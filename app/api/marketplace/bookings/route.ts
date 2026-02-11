export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, tenantId, unitId, fechaSolicitada, notas } = body;

    if (!serviceId || !tenantId) {
      return NextResponse.json(
        { error: 'serviceId y tenantId son requeridos' },
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
    const precioBase = service.precio || 0;
    const comision = (precioBase * (service.comisionPorcentaje || 0)) / 100;
    const precioTotal = precioBase + comision;
    const fechaServicio = fechaSolicitada ? new Date(fechaSolicitada) : new Date();

    const booking = await prisma.marketplaceBooking.create({
      data: {
        serviceId,
        companyId: session.user.companyId,
        tenantId,
        unitId,
        estado: 'pendiente',
        fechaServicio,
        precioBase,
        comision,
        precioTotal,
        notasCliente: notas,
      },
    });

    logger.info(`Booking created: ${booking.id} for service ${serviceId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Reserva creada correctamente',
      bookingId: booking.id,
    });
  } catch (error) {
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
      serviceName: booking.service?.nombre || 'Servicio',
      providerName: booking.service?.provider?.nombre || 'Proveedor',
      status: booking.estado,
      date:
        booking.fechaServicio?.toISOString().split('T')[0] ||
        booking.createdAt.toISOString().split('T')[0],
      amount: booking.precioTotal || 0,
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}
