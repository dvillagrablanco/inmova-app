/**
 * API Endpoint: Gestión de Salas de Reuniones
 * 
 * GET /api/salas-reuniones - Listar salas
 * POST /api/salas-reuniones - Crear sala
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// VALIDACIÓN
// ============================================================================

const createRoomSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  buildingId: z.string().optional(),
  capacidad: z.number().int().positive(),
  equipamiento: z.array(z.string()).default([]),
  tarifaHora: z.number().positive().optional(),
  tarifaMediodia: z.number().positive().optional(),
  tarifaDia: z.number().positive().optional(),
  disponibleDesde: z.string().default('08:00'),
  disponibleHasta: z.string().default('20:00'),
  diasDisponibles: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  imagenes: z.array(z.string()).default([]),
});

// ============================================================================
// GET - Listar salas
// ============================================================================

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
    const capacidadMin = searchParams.get('capacidadMin');

    const { prisma } = await import('@/lib/db');

    // Buscar espacios de tipo sala de reuniones
    const where: any = {
      companyId,
      tipo: { in: ['sala_reuniones', 'meeting_room', 'sala'] },
    };

    if (buildingId) {
      where.buildingId = buildingId;
    }
    if (capacidadMin) {
      where.capacidad = { gte: parseInt(capacidadMin) };
    }

    const rooms = await prisma.workspaceSpace.findMany({
      where,
      include: {
        building: {
          select: { id: true, nombre: true, direccion: true },
        },
        bookings: {
          where: {
            fechaFin: { gte: new Date() },
            estado: { in: ['confirmada', 'pendiente'] },
          },
          select: {
            id: true,
            fechaInicio: true,
            fechaFin: true,
            estado: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    // Calcular disponibilidad de cada sala
    const roomsWithAvailability = rooms.map(room => ({
      ...room,
      disponibleHoy: !room.bookings.some(b => {
        const now = new Date();
        return new Date(b.fechaInicio) <= now && new Date(b.fechaFin) >= now;
      }),
      proximasReservas: room.bookings.length,
    }));

    // Estadísticas
    const stats = {
      total: rooms.length,
      disponiblesHoy: roomsWithAvailability.filter(r => r.disponibleHoy).length,
      capacidadTotal: rooms.reduce((sum, r) => sum + (r.capacidad || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: roomsWithAvailability,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching meeting rooms:', error);
    return NextResponse.json({ error: 'Error al obtener salas' }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear sala
// ============================================================================

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

    const room = await prisma.workspaceSpace.create({
      data: {
        companyId,
        buildingId: data.buildingId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: 'sala_reuniones',
        capacidad: data.capacidad,
        equipamiento: data.equipamiento,
        tarifaHora: data.tarifaHora,
        tarifaMediodia: data.tarifaMediodia,
        tarifaDia: data.tarifaDia,
        disponibleDesde: data.disponibleDesde,
        disponibleHasta: data.disponibleHasta,
        diasDisponibles: data.diasDisponibles,
        imagenes: data.imagenes,
        activo: true,
      },
    });

    logger.info('Meeting room created', { roomId: room.id, companyId });

    return NextResponse.json({
      success: true,
      data: room,
      message: 'Sala de reuniones creada',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating meeting room:', error);
    return NextResponse.json({ error: 'Error al crear sala' }, { status: 500 });
  }
}
