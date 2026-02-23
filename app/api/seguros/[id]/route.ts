import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const seguro = await prisma.insurance.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { id: true, nombre: true } },
        unit: { select: { id: true, numero: true } },
        company: { select: { id: true, nombre: true } },
      },
    });

    if (!seguro) {
      return NextResponse.json({ error: 'Seguro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(seguro);
  } catch (error: any) {
    logger.error('[Seguros GET id]:', error);
    return NextResponse.json({ error: 'Error obteniendo seguro' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const body = await req.json();

    const { companyId, id, company, building, unit, claims, createdAt, updatedAt, ...updateData } =
      body;

    if (updateData.fechaInicio) updateData.fechaInicio = new Date(updateData.fechaInicio);
    if (updateData.fechaVencimiento)
      updateData.fechaVencimiento = new Date(updateData.fechaVencimiento);

    const seguro = await prisma.insurance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
      },
    });

    return NextResponse.json(seguro);
  } catch (error: any) {
    logger.error('[Seguros PUT]:', error);
    return NextResponse.json({ error: 'Error actualizando seguro' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    await prisma.insurance.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[Seguros DELETE]:', error);
    return NextResponse.json({ error: 'Error eliminando seguro' }, { status: 500 });
  }
}
