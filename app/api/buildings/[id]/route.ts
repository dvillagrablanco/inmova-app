import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const building = await prisma.building.findUnique({
      where: { id: params.id },
      include: {
        units: {
          include: {
            tenant: true,
            contracts: true,
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(building);
  } catch (error) {
    logger.error('Error fetching building:', error);
    return NextResponse.json({ error: 'Error al obtener edificio' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    const body = await req.json();
    const { nombre, direccion, tipo, anoConstructor, numeroUnidades } = body;

    const building = await prisma.building.update({
      where: { id: params.id },
      data: {
        nombre,
        direccion,
        tipo,
        anoConstructor: anoConstructor ? parseInt(anoConstructor) : undefined,
        numeroUnidades: numeroUnidades ? parseInt(numeroUnidades) : undefined,
      },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateBuildingsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json(building);
  } catch (error) {
    logger.error('Error updating building:', error);
    return NextResponse.json({ error: 'Error al actualizar edificio' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;

    await prisma.building.delete({
      where: { id: params.id },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateBuildingsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json({ message: 'Edificio eliminado' });
  } catch (error) {
    logger.error('Error deleting building:', error);
    return NextResponse.json({ error: 'Error al eliminar edificio' }, { status: 500 });
  }
}
