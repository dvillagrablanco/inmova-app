import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'administrador'];

const updatePlanSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  tier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']).optional(),
  descripcion: z.string().optional(),
  precioMensual: z.number().min(0).optional(),
  maxUsuarios: z.number().min(1).optional(),
  maxPropiedades: z.number().min(1).optional(),
  modulosIncluidos: z.array(z.string()).optional(),
  signaturesIncludedMonth: z.number().min(0).optional(),
  extraSignaturePrice: z.number().min(0).optional(),
  storageIncludedGB: z.number().min(0).optional(),
  extraStorageGBPrice: z.number().min(0).optional(),
  aiTokensIncludedMonth: z.number().min(0).optional(),
  extraAITokensPrice: z.number().min(0).optional(),
  smsIncludedMonth: z.number().min(0).optional(),
  extraSMSPrice: z.number().min(0).optional(),
  stripePriceIdMonthly: z.string().optional(),
  stripePriceIdAnnual: z.string().optional(),
  activo: z.boolean().optional(),
});

/**
 * GET /api/admin/planes/[id]
 * Obtiene un plan específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
          },
          take: 10,
        },
        _count: {
          select: { companies: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error('[Admin Plan GET Error]:', error);
    return NextResponse.json({ error: 'Error al cargar plan' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/planes/[id]
 * Actualiza un plan existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const data = updatePlanSchema.parse(body);

    // Verificar que el plan existe
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // Actualizar
    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        ...data,
        tier: data.tier as any,
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    });

  } catch (error: any) {
    console.error('[Admin Plan PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/planes/[id]
 * Elimina un plan
 * 
 * Query params:
 * - force=true: Permite eliminar aunque tenga empresas asignadas
 * - migrateTo=<planId>: ID del plan al que migrar las empresas (opcional)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo super_admin puede eliminar planes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const migrateTo = searchParams.get('migrateTo');

    // Verificar que el plan existe
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { companies: true } },
        companies: {
          select: { id: true, name: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const empresasAsignadas = plan._count.companies;

    // Si tiene empresas y no es forzado, retornar error con información
    if (empresasAsignadas > 0 && !force) {
      return NextResponse.json(
        { 
          error: 'Este plan tiene empresas asignadas',
          empresasAsignadas,
          empresas: plan.companies.slice(0, 10), // Primeras 10 empresas
          requiresForce: true,
          message: `Hay ${empresasAsignadas} empresa(s) usando este plan. ¿Deseas eliminarlo de todas formas?`,
        },
        { status: 400 }
      );
    }

    // Si hay empresas y es forzado, migrarlas o desvincularlas
    if (empresasAsignadas > 0 && force) {
      if (migrateTo) {
        // Verificar que el plan destino existe
        const targetPlan = await prisma.subscriptionPlan.findUnique({
          where: { id: migrateTo },
        });

        if (!targetPlan) {
          return NextResponse.json(
            { error: 'Plan de destino no encontrado' },
            { status: 400 }
          );
        }

        // Migrar empresas al nuevo plan
        await prisma.company.updateMany({
          where: { subscriptionPlanId: params.id },
          data: { subscriptionPlanId: migrateTo },
        });
      } else {
        // Desvincular empresas (poner subscriptionPlanId a null)
        await prisma.company.updateMany({
          where: { subscriptionPlanId: params.id },
          data: { subscriptionPlanId: null },
        });
      }
    }

    // Eliminar el plan
    await prisma.subscriptionPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Plan eliminado correctamente',
      empresasMigradas: empresasAsignadas,
      migratedTo: migrateTo || null,
    });

  } catch (error: any) {
    console.error('[Admin Plan DELETE Error]:', error);
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 });
  }
}
