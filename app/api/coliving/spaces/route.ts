import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type SessionUser = {
  companyId?: string;
};

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        numero: true,
        nombre: true,
        tipoHabitacion: true,
      },
      orderBy: { numero: 'asc' },
    });

    const data = rooms.map((room) => ({
      id: room.id,
      nombre: room.nombre || `Habitación ${room.numero}`,
      name: room.nombre || `Habitación ${room.numero}`,
      tipo: room.tipoHabitacion,
      type: room.tipoHabitacion,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Error fetching coliving spaces', error);
    return NextResponse.json(
      { error: 'Error al obtener espacios' },
      { status: 500 }
    );
  }
}
