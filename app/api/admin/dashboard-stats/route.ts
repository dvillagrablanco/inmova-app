import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { isSuperAdmin } from '@/lib/admin-roles';
import { getRedisClient } from '@/lib/redis';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache keys y TTLs
const CACHE_KEYS = {
  OVERVIEW: 'admin:dashboard:overview',
  HISTORICAL: 'admin:dashboard:historical',
  FINANCIAL: 'admin:dashboard:financial',
};
const CACHE_TTL = {
  OVERVIEW: 60, // 1 minuto para métricas en tiempo real
  HISTORICAL: 3600, // 1 hora para datos históricos (cambian poco)
  FINANCIAL: 300, // 5 minutos para datos financieros
};

// Helper para cache
async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: any, ttl: number): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    logger.warn('Error setting cache:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Usar helper centralizado de roles
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar si debemos saltar cache (query param ?fresh=true)
    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get('fresh') === 'true';

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));
    const last30Days = subDays(now, 30);
    const last90Days = subDays(now, 90);

    // ===== MÉTRICAS OVERVIEW (con cache corto) =====
    // IMPORTANTE: Excluir empresas de prueba de todas las analíticas
    const realCompanyFilter = { esEmpresaPrueba: false };
    
    let overviewData = skipCache ? null : await getFromCache<any>(CACHE_KEYS.OVERVIEW);
    
    if (!overviewData) {
      // Ejecutar todas las queries de overview en paralelo (excluyendo empresas de prueba)
      const [
        totalCompanies,
        activeCompanies,
        trialCompanies,
        suspendedCompanies,
        newCompaniesLast30Days,
        newCompaniesLast90Days,
        churnedCompanies,
        totalUsers,
        activeUsers,
        newUsersLast30Days,
        totalBuildings,
        totalUnits,
        newBuildingsLast30Days,
        totalTenants,
        activeTenants,
        totalContracts,
        activeContracts,
        occupiedUnits,
      ] = await Promise.all([
        prisma.company.count({ where: realCompanyFilter }),
        prisma.company.count({ where: { ...realCompanyFilter, activo: true } }),
        prisma.company.count({ where: { ...realCompanyFilter, estadoCliente: 'prueba' } }),
        prisma.company.count({ where: { ...realCompanyFilter, estadoCliente: 'suspendido' } }),
        prisma.company.count({ where: { ...realCompanyFilter, createdAt: { gte: last30Days } } }),
        prisma.company.count({ where: { ...realCompanyFilter, createdAt: { gte: last90Days } } }),
        prisma.company.count({ where: { ...realCompanyFilter, estadoCliente: 'suspendido', updatedAt: { gte: last30Days } } }),
        prisma.user.count({ where: { company: realCompanyFilter } }),
        prisma.user.count({ where: { company: { ...realCompanyFilter, activo: true } } }),
        prisma.user.count({ where: { company: realCompanyFilter, createdAt: { gte: last30Days } } }),
        prisma.building.count({ where: { company: realCompanyFilter } }),
        prisma.unit.count({ where: { building: { company: realCompanyFilter } } }),
        prisma.building.count({ where: { company: realCompanyFilter, createdAt: { gte: last30Days } } }),
        prisma.tenant.count({ where: { company: realCompanyFilter } }),
        prisma.tenant.count({ where: { company: realCompanyFilter, contracts: { some: { estado: 'activo' } } } }),
        prisma.contract.count({ where: { unit: { building: { company: realCompanyFilter } } } }),
        prisma.contract.count({ where: { unit: { building: { company: realCompanyFilter } }, estado: 'activo' } }),
        prisma.unit.count({ where: { building: { company: realCompanyFilter }, estado: 'ocupada' } }),
      ]);

      const churnRate = totalCompanies > 0 ? (churnedCompanies / totalCompanies) * 100 : 0;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      overviewData = {
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
        occupancyRate,
        newCompaniesLast30Days,
        newCompaniesLast90Days,
        newUsersLast30Days,
        newBuildingsLast30Days,
        churnRate,
        churnedCompanies,
      };

      await setCache(CACHE_KEYS.OVERVIEW, overviewData, CACHE_TTL.OVERVIEW);
    }

    // ===== MÉTRICAS FINANCIERAS (con cache medio) =====
    let financialData = skipCache ? null : await getFromCache<any>(CACHE_KEYS.FINANCIAL);
    
    if (!financialData) {
      const [paymentsThisMonth, paymentsLastMonth, companiesWithPlans] = await Promise.all([
        prisma.payment.findMany({
          where: {
            contract: { unit: { building: { company: realCompanyFilter } } },
            fechaVencimiento: { gte: startOfCurrentMonth, lte: endOfMonth(now) },
            estado: 'pagado',
          },
          select: { monto: true },
        }),
        prisma.payment.findMany({
          where: {
            contract: { unit: { building: { company: realCompanyFilter } } },
            fechaVencimiento: { gte: startOfLastMonth, lte: endOfLastMonth },
            estado: 'pagado',
          },
          select: { monto: true },
        }),
        prisma.company.findMany({
          where: { ...realCompanyFilter, subscriptionPlanId: { not: null }, activo: true },
          include: { subscriptionPlan: { select: { precioMensual: true } } },
        }),
      ]);

      const monthlyRevenue = paymentsThisMonth.reduce((sum, p) => sum + p.monto, 0);
      const lastMonthRevenue = paymentsLastMonth.reduce((sum, p) => sum + p.monto, 0);
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      const mrr = companiesWithPlans.reduce(
        (sum, c) => sum + (c.subscriptionPlan?.precioMensual || 0), 0
      );

      financialData = {
        mrr,
        arr: mrr * 12,
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth,
      };

      await setCache(CACHE_KEYS.FINANCIAL, financialData, CACHE_TTL.FINANCIAL);
    }

    // Añadir monthlyRevenue a overview
    overviewData.monthlyRevenue = financialData.monthlyRevenue;

    // ===== DATOS HISTÓRICOS (con cache largo) =====
    let historicalData = skipCache ? null : await getFromCache<any[]>(CACHE_KEYS.HISTORICAL);
    
    if (!historicalData) {
      historicalData = [];
      
      // Ejecutar todas las queries históricas en paralelo (12 meses) - excluyendo empresas de prueba
      const historicalPromises = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        historicalPromises.push(
          Promise.all([
            prisma.company.count({ where: { ...realCompanyFilter, createdAt: { lte: monthEnd } } }),
            prisma.user.count({ where: { company: realCompanyFilter, createdAt: { lte: monthEnd } } }),
            prisma.building.count({ where: { company: realCompanyFilter, createdAt: { lte: monthEnd } } }),
            prisma.payment.aggregate({
              where: {
                contract: { unit: { building: { company: realCompanyFilter } } },
                fechaVencimiento: { gte: monthStart, lte: monthEnd },
                estado: 'pagado',
              },
              _sum: { monto: true },
            }),
          ]).then(([companies, users, buildings, revenueAgg]) => ({
            month: format(monthDate, 'MMM yyyy', { locale: es }),
            companies,
            users,
            buildings,
            revenue: revenueAgg._sum.monto || 0,
          }))
        );
      }
      
      historicalData = await Promise.all(historicalPromises);
      await setCache(CACHE_KEYS.HISTORICAL, historicalData, CACHE_TTL.HISTORICAL);
    }

    // ===== MÉTRICAS DE CONVERSIÓN =====
    const trialToActiveRate = overviewData.trialCompanies > 0
      ? (overviewData.activeCompanies / (overviewData.activeCompanies + overviewData.trialCompanies)) * 100
      : 0;

    // Planes de suscripción más populares (ejecutar en paralelo con otras queries) - excluyendo empresas de prueba
    const [subscriptionStats, recentActivity, topCompaniesByProperties, companiesNeedingAttention] = await Promise.all([
      prisma.company.groupBy({
        by: ['subscriptionPlanId'],
        _count: { id: true },
        where: { ...realCompanyFilter, subscriptionPlanId: { not: null } },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { company: realCompanyFilter },
        include: {
          user: { select: { name: true, email: true } },
          company: { select: { nombre: true } },
        },
      }),
      prisma.company.findMany({
        where: realCompanyFilter,
        take: 5,
        orderBy: { buildings: { _count: 'desc' } },
        include: { _count: { select: { buildings: true, users: true, tenants: true } } },
      }),
      prisma.company.findMany({
        where: { ...realCompanyFilter, OR: [{ estadoCliente: 'suspendido' }] },
        take: 10,
        include: { _count: { select: { users: true, buildings: true } } },
      }),
    ]);

    // Obtener nombres de planes
    const planIds = subscriptionStats
      .map((s) => s.subscriptionPlanId)
      .filter((id): id is string => id !== null);

    const plans = planIds.length > 0 ? await prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, nombre: true },
    }) : [];

    const planMap = new Map(plans.map((p) => [p.id, p.nombre]));

    const subscriptionBreakdown = subscriptionStats.map((stat) => ({
      planId: stat.subscriptionPlanId,
      planName: stat.subscriptionPlanId
        ? planMap.get(stat.subscriptionPlanId) || 'Desconocido'
        : 'Sin plan',
      count: stat._count.id,
    }));

    return NextResponse.json({
      overview: overviewData,
      financial: financialData,
      growth: {
        newCompaniesLast30Days: overviewData.newCompaniesLast30Days,
        newCompaniesLast90Days: overviewData.newCompaniesLast90Days,
        newUsersLast30Days: overviewData.newUsersLast30Days,
        newBuildingsLast30Days: overviewData.newBuildingsLast30Days,
        trialToActiveRate,
      },
      subscriptionBreakdown,
      historicalData,
      recentActivity,
      topCompaniesByProperties,
      companiesNeedingAttention,
      _cache: {
        overview: !skipCache && !!overviewData,
        financial: !skipCache && !!financialData,
        historical: !skipCache && !!historicalData,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin dashboard stats:', error);
    // En caso de error, retornar datos por defecto en lugar de error 500
    // Esto permite que el dashboard se renderice aunque haya problemas de BD
    return NextResponse.json({
      overview: {
        totalCompanies: 0,
        activeCompanies: 0,
        trialCompanies: 0,
        suspendedCompanies: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalBuildings: 0,
        totalUnits: 0,
        totalTenants: 0,
        activeTenants: 0,
        totalContracts: 0,
        activeContracts: 0,
        occupancyRate: 0,
        newCompaniesLast30Days: 0,
        newCompaniesLast90Days: 0,
        newUsersLast30Days: 0,
        newBuildingsLast30Days: 0,
        churnRate: 0,
        churnedCompanies: 0,
        monthlyRevenue: 0,
      },
      financial: {
        mrr: 0,
        arr: 0,
        monthlyRevenue: 0,
        lastMonthRevenue: 0,
        revenueGrowth: 0,
      },
      growth: {
        newCompaniesLast30Days: 0,
        newCompaniesLast90Days: 0,
        newUsersLast30Days: 0,
        newBuildingsLast30Days: 0,
        trialToActiveRate: 0,
      },
      subscriptionBreakdown: [],
      historicalData: [],
      recentActivity: [],
      topCompaniesByProperties: [],
      companiesNeedingAttention: [],
      _error: 'Error parcial al obtener estadísticas',
      _cache: { overview: false, financial: false, historical: false },
    });
  }
}
