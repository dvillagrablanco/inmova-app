import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateBuildingMetrics } from '@/lib/analytics-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const periodo = searchParams.get('periodo');

    if (!buildingId) {
      return NextResponse.json(
        { error: 'buildingId requerido' },
        { status: 400 }
      );
    }

    const companyId = session?.user?.companyId;

    // Verify building belongs to company
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId,
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      );
    }

    // Get metrics
    let metrics;
    if (periodo) {
      metrics = await prisma.buildingMetrics.findMany({
        where: {
          buildingId,
          periodo,
        },
        orderBy: { fecha: 'desc' },
        take: 1,
      });
    } else {
      metrics = await prisma.buildingMetrics.findMany({
        where: { buildingId },
        orderBy: { fecha: 'desc' },
        take: 12,
      });
    }

    return NextResponse.json({ metrics });
  } catch (error: any) {
    logger.error('Error fetching building metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar métricas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { buildingId } = await request.json();

    if (!buildingId) {
      return NextResponse.json(
        { error: 'buildingId requerido' },
        { status: 400 }
      );
    }

    const companyId = session?.user?.companyId;

    // Verify building belongs to company
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId,
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      );
    }

    const metrics = await generateBuildingMetrics(buildingId);

    return NextResponse.json({ metrics }, { status: 201 });
  } catch (error: any) {
    logger.error('Error generating building metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar métricas' },
      { status: 500 }
    );
  }
}
