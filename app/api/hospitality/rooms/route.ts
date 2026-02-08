/**
 * API Endpoint: Gestión de Habitaciones de Hotel/Hospitality
 * Utiliza el modelo Room existente con configuración para hospitality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createRoomSchema = z.object({
  buildingId: z.string(),
  unitId: z.string(),
  numero: z.string(),
  tipo: z.string(), // suite, standard, deluxe, etc.
  capacidad: z.number().int().min(1),
  precioPorNoche: z.number().min(0),
  amenidades: z.array(z.string()).default([]),
  descripcion: z.string().optional(),
  superficie: z.number().min(0),
  vistas: z.string().optional(),
  piso: z.number().optional(),
  estado: z.enum(['disponible', 'ocupada', 'mantenimiento', 'reservada']).default('disponible'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');

    const { prisma } = await import('@/lib/db');

    // Obtener habitaciones (rooms) de edificios con tipo hospitality
    const rooms = await prisma.room.findMany({
      where: {
        companyId,
        ...(buildingId && { unit: { buildingId } }),
        ...(estado && { estado }),
      },
      include: {
        unit: {
          select: {
            id: true,
            numero: true,
            habitaciones: true,
            rentaMensual: true,
            buildingId: true,
            building: {
              select: { id: true, nombre: true, direccion: true },
            },
          },
        },
      },
      orderBy: [{ unit: { buildingId: 'asc' } }, { numero: 'asc' }],
    });

    // Estadísticas
    const stats = {
      total: rooms.length,
      disponibles: rooms.filter(r => r.estado === 'disponible').length,
      ocupadas: rooms.filter(r => r.estado === 'ocupada').length,
      mantenimiento: rooms.filter(r => r.estado === 'mantenimiento').length,
      reservadas: rooms.filter(r => r.estado === 'reservada').length,
    };

    const roomsResponse = rooms.map(room => {
      const amenidades: string[] = [];
      if (room.tieneBalcon) amenidades.push('balcon');
      if (room.aireAcondicionado) amenidades.push('aire');
      if (room.calefaccion) amenidades.push('calefaccion');
      if (room.banoPrivado) amenidades.push('bano_privado');

      return {
        id: room.id,
        numero: room.numero,
        tipo: room.tipoHabitacion,
        capacidad: room.unit?.habitaciones ?? 0,
        precioMensual: room.rentaMensual,
        amenidades,
        descripcion: room.descripcion || undefined,
        superficie: room.superficie,
        estado: room.estado,
        building: room.unit?.building
          ? { id: room.unit.building.id, nombre: room.unit.building.nombre, direccion: room.unit.building.direccion }
          : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: roomsResponse,
      stats,
    });
  } catch (error: unknown) {
    logger.error('Error fetching hospitality rooms:', error);
    return NextResponse.json({ error: 'Error al obtener habitaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createRoomSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    const unit = await prisma.unit.findFirst({
      where: {
        id: data.unitId,
        companyId,
      },
      select: {
        id: true,
        buildingId: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    if (data.buildingId && unit.buildingId !== data.buildingId) {
      return NextResponse.json({ error: 'La unidad no pertenece al edificio indicado' }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        companyId,
        unitId: data.unitId,
        numero: data.numero,
        nombre: data.numero,
        tipoHabitacion: data.tipo,
        superficie: data.superficie,
        rentaMensual: data.precioPorNoche, // Usamos rentaMensual como precio por noche
        descripcion: data.descripcion,
        aireAcondicionado: data.amenidades.includes('aire'),
        tieneBalcon: data.amenidades.includes('balcon'),
        calefaccion: data.amenidades.includes('calefaccion'),
        banoPrivado: data.amenidades.includes('bano_privado'),
        estado: data.estado,
      },
      include: {
        unit: {
          select: {
            building: { select: { id: true, nombre: true, direccion: true } },
          },
        },
      },
    });

    logger.info('Hospitality room created', { roomId: room.id, companyId });

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        numero: room.numero,
        tipo: room.tipoHabitacion,
        capacidad: data.capacidad,
        precioMensual: room.rentaMensual,
        amenidades: data.amenidades,
        descripcion: room.descripcion || undefined,
        superficie: room.superficie,
        estado: room.estado,
        building: room.unit?.building
          ? { id: room.unit.building.id, nombre: room.unit.building.nombre, direccion: room.unit.building.direccion }
          : undefined,
      },
      message: 'Habitación creada exitosamente',
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating hospitality room:', error);
    return NextResponse.json({ error: 'Error al crear habitación' }, { status: 500 });
  }
}
