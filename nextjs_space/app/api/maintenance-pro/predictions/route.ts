import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { predictEquipmentFailures } from '@/lib/maintenance-prediction-service';
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
    const estado = searchParams.get('estado');

    const companyId = session?.user?.companyId;

    const where: any = { companyId };
    if (buildingId) where.buildingId = buildingId;
    if (estado) where.estado = estado;

    const predictions = await prisma.maintenanceFailurePrediction.findMany({
      where,
      orderBy: [
        { probabilidadFalla: 'desc' },
        { fechaObjetivo: 'asc' },
      ],
      take: 20,
    });

    return NextResponse.json({ predictions });
  } catch (error: any) {
    logger.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar predicciones' },
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

    const companyId = session?.user?.companyId;
    const predictions = await predictEquipmentFailures(companyId);

    return NextResponse.json({ predictions, count: predictions.length }, { status: 201 });
  } catch (error: any) {
    logger.error('Error generating predictions:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar predicciones' },
      { status: 500 }
    );
  }
}
