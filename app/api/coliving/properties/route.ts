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

type RoomStats = {
  total: number;
  ocupadas: number;
  rentaTotal: number;
};

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [buildings, rooms] = await Promise.all([
      prisma.building.findMany({
        where: { companyId: user.companyId },
        select: {
          id: true,
          nombre: true,
          direccion: true,
          etiquetas: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.room.findMany({
        where: { companyId: user.companyId },
        select: {
          rentaMensual: true,
          estado: true,
          unit: {
            select: { buildingId: true },
          },
        },
      }),
    ]);

    const statsByBuilding = new Map<string, RoomStats>();
    rooms.forEach((room) => {
      const buildingId = room.unit.buildingId;
      const current = statsByBuilding.get(buildingId) || {
        total: 0,
        ocupadas: 0,
        rentaTotal: 0,
      };
      current.total += 1;
      if (room.estado === 'ocupada') {
        current.ocupadas += 1;
      }
      current.rentaTotal += room.rentaMensual;
      statsByBuilding.set(buildingId, current);
    });

    const properties = buildings.map((building) => {
      const stats = statsByBuilding.get(building.id) || {
        total: 0,
        ocupadas: 0,
        rentaTotal: 0,
      };
      const precioMedio =
        stats.total > 0 ? stats.rentaTotal / stats.total : 0;

      return {
        id: building.id,
        nombre: building.nombre,
        direccion: building.direccion,
        ciudad: '',
        totalHabitaciones: stats.total,
        habitacionesOcupadas: stats.ocupadas,
        precioMedioHabitacion: precioMedio,
        amenities: building.etiquetas,
        estado: stats.total > stats.ocupadas ? 'disponible' : 'completo',
      };
    });

    return NextResponse.json(properties);
  } catch (error) {
    logger.error('Error fetching coliving properties', error);
    return NextResponse.json(
      { error: 'Error al obtener propiedades' },
      { status: 500 }
    );
  }
}
