/**
 * API Endpoint: Reservas de Hospitality
 * Utiliza el modelo STRBooking existente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createBookingSchema = z.object({
  roomId: z.string(),
  buildingId: z.string(),
  guestName: z.string(),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  checkIn: z.string(), // ISO date
  checkOut: z.string(), // ISO date
  numGuests: z.number().int().min(1),
  precioTotal: z.number().min(0),
  notas: z.string().optional(),
  origen: z.string().default('directo'), // directo, booking, airbnb, etc.
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
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const { prisma } = await import('@/lib/db');

    // Obtener reservas
    const bookings = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        ...(buildingId && { buildingId }),
        ...(estado && { estado }),
        ...(fechaDesde && {
          checkIn: { gte: new Date(fechaDesde) },
        }),
        ...(fechaHasta && {
          checkOut: { lte: new Date(fechaHasta) },
        }),
      },
      include: {
        listing: {
          select: { titulo: true },
        },
      },
      orderBy: { checkIn: 'desc' },
      take: 100,
    });

    // Estadísticas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      total: bookings.length,
      confirmadas: bookings.filter(b => b.estado === 'confirmada').length,
      pendientes: bookings.filter(b => b.estado === 'pendiente').length,
      checkinHoy: bookings.filter(b => {
        const checkIn = new Date(b.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      }).length,
      checkoutHoy: bookings.filter(b => {
        const checkOut = new Date(b.checkOut);
        checkOut.setHours(0, 0, 0, 0);
        return checkOut.getTime() === today.getTime();
      }).length,
      ingresosMes: bookings
        .filter(b => {
          const checkIn = new Date(b.checkIn);
          return checkIn.getMonth() === today.getMonth() && 
                 checkIn.getFullYear() === today.getFullYear();
        })
        .reduce((sum, b) => sum + (b.precioTotal || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: bookings,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching hospitality bookings:', error);
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

    // Verificar que la habitación está disponible
    const existingBooking = await prisma.sTRBooking.findFirst({
      where: {
        companyId,
        estado: { in: ['confirmada', 'pendiente'] },
        OR: [
          {
            checkIn: { lte: new Date(data.checkOut) },
            checkOut: { gte: new Date(data.checkIn) },
          },
        ],
      },
    });

    if (existingBooking) {
      return NextResponse.json({
        error: 'Habitación no disponible para esas fechas',
      }, { status: 400 });
    }

    // Buscar o crear un listing para este edificio
    let listing = await prisma.sTRListing.findFirst({
      where: { companyId, buildingId: data.buildingId },
    });

    if (!listing) {
      listing = await prisma.sTRListing.create({
        data: {
          companyId,
          buildingId: data.buildingId,
          titulo: 'Reserva Directa',
          descripcion: 'Reservas directas del sistema',
          tipo: 'hotel',
          capacidad: 2,
          habitaciones: 1,
          banos: 1,
          precioPorNoche: 0,
          estado: 'activo',
        },
      });
    }

    const booking = await prisma.sTRBooking.create({
      data: {
        companyId,
        listingId: listing.id,
        buildingId: data.buildingId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        numGuests: data.numGuests,
        precioTotal: data.precioTotal,
        notas: data.notas,
        plataforma: data.origen,
        estado: 'pendiente',
      },
    });

    logger.info('Hospitality booking created', { bookingId: booking.id, companyId });

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Reserva creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating hospitality booking:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
