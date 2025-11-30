import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

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

    // Obtener todas las empresas
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

    // Usuarios totales en el sistema
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        company: {
          activo: true,
        },
      },
    });

    // Propiedades totales
    const totalBuildings = await prisma.building.count();
    const totalUnits = await prisma.unit.count();

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

    // Ingresos del mes actual
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const paymentsThisMonth = await prisma.payment.findMany({
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
    });

    const monthlyRevenue = paymentsThisMonth.reduce(
      (sum, payment) => sum + payment.monto,
      0
    );

    // Crecimiento de empresas (últimos 30 días)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const newCompaniesLast30Days = await prisma.company.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Tasa de ocupación global
    const occupiedUnits = await prisma.unit.count({
      where: {
        estado: 'ocupada',
      },
    });
    const occupancyRate =
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

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
      },
      subscriptionBreakdown,
      recentActivity,
      topCompaniesByProperties,
      companiesNeedingAttention,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
