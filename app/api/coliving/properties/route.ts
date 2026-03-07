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

    // Resolve company scope (include subsidiaries)
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: (session?.user as any)?.id as string,
      role: ((session?.user as any)?.role || 'admin') as any,
      primaryCompanyId: user.companyId,
      request,
    });

    // Only fetch rooms (coliving-specific data) — then find which buildings have rooms
    const rooms = await prisma.room.findMany({
      where: { companyId: { in: scope.scopeCompanyIds } },
      select: {
        rentaMensual: true,
        estado: true,
        unit: {
          select: { buildingId: true },
        },
      },
    });

    // Aggregate stats per building
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

    // Only fetch buildings that actually have coliving rooms
    const buildingIdsWithRooms = Array.from(statsByBuilding.keys());

    if (buildingIdsWithRooms.length === 0) {
      return NextResponse.json([]);
    }

    const buildings = await prisma.building.findMany({
      where: { id: { in: buildingIdsWithRooms } },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        etiquetas: true,
      },
      orderBy: { nombre: 'asc' },
    });

    const properties = buildings.map((building) => {
      const stats = statsByBuilding.get(building.id)!;
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
