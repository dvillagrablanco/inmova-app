import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const estado = searchParams.get('estado');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      companyId: session.user.companyId
    };

    if (listingId) {
      where.listingId = listingId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) {
        where.checkInDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.checkInDate.lte = new Date(endDate);
      }
    }

    const bookings = await prisma.sTRBooking.findMany({
      where,
      include: {
        listing: {
          include: {
            unit: {
              include: {
                building: true
              }
            }
          }
        }
      },
      orderBy: {
        checkInDate: 'desc'
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    logger.error('Error fetching STR bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Calcular número de noches
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    const numNoches = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular ingreso neto
    const ingresoNeto = data.precioTotal - data.comisionCanal - data.tasasImpuestos;

    const booking = await prisma.sTRBooking.create({
      data: {
        ...data,
        companyId: session.user.companyId,
        numNoches,
        ingresoNeto
      },
      include: {
        listing: {
          include: {
            unit: {
              include: {
                building: true
              }
            }
          }
        }
      }
    });

    // Actualizar contador de reservas del listing
    await prisma.sTRListing.update({
      where: { id: data.listingId },
      data: {
        totalReservas: {
          increment: 1
        }
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    logger.error('Error creating STR booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
