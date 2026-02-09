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
  unitId: z.string().optional(),
  numero: z.string(),
  tipo: z.string(), // suite, standard, deluxe, etc.
  capacidad: z.number().int().min(1),
  precioPorNoche: z.number().min(0),
  amenidades: z.array(z.string()).default([]),
  descripcion: z.string().optional(),
  superficie: z.number().optional(),
  vistas: z.string().optional(),
  piso: z.number().optional(),
  estado: z.enum(['disponible', 'ocupada', 'mantenimiento', 'reservada']).default('disponible'),
});

type RoomStatusDb = 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';

const normalizeRoomStatus = (estado?: string | null): RoomStatusDb | null => {
  if (!estado) return null;
  const normalized = estado.trim().toLowerCase();
  if (normalized === 'disponible') return 'disponible';
  if (normalized === 'ocupada') return 'ocupada';
  if (normalized === 'mantenimiento') return 'mantenimiento';
  if (normalized === 'reservada') return 'reservada';
  return null;
};

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
    const normalizedEstado = normalizeRoomStatus(estado);

    const { prisma } = await import('@/lib/db');

    // Obtener habitaciones (rooms) de edificios con tipo hospitality
    const rooms = await prisma.room.findMany({
      where: {
        companyId,
        ...(buildingId && { unit: { buildingId } }),
        ...(normalizedEstado && { estado: normalizedEstado }),
      },
      include: {
        unit: {
          select: {
            id: true,
            identificador: true,
            building: {
              select: { id: true, nombre: true, direccion: true },
            },
          },
        },
      },
      orderBy: [{ unitId: 'asc' }, { numero: 'asc' }],
    });

    // Estadísticas
    const stats = {
      total: rooms.length,
      disponibles: rooms.filter(r => r.estado === 'disponible').length,
      ocupadas: rooms.filter(r => r.estado === 'ocupada').length,
      mantenimiento: rooms.filter(r => r.estado === 'mantenimiento').length,
      reservadas: rooms.filter(r => r.estado === 'reservada').length,
    };

    return NextResponse.json({
      success: true,
      data: rooms,
      stats,
    });
  } catch (error: any) {
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

    const resolvedUnitId = data.unitId
      ? data.unitId
      : (
          await prisma.unit.findFirst({
            where: { buildingId: data.buildingId, companyId },
            select: { id: true },
          })
        )?.id;

    if (!resolvedUnitId) {
      return NextResponse.json(
        { error: 'Unit ID no encontrado para el edificio' },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        companyId,
        unitId: resolvedUnitId,
        numero: data.numero,
        tipoHabitacion: data.tipo,
        rentaMensual: data.precioPorNoche,
        descripcion: data.descripcion,
        superficie: data.superficie ?? 0,
        estado: data.estado,
      },
      include: {
        unit: {
          select: {
            id: true,
            identificador: true,
            building: { select: { nombre: true } },
          },
        },
      },
    });

    logger.info('Hospitality room created', { roomId: room.id, companyId });

    return NextResponse.json({
      success: true,
      data: room,
      message: 'Habitación creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating hospitality room:', error);
    return NextResponse.json({ error: 'Error al crear habitación' }, { status: 500 });
  }
}
