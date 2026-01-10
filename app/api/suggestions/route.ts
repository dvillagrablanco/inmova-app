import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';
import logger, { logError } from '@/lib/logger';
import { sendEmail } from '@/lib/email-service';

export const dynamic = 'force-dynamic';


const createSuggestionSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  categoria: z.enum(['mejora_producto', 'reporte_bug', 'nueva_funcionalidad', 'otro']),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica']).default('media'),
  navegador: z.string().optional(),
  sistemaOperativo: z.string().optional(),
  urlOrigen: z.string().optional(),
});

// GET - Obtener todas las sugerencias (super_admin o soporte)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    // Solo super_admin puede ver todas las sugerencias
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para ver las sugerencias' },
        { status: 403 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const categoria = searchParams.get('categoria');
    const companyId = searchParams.get('companyId');

    const where: any = {};
    
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (categoria) where.categoria = categoria;
    if (companyId) where.companyId = companyId;

    const [suggestions, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              nombre: true,
              logoUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { prioridad: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.suggestion.count({ where }),
    ]);

    return NextResponse.json({
      suggestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Error al obtener sugerencias:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener sugerencias' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva sugerencia
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const validatedData = createSuggestionSchema.parse(body);

    const suggestion = await prisma.suggestion.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        nombreRemitente: user.name,
        emailRemitente: user.email,
        titulo: validatedData.titulo,
        descripcion: validatedData.descripcion,
        prioridad: validatedData.prioridad,
        categoria: validatedData.categoria,
        navegador: validatedData.navegador,
        sistemaOperativo: validatedData.sistemaOperativo,
        urlOrigen: validatedData.urlOrigen,
      } as any,
      include: {
        company: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Crear notificación para super_admin
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'super_admin',
        activo: true,
      },
    });

    // Crear notificaciones y enviar emails a superadmins
    await Promise.all(
      superAdmins.map(async (admin) => {
        // Crear notificación en la plataforma
        await prisma.notification.create({
          data: {
            companyId: user.companyId,
            userId: admin.id,
            tipo: 'info',
            titulo: '💡 Nueva Sugerencia',
            mensaje: `${user.name} (${(suggestion as any).company?.nombre || 'Empresa'}) envió: "${validatedData.titulo}"`,
            leida: false,
            entityId: suggestion.id,
            entityType: 'suggestion',
          },
        });

        // Enviar email al superadmin
        try {
          await sendEmail({
            to: admin.email,
            subject: `💡 Nueva Sugerencia: ${validatedData.titulo}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Nueva Sugerencia Recibida</h2>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Remitente:</strong> ${user.name} (${user.email})</p>
                  <p><strong>Empresa:</strong> ${(suggestion as any).company?.nombre || 'N/A'}</p>
                  <p><strong>Categoría:</strong> ${validatedData.categoria}</p>
                  <p><strong>Prioridad:</strong> ${validatedData.prioridad}</p>
                </div>
                
                <h3 style="color: #1f2937;">${validatedData.titulo}</h3>
                <p style="color: #4b5563; line-height: 1.6;">${validatedData.descripcion}</p>
                
                ${validatedData.urlOrigen ? `<p style="color: #6b7280; font-size: 12px;">Página de origen: ${validatedData.urlOrigen}</p>` : ''}
                ${validatedData.navegador ? `<p style="color: #6b7280; font-size: 12px;">Navegador: ${validatedData.navegador}</p>` : ''}
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                
                <p style="color: #6b7280; font-size: 14px;">
                  <a href="${process.env.NEXTAUTH_URL}/admin/sugerencias/${suggestion.id}" style="color: #4F46E5; text-decoration: none;">
                    Ver sugerencia en el panel de administración →
                  </a>
                </p>
              </div>
            `,
          });
        } catch (emailError) {
          logger.warn('Error al enviar email de sugerencia:', emailError);
          // No fallamos la operación si el email falla
        }
      })
    );

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error: any) {
    logger.error('Error al crear sugerencia:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al crear sugerencia' },
      { status: 500 }
    );
  }
}
