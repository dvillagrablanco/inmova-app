import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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

    const companyId = session?.user?.companyId;

    const where: any = { companyId };
    if (buildingId) where.buildingId = buildingId;
    if (periodo) where.periodo = periodo;

    const budgets = await prisma.maintenanceBudget.findMany({
      where,
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    return NextResponse.json({ budgets });
  } catch (error: any) {
    logger.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar presupuestos' },
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
    const data = await request.json();

    const budget = await prisma.maintenanceBudget.create({
      data: {
        companyId,
        ...data,
      },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating budget:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}
