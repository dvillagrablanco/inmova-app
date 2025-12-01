import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { calculateMaintenanceMetrics } from '@/lib/maintenance-prediction-service';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';

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

    const companyId = session.user.companyId;

    const where: any = { companyId };
    if (buildingId) where.buildingId = buildingId;
    if (periodo) where.periodo = periodo;

    const metrics = await prisma.maintenanceMetrics.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
    });

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
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

    const companyId = session.user.companyId;
    const { buildingId } = await request.json();
    const periodo = format(new Date(), 'yyyy-MM');

    const metrics = await calculateMaintenanceMetrics(companyId, periodo, buildingId);

    return NextResponse.json({ metrics }, { status: 201 });
  } catch (error: any) {
    console.error('Error calculating metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Error al calcular métricas' },
      { status: 500 }
    );
  }
}
