/**
 * ANALYTICS AVANZADO PARA MEDIA ESTANCIA
 * 
 * Dashboard de métricas, KPIs y análisis de rendimiento
 */

import { prisma } from '../db';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subMonths,
  subYears,
  differenceInDays,
  format,
  eachMonthOfInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// TIPOS
// ==========================================

export interface MediumTermKPIs {
  // Ocupación
  occupancyRate: number;
  averageStayDuration: number;
  turnaroundTime: number;
  
  // Financieros
  totalRevenue: number;
  averageRent: number;
  revenuePerSquareMeter: number;
  collectionRate: number;
  
  // Operacionales
  activeContracts: number;
  pendingContracts: number;
  expiringContracts: number;
  renewalRate: number;
  
  // Inquilinos
  totalTenants: number;
  averageScore: number;
  tenantSatisfaction: number;
  
  // Tendencias
  revenueChange: number;
  occupancyChange: number;
}

export interface TimeSeriesData {
  period: string;
  value: number;
  previousValue?: number;
  change?: number;
}

export interface PropertyPerformance {
  propertyId: string;
  propertyName: string;
  address: string;
  occupancyRate: number;
  revenue: number;
  averageRent: number;
  contracts: number;
  rating: number;
}

export interface TenantAnalytics {
  byNationality: { nationality: string; count: number; percentage: number }[];
  byPurpose: { purpose: string; count: number; percentage: number }[];
  byDuration: { range: string; count: number; percentage: number }[];
  byAgeGroup: { range: string; count: number; percentage: number }[];
  averageScore: number;
  repeatRate: number;
}

export interface MarketComparison {
  metric: string;
  yourValue: number;
  marketAverage: number;
  difference: number;
  percentile: number;
  recommendation: string;
}

export interface SeasonalityData {
  month: string;
  occupancy: number;
  revenue: number;
  averageRent: number;
  demand: 'low' | 'medium' | 'high' | 'peak';
}

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Obtiene los KPIs principales de media estancia
 */
