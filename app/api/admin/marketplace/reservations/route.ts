import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { startOfMonth, endOfMonth } from 'date-fns';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';

const mapReservationStatus = (estado: string): ReservationStatus => {
  switch (estado) {
    case 'confirmada':
      return 'confirmed';
    case 'completada':
      return 'completed';
    case 'cancelada':
    case 'rechazada':
      return 'cancelled';
    case 'disputada':
      return 'disputed';
    case 'pendiente':
    default:
      return 'pending';
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [reservations, statusCounts, monthTotals] = await prisma.$transaction([
      prisma.marketplaceBooking.findMany({
        include: {
          service: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              provider: {
                select: { id: true, nombre: true, email: true },
              },
            },
          },
          tenant: {
            select: { nombreCompleto: true, email: true },
          },
          unit: {
            include: { building: { select: { nombre: true } } },
          },
          company: {
            select: { nombre: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketplaceBooking.groupBy({
        by: ['estado'],
        orderBy: { estado: 'asc' },
        _count: { _all: true },
      }),
      prisma.marketplaceBooking.aggregate({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          precioTotal: true,
          comision: true,
        },
      }),
    ]);

    const countsByEstado = statusCounts.reduce<Record<string, number>>((acc, item) => {
      const count =
        typeof item._count === 'object' && item._count ? item._count._all ?? 0 : 0;
      acc[item.estado] = count;
      return acc;
    }, {});

    const stats = {
      total: reservations.length,
      pendientes: countsByEstado.pendiente || 0,
      confirmadas: countsByEstado.confirmada || 0,
      completadas: countsByEstado.completada || 0,
      canceladas: (countsByEstado.cancelada || 0) + (countsByEstado.rechazada || 0),
      ingresosMes: monthTotals._sum.precioTotal || 0,
      comisionesMes: monthTotals._sum.comision || 0,
    };

    const formatted = reservations.map((reservation) => ({
      id: reservation.id,
      servicio: reservation.service.nombre,
      categoria: reservation.service.categoria,
      proveedor: reservation.service.provider?.nombre || 'Sin proveedor',
      cliente: {
        empresa: reservation.company.nombre || 'Empresa',
        contacto: reservation.tenant.nombreCompleto,
        email: reservation.tenant.email,
      },
      propiedad: reservation.unit?.building?.nombre || reservation.unit?.numero || null,
      fechaSolicitud: reservation.fechaSolicitud.toISOString(),
      fechaServicio: reservation.fechaServicio ? reservation.fechaServicio.toISOString() : null,
      precio: reservation.precioTotal,
      comision: reservation.comision,
      estado: mapReservationStatus(reservation.estado),
      notas: reservation.notasCliente || reservation.notasInternas || null,
    }));

    return NextResponse.json({
      stats,
      reservations: formatted,
    });
  } catch (error: unknown) {
    logger.error('[API Error] Marketplace reservations:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
