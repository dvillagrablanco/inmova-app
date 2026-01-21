import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const activeStatuses = ['pendiente', 'asignada', 'aceptada', 'en_progreso', 'pausada'];
const pendingStatuses = ['pendiente', 'asignada'];

const mapStatus = (status: string): 'pendiente' | 'confirmada' | 'completada' | 'cancelada' => {
  if (status === 'completada') return 'completada';
  if (status === 'cancelada' || status === 'rechazada') return 'cancelada';
  if (status === 'pendiente') return 'pendiente';
  return 'confirmada';
};

const formatDateParts = (date: Date) => {
  const iso = date.toISOString();
  const [dayPart, timePart] = iso.split('T');
  const time = timePart ? timePart.slice(0, 5) : '00:00';
  return { dayPart, time };
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({
        stats: {
          serviciosActivos: 0,
          reservasEsteMes: 0,
          reservasPendientes: 0,
          ingresosMes: 0,
          valoracionMedia: 0,
          totalValoraciones: 0,
        },
        recentBookings: [],
      });
    }

    const provider = await prisma.provider.findFirst({
      where: { companyId, email: user.email },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json({
        stats: {
          serviciosActivos: 0,
          reservasEsteMes: 0,
          reservasPendientes: 0,
          ingresosMes: 0,
          valoracionMedia: 0,
          totalValoraciones: 0,
        },
        recentBookings: [],
      });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [activeCount, monthCount, pendingCount, completedWorkOrders, ratingWorkOrders, recent] =
      await Promise.all([
        prisma.providerWorkOrder.count({
          where: { providerId: provider.id, estado: { in: activeStatuses } },
        }),
        prisma.providerWorkOrder.count({
          where: { providerId: provider.id, fechaAsignacion: { gte: startOfMonth } },
        }),
        prisma.providerWorkOrder.count({
          where: { providerId: provider.id, estado: { in: pendingStatuses } },
        }),
        prisma.providerWorkOrder.findMany({
          where: {
            providerId: provider.id,
            estado: 'completada',
            fechaCompletado: { gte: startOfMonth },
          },
          select: { costoTotal: true, costoManoObra: true, costoMateriales: true },
        }),
        prisma.providerWorkOrder.findMany({
          where: { providerId: provider.id, valoracion: { not: null } },
          select: { valoracion: true },
        }),
        prisma.providerWorkOrder.findMany({
          where: { providerId: provider.id },
          include: {
            building: { select: { nombre: true } },
            unit: { select: { numero: true } },
          },
          orderBy: { fechaAsignacion: 'desc' },
          take: 5,
        }),
      ]);

    const ingresosMes = completedWorkOrders.reduce((sum, order) => {
      if (order.costoTotal !== null && order.costoTotal !== undefined) return sum + order.costoTotal;
      const material = order.costoMateriales || 0;
      const mano = order.costoManoObra || 0;
      return sum + material + mano;
    }, 0);

    const totalValoraciones = ratingWorkOrders.length;
    const valoracionMedia =
      totalValoraciones > 0
        ? ratingWorkOrders.reduce((sum, r) => sum + (r.valoracion || 0), 0) /
          totalValoraciones
        : 0;

    const recentBookings = recent.map((order) => {
      const { dayPart, time } = formatDateParts(order.fechaAsignacion);
      const cliente = order.unit?.numero
        ? `${order.building.nombre} - ${order.unit.numero}`
        : order.building.nombre;

      const precio =
        order.costoTotal ??
        (order.costoMateriales || 0) + (order.costoManoObra || 0) ||
        0;

      return {
        id: order.id,
        servicio: order.titulo,
        cliente,
        fecha: dayPart,
        hora: time,
        estado: mapStatus(order.estado),
        precio,
      };
    });

    return NextResponse.json({
      stats: {
        serviciosActivos: activeCount,
        reservasEsteMes: monthCount,
        reservasPendientes: pendingCount,
        ingresosMes,
        valoracionMedia: Number(valoracionMedia.toFixed(1)),
        totalValoraciones,
      },
      recentBookings,
    });
  } catch (error) {
    logger.error('[Proveedor Dashboard] Error al cargar datos', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al cargar dashboard' },
      { status: 500 }
    );
  }
}
