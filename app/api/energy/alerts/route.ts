import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/energy/alerts - Obtener alertas de energía
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resuelta = searchParams.get('resuelta');
    const tipo = searchParams.get('tipo');
    const buildingId = searchParams.get('buildingId');

    const alerts = await prisma.energyAlert.findMany({
      where: {
        companyId: session?.user?.companyId,
        ...(resuelta !== null && { resuelta: resuelta === 'true' }),
        ...(tipo && { tipo: tipo as any }),
        ...(buildingId && { buildingId }),
      },
      include: {
        building: true,
        unit: true,
      },
      orderBy: { fechaDeteccion: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    logger.error('Error fetching energy alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

// PATCH /api/energy/alerts - Resolver alerta
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, accionTomada } = body;

    const alert = await prisma.energyAlert.update({
      where: { id },
      data: {
        resuelta: true,
        fechaResolucion: new Date(),
        accionTomada: accionTomada || null,
      },
      include: {
        building: true,
        unit: true,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    logger.error('Error resolving energy alert:', error);
    return NextResponse.json(
      { error: 'Error al resolver alerta' },
      { status: 500 }
    );
  }
}
