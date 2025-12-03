import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    const where: any = {};
    if (buildingId) where.buildingId = buildingId;
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const units = await prisma.unit.findMany({
      where,
      include: {
        building: true,
        tenant: true,
        contracts: {
          where: { estado: 'activo' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(units);
  } catch (error) {
    logger.error('Error fetching units:', error);
    return NextResponse.json({ error: 'Error al obtener unidades' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { numero, buildingId, tipo, estado, superficie, habitaciones, banos, rentaMensual, tenantId } = body;

    if (!numero || !buildingId || !tipo || !superficie || !rentaMensual) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const unit = await prisma.unit.create({
      data: {
        numero,
        buildingId,
        tipo,
        estado: estado || 'disponible',
        superficie: parseFloat(superficie),
        habitaciones: habitaciones ? parseInt(habitaciones) : null,
        banos: banos ? parseInt(banos) : null,
        rentaMensual: parseFloat(rentaMensual),
        tenantId: tenantId || null,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    logger.error('Error creating unit:', error);
    return NextResponse.json({ error: 'Error al crear unidad' }, { status: 500 });
  }
}
