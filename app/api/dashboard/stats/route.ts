import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { cachedDashboardStats } from '@/lib/api-cache-helpers';
import { subMonths, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get('companyId');
    const isSuperAdmin = user.role === 'super_admin' || user.role === 'soporte';
    const companyId = isSuperAdmin && requestedCompanyId ? requestedCompanyId : user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId requerido' }, { status: 400 });
    }

    const cached = await cachedDashboardStats(companyId);

    const currentMonth = new Date();
    const threeMonthsAgo = subMonths(currentMonth, 3);
    const monthEnd = endOfMonth(currentMonth);

    const [activeContracts, overduePayments, totalExpectedPayments, upcomingPayments] =
      await Promise.all([
        prisma.contract.count({
          where: {
            unit: { building: { companyId } },
            estado: 'activo',
          },
        }),
        prisma.payment.count({
          where: {
            contract: { unit: { building: { companyId } } },
            estado: 'pendiente',
            fechaVencimiento: { lt: new Date() },
          },
        }),
        prisma.payment.count({
          where: {
            contract: { unit: { building: { companyId } } },
            fechaVencimiento: { gte: threeMonthsAgo, lte: monthEnd },
          },
        }),
        prisma.payment.count({
          where: {
            contract: { unit: { building: { companyId } } },
            estado: 'pendiente',
            fechaVencimiento: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    const morosidad =
      totalExpectedPayments > 0 ? (overduePayments / totalExpectedPayments) * 100 : 0;

    return NextResponse.json({
      totalEdificios: cached.kpis.numeroPropiedades,
      totalUnidades: cached.kpis.numeroUnidades,
      totalInquilinos: cached.kpis.numeroInquilinos,
      ingresosMensuales: cached.kpis.ingresosMensuales,
      ocupacionPromedio: cached.kpis.tasaOcupacion,
      contratosActivos: activeContracts,
      pagosVencidos: overduePayments,
      morosidad: Number(morosidad.toFixed(1)),
      proximosPagos: upcomingPayments,
      mantenimientosPendientes: cached.kpis.mantenimientosPendientes,
    });
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    logger.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
