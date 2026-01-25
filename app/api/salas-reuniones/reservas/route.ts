/**
 * API Endpoint: Reservas de Salas de Reuniones
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
  titulo: z.string().min(2),
  descripcion: z.string().optional(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  asistentes: z.array(z.string()).default([]),
  serviciosAdicionales: z.array(z.string()).default([]), // catering, videoconferencia, etc
  notas: z.string().optional(),
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
      where.fechaInicio = {
        gte: fechaDate,
        lt: fechaFin,
      };
    }

    const bookings = await prisma.workspaceBooking.findMany({
      where,
      include: {
        space: {
          select: { id: true, nombre: true, capacidad: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { fechaInicio: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
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
    const userId = session.user.id;
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Company/User ID no encontrado' }, { status: 400 });
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

    // Verificar disponibilidad
    const conflictingBooking = await prisma.workspaceBooking.findFirst({
      where: {
        spaceId: data.spaceId,
        estado: { in: ['confirmada', 'pendiente'] },
        OR: [
          {
            fechaInicio: { lte: new Date(data.fechaInicio) },
            fechaFin: { gt: new Date(data.fechaInicio) },
          },
          {
            fechaInicio: { lt: new Date(data.fechaFin) },
            fechaFin: { gte: new Date(data.fechaFin) },
          },
          {
            fechaInicio: { gte: new Date(data.fechaInicio) },
            fechaFin: { lte: new Date(data.fechaFin) },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json({
        error: 'La sala no está disponible en ese horario',
      }, { status: 409 });
    }

    // Obtener tarifa de la sala
    const space = await prisma.workspaceSpace.findUnique({
      where: { id: data.spaceId },
      select: { tarifaHora: true, nombre: true },
    });

    // Calcular duración y precio
    const inicio = new Date(data.fechaInicio);
    const fin = new Date(data.fechaFin);
    const duracionHoras = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    const precio = space?.tarifaHora ? space.tarifaHora * duracionHoras : 0;

    const booking = await prisma.workspaceBooking.create({
      data: {
        companyId,
        spaceId: data.spaceId,
        userId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        fechaInicio: inicio,
        fechaFin: fin,
        estado: 'confirmada',
        asistentes: data.asistentes,
        serviciosAdicionales: data.serviciosAdicionales,
        notas: data.notas,
        precioTotal: precio,
      },
      include: {
        space: {
          select: { id: true, nombre: true },
        },
      },
    });

    logger.info('Room booking created', { bookingId: booking.id, spaceId: data.spaceId });

    return NextResponse.json({
      success: true,
      data: booking,
      message: `Reserva confirmada para ${space?.nombre || 'la sala'}`,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating room booking:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
