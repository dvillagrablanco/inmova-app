import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/ewoorker-planes
 * Lista los planes de eWoorker
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const planes = await prisma.ewoorkerPlan.findMany({
      orderBy: { orden: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: planes,
      total: planes.length,
    });
  } catch (error: any) {
    console.error('[eWoorker Planes API Error]:', error);
    return NextResponse.json(
      {
        error: 'Error al cargar planes',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ewoorker-planes
 * Crear un nuevo plan de eWoorker
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación
    const schema = z.object({
      codigo: z.string().min(2).max(20),
      nombre: z.string().min(3).max(100),
      descripcion: z.string().min(10),
      precioMensual: z.number().min(0),
      precioAnual: z.number().min(0).optional(),
      maxOfertas: z.number(),
      comisionEscrow: z.number().min(0).max(100),
      features: z.array(z.string()),
      socioPercentage: z.number().min(0).max(100).default(50),
      plataformaPercentage: z.number().min(0).max(100).default(50),
      destacado: z.boolean().optional(),
    });

    const validated = schema.parse(body);

    // Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que el código no existe
    const existing = await prisma.ewoorkerPlan.findUnique({
      where: { codigo: validated.codigo },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'Ya existe un plan con ese código',
        },
        { status: 400 }
      );
    }

    // Si es destacado, quitar destacado de los demás
    if (validated.destacado) {
      await prisma.ewoorkerPlan.updateMany({
        where: { destacado: true },
        data: { destacado: false },
      });
    }

    // Obtener el último orden
    const lastPlan = await prisma.ewoorkerPlan.findFirst({
      orderBy: { orden: 'desc' },
    });
    const orden = (lastPlan?.orden || 0) + 1;

    // Crear plan
    const plan = await prisma.ewoorkerPlan.create({
      data: {
        codigo: validated.codigo,
        nombre: validated.nombre,
        descripcion: validated.descripcion,
        precioMensual: validated.precioMensual,
        precioAnual: validated.precioAnual,
        maxOfertas: validated.maxOfertas,
        comisionEscrow: validated.comisionEscrow,
        features: validated.features,
        socioPercentage: validated.socioPercentage,
        plataformaPercentage: validated.plataformaPercentage,
        destacado: validated.destacado || false,
        activo: true,
        orden,
      },
    });

    // Log de auditoría (solo si hay companyId)
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyId: true },
      });
      
      if (user?.companyId) {
        await prisma.auditLog.create({
          data: {
            companyId: user.companyId,
            userId: session.user.id,
            action: 'PLATFORM_SETTINGS_UPDATED',
            entityType: 'EWOORKER_PLAN',
            entityId: plan.id,
            entityName: plan.nombre,
            changes: JSON.stringify({
              action: 'created',
              codigo: plan.codigo,
              nombre: plan.nombre,
              precioMensual: plan.precioMensual,
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      console.warn('[Audit Log Warning]:', auditError);
    }

    return NextResponse.json(
      {
        success: true,
        data: plan,
        message: 'Plan eWoorker creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[eWoorker Planes POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error creando plan',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
