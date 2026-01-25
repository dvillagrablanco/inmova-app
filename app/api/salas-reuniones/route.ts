/**
 * API Endpoint: Gestión de Salas de Reuniones
 * 
 * Usa el modelo CommonSpace para espacios comunes de tipo sala_reuniones
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
  buildingId: z.string(),
  capacidadMaxima: z.number().int().positive(),
  costoPorHora: z.number().positive().optional(),
  horaApertura: z.string().default('08:00'),
  horaCierre: z.string().default('20:00'),
  duracionMaximaHoras: z.number().int().positive().default(4),
  anticipacionDias: z.number().int().positive().default(30),
  reglas: z.string().optional(),
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

    // Buscar espacios comunes de tipo sala de reuniones
    const where: any = {
      companyId,
      tipo: { in: ['sala_reuniones', 'salon_actos', 'sala_multiusos'] },
      activo: true,
    };

    if (buildingId) {
      where.buildingId = buildingId;
    }
    if (capacidadMin) {
      where.capacidadMaxima = { gte: parseInt(capacidadMin) };
    }

    const rooms = await prisma.commonSpace.findMany({
      where,
      include: {
        building: {
          select: { id: true, nombre: true, direccion: true },
        },
        reservations: {
          where: {
            fechaReserva: { gte: new Date() },
            estado: { in: ['confirmada', 'pendiente'] },
          },
          select: {
            id: true,
            fechaReserva: true,
            horaInicio: true,
            horaFin: true,
            estado: true,
          },
          take: 10,
        },
      },
      orderBy: { nombre: 'asc' },
    });

    // Calcular disponibilidad de cada sala
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const roomsWithAvailability = rooms.map(room => {
      const reservasHoy = room.reservations.filter(r => {
        const fechaReserva = new Date(r.fechaReserva);
        fechaReserva.setHours(0, 0, 0, 0);
        return fechaReserva.getTime() === today.getTime();
      });
      
      return {
        id: room.id,
        nombre: room.nombre,
        descripcion: room.descripcion,
        tipo: room.tipo,
        capacidad: room.capacidadMaxima,
        tarifaHora: room.costoPorHora,
        disponibleDesde: room.horaApertura,
        disponibleHasta: room.horaCierre,
        activo: room.activo,
        building: room.building,
        bookings: room.reservations.map(r => ({
          id: r.id,
          fechaInicio: r.fechaReserva,
          horaInicio: r.horaInicio,
          horaFin: r.horaFin,
          estado: r.estado,
        })),
        disponibleHoy: reservasHoy.length === 0,
        proximasReservas: room.reservations.length,
        equipamiento: [], // CommonSpace no tiene este campo, pero lo mantenemos para compatibilidad
        diasDisponibles: [1, 2, 3, 4, 5], // Valores por defecto
      };
    });

    // Estadísticas
    const stats = {
      total: rooms.length,
      disponiblesHoy: roomsWithAvailability.filter(r => r.disponibleHoy).length,
      capacidadTotal: rooms.reduce((sum, r) => sum + (r.capacidadMaxima || 0), 0),
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

    // Verificar que el edificio existe
    const building = await prisma.building.findFirst({
      where: { id: data.buildingId, companyId },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const room = await prisma.commonSpace.create({
      data: {
        companyId,
        buildingId: data.buildingId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: 'sala_reuniones',
        capacidadMaxima: data.capacidadMaxima,
        requierePago: !!data.costoPorHora,
        costoPorHora: data.costoPorHora,
        horaApertura: data.horaApertura,
        horaCierre: data.horaCierre,
        duracionMaximaHoras: data.duracionMaximaHoras,
        anticipacionDias: data.anticipacionDias,
        reglas: data.reglas,
        activo: true,
      },
      include: {
        building: {
          select: { id: true, nombre: true, direccion: true },
        },
      },
    });

    logger.info('Meeting room created', { roomId: room.id, companyId });

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        nombre: room.nombre,
        descripcion: room.descripcion,
        capacidad: room.capacidadMaxima,
        tarifaHora: room.costoPorHora,
        disponibleDesde: room.horaApertura,
        disponibleHasta: room.horaCierre,
        activo: room.activo,
        building: room.building,
      },
      message: 'Sala de reuniones creada',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating meeting room:', error);
    return NextResponse.json({ error: 'Error al crear sala' }, { status: 500 });
  }
}
