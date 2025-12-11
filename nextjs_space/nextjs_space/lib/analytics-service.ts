import { prisma } from './db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface AnalyticsData {
  snapshot: any;
  trends: any[];
  comparisons: any;
}

/**
 * Genera un snapshot de analytics para la empresa en un periodo dado
 */
export async function generateAnalyticsSnapshot(companyId: string, fecha: Date = new Date()) {
  const periodo = format(fecha, 'yyyy-MM');
  
  // Get units data
  const units = await prisma.unit.findMany({
    where: {
      building: {
        companyId,
      },
    },
    include: {
      contracts: {
        where: {
          OR: [
            {
              AND: [
                { fechaInicio: { lte: endOfMonth(fecha) } },
                { fechaFin: { gte: startOfMonth(fecha) } },
              ],
            },
            {
              fechaInicio: { lte: endOfMonth(fecha) },
              fechaFin: undefined,
            },
          ],
        },
      },
    },
  });

  const totalUnidades = units.length;
  const unidadesOcupadas = units.filter((u: any) => u.contracts.length > 0).length;
  const unidadesVacantes = totalUnidades - unidadesOcupadas;
  const tasaOcupacion = totalUnidades > 0 ? (unidadesOcupadas / totalUnidades) * 100 : 0;

  // Get payments data
  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        tenant: {
          companyId,
        },
      },
      periodo: {
        gte: format(startOfMonth(fecha), 'yyyy-MM'),
        lte: format(endOfMonth(fecha), 'yyyy-MM'),
      },
    },
  });

  const ingresosMensuales = payments
    .filter(p => p.estado === 'pagado')
    .reduce((sum, p) => sum + p.monto, 0);

  const morosidad = payments
    .filter(p => p.estado === 'pendiente' && new Date(p.fechaVencimiento) < new Date())
    .reduce((sum, p) => sum + p.monto, 0);

  const tasaMorosidad = ingresosMensuales + morosidad > 0 
    ? (morosidad / (ingresosMensuales + morosidad)) * 100 
    : 0;

  // Get expenses
  const expenses = await prisma.expense.findMany({
    where: {
      building: {
        companyId,
      },
      fecha: {
        gte: startOfMonth(fecha),
        lte: endOfMonth(fecha),
      },
    },
  });

  const gastosMensuales = expenses.reduce((sum, e) => sum + e.monto, 0);
  const ingresoNeto = ingresosMensuales - gastosMensuales;

  // Get contracts expiring soon
  const contratosPorVencer = await prisma.contract.count({
    where: {
      tenant: {
        companyId,
      },
      fechaFin: {
        gte: new Date(),
        lte: subMonths(new Date(), -3),
      },
    },
  });

  // Get pending maintenance
  const mantenimientoPendiente = await prisma.maintenanceRequest.count({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      estado: {
        in: ['pendiente', 'en_progreso'],
      },
    },
  });

  const ticketPromedio = unidadesOcupadas > 0 ? ingresosMensuales / unidadesOcupadas : 0;

  // Check if snapshot exists
  const existingSnapshot = await prisma.analyticsSnapshot.findFirst({
    where: {
      companyId,
      periodo,
    },
  });

  // Create or update snapshot
  const snapshot = existingSnapshot
    ? await prisma.analyticsSnapshot.update({
        where: { id: existingSnapshot.id },
        data: {
          fecha,
          totalUnidades,
          unidadesOcupadas,
          unidadesVacantes,
          tasaOcupacion,
          ingresosMensuales,
          gastosMensuales,
          ingresoNeto,
          morosidad,
          tasaMorosidad,
          contratosPorVencer,
          mantenimientoPendiente,
          ticketPromedio,
        },
      })
    : await prisma.analyticsSnapshot.create({
        data: {
          companyId,
          fecha,
          periodo,
          totalUnidades,
          unidadesOcupadas,
          unidadesVacantes,
          tasaOcupacion,
          ingresosMensuales,
          gastosMensuales,
          ingresoNeto,
          morosidad,
          tasaMorosidad,
          contratosPorVencer,
          mantenimientoPendiente,
          ticketPromedio,
        },
      });

  return snapshot;
}

/**
 * Obtiene tendencias históricas de analytics
 */
export async function getAnalyticsTrends(companyId: string, months: number = 12) {
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      companyId,
    },
    orderBy: {
      fecha: 'desc',
    },
    take: months,
  });

  return snapshots.reverse();
}

/**
 * Genera métricas por edificio
 */
