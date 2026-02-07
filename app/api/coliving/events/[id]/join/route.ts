import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = {
  email?: string;
  companyId?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId || !user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { email: user.email },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    const profile = await prisma.colivingProfile.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil coliving no encontrado' },
        { status: 404 }
      );
    }

    const event = await prisma.colivingEvent.findUnique({
      where: { id: params.id },
      include: { asistentes: true },
    });

    if (!event || event.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (event.capacidad && event.asistentes.length >= event.capacidad) {
      return NextResponse.json(
        { error: 'Evento completo' },
        { status: 400 }
      );
    }

    const existing = await prisma.colivingEventAttendance.findUnique({
      where: {
        eventId_profileId: {
          eventId: event.id,
          profileId: profile.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true });
    }

    await prisma.colivingEventAttendance.create({
      data: {
        eventId: event.id,
        profileId: profile.id,
        estado: 'confirmado',
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error('Error joining coliving event', error);
    return NextResponse.json(
      { error: 'Error al unirse al evento' },
      { status: 500 }
    );
  }
}
