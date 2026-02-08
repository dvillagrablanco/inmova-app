export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  fechaSolicitada: z.string().min(1),
  notas: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { serviceId, fechaSolicitada, notas } = parsed.data;
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId requerido' },
        { status: 400 }
      );
    }

    // Verificar que el servicio existe
    const service = await prisma.marketplaceService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // Crear la reserva en la base de datos
    const precioBase = service.precio;
    if (precioBase == null) {
      return NextResponse.json(
        { error: 'Servicio sin precio configurado' },
        { status: 400 }
      );
    }

    const comision = (precioBase * (service.comisionPorcentaje || 0)) / 100;
    const precioTotal = precioBase + comision;

    const booking = await prisma.marketplaceBooking.create({
      data: {
        serviceId,
        companyId: session.user.companyId,
        tenantId,
        estado: 'pendiente',
        precioBase,
        comision,
        precioTotal,
        fechaServicio: new Date(fechaSolicitada),
        notasCliente: notas,
      },
    });

    logger.info(`Booking created: ${booking.id} for service ${serviceId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Reserva creada correctamente',
      bookingId: booking.id,
    });
  } catch (error: unknown) {
    logger.error('Error creating marketplace booking:', error);
    return NextResponse.json(
      { error: 'Error al crear reserva' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener reservas reales de la base de datos
    const bookings = await prisma.marketplaceBooking.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        service: {
          select: {
            id: true,
            nombre: true,
            provider: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar al formato esperado
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      serviceId: booking.serviceId,
      serviceName: booking.service?.nombre || '',
      providerName: booking.service?.provider?.nombre || '',
      status: booking.estado,
      date: booking.fechaServicio.toISOString().split('T')[0],
      amount: booking.precioTotal,
    }));

    return NextResponse.json(formattedBookings);
  } catch (error: unknown) {
    logger.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}
