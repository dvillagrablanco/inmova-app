import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';
import type { BookingStatus, Prisma } from '@/types/prisma-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ReservaEstado = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

interface Reserva {
  id: string;
  propiedad: string;
  unidad: string;
  cliente: string;
  email: string;
  telefono: string;
  fechaEntrada: string;
  fechaSalida: string;
  noches: number;
  precioPorNoche: number;
  total: number;
  estado: ReservaEstado;
  plataforma?: string;
}

const estadoSchema = z.enum(['pendiente', 'confirmada', 'cancelada', 'completada']);
const channelOptions = [
  'AIRBNB',
  'BOOKING',
  'VRBO',
  'HOMEAWAY',
  'WEB_PROPIA',
  'EXPEDIA',
  'TRIPADVISOR',
  'OTROS',
] as const;

type ChannelKey = (typeof channelOptions)[number];

const createSchema = z.object({
  listingId: z.string().optional(),
  unitId: z.string().optional(),
  propertyId: z.string().optional(),
  canal: z.enum(channelOptions).optional(),
  clienteNombre: z.string().optional(),
  guestNombre: z.string().optional(),
  clienteEmail: z.string().email().optional(),
  guestEmail: z.string().email().optional(),
  telefono: z.string().optional(),
  guestTelefono: z.string().optional(),
  fechaEntrada: z.string(),
  fechaSalida: z.string(),
  precioPorNoche: z.number().nonnegative().optional(),
  tarifaNocturna: z.number().nonnegative().optional(),
  tarifaLimpieza: z.number().nonnegative().optional(),
  tasasImpuestos: z.number().nonnegative().optional(),
  comisionCanal: z.number().nonnegative().optional(),
  numHuespedes: z.number().int().positive().optional(),
});

const channelLabels: Record<ChannelKey, string> = {
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking',
  VRBO: 'VRBO',
  HOMEAWAY: 'HomeAway',
  WEB_PROPIA: 'Web Propia',
  EXPEDIA: 'Expedia',
  TRIPADVISOR: 'Tripadvisor',
  OTROS: 'Otros',
};

const bookingStatusToReservaEstado: Record<BookingStatus, ReservaEstado> = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  CHECK_IN: 'confirmada',
  CHECK_OUT: 'completada',
  CANCELADA: 'cancelada',
  NO_SHOW: 'cancelada',
};

