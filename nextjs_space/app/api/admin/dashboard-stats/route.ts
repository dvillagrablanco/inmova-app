import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subDays, subMonths, startOfMonth, endOfMonth, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));
    const last30Days = subDays(now, 30);
    const last90Days = subDays(now, 90);

    // ===== MÉTRICAS DE EMPRESAS =====
    const totalCompanies = await prisma.company.count();
    const activeCompanies = await prisma.company.count({
      where: { activo: true },
    });
    const trialCompanies = await prisma.company.count({
      where: { estadoCliente: 'prueba' },
    });
    const suspendedCompanies = await prisma.company.count({
      where: { estadoCliente: 'suspendido' },
    });

    const newCompaniesLast30Days = await prisma.company.count({
      where: {
        createdAt: { gte: last30Days },
      },
    });

    const newCompaniesLast90Days = await prisma.company.count({
      where: {
        createdAt: { gte: last90Days },
      },
    });

    // Churn rate (empresas suspendidas en últimos 30 días)
    const churnedCompanies = await prisma.company.count({
      where: {
        estadoCliente: 'suspendido',
        updatedAt: { gte: last30Days },
      },
    });

    const churnRate = totalCompanies > 0 ? (churnedCompanies / totalCompanies) * 100 : 0;

    // ===== MÉTRICAS DE USUARIOS =====
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        company: {
          activo: true,
        },
      },
    });

    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: { gte: last30Days },
      },
    });

    // ===== MÉTRICAS DE PROPIEDADES =====
    const totalBuildings = await prisma.building.count();
    const totalUnits = await prisma.unit.count();

    const newBuildingsLast30Days = await prisma.building.count({
      where: {
        createdAt: { gte: last30Days },
      },
    });

    // Inquilinos totales
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({
      where: {
        contracts: {
          some: {
            estado: 'activo',
          },
        },
      },
    });

    // Contratos
    const totalContracts = await prisma.contract.count();
    const activeContracts = await prisma.contract.count({
      where: { estado: 'activo' },
    });

    // ===== MÉTRICAS FINANCIERAS =====
    // Ingresos del mes actual
    const paymentsThisMonth = await prisma.payment.findMany({
      where: {
        fechaVencimiento: {
          gte: startOfCurrentMonth,
          lte: endOfMonth(now),
        },
        estado: 'pagado',
      },
      select: {
        monto: true,
      },
    });

    const monthlyRevenue = paymentsThisMonth.reduce(
      (sum, payment) => sum + payment.monto,
      0
    );

    // Ingresos del mes pasado
    const paymentsLastMonth = await prisma.payment.findMany({
      where: {
        fechaVencimiento: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        estado: 'pagado',
      },
      select: {
        monto: true,
      },
    });

    const lastMonthRevenue = paymentsLastMonth.reduce(
      (sum, payment) => sum + payment.monto,
      0
    );

    // Crecimiento de ingresos
    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // MRR (Monthly Recurring Revenue) - Basado en planes de suscripción
    const companiesWithPlans = await prisma.company.findMany({
      where: {
        subscriptionPlanId: { not: null },
        activo: true,
      },
      include: {
        subscriptionPlan: {
          select: {
            precioMensual: true,
          },
        },
      },
    });

    const mrr = companiesWithPlans.reduce(
      (sum, company) => sum + (company.subscriptionPlan?.precioMensual || 0),
      0
    );

    const arr = mrr * 12; // Annual Recurring Revenue

    // ===== MÉTRICAS DE OCUPACIÓN =====
    const occupiedUnits = await prisma.unit.count({
      where: {
        estado: 'ocupada',
      },
    });
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // ===== DATOS HISTÓRICOS PARA GRÁFICOS (últimos 12 meses) =====
    const historicalData: Array<{
      month: string;
      companies: number;
      users: number;
      buildings: number;
      revenue: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const [companiesCount, usersCount, buildingsCount, revenueData] = await Promise.all([
        prisma.company.count({
          where: {
            createdAt: { lte: monthEnd },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { lte: monthEnd },
          },
        }),
        prisma.building.count({
          where: {
            createdAt: { lte: monthEnd },
          },
        }),
        prisma.payment.findMany({
          where: {
            fechaVencimiento: {
              gte: monthStart,
              lte: monthEnd,
            },
            estado: 'pagado',
          },
          select: {
            monto: true,
          },
        }),
      ]);

      const monthRevenue = revenueData.reduce((sum, p) => sum + p.monto, 0);

      historicalData.push({
        month: format(monthDate, 'MMM yyyy', { locale: es }),
        companies: companiesCount,
        users: usersCount,
        buildings: buildingsCount,
        revenue: monthRevenue,
      });
    }

    // ===== MÉTRICAS DE CONVERSIÓN =====
    const trialToActiveRate = trialCompanies > 0
      ? (activeCompanies / (activeCompanies + trialCompanies)) * 100
      : 0;

    // Planes de suscripción más populares
    const subscriptionStats = await prisma.company.groupBy({
      by: ['subscriptionPlanId'],
      _count: {
        id: true,
      },
      where: {
        subscriptionPlanId: {
          not: null,
        },
      },
    });

    // Obtener nombres de planes
    const planIds = subscriptionStats
      .map((s) => s.subscriptionPlanId)
      .filter((id): id is string => id !== null);

    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        id: {
          in: planIds,
        },
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    const planMap = new Map(plans.map((p) => [p.id, p.nombre]));

    const subscriptionBreakdown = subscriptionStats.map((stat) => ({
      planId: stat.subscriptionPlanId,
      planName: stat.subscriptionPlanId
        ? planMap.get(stat.subscriptionPlanId) || 'Desconocido'
        : 'Sin plan',
      count: stat._count.id,
    }));

    // Actividad reciente (últimas acciones de audit log)
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Top 5 empresas por número de propiedades
    const topCompaniesByProperties = await prisma.company.findMany({
      take: 5,
      orderBy: {
        buildings: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            buildings: true,
            users: true,
            tenants: true,
          },
        },
      },
    });

    // Empresas que requieren atención (límites alcanzados)
    const companiesNeedingAttention = await prisma.company.findMany({
      where: {
        OR: [
          {
            estadoCliente: 'suspendido',
          },
          // Aquí podrías agregar más condiciones
        ],
      },
      take: 10,
      include: {
        _count: {
          select: {
            users: true,
            buildings: true,
          },
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalCompanies,
        activeCompanies,
        trialCompanies,
        suspendedCompanies,
        totalUsers,
        activeUsers,
        totalBuildings,
        totalUnits,
        totalTenants,
        activeTenants,
        totalContracts,
        activeContracts,
        monthlyRevenue,
        occupancyRate,
        newCompaniesLast30Days,
        newCompaniesLast90Days,
        newUsersLast30Days,
        newBuildingsLast30Days,
        churnRate,
        churnedCompanies,
      },
      financial: {
        mrr,
        arr,
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth,
      },
      growth: {
        newCompaniesLast30Days,
        newCompaniesLast90Days,
        newUsersLast30Days,
        newBuildingsLast30Days,
        trialToActiveRate,
      },
      subscriptionBreakdown,
      historicalData,
      recentActivity,
      topCompaniesByProperties,
      companiesNeedingAttention,
    });
  } catch (error) {
    logger.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
