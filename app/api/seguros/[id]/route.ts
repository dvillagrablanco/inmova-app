import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const seguro = await prisma.insurance.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        building: {
          select: {
            nombre: true,
            direccion: true,
            ciudad: true,
          },
        },
        unit: {
          select: {
            numero: true,
          },
        },
        claims: {
          orderBy: { fechaSiniestro: 'desc' },
        },
        _count: {
          select: { claims: true },
        },
      },
    });

    if (!seguro) {
      return NextResponse.json({ error: 'Seguro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(seguro);
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener seguro' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Verify ownership
    const existing = await prisma.insurance.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Seguro no encontrado' }, { status: 404 });
    }

    const updated = await prisma.insurance.update({
      where: { id: params.id },
      data: body,
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar seguro' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.insurance.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Seguro no encontrado' }, { status: 404 });
    }

    await prisma.insurance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al eliminar seguro' }, { status: 500 });
  }
}
