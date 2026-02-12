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

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar habitaciones (Room model)
    const rooms = await prisma.room.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        contracts: {
          where: {
            estado: 'activo',
          },
          include: {
            tenant: true,
          },
          take: 1,
          orderBy: {
            fechaFin: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar los datos al formato esperado
    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      name: room.nombre || room.numero || 'Habitación',
      property: room.unit?.building?.nombre || 'Sin propiedad',
      address: room.unit?.building?.direccion || 'Sin dirección',
      price: room.rentaMensual || 0,
      status: room.estado === 'ocupada'
        ? 'occupied'
        : room.estado === 'reservada'
          ? 'reserved'
          : room.estado === 'mantenimiento'
            ? 'maintenance'
            : 'available',
      tenant: room.contracts[0]?.tenant?.nombreCompleto || null,
      contractEnd: room.contracts[0]?.fechaFin?.toISOString() || null,
      size: room.superficie || 0,
      amenities: [
        ...(room.banoPrivado ? ['bathroom'] : []),
        ...(room.amueblada ? ['furnished'] : []),
      ],
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    logger.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Obtener información de la unidad padre
    const parentUnit = await prisma.unit.findUnique({
      where: { id: data.unitId },
      select: { id: true },
    });

    if (!parentUnit) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const room = await prisma.room.create({
      data: {
        companyId: session.user.companyId,
        unitId: parentUnit.id,
        numero: data.name,
        nombre: data.name,
        superficie: data.size || 0,
        rentaMensual: data.price,
        tipoHabitacion: 'individual',
        banoPrivado: data.hasPrivateBathroom || false,
        amueblada: true,
        estado: 'disponible',
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    logger.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
