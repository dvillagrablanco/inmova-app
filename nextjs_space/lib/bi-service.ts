import { prisma } from './db';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

/**
 * PAQUETE 12: BUSINESS INTELLIGENCE - SERVICE LAYER
 */

// Calcular métricas de ocupación por periodo
export async function calculateOccupancyMetrics(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const units = await prisma.unit.findMany({
    where: {
      building: { companyId },
    },
    include: {
      contracts: true,
    },
  });

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u: any) => {
    if (!u.contracts || u.contracts.length === 0) return false;
    return u.contracts.some((c: any) => {
      const inicio = new Date(c.fechaInicio);
      const fin = c.fechaFin ? new Date(c.fechaFin) : null;
      return inicio <= endDate && (!fin || fin >= startDate);
    });
  }).length;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  return {
    totalUnits,
    occupiedUnits,
    vacantUnits: totalUnits - occupiedUnits,
    occupancyRate: parseFloat(occupancyRate.toFixed(2)),
  };
}

// Análisis de tendencias de ingresos
export async function analyzeRevenueTrends(
  companyId: string,
  months: number = 6
) {
  const trends = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const periodo = format(date, 'yyyy-MM');

    const payments = await prisma.payment.findMany({
      where: {
        contract: { tenant: { companyId } },
        fechaPago: { gte: start, lte: end },
        estado: 'pagado',
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.monto, 0);

    trends.push({
      periodo,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      paymentsCount: payments.length,
    });
  }

  return trends;
}

// Segmentación de inquilinos por comportamiento
export async function segmentTenantsByBehavior(companyId: string) {
  const tenants = await prisma.tenant.findMany({
    where: { companyId },
    include: {
      contracts: {
        include: {
          payments: true,
        },
      },
    },
  });

  const segments = {
    excelentes: [] as any[],
    buenos: [] as any[],
    regulares: [] as any[],
    problemáticos: [] as any[],
  };

  for (const tenant of tenants) {
    let totalPayments = 0;
    let latePayments = 0;
    let onTimePayments = 0;

    for (const contract of tenant.contracts) {
      totalPayments += contract.payments.length;
      latePayments += contract.payments.filter(p => p.estado === 'atrasado').length;
      onTimePayments += contract.payments.filter(
        p => p.estado === 'pagado' && p.fechaPago && p.fechaPago <= p.fechaVencimiento
      ).length;
    }

    const onTimeRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;
    const lateRate = totalPayments > 0 ? (latePayments / totalPayments) * 100 : 0;

    const tenantData = {
      id: tenant.id,
      nombreCompleto: tenant.nombreCompleto,
      email: tenant.email,
      totalPayments,
      onTimeRate: parseFloat(onTimeRate.toFixed(2)),
      lateRate: parseFloat(lateRate.toFixed(2)),
    };

    if (onTimeRate >= 95 && lateRate === 0) {
      segments.excelentes.push(tenantData);
    } else if (onTimeRate >= 80 && lateRate < 10) {
      segments.buenos.push(tenantData);
    } else if (onTimeRate >= 60 && lateRate < 25) {
      segments.regulares.push(tenantData);
    } else {
      segments.problemáticos.push(tenantData);
    }
  }

  return segments;
}

// Benchmarking entre propiedades
export async function benchmarkProperties(companyId: string) {
  const buildings = await prisma.building.findMany({
    where: { companyId },
    include: {
      units: {
        include: {
          contracts: {
            include: {
              payments: { where: { estado: 'pagado' } },
            },
          },
        },
      },
    },
  });

  const benchmarks = buildings.map(building => {
    const totalUnits = building.units.length;
    const occupiedUnits = building.units.filter(u => u.estado === 'ocupada').length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    let totalRevenue = 0;
    let totalPayments = 0;

    building.units.forEach(unit => {
      unit.contracts.forEach(contract => {
        contract.payments.forEach(payment => {
          totalRevenue += payment.monto;
          totalPayments++;
        });
      });
    });

    const avgRevenuePerUnit = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    return {
      buildingId: building.id,
      nombre: building.nombre,
      totalUnits,
      occupiedUnits,
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgRevenuePerUnit: parseFloat(avgRevenuePerUnit.toFixed(2)),
      totalPayments,
    };
  });

  return benchmarks.sort((a, b) => b.occupancyRate - a.occupancyRate);
}

// Verificar alertas inteligentes
export async function checkIntelligentAlerts(companyId: string) {
  const alerts = [];

  // Alerta: Tasa de ocupación baja
  const occupancy = await calculateOccupancyMetrics(
    companyId,
    new Date(),
    new Date()
  );
  if (occupancy.occupancyRate < 70) {
    alerts.push({
      metrica: 'occupancy_rate',
      titulo: 'Tasa de ocupación baja',
      descripcion: `La tasa de ocupación actual es del ${occupancy.occupancyRate}%, por debajo del objetivo del 70%.`,
      valor: occupancy.occupancyRate,
      umbral: 70,
      severidad: occupancy.occupancyRate < 50 ? 'critical' : 'warning',
    });
  }

  // Alerta: Pagos atrasados
  const latePayments = await prisma.payment.count({
    where: {
      contract: { tenant: { companyId } },
      estado: 'atrasado',
    },
  });
  if (latePayments > 5) {
    alerts.push({
      metrica: 'late_payments',
      titulo: 'Alto número de pagos atrasados',
      descripcion: `Hay ${latePayments} pagos atrasados que requieren atención.`,
      valor: latePayments,
      umbral: 5,
      severidad: latePayments > 10 ? 'critical' : 'warning',
    });
  }

  // Alerta: Contratos próximos a vencer
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const expiringContracts = await prisma.contract.count({
    where: {
      tenant: { companyId },
      fechaFin: { gte: now, lte: thirtyDaysFromNow },
      estado: 'activo',
    },
  });

  if (expiringContracts > 0) {
    alerts.push({
      metrica: 'expiring_contracts',
      titulo: 'Contratos próximos a vencer',
      descripcion: `${expiringContracts} contrato(s) vencen en los próximos 30 días.`,
      valor: expiringContracts,
      umbral: 0,
      severidad: 'info',
    });
  }

  return alerts;
}

// Análisis comparativo multi-periodo
export async function compareMultiPeriod(
  companyId: string,
  metric: 'revenue' | 'occupancy' | 'payments',
  periods: number = 3
) {
  const comparisons: Array<{ periodo: string; value: number; variation?: number }> = [];
  const now = new Date();

  for (let i = periods - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const periodo = format(date, 'yyyy-MM');

    let value = 0;

    if (metric === 'revenue') {
      const payments = await prisma.payment.findMany({
        where: {
          contract: { tenant: { companyId } },
          fechaPago: { gte: start, lte: end },
          estado: 'pagado',
        },
      });
      value = payments.reduce((sum, p) => sum + p.monto, 0);
    } else if (metric === 'occupancy') {
      const metrics = await calculateOccupancyMetrics(companyId, start, end);
      value = metrics.occupancyRate;
    } else if (metric === 'payments') {
      value = await prisma.payment.count({
        where: {
          contract: { tenant: { companyId } },
          fechaPago: { gte: start, lte: end },
          estado: 'pagado',
        },
      });
    }

    comparisons.push({
      periodo,
      value: parseFloat(value.toFixed(2)),
    });
  }

  // Calcular variaciones
  const result = comparisons.map((item, i) => {
    if (i === 0) {
      return { ...item, variation: 0 };
    }
    const current = item.value;
    const previous = comparisons[i - 1].value;
    const variation = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return { ...item, variation: parseFloat(variation.toFixed(2)) };
  });

  return result;
}
