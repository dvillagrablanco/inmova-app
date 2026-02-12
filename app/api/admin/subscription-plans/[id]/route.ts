import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET - Obtener un plan específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { companies: true }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    logger.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Error al obtener el plan' }, { status: 500 });
  }
}

// PATCH - Actualizar un plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      nombre,
      descripcion,
      tier,
      precioMensual,
      maxUsuarios,
      maxPropiedades,
      modulosIncluidos,
      activo
    } = body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(tier && { tier }),
        ...(precioMensual !== undefined && { precioMensual }),
        ...(maxUsuarios !== undefined && { maxUsuarios }),
        ...(maxPropiedades !== undefined && { maxPropiedades }),
        ...(modulosIncluidos !== undefined && { modulosIncluidos }),
        ...(activo !== undefined && { activo })
      },
      include: {
        _count: {
          select: { companies: true }
        }
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    logger.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Error al actualizar el plan' }, { status: 500 });
  }
}

// DELETE - Eliminar un plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si hay empresas usando este plan
    const companiesCount = await prisma.company.count({
      where: { subscriptionPlanId: params.id }
    });

    if (companiesCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar. ${companiesCount} empresa(s) están usando este plan` },
        { status: 400 }
      );
    }

    await prisma.subscriptionPlan.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'Plan eliminado correctamente' });
  } catch (error) {
    logger.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Error al eliminar el plan' }, { status: 500 });
  }
}