export async function getMediumTermKPIs(
  companyId: string,
  dateRange?: { start: Date; end: Date }
): Promise<MediumTermKPIs> {
  const start = dateRange?.start || startOfYear(new Date());
  const end = dateRange?.end || new Date();
  const previousStart = subYears(start, 1);
  const previousEnd = subYears(end, 1);

  // Contratos activos y de media estancia
  const contracts = await prisma.contract.findMany({
    where: {
      companyId,
      tipoArrendamiento: 'temporada',
      fechaInicio: { lte: end },
      fechaFin: { gte: start },
    },
    include: {
      unit: true,
      payments: true,
    },
  });

  // Contratos del período anterior para comparación
  const previousContracts = await prisma.contract.findMany({
    where: {
      companyId,
      tipoArrendamiento: 'temporada',
      fechaInicio: { lte: previousEnd },
      fechaFin: { gte: previousStart },
    },
  });

  // Calcular métricas de ocupación
  const units = await prisma.unit.count({
    where: { building: { companyId } },
  });

  const daysInPeriod = differenceInDays(end, start) || 1;
  const totalPossibleDays = units * daysInPeriod;
  
  let occupiedDays = 0;
  for (const contract of contracts) {
    const contractStart = contract.fechaInicio > start ? contract.fechaInicio : start;
    const contractEnd = contract.fechaFin < end ? contract.fechaFin : end;
    occupiedDays += differenceInDays(contractEnd, contractStart);
  }

  const occupancyRate = totalPossibleDays > 0 
    ? Math.round((occupiedDays / totalPossibleDays) * 100) 
    : 0;

  // Calcular métricas financieras
  const totalRevenue = contracts.reduce((sum, c) => {
    const payments = c.payments.filter(p => 
      p.status === 'pagado' && 
      new Date(p.fecha) >= start && 
      new Date(p.fecha) <= end
    );
    return sum + payments.reduce((s, p) => s + p.amount, 0);
  }, 0);

  const previousRevenue = previousContracts.reduce((sum, c) => 
    sum + c.rentaMensual * (c.duracionMesesPrevista || 6), 0
  );

  const averageRent = contracts.length > 0
    ? Math.round(contracts.reduce((sum, c) => sum + c.rentaMensual, 0) / contracts.length)
    : 0;

  // Duración media de estancia
  const averageStayDuration = contracts.length > 0
    ? Math.round(contracts.reduce((sum, c) => 
        sum + differenceInDays(c.fechaFin, c.fechaInicio), 0
      ) / contracts.length / 30) // En meses
    : 0;

  // Tasa de cobro
  const totalDue = contracts.reduce((sum, c) => {
    const payments = c.payments.filter(p => 
      new Date(p.fecha) >= start && new Date(p.fecha) <= end
    );
    return sum + payments.reduce((s, p) => s + p.amount, 0);
  }, 0);

  const collectionRate = totalDue > 0 
    ? Math.round((totalRevenue / totalDue) * 100) 
    : 100;

  // Contratos próximos a vencer (30 días)
  const expiringContracts = await prisma.contract.count({
    where: {
      companyId,
      tipoArrendamiento: 'temporada',
      status: 'activo',
      fechaFin: {
        gte: new Date(),
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Tasa de renovación
  const renewedContracts = await prisma.contract.count({
    where: {
      companyId,
      tipoArrendamiento: 'temporada',
      prorrogasRealizadas: { gt: 0 },
      fechaInicio: { gte: start },
    },
  });

  const renewalRate = contracts.length > 0
    ? Math.round((renewedContracts / contracts.length) * 100)
    : 0;

  // Tenants
  const tenants = await prisma.tenant.findMany({
    where: {
      contracts: {
        some: {
          companyId,
          tipoArrendamiento: 'temporada',
        },
      },
    },
  });

  // Cambios respecto al período anterior
  const revenueChange = previousRevenue > 0
    ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
    : 0;

  const previousOccupiedDays = previousContracts.reduce((sum, c) => 
    sum + differenceInDays(c.fechaFin, c.fechaInicio), 0
  );
  const previousOccupancy = totalPossibleDays > 0
    ? (previousOccupiedDays / totalPossibleDays) * 100
    : 0;
  const occupancyChange = Math.round(occupancyRate - previousOccupancy);

  return {
    occupancyRate,
    averageStayDuration,
    turnaroundTime: 3, // Días promedio entre inquilinos
    
    totalRevenue,
    averageRent,
    revenuePerSquareMeter: 0, // TODO: Calcular
    collectionRate,
    
    activeContracts: contracts.filter(c => c.status === 'activo').length,
    pendingContracts: contracts.filter(c => c.status === 'pendiente').length,
    expiringContracts,
    renewalRate,
    
    totalTenants: tenants.length,
    averageScore: 75, // TODO: Calcular desde scoring
    tenantSatisfaction: 85, // TODO: Calcular desde reviews
    
    revenueChange,
    occupancyChange,
  };
}

/**
 * Obtiene datos de serie temporal (ingresos, ocupación, etc.)
 */
export async function getTimeSeriesData(
  companyId: string,
  metric: 'revenue' | 'occupancy' | 'contracts' | 'rent',
  period: '6m' | '12m' | '24m' = '12m'
): Promise<TimeSeriesData[]> {
  const months = period === '6m' ? 6 : period === '12m' ? 12 : 24;
  const start = subMonths(new Date(), months);
  const intervals = eachMonthOfInterval({ start, end: new Date() });

  const data: TimeSeriesData[] = [];

  for (const monthStart of intervals) {
    const monthEnd = endOfMonth(monthStart);
    const previousMonthStart = subMonths(monthStart, 1);

    let value = 0;
    let previousValue = 0;

    if (metric === 'revenue') {
      const payments = await prisma.payment.aggregate({
        where: {
          contract: { companyId, tipoArrendamiento: 'temporada' },
          status: 'pagado',
          fecha: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });
      value = payments._sum.amount || 0;

      const prevPayments = await prisma.payment.aggregate({
        where: {
          contract: { companyId, tipoArrendamiento: 'temporada' },
          status: 'pagado',
          fecha: { gte: previousMonthStart, lte: endOfMonth(previousMonthStart) },
        },
        _sum: { amount: true },
      });
      previousValue = prevPayments._sum.amount || 0;
    } else if (metric === 'contracts') {
      value = await prisma.contract.count({
        where: {
          companyId,
          tipoArrendamiento: 'temporada',
          status: 'activo',
          fechaInicio: { lte: monthEnd },
          fechaFin: { gte: monthStart },
        },
      });
    } else if (metric === 'rent') {
      const contracts = await prisma.contract.findMany({
        where: {
          companyId,
          tipoArrendamiento: 'temporada',
          status: 'activo',
          fechaInicio: { lte: monthEnd },
          fechaFin: { gte: monthStart },
        },
        select: { rentaMensual: true },
      });
      value = contracts.length > 0
        ? Math.round(contracts.reduce((s, c) => s + c.rentaMensual, 0) / contracts.length)
        : 0;
    }

    data.push({
      period: format(monthStart, 'MMM yyyy', { locale: es }),
      value,
      previousValue: previousValue || undefined,
      change: previousValue > 0 
        ? Math.round(((value - previousValue) / previousValue) * 100) 
        : undefined,
    });
  }

  return data;
}

/**
 * Obtiene rendimiento por propiedad
 */
export async function getPropertyPerformance(
  companyId: string,
  limit: number = 10
): Promise<PropertyPerformance[]> {
  const units = await prisma.unit.findMany({
    where: { building: { companyId } },
    include: {
      building: true,
      contracts: {
        where: { tipoArrendamiento: 'temporada' },
        include: { payments: true },
      },
    },
  });

  const performance: PropertyPerformance[] = units.map(unit => {
    const activeContracts = unit.contracts.filter(c => c.status === 'activo');
    
    const totalRevenue = unit.contracts.reduce((sum, c) => 
      sum + c.payments.filter(p => p.status === 'pagado').reduce((s, p) => s + p.amount, 0),
      0
    );

    const averageRent = activeContracts.length > 0
      ? Math.round(activeContracts.reduce((s, c) => s + c.rentaMensual, 0) / activeContracts.length)
      : unit.precioBase || 0;

    // Calcular ocupación
    const now = new Date();
    const yearAgo = subYears(now, 1);
    let occupiedDays = 0;
    
    for (const contract of unit.contracts) {
      if (contract.fechaFin >= yearAgo && contract.fechaInicio <= now) {
        const start = contract.fechaInicio > yearAgo ? contract.fechaInicio : yearAgo;
        const end = contract.fechaFin < now ? contract.fechaFin : now;
        occupiedDays += differenceInDays(end, start);
      }
    }
    
    const occupancyRate = Math.round((occupiedDays / 365) * 100);

    return {
      propertyId: unit.id,
      propertyName: unit.nombre || `Unidad ${unit.numero}`,
      address: `${unit.direccion}, ${unit.building?.city}`,
      occupancyRate,
      revenue: totalRevenue,
      averageRent,
      contracts: unit.contracts.length,
      rating: 4.5, // TODO: Calcular desde reviews
    };
  });

  // Ordenar por ingresos
  return performance
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Obtiene análisis de inquilinos
 */
export async function getTenantAnalytics(
  companyId: string
): Promise<TenantAnalytics> {
  const contracts = await prisma.contract.findMany({
    where: {
      companyId,
      tipoArrendamiento: 'temporada',
    },
    include: { tenant: true },
  });

  const tenants = contracts.map(c => c.tenant);
  const total = tenants.length || 1;

  // Por nacionalidad
  const nationalityCount = new Map<string, number>();
  tenants.forEach(t => {
    const nat = t.nacionalidad || 'No especificada';
    nationalityCount.set(nat, (nationalityCount.get(nat) || 0) + 1);
  });

  const byNationality = Array.from(nationalityCount.entries())
    .map(([nationality, count]) => ({
      nationality,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Por motivo
  const purposeCount = new Map<string, number>();
  contracts.forEach(c => {
    const purpose = c.motivoTemporalidad || 'No especificado';
    purposeCount.set(purpose, (purposeCount.get(purpose) || 0) + 1);
  });

  const byPurpose = Array.from(purposeCount.entries())
    .map(([purpose, count]) => ({
      purpose,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Por duración
  const durationRanges = [
    { range: '1-2 meses', min: 1, max: 2 },
    { range: '3-4 meses', min: 3, max: 4 },
    { range: '5-6 meses', min: 5, max: 6 },
    { range: '7-9 meses', min: 7, max: 9 },
    { range: '10-11 meses', min: 10, max: 11 },
  ];

  const byDuration = durationRanges.map(r => {
    const count = contracts.filter(c => {
      const months = c.duracionMesesPrevista || 0;
      return months >= r.min && months <= r.max;
    }).length;
    return {
      range: r.range,
      count,
      percentage: Math.round((count / total) * 100),
    };
  });

  // Tasa de repetición (inquilinos que vuelven)
  const tenantIds = new Set<string>();
  const repeatTenants = new Set<string>();
  contracts.forEach(c => {
    if (tenantIds.has(c.tenantId)) {
      repeatTenants.add(c.tenantId);
    }
    tenantIds.add(c.tenantId);
  });

  const repeatRate = tenantIds.size > 0
    ? Math.round((repeatTenants.size / tenantIds.size) * 100)
    : 0;

  return {
    byNationality,
    byPurpose,
    byDuration,
    byAgeGroup: [], // TODO: Calcular si tenemos fecha de nacimiento
    averageScore: 75,
    repeatRate,
  };
}

/**
 * Obtiene datos de estacionalidad
 */
export async function getSeasonalityData(
  companyId: string
): Promise<SeasonalityData[]> {
  const months = eachMonthOfInterval({
    start: startOfYear(new Date()),
    end: endOfYear(new Date()),
  });

  const seasonality: SeasonalityData[] = [];

  for (const monthStart of months) {
    const monthEnd = endOfMonth(monthStart);

    const contracts = await prisma.contract.findMany({
      where: {
        companyId,
        tipoArrendamiento: 'temporada',
        fechaInicio: { lte: monthEnd },
        fechaFin: { gte: monthStart },
      },
      include: { payments: true },
    });

    const units = await prisma.unit.count({
      where: { building: { companyId } },
    });

    const occupancy = units > 0 
      ? Math.round((contracts.length / units) * 100)
      : 0;

    const revenue = contracts.reduce((sum, c) => 
      sum + c.payments
        .filter(p => p.status === 'pagado' && new Date(p.fecha) >= monthStart && new Date(p.fecha) <= monthEnd)
        .reduce((s, p) => s + p.amount, 0),
      0
    );

    const averageRent = contracts.length > 0
      ? Math.round(contracts.reduce((s, c) => s + c.rentaMensual, 0) / contracts.length)
      : 0;

    // Determinar nivel de demanda
    let demand: SeasonalityData['demand'] = 'medium';
    const monthNum = monthStart.getMonth();
    
    if ([8, 0, 1].includes(monthNum)) demand = 'peak'; // Sep, Ene, Feb (inicio cursos/año)
    else if ([5, 6, 7].includes(monthNum)) demand = 'high'; // Jun, Jul, Ago (verano)
    else if ([11].includes(monthNum)) demand = 'low'; // Dic
    else demand = 'medium';

    seasonality.push({
      month: format(monthStart, 'MMMM', { locale: es }),
      occupancy,
      revenue,
      averageRent,
      demand,
    });
  }

  return seasonality;
}

/**
 * Genera comparación con el mercado
 */
export async function getMarketComparison(
  companyId: string
): Promise<MarketComparison[]> {
  const kpis = await getMediumTermKPIs(companyId);

  // Valores de mercado (simulados - en producción vendrían de API externa)
  const marketData = {
    occupancyRate: 75,
    averageRent: 900,
    renewalRate: 40,
    collectionRate: 95,
    averageStayDuration: 4,
  };

  const comparisons: MarketComparison[] = [
    {
      metric: 'Ocupación',
      yourValue: kpis.occupancyRate,
      marketAverage: marketData.occupancyRate,
      difference: kpis.occupancyRate - marketData.occupancyRate,
      percentile: calculatePercentile(kpis.occupancyRate, marketData.occupancyRate),
      recommendation: kpis.occupancyRate < marketData.occupancyRate
        ? 'Considera ajustar precios o mejorar la visibilidad en portales'
        : 'Excelente ocupación. Podrías considerar aumentar precios.',
    },
    {
      metric: 'Renta media',
      yourValue: kpis.averageRent,
      marketAverage: marketData.averageRent,
      difference: kpis.averageRent - marketData.averageRent,
      percentile: calculatePercentile(kpis.averageRent, marketData.averageRent),
      recommendation: kpis.averageRent < marketData.averageRent
        ? 'Hay margen para aumentar los precios'
        : 'Precios competitivos. Mantén la calidad del servicio.',
    },
    {
      metric: 'Tasa de renovación',
      yourValue: kpis.renewalRate,
      marketAverage: marketData.renewalRate,
      difference: kpis.renewalRate - marketData.renewalRate,
      percentile: calculatePercentile(kpis.renewalRate, marketData.renewalRate),
      recommendation: kpis.renewalRate < marketData.renewalRate
        ? 'Mejora la experiencia del inquilino para aumentar renovaciones'
        : 'Buen índice de fidelización.',
    },
    {
      metric: 'Tasa de cobro',
      yourValue: kpis.collectionRate,
      marketAverage: marketData.collectionRate,
      difference: kpis.collectionRate - marketData.collectionRate,
      percentile: calculatePercentile(kpis.collectionRate, marketData.collectionRate),
      recommendation: kpis.collectionRate < marketData.collectionRate
        ? 'Implementa recordatorios automáticos y domiciliación'
        : 'Excelente gestión de cobros.',
    },
  ];

  return comparisons;
}

function calculatePercentile(value: number, average: number): number {
  const ratio = value / (average || 1);
  if (ratio >= 1.2) return 90;
  if (ratio >= 1.1) return 75;
  if (ratio >= 0.9) return 50;
  if (ratio >= 0.8) return 25;
  return 10;
}

export default {
  getMediumTermKPIs,
  getTimeSeriesData,
  getPropertyPerformance,
  getTenantAnalytics,
  getSeasonalityData,
  getMarketComparison,
};
