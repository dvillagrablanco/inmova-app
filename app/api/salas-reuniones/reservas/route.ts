/**
 * API Endpoint: Reservas de Salas de Reuniones
 * 
 * Usa el modelo SpaceReservation para gestionar reservas de CommonSpace
 * 
 * GET /api/salas-reuniones/reservas - Listar reservas
 * POST /api/salas-reuniones/reservas - Crear reserva
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createBookingSchema = z.object({
  spaceId: z.string(),
  tenantId: z.string(),
  fechaReserva: z.string(), // Fecha YYYY-MM-DD
  horaInicio: z.string(), // HH:mm
  horaFin: z.string(), // HH:mm
  numeroPersonas: z.number().int().positive().optional(),
  proposito: z.string().optional(),
  observaciones: z.string().optional(),
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
    const spaceId = searchParams.get('spaceId');
    const fecha = searchParams.get('fecha');

    const { prisma } = await import('@/lib/db');

    const where: any = { companyId };

    if (spaceId) {
      where.spaceId = spaceId;
    }
    if (fecha) {
      const fechaDate = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      where.fechaReserva = {
        gte: fechaDate,
        lt: fechaFin,
      };
    }

    const bookings = await prisma.spaceReservation.findMany({
      where,
      include: {
        space: {
          select: { id: true, nombre: true, capacidadMaxima: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { fechaReserva: 'asc' },
    });

    // Transformar para mantener compatibilidad con el frontend
    const transformedBookings = bookings.map(b => ({
      id: b.id,
      spaceId: b.spaceId,
      space: {
        id: b.space.id,
        nombre: b.space.nombre,
        capacidad: b.space.capacidadMaxima,
      },
      tenantId: b.tenantId,
      tenant: b.tenant ? {
        id: b.tenant.id,
        name: `${b.tenant.firstName} ${b.tenant.lastName}`,
        email: b.tenant.email,
      } : null,
      titulo: b.proposito || 'Reserva',
      fechaInicio: b.fechaReserva,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
      estado: b.estado,
      numeroPersonas: b.numeroPersonas,
      proposito: b.proposito,
      observaciones: b.observaciones,
      monto: b.monto,
      pagado: b.pagado,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedBookings,
    });
  } catch (error: any) {
    logger.error('Error fetching room bookings:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
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
    const validationResult = createBookingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    // Verificar que el espacio existe y pertenece a la compañía
    const space = await prisma.commonSpace.findFirst({
      where: { id: data.spaceId, companyId },
      select: { id: true, nombre: true, costoPorHora: true, horaApertura: true, horaCierre: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    // Verificar disponibilidad - buscar reservas conflictivas
    const fechaReserva = new Date(data.fechaReserva);
    const conflictingBooking = await prisma.spaceReservation.findFirst({
      where: {
        spaceId: data.spaceId,
        fechaReserva: fechaReserva,
        estado: { in: ['confirmada', 'pendiente'] },
        OR: [
          {
            horaInicio: { lte: data.horaInicio },
            horaFin: { gt: data.horaInicio },
          },
          {
            horaInicio: { lt: data.horaFin },
            horaFin: { gte: data.horaFin },
          },
          {
            horaInicio: { gte: data.horaInicio },
            horaFin: { lte: data.horaFin },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json({
        error: 'La sala no está disponible en ese horario',
      }, { status: 409 });
    }

    // Calcular duración y precio
    const [horaIni, minIni] = data.horaInicio.split(':').map(Number);
    const [horaFin, minFin] = data.horaFin.split(':').map(Number);
    const duracionHoras = (horaFin - horaIni) + (minFin - minIni) / 60;
    const monto = space.costoPorHora ? space.costoPorHora * duracionHoras : null;

    const booking = await prisma.spaceReservation.create({
      data: {
        companyId,
        spaceId: data.spaceId,
        tenantId: data.tenantId,
        fechaReserva,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        estado: 'confirmada',
        monto,
        pagado: !monto, // Si es gratis, marcar como pagado
        numeroPersonas: data.numeroPersonas,
        proposito: data.proposito,
        observaciones: data.observaciones,
      },
      include: {
        space: {
          select: { id: true, nombre: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Room booking created', { bookingId: booking.id, spaceId: data.spaceId });

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        spaceId: booking.spaceId,
        space: booking.space,
        tenantId: booking.tenantId,
        tenant: booking.tenant ? {
          id: booking.tenant.id,
          name: `${booking.tenant.firstName} ${booking.tenant.lastName}`,
        } : null,
        fechaReserva: booking.fechaReserva,
        horaInicio: booking.horaInicio,
        horaFin: booking.horaFin,
        estado: booking.estado,
        monto: booking.monto,
      },
      message: `Reserva confirmada para ${space.nombre}`,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating room booking:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
