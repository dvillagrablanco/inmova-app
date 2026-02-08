import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { startOfMonth, endOfMonth } from 'date-fns';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      monthTotals,
      allTotals,
      pendingCount,
      services,
      serviceGroups,
      monthTransactionsCount,
      recentTransactions,
      activeProviderCount,
    ] = await prisma.$transaction([
      prisma.marketplaceBooking.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { comision: true },
      }),
      prisma.marketplaceBooking.aggregate({
        _sum: { comision: true },
      }),
      prisma.marketplaceBooking.count({
        where: { pagado: false },
      }),
      prisma.marketplaceService.findMany({
        include: {
          provider: { select: { nombre: true, email: true } },
        },
      }),
      prisma.marketplaceBooking.groupBy({
        by: ['serviceId'],
        orderBy: { serviceId: 'asc' },
        _count: { _all: true },
        _sum: { precioTotal: true, comision: true },
      }),
      prisma.marketplaceBooking.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.marketplaceBooking.findMany({
        include: {
          service: {
            select: {
              nombre: true,
              provider: { select: { nombre: true } },
            },
          },
          company: { select: { nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.marketplaceService.findMany({
        where: { providerId: { not: null } },
        select: { providerId: true },
        distinct: ['providerId'],
      }),
    ]);

    const groupedByService = new Map(
      serviceGroups.map((group) => [group.serviceId, group])
    );

    const servicesData = services.map((service) => {
      const grouped = groupedByService.get(service.id);
      const totalTransactions =
        grouped && grouped._count && grouped._count !== true
          ? grouped._count._all ?? 0
          : 0;
      return {
        id: service.id,
        serviceName: service.nombre,
        serviceCategory: service.categoria,
        providerName: service.provider?.nombre || 'Sin proveedor',
        providerEmail: service.provider?.email || '',
        commissionType: 'percentage',
        commissionRate: service.comisionPorcentaje,
        totalTransactions,
        totalRevenue: grouped?._sum?.precioTotal ?? 0,
        totalCommissions: grouped?._sum?.comision ?? 0,
        status: service.activo ? 'active' : 'paused',
      };
    });

    const transactions = recentTransactions.map((transaction) => ({
      id: transaction.id,
      serviceName: transaction.service.nombre,
      providerName: transaction.service.provider?.nombre || 'Sin proveedor',
      clientCompany: transaction.company.nombre || 'Empresa',
      transactionAmount: transaction.precioTotal,
      commissionAmount: transaction.comision,
      status: transaction.pagado
        ? 'paid'
        : transaction.estado === 'completada'
          ? 'processed'
          : 'pending',
      date: transaction.createdAt.toISOString(),
    }));

    const avgCommissionRate =
      services.length > 0
        ? services.reduce((sum, service) => sum + service.comisionPorcentaje, 0) / services.length
        : 0;

    return NextResponse.json({
      stats: {
        totalCommissionsThisMonth: monthTotals._sum.comision || 0,
        totalCommissionsAllTime: allTotals._sum.comision || 0,
        pendingCommissions: pendingCount,
        activeProviders: activeProviderCount.length,
        avgCommissionRate: Math.round(avgCommissionRate * 10) / 10,
        transactionsThisMonth: monthTransactionsCount,
      },
      services: servicesData,
      transactions,
    });
  } catch (error: unknown) {
    logger.error('[API Error] Marketplace commissions:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
