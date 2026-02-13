/**
 * API Hospitality: Bookings (Reservas)
 * Usa el modelo STRBooking existente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ data: [], stats: null }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');

    const where: any = {
      companyId: session.user.companyId,
    };

    // Filtrar por building si se especifica
    if (buildingId && buildingId !== 'all') {
      where.listing = { unit: { buildingId } };
    }

    const bookings = await prisma.sTRBooking.findMany({
      where,
      include: {
        listing: {
          select: {
            titulo: true,
            unit: {
              select: {
                numero: true,
                building: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { checkInDate: 'desc' },
      take: 50,
    });

    // Mapear a formato esperado por la página
    const mapped = bookings.map((b: any) => ({
      id: b.id,
      guestName: b.guestNombre,
      guestEmail: b.guestEmail,
      guestPhone: b.guestTelefono,
      checkIn: b.checkInDate,
      checkOut: b.checkOutDate,
      numGuests: b.numHuespedes,
      precioTotal: Number(b.precioTotal) || 0,
      estado: b.estado,
      notas: b.notas,
      plataforma: b.canal,
      listing: b.listing,
    }));

    // Stats
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: bookings.length,
      confirmadas: bookings.filter((b: any) => b.estado === 'confirmada').length,
      pendientes: bookings.filter((b: any) => b.estado === 'pendiente').length,
      checkinHoy: bookings.filter((b: any) =>
        b.checkInDate && new Date(b.checkInDate).toISOString().split('T')[0] === today
      ).length,
      checkoutHoy: bookings.filter((b: any) =>
        b.checkOutDate && new Date(b.checkOutDate).toISOString().split('T')[0] === today
      ).length,
      ingresosMes: bookings
        .filter((b: any) => new Date(b.checkInDate) >= monthStart)
        .reduce((sum: number, b: any) => sum + (Number(b.precioTotal) || 0), 0),
    };

    return NextResponse.json({ data: mapped, stats });
  } catch (error: any) {
    logger.error('Error en hospitality bookings GET:', error);
    return NextResponse.json({ data: [], stats: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Buscar o crear un listing para la unidad seleccionada
    let listing = await prisma.sTRListing.findFirst({
      where: {
        companyId: session.user.companyId,
        unitId: body.roomId,
      },
    });

    if (!listing && body.roomId) {
      // Crear listing básico
      const unit = await prisma.unit.findUnique({
        where: { id: body.roomId },
        include: { building: true },
      });

      if (unit) {
        listing = await prisma.sTRListing.create({
          data: {
            companyId: session.user.companyId,
            unitId: body.roomId,
            titulo: `${unit.building?.nombre || 'Propiedad'} - ${unit.numero}`,
            descripcion: `Unidad ${unit.numero}`,
            tipoPropiedad: unit.tipo || 'vivienda',
            capacidadMaxima: unit.habitaciones || 2,
            numDormitorios: unit.habitaciones || 1,
            numCamas: unit.habitaciones || 1,
            numBanos: unit.banos || 1,
            precioPorNoche: Number(unit.rentaMensual) || 0,
            activo: true,
          },
        });
      }
    }

    if (!listing) {
      return NextResponse.json({ error: 'No se pudo asociar la reserva a un listing' }, { status: 400 });
    }

    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    const numNoches = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const precioTotal = body.precioTotal || (numNoches * Number(listing.precioPorNoche));

    const booking = await prisma.sTRBooking.create({
      data: {
        companyId: session.user.companyId,
        listingId: listing.id,
        canal: 'directo',
        guestNombre: body.guestName,
        guestEmail: body.guestEmail,
        guestTelefono: body.guestPhone || null,
        numHuespedes: body.numGuests || 1,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numNoches,
        precioTotal,
        tarifaNocturna: Number(listing.precioPorNoche),
        ingresoNeto: precioTotal,
        estado: 'confirmada',
        notas: body.notas || null,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    logger.error('Error en hospitality bookings POST:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
