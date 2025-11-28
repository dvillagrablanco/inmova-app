import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const equipoSistema = searchParams.get('equipoSistema');
    const buildingId = searchParams.get('buildingId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (equipoSistema) where.equipoSistema = equipoSistema;
    if (buildingId) where.buildingId = buildingId;

    const history = await prisma.maintenanceHistory.findMany({
      where,
      orderBy: {
        fechaDeteccion: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar historial' },
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

    const data = await request.json();

    const record = await prisma.maintenanceHistory.create({
      data,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating history record:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear registro' },
      { status: 500 }
    );
  }
}
