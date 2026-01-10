import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar habitaciones (unidades tipo habitación o en propiedades de coliving)
    const rooms = await prisma.unit.findMany({
      where: {
        companyId: session.user.companyId,
        tipo: {
          in: ['habitacion', 'room', 'estudio'],
        },
      },
      include: {
        building: true,
        tenant: true,
        contracts: {
          where: {
            estado: 'ACTIVO',
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
      name: room.numero || 'Habitación',
      property: room.building?.nombre || 'Sin propiedad',
      address: room.building?.direccion || 'Sin dirección',
      price: room.rentaMensual || 0,
      status: room.estado?.toLowerCase() || 'available',
      tenant: room.tenant?.nombreCompleto || null,
      contractEnd: room.contracts[0]?.fechaFin?.toISOString() || null,
      size: room.superficie || 0,
      amenities: room.caracteristicas || [],
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    logger.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Obtener información de la propiedad padre
    const parentUnit = await prisma.unit.findUnique({
      where: { id: data.unitId },
      include: { building: true },
    });

    if (!parentUnit) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const room = await prisma.unit.create({
      data: {
        numero: data.name,
        tipo: 'habitacion',
        estado: 'disponible',
        superficie: data.size || 0,
        rentaMensual: data.price,
        caracteristicas: data.hasPrivateBathroom
          ? ['bathroom', 'wifi', 'furnished']
          : ['wifi', 'furnished'],
        buildingId: parentUnit.buildingId,
        companyId: session.user.companyId,
      },
      include: {
        building: true,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    logger.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
