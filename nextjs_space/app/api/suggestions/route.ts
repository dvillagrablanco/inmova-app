import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';

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
    
    // Solo super_admin o soporte pueden ver todas las sugerencias
    if (user.role !== 'super_admin' && user.role !== 'soporte') {
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
    console.error('Error al obtener sugerencias:', error);
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
        ...validatedData,
        companyId: user.companyId,
        userId: user.id,
        nombreRemitente: user.name,
        emailRemitente: user.email,
      },
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

    await Promise.all(
      superAdmins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'sugerencia',
            title: '💡 Nueva Sugerencia',
            message: `${user.name} (${suggestion.company.nombre}) envió: "${validatedData.titulo}"`,
            link: `/admin/sugerencias/${suggestion.id}`,
            read: false,
          },
        })
      )
    );

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear sugerencia:', error);
    
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