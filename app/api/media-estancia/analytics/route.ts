import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subMonths, startOfMonth, endOfMonth, format, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || '6m';
    
    // Calcular rango de fechas según período
    const now = new Date();
    const monthsBack = periodParam === '1m' ? 1 : periodParam === '3m' ? 3 : periodParam === '12m' ? 12 : 6;
    const startDate = startOfMonth(subMonths(now, monthsBack - 1));
    const endDate = endOfMonth(now);

    // Obtener contratos del período (excluyendo demos)
    const contracts = await prisma.contract.findMany({
      where: {
        unit: {
          building: {
            companyId,
          },
        },
        isDemo: false,
        OR: [
          {
            fechaInicio: { gte: startDate, lte: endDate },
          },
          {
            fechaFin: { gte: startDate, lte: endDate },
          },
          {
            AND: [
              { fechaInicio: { lte: startDate } },
              { fechaFin: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            nacionalidad: true,
            situacionLaboral: true,
          },
        },
        unit: {
          select: {
            id: true,
            numero: true,
            rentaMensual: true,
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
              },
            },
          },
        },
      },
    });

    // Obtener unidades totales
    const totalUnits = await prisma.unit.count({
      where: {
        building: {
          companyId,
          isDemo: false,
        },
        isDemo: false,
      },
    });

    // Calcular métricas por mes
    type MonthlyMetric = {
      period: string;
      revenue: number;
      revenueChange: number;
      occupancy: number;
      activeContracts: number;
    };

    const monthlyData: MonthlyMetric[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const periodLabel = format(monthDate, 'MMM', { locale: es });

      // Contratos activos en este mes
      const activeContracts = contracts.filter((c) => {
        const start = new Date(c.fechaInicio);
        const end = new Date(c.fechaFin);
        return start <= monthEnd && end >= monthStart;
      });

      // Ingresos del mes (suma de rentas de contratos activos)
      const revenue = activeContracts.reduce((sum, c) => sum + c.rentaMensual, 0);

      // Tasa de ocupación
      const occupancy = totalUnits > 0 ? Math.round((activeContracts.length / totalUnits) * 100) : 0;

      const prevMonth: MonthlyMetric | null = i < monthsBack - 1
        ? monthlyData[monthlyData.length - 1]
        : null;
      const revenueChange = prevMonth && prevMonth.revenue > 0 
        ? Math.round(((revenue - prevMonth.revenue) / prevMonth.revenue) * 100)
        : 0;

      monthlyData.push({
        period: periodLabel,
        revenue,
        revenueChange,
        occupancy,
        activeContracts: activeContracts.length,
      });
    }

    // Calcular KPIs generales
    const activeContractsNow = contracts.filter(
      (c) => c.estado === 'activo' || (new Date(c.fechaInicio) <= now && new Date(c.fechaFin) >= now)
    );

    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const avgOccupancy = Math.round(monthlyData.reduce((sum, m) => sum + m.occupancy, 0) / monthlyData.length);
    const avgRent = activeContractsNow.length > 0
      ? Math.round(activeContractsNow.reduce((sum, c) => sum + c.rentaMensual, 0) / activeContractsNow.length)
      : 0;

    // Demografía de inquilinos - por propósito/situación laboral
    const tenantsByPurpose: Record<string, number> = {};
    const tenantsByNationality: Record<string, number> = {};

    activeContractsNow.forEach((c) => {
      const purpose = c.tenant?.situacionLaboral || 'otros';
      tenantsByPurpose[purpose] = (tenantsByPurpose[purpose] || 0) + 1;

      const nationality = c.tenant?.nacionalidad || 'No especificada';
      tenantsByNationality[nationality] = (tenantsByNationality[nationality] || 0) + 1;
    });

    const totalTenants = activeContractsNow.length;
    const purposeData = Object.entries(tenantsByPurpose)
      .map(([category, count]) => ({
        category: formatPurpose(category),
        count,
        percentage: totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const nationalityData = Object.entries(tenantsByNationality)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6);

    // Rendimiento por propiedad (agrupado por building)
    const propertyPerformance: Record<string, { 
      name: string; 
      address: string; 
      revenue: number; 
      contracts: number; 
      totalUnits: number;
    }> = {};

    contracts.forEach((c) => {
      const buildingId = c.unit.building.id;
      if (!propertyPerformance[buildingId]) {
        propertyPerformance[buildingId] = {
          name: c.unit.building.nombre,
          address: c.unit.building.direccion || '',
          revenue: 0,
          contracts: 0,
          totalUnits: 0,
        };
      }
      propertyPerformance[buildingId].revenue += c.rentaMensual;
      propertyPerformance[buildingId].contracts += 1;
    });

    // Obtener total de unidades por edificio
    const unitsByBuilding = await prisma.unit.groupBy({
      by: ['buildingId'],
      where: {
        building: { companyId, isDemo: false },
        isDemo: false,
      },
      _count: { id: true },
    });

    unitsByBuilding.forEach((ub) => {
      if (propertyPerformance[ub.buildingId]) {
        propertyPerformance[ub.buildingId].totalUnits = ub._count.id;
      }
    });

    const propertyData = Object.values(propertyPerformance)
      .map((p) => ({
        name: p.name,
        address: p.address,
        revenue: p.revenue,
        occupancy: p.totalUnits > 0 ? Math.round((p.contracts / p.totalUnits) * 100) : 0,
        avgRent: p.contracts > 0 ? Math.round(p.revenue / p.contracts) : 0,
        rating: 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calcular estancia media y tasa de renovación
    const completedContracts = contracts.filter(
      (c) => c.estado === 'vencido' || c.estado === 'cancelado' || new Date(c.fechaFin) < now
    );
    const avgStayMonths = completedContracts.length > 0
      ? Math.round(
          completedContracts.reduce((sum, c) => {
            return sum + differenceInMonths(new Date(c.fechaFin), new Date(c.fechaInicio));
          }, 0) / completedContracts.length * 10
        ) / 10
      : 0;

    // Tasa de renovación (contratos que se renovaron)
    const renewedCount = contracts.filter((c) => c.renovacionAutomatica).length;
    const renewalRate = completedContracts.length > 0
      ? Math.round((renewedCount / completedContracts.length) * 100)
      : 0;

    // Calcular cambio respecto al mes anterior
    const currentMonthData = monthlyData[monthlyData.length - 1];
    const prevMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

    const revenueChange = prevMonthData && prevMonthData.revenue > 0
      ? Math.round(((currentMonthData.revenue - prevMonthData.revenue) / prevMonthData.revenue) * 100)
      : 0;

    const occupancyChange = prevMonthData
      ? currentMonthData.occupancy - prevMonthData.occupancy
      : 0;

    const prevMonthAvgRent = prevMonthData && prevMonthData.activeContracts > 0
      ? Math.round(prevMonthData.revenue / prevMonthData.activeContracts)
      : 0;

    const rentChange = prevMonthAvgRent > 0
      ? Math.round(((avgRent - prevMonthAvgRent) / prevMonthAvgRent) * 100)
      : 0;

    const tenantContractCounts = new Map<string, number>();
    contracts.forEach((c) => {
      const tenantId = c.tenant?.id;
      if (!tenantId) return;
      tenantContractCounts.set(tenantId, (tenantContractCounts.get(tenantId) || 0) + 1);
    });

    const repeatTenants = Array.from(tenantContractCounts.values()).filter((count) => count > 1).length;
    const repeatTenantRate = tenantContractCounts.size > 0
      ? Math.round((repeatTenants / tenantContractCounts.size) * 100)
      : 0;

    return NextResponse.json({
      kpis: {
        totalRevenue,
        revenueChange,
        avgOccupancy,
        occupancyChange,
        activeTenants: activeContractsNow.length,
        tenantsChange: prevMonthData ? currentMonthData.activeContracts - prevMonthData.activeContracts : 0,
        avgRent,
        rentChange,
      },
      revenueData: monthlyData.map((m) => ({
        period: m.period,
        value: m.revenue,
        change: m.revenueChange,
      })),
      occupancyData: monthlyData.map((m) => ({
        period: m.period,
        value: m.occupancy,
      })),
      tenantsByPurpose: purposeData,
      tenantsByNationality: nationalityData,
      propertyPerformance: propertyData,
      metrics: {
        avgStayMonths,
        renewalRate,
        repeatTenantRate,
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Error al obtener analytics' }, { status: 500 });
  }
}

function formatPurpose(purpose: string): string {
  const mapping: Record<string, string> = {
    empleado: 'Trabajo',
    autonomo: 'Trabajo',
    funcionario: 'Trabajo',
    estudiante: 'Estudios',
    desempleado: 'Busqueda de empleo',
    jubilado: 'Jubilacion',
    otros: 'Otros',
  };
  return mapping[purpose.toLowerCase()] || purpose;
}
