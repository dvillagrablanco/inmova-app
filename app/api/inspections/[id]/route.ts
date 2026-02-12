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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const inspection = await prisma.legalInspection.findUnique({
      where: { id: params.id },
    });

    if (!inspection || inspection.companyId !== session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      );
    }

    // Enriquecer con datos relacionales
    let building: any = null;
    let unit: any = null;
    let tenant: any = null;

    if (inspection.buildingId) {
      building = await prisma.building.findUnique({
        where: { id: inspection.buildingId },
      });
    }

    if (inspection.unitId) {
      unit = await prisma.unit.findUnique({
        where: { id: inspection.unitId },
      });
    }

    if (inspection.tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: inspection.tenantId },
      });
    }

    return NextResponse.json({
      ...inspection,
      building,
      unit,
      tenant,
    });
  } catch (error) {
    logger.error('Error al obtener inspección:', error);
    return NextResponse.json(
      { error: 'Error al obtener inspección' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { estado, fechaRealizada, observaciones, daniosEncontrados, costoEstimadoDanos } = body;

    const inspection = await prisma.legalInspection.findUnique({
      where: { id: params.id },
    });

    if (!inspection || inspection.companyId !== session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      );
    }

    const updated = await prisma.legalInspection.update({
      where: { id: params.id },
      data: {
        estado,
        fechaRealizada: fechaRealizada ? new Date(fechaRealizada) : undefined,
        observaciones,
        daniosEncontrados,
        costoEstimadoDanos,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error al actualizar inspección:', error);
    return NextResponse.json(
      { error: 'Error al actualizar inspección' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const inspection = await prisma.legalInspection.findUnique({
      where: { id: params.id },
    });

    if (!inspection || inspection.companyId !== session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      );
    }

    await prisma.legalInspection.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Inspección eliminada' });
  } catch (error) {
    logger.error('Error al eliminar inspección:', error);
    return NextResponse.json(
      { error: 'Error al eliminar inspección' },
      { status: 500 }
    );
  }
}