const reservaEstadoToBookingStatus: Record<ReservaEstado, BookingStatus> = {
  pendiente: 'PENDIENTE',
  confirmada: 'CONFIRMADA',
  completada: 'CHECK_OUT',
  cancelada: 'CANCELADA',
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

// GET - Obtener reservas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');

    if (estado && estado !== 'all' && !estadoSchema.safeParse(estado).success) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const where: Prisma.STRBookingWhereInput = {
      companyId: session.user.companyId,
    };

    if (estado && estado !== 'all') {
      const normalizedEstado = estadoSchema.parse(estado);
      const bookingEstados: BookingStatus[] =
        normalizedEstado === 'confirmada'
          ? ['CONFIRMADA', 'CHECK_IN']
          : normalizedEstado === 'completada'
            ? ['CHECK_OUT']
            : normalizedEstado === 'cancelada'
              ? ['CANCELADA', 'NO_SHOW']
              : ['PENDIENTE'];
      where.estado = { in: bookingEstados };
    }

    const bookings = await prisma.sTRBooking.findMany({
      where,
      include: {
        listing: {
          include: {
            unit: {
              include: { building: true },
            },
          },
        },
      },
      take: 50,
      orderBy: { checkInDate: 'desc' },
    });

    let reservas: Reserva[] = bookings.map((booking) => ({
      id: booking.id,
      propiedad: booking.listing?.unit?.building?.nombre || booking.listing?.unit?.building?.direccion || 'Sin propiedad',
      unidad: booking.listing?.unit?.numero || '',
      cliente: booking.guestNombre,
      email: booking.guestEmail,
      telefono: booking.guestTelefono || '',
      fechaEntrada: booking.checkInDate.toISOString().split('T')[0],
      fechaSalida: booking.checkOutDate.toISOString().split('T')[0],
      noches: booking.numNoches,
      precioPorNoche: booking.tarifaNocturna,
      total: booking.precioTotal,
      estado: bookingStatusToReservaEstado[booking.estado],
      plataforma: channelLabels[booking.canal as ChannelKey],
    }));

    // Filtrar por estado
    if (estado && estado !== 'all') {
      reservas = reservas.filter((reserva) => reserva.estado === estado);
    }

    // Estadísticas
    const stats = {
      total: reservas.length,
      pendientes: reservas.filter((reserva) => reserva.estado === 'pendiente').length,
      confirmadas: reservas.filter((reserva) => reserva.estado === 'confirmada').length,
      completadas: reservas.filter((reserva) => reserva.estado === 'completada').length,
      ingresos: reservas
        .filter((reserva) => reserva.estado === 'confirmada' || reserva.estado === 'completada')
        .reduce((sum, reserva) => sum + reserva.total, 0),
    };

    return NextResponse.json({
      success: true,
      data: reservas,
      stats,
    });
  } catch (error: unknown) {
    logger.error('[API Reservas] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const data = createSchema.parse(await request.json());

    const guestNombre = data.guestNombre ?? data.clienteNombre;
    const guestEmail = data.guestEmail ?? data.clienteEmail;
    if (!guestNombre || !guestEmail) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: clienteNombre/guestNombre y clienteEmail/guestEmail' },
        { status: 400 }
      );
    }

    const entrada = new Date(data.fechaEntrada);
    const salida = new Date(data.fechaSalida);
    if (Number.isNaN(entrada.getTime()) || Number.isNaN(salida.getTime()) || salida <= entrada) {
      return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
    }

    const tarifaNocturna = data.tarifaNocturna ?? data.precioPorNoche ?? 0;
    if (tarifaNocturna <= 0) {
      return NextResponse.json({ error: 'precioPorNoche/tarifaNocturna inválido' }, { status: 400 });
    }

    let listingId = data.listingId;
    if (!listingId && data.unitId) {
      const listing = await prisma.sTRListing.findFirst({
        where: { companyId: session.user.companyId, unitId: data.unitId, activo: true },
        select: { id: true },
      });
      listingId = listing?.id;
    }

    if (!listingId && data.propertyId) {
      const listing = await prisma.sTRListing.findFirst({
        where: {
          companyId: session.user.companyId,
          activo: true,
          unit: { buildingId: data.propertyId },
        },
        select: { id: true },
      });
      listingId = listing?.id;
    }

    if (!listingId) {
      return NextResponse.json(
        { error: 'No se encontró un listing válido para la reserva' },
        { status: 404 }
      );
    }

    const listing = await prisma.sTRListing.findFirst({
      where: { id: listingId, companyId: session.user.companyId },
      select: { id: true },
    });
    if (!listing) {
      return NextResponse.json({ error: 'Listing no encontrado' }, { status: 404 });
    }

    const numNoches = Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));
    const tarifaLimpieza = data.tarifaLimpieza ?? 0;
    const tasasImpuestos = data.tasasImpuestos ?? 0;
    const comisionCanal = data.comisionCanal ?? 0;
    const precioTotal = numNoches * tarifaNocturna + tarifaLimpieza + tasasImpuestos;
    const ingresoNeto = precioTotal - comisionCanal - tasasImpuestos;

    const booking = await prisma.sTRBooking.create({
      data: {
        companyId: session.user.companyId,
        listingId: listing.id,
        canal: data.canal ?? 'WEB_PROPIA',
        guestNombre,
        guestEmail,
        guestTelefono: data.guestTelefono ?? data.telefono ?? null,
        numHuespedes: data.numHuespedes ?? 1,
        checkInDate: entrada,
        checkOutDate: salida,
        numNoches,
        precioTotal,
        tarifaNocturna,
        tarifaLimpieza,
        tasasImpuestos,
        comisionCanal,
        ingresoNeto,
        estado: 'PENDIENTE',
      },
      include: {
        listing: {
          include: {
            unit: {
              include: { building: true },
            },
          },
        },
      },
    });

    await prisma.sTRListing.update({
      where: { id: listing.id },
      data: { totalReservas: { increment: 1 } },
    });

    const responseReserva: Reserva = {
      id: booking.id,
      propiedad:
        booking.listing?.unit?.building?.nombre ||
        booking.listing?.unit?.building?.direccion ||
        'Sin propiedad',
      unidad: booking.listing?.unit?.numero || '',
      cliente: booking.guestNombre,
      email: booking.guestEmail,
      telefono: booking.guestTelefono || '',
      fechaEntrada: booking.checkInDate.toISOString().split('T')[0],
      fechaSalida: booking.checkOutDate.toISOString().split('T')[0],
      noches: booking.numNoches,
      precioPorNoche: booking.tarifaNocturna,
      total: booking.precioTotal,
      estado: bookingStatusToReservaEstado[booking.estado],
      plataforma: channelLabels[booking.canal as ChannelKey],
    };

    return NextResponse.json(
      {
        success: true,
        data: responseReserva,
        message: 'Reserva creada correctamente',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('[API Reservas] Error POST:', error);
    return NextResponse.json(
      { error: 'Error al crear reserva', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de reserva
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const body = await request.json();
    const parsed = z
      .object({
        reservaId: z.string(),
        nuevoEstado: estadoSchema,
      })
      .parse(body);

    const booking = await prisma.sTRBooking.findFirst({
      where: { id: parsed.reservaId, companyId: session.user.companyId },
      include: {
        listing: {
          include: {
            unit: {
              include: { building: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const bookingStatus = reservaEstadoToBookingStatus[parsed.nuevoEstado];
    const updateData: Prisma.STRBookingUpdateInput = {
      estado: bookingStatus,
    };
    const now = new Date();
    if (parsed.nuevoEstado === 'confirmada') {
      updateData.confirmadaEn = now;
    } else if (parsed.nuevoEstado === 'completada') {
      updateData.checkOutRealizado = now;
    } else if (parsed.nuevoEstado === 'cancelada') {
      updateData.canceladaEn = now;
    }

    const updated = await prisma.sTRBooking.update({
      where: { id: booking.id },
      data: updateData,
      include: {
        listing: {
          include: {
            unit: {
              include: { building: true },
            },
          },
        },
      },
    });

    const responseReserva: Reserva = {
      id: updated.id,
      propiedad:
        updated.listing?.unit?.building?.nombre ||
        updated.listing?.unit?.building?.direccion ||
        'Sin propiedad',
      unidad: updated.listing?.unit?.numero || '',
      cliente: updated.guestNombre,
      email: updated.guestEmail,
      telefono: updated.guestTelefono || '',
      fechaEntrada: updated.checkInDate.toISOString().split('T')[0],
      fechaSalida: updated.checkOutDate.toISOString().split('T')[0],
      noches: updated.numNoches,
      precioPorNoche: updated.tarifaNocturna,
      total: updated.precioTotal,
      estado: bookingStatusToReservaEstado[updated.estado],
      plataforma: channelLabels[updated.canal as ChannelKey],
    };

    return NextResponse.json({
      success: true,
      data: responseReserva,
      message: `Reserva ${parsed.nuevoEstado === 'confirmada' ? 'confirmada' : 'actualizada'} correctamente`,
    });
  } catch (error: unknown) {
    logger.error('[API Reservas] Error PATCH:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reserva', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
