import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [company, reservations] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { nombre: true },
      }),
      prisma.marketplaceBooking.findMany({
      where: { companyId },
      include: {
        service: {
          select: {
            nombre: true,
            categoria: true,
            provider: { select: { nombre: true } },
          },
        },
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
        unit: {
          select: {
            numero: true,
          },
        },
      },
      orderBy: { fechaSolicitud: 'desc' },
      take: 20,
      }),
    ]);

    const mapStatus = (estado: string) => {
      switch (estado) {
        case 'pendiente':
          return 'pending';
        case 'confirmada':
          return 'confirmed';
        case 'completada':
          return 'completed';
        case 'cancelada':
          return 'cancelled';
        case 'disputada':
          return 'disputed';
        default:
          return 'pending';
      }
    };

    const formatted = reservations.map((reservation) => ({
      id: reservation.id,
      servicio: reservation.service.nombre,
      categoria: reservation.service.categoria,
      proveedor: reservation.service.provider?.nombre || 'Sin proveedor',
      cliente: {
        empresa: company?.nombre || 'Empresa',
        contacto: reservation.tenant.nombreCompleto,
        email: reservation.tenant.email,
      },
      propiedad: reservation.unit?.numero ? `Unidad ${reservation.unit.numero}` : null,
      fechaSolicitud: reservation.fechaSolicitud.toISOString(),
      fechaServicio: reservation.fechaServicio.toISOString(),
      precio: reservation.precioTotal,
      comision: reservation.comision,
      estado: mapStatus(reservation.estado),
      notas: reservation.notasCliente || reservation.notasInternas || null,
    }));

    const stats = formatted.reduce(
      (acc, reservation) => {
        acc.total += 1;
        if (reservation.estado === 'pending') acc.pendientes += 1;
        if (reservation.estado === 'confirmed') acc.confirmadas += 1;
        if (reservation.estado === 'completed') acc.completadas += 1;
        if (reservation.estado === 'cancelled') acc.canceladas += 1;
        return acc;
      },
      {
        total: 0,
        pendientes: 0,
        confirmadas: 0,
        completadas: 0,
        canceladas: 0,
        ingresosMes: 0,
        comisionesMes: 0,
      }
    );

    const monthReservations = reservations.filter(
      (reservation) =>
        reservation.fechaServicio >= monthStart && reservation.fechaServicio < monthEnd
    );

    stats.ingresosMes = monthReservations.reduce(
      (sum, reservation) => sum + (reservation.precioTotal || 0),
      0
    );
    stats.comisionesMes = monthReservations.reduce(
      (sum, reservation) => sum + (reservation.comision || 0),
      0
    );

    return NextResponse.json({ stats, reservations: formatted });
  } catch (error) {
    logger.error('[API Error] Marketplace reservations:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
