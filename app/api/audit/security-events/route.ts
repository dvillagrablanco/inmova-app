import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const severidad = searchParams.get('severidad');
    const resuelta = searchParams.get('resuelta');

    const where: any = {
      companyId: session?.user?.companyId,
    };

    if (severidad && severidad !== 'all') {
      where.severidad = severidad;
    }

    if (resuelta === 'true') {
      where.resuelta = true;
    } else if (resuelta === 'false') {
      where.resuelta = false;
    }

    const events = await prisma.securityEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(events);
  } catch (error) {
    logger.error('Error al obtener eventos de seguridad:', error);
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { tipo, severidad, descripcion, detalles, ipAddress, userAgent } = body;

    const event = await prisma.securityEvent.create({
      data: {
        companyId: session?.user?.companyId,
        tipo,
        severidad: severidad || 'warning',
        userId: session?.user?.id,
        descripcion,
        detalles,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    logger.error('Error al crear evento de seguridad:', error);
    return NextResponse.json(
      { error: 'Error al crear evento' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, resolucionNota } = body;

    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.companyId !== session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    const updated = await prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        resuelta: true,
        resolucionNota,
        resueltoPor: session?.user?.email,
        fechaResolucion: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error al resolver evento:', error);
    return NextResponse.json({ error: 'Error al resolver evento' }, { status: 500 });
  }
}
