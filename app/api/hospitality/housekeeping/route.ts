/**
 * API Hospitality: Housekeeping
 * 
 * GET   - Lista tareas de limpieza generadas desde check-outs
 * PATCH - Actualizar estado de una tarea
 * 
 * Genera tareas dinámicamente desde STRBookings con check-out próximo.
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
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ data: [] });
    }

    // Generar tareas de housekeeping desde bookings con checkout hoy o mañana
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const bookingsWithCheckout = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        checkOutDate: { gte: today, lte: tomorrow },
        estado: { in: ['checked_in', 'completada'] },
      },
      include: {
        listing: {
          select: {
            titulo: true,
            unit: {
              select: {
                id: true,
                numero: true,
                building: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { checkOutDate: 'asc' },
    });

    // También buscar bookings con check-in próximo (para preparar habitación)
    const bookingsWithCheckin = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        checkInDate: { gte: today, lte: tomorrow },
        estado: 'confirmada',
      },
      include: {
        listing: {
          select: {
            titulo: true,
            unit: {
              select: {
                id: true,
                numero: true,
                building: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    // Generar tareas de limpieza dinámicamente
    const tasks = [
      ...bookingsWithCheckout.map((b: any) => ({
        id: `clean-${b.id}`,
        unitNumero: b.listing?.unit?.numero || 'N/A',
        buildingNombre: b.listing?.unit?.building?.nombre || b.listing?.titulo || 'N/A',
        tipo: 'checkout_clean' as const,
        estado: b.estado === 'completada' ? 'pendiente' as const : 'pendiente' as const,
        prioridad: 'alta' as const,
        checkoutDate: b.checkOutDate,
        notas: `Check-out: ${b.guestNombre}`,
      })),
      ...bookingsWithCheckin.map((b: any) => ({
        id: `prep-${b.id}`,
        unitNumero: b.listing?.unit?.numero || 'N/A',
        buildingNombre: b.listing?.unit?.building?.nombre || b.listing?.titulo || 'N/A',
        tipo: 'stay_clean' as const,
        estado: 'pendiente' as const,
        prioridad: 'media' as const,
        checkinDate: b.checkInDate,
        notas: `Preparar para: ${b.guestNombre}`,
      })),
    ];

    return NextResponse.json({ data: tasks });
  } catch (error: any) {
    logger.error('Error en hospitality housekeeping GET:', error);
    return NextResponse.json({ error: 'Error interno', data: [] }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { taskId, estado } = await req.json();

    // Las tareas son dinámicas (no persistidas), el estado se gestiona en frontend
    // En producción esto se conectaría a una tabla HousekeepingTask
    logger.info(`Housekeeping task ${taskId} → ${estado}`, { userId: session.user.id });

    return NextResponse.json({ success: true, taskId, estado });
  } catch (error: any) {
    logger.error('Error en hospitality housekeeping PATCH:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