export async function generateBuildingMetrics(buildingId: string, fecha: Date = new Date()) {
  const periodo = format(fecha, 'yyyy-MM');

  const building: any = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      units: {
        include: {
          contracts: {
            where: {
              OR: [
                {
                  AND: [
                    { fechaInicio: { lte: endOfMonth(fecha) } },
                    { fechaFin: { gte: startOfMonth(fecha) } },
                  ],
                },
                {
                  fechaInicio: { lte: endOfMonth(fecha) },
                  fechaFin: undefined,
                },
              ],
            },
          },
        },
      },
    },
  });

  if (!building) return null;

  const totalUnidades = building.units.length;
  const unidadesOcupadas = building.units.filter((u: any) => u.contracts.length > 0).length;
  const tasaOcupacion = totalUnidades > 0 ? (unidadesOcupadas / totalUnidades) * 100 : 0;

  // Calculate revenues
  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        unit: {
          buildingId,
        },
      },
      periodo: {
        gte: format(startOfMonth(fecha), 'yyyy-MM'),
        lte: format(endOfMonth(fecha), 'yyyy-MM'),
      },
      estado: 'pagado',
    },
  });

  const ingresosReales = payments.reduce((sum, p) => sum + p.monto, 0);

  // Calculate potential revenue
  const ingresosPotenciales = building.units.reduce((sum: number, u: any) => sum + (u.precioRenta || 0), 0);

  // Calculate expenses
  const expenses = await prisma.expense.findMany({
    where: {
      buildingId,
      fecha: {
        gte: startOfMonth(fecha),
        lte: endOfMonth(fecha),
      },
    },
  });

  const gastos = expenses.reduce((sum, e) => sum + e.monto, 0);
  const ingresoNeto = ingresosReales - gastos;
  const roi = ingresosPotenciales > 0 ? (ingresoNeto / ingresosPotenciales) * 100 : 0;
  const ticketPromedio = unidadesOcupadas > 0 ? ingresosReales / unidadesOcupadas : 0;

  // Calculate average vacancy days (simplified)
  const diasPromedioVacancia = 30;

  const metrics = await prisma.buildingMetrics.create({
    data: {
      buildingId,
      fecha,
      periodo,
      totalUnidades,
      unidadesOcupadas,
      tasaOcupacion,
      ingresosReales,
      ingresosPotenciales,
      gastos,
      ingresoNeto,
      roi,
      ticketPromedio,
      diasPromedioVacancia,
    },
  });

  return metrics;
}

/**
 * Analiza el comportamiento de un inquilino
 */
export async function analyzeTenantBehavior(tenantId: string) {
  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        tenantId,
      },
    },
    orderBy: {
      fechaVencimiento: 'desc',
    },
  });

  const pagosATiempo = payments.filter(
    p => p.estado === 'pagado' && p.fechaPago && p.fechaPago <= p.fechaVencimiento
  ).length;

  const pagosRetrasados = payments.filter(
    p => p.estado === 'pagado' && p.fechaPago && p.fechaPago > p.fechaVencimiento
  ).length;

  const retrasos = payments
    .filter(p => p.estado === 'pagado' && p.fechaPago && p.fechaPago > p.fechaVencimiento)
    .map(p => {
      const diff = new Date(p.fechaPago!).getTime() - new Date(p.fechaVencimiento).getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    });

  const promedioRetrasosDias = retrasos.length > 0
    ? retrasos.reduce((sum, d) => sum + d, 0) / retrasos.length
    : 0;

  const ticketsMantenimiento = await prisma.maintenanceRequest.count({
    where: {
      unit: {
        contracts: {
          some: {
            tenantId,
          },
        },
      },
    },
  });

  // Calculate behavior score (0-100)
  let scoreComportamiento = 50;
  scoreComportamiento += Math.min(pagosATiempo * 2, 30);
  scoreComportamiento -= Math.min(pagosRetrasados * 5, 30);
  scoreComportamiento -= Math.min(promedioRetrasosDias * 2, 20);
  scoreComportamiento = Math.max(0, Math.min(100, scoreComportamiento));

  // Determine risk level
  let riesgoMorosidad = 'bajo';
  if (scoreComportamiento < 40) riesgoMorosidad = 'alto';
  else if (scoreComportamiento < 60) riesgoMorosidad = 'medio';

  const behavior = await prisma.tenantBehavior.create({
    data: {
      tenantId,
      fecha: new Date(),
      pagosATiempo,
      pagosRetrasados,
      promedioRetrasosDias,
      ticketsMantenimiento,
      scoreComportamiento,
      riesgoMorosidad,
    },
  });

  return behavior;
}
