import { prisma } from './db';
import { addMonths, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface PredictionResult {
  tipo: string;
  valorPredicho: number;
  confianza: number;
  factores: string[];
  periodo: string;
}

/**
 * Predice ingresos futuros basado en datos históricos
 */
export async function predictRevenue(
  companyId: string,
  monthsAhead: number = 3
): Promise<PredictionResult[]> {
  // Get historical snapshots
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: { companyId },
    orderBy: { fecha: 'desc' },
    take: 12,
  });

  if (snapshots.length < 3) {
    return [];
  }

  const predictions: PredictionResult[] = [];

  // Calculate trend
  const avgRevenue =
    snapshots.reduce((sum, s) => sum + s.ingresosMensuales, 0) / snapshots.length;
  const recentAvg =
    snapshots.slice(0, 3).reduce((sum, s) => sum + s.ingresosMensuales, 0) / 3;
  const trend = recentAvg / avgRevenue;

  // Calculate seasonal factors
  const seasonalityFactor = 1.0; // Simplified

  // Generate predictions
  for (let i = 1; i <= monthsAhead; i++) {
    const targetDate = addMonths(new Date(), i);
    const periodo = format(targetDate, 'yyyy-MM');

    // Simple linear prediction with trend
    const valorPredicho = recentAvg * Math.pow(trend, i) * seasonalityFactor;

    // Calculate confidence based on data consistency
    const variance =
      snapshots.reduce((sum, s) => sum + Math.pow(s.ingresosMensuales - avgRevenue, 2), 0) /
      snapshots.length;
    const stdDev = Math.sqrt(variance);
    const confianza = Math.max(0.5, Math.min(0.95, 1 - stdDev / avgRevenue));

    const factores = [
      `Tendencia: ${trend > 1 ? 'creciente' : 'decreciente'} (${((trend - 1) * 100).toFixed(1)}%)`,
      `Tasa de ocupación: ${snapshots[0]?.tasaOcupacion.toFixed(1)}%`,
      `Ticket promedio: €${snapshots[0]?.ticketPromedio.toFixed(2)}`,
    ];

    predictions.push({
      tipo: 'ingresos',
      valorPredicho: Math.round(valorPredicho),
      confianza: Math.round(confianza * 100) / 100,
      factores,
      periodo,
    });

    // Save to database
    await prisma.prediction.create({
      data: {
        companyId,
        tipo: 'ingresos',
        periodo,
        valorPredicho,
        confianza,
        factores: JSON.stringify(factores),
        fechaObjetivo: targetDate,
      },
    });
  }

  return predictions;
}

/**
 * Predice tasa de ocupación futura
 */
export async function predictOccupancy(
  companyId: string,
  monthsAhead: number = 3
): Promise<PredictionResult[]> {
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: { companyId },
    orderBy: { fecha: 'desc' },
    take: 12,
  });

  if (snapshots.length < 3) {
    return [];
  }

  const predictions: PredictionResult[] = [];

  // Calculate average and trend
  const avgOccupancy =
    snapshots.reduce((sum, s) => sum + s.tasaOcupacion, 0) / snapshots.length;
  const recentAvg = snapshots.slice(0, 3).reduce((sum, s) => sum + s.tasaOcupacion, 0) / 3;
  const trend = (recentAvg - avgOccupancy) / avgOccupancy;

  // Get contracts ending soon
  const contractsEnding = await prisma.contract.count({
    where: {
      tenant: { companyId },
      fechaFin: {
        gte: new Date(),
        lte: addMonths(new Date(), monthsAhead),
      },
    },
  });

  const totalUnits = snapshots[0]?.totalUnidades || 1;
  const impactFromContracts = (contractsEnding / totalUnits) * 100;

  for (let i = 1; i <= monthsAhead; i++) {
    const targetDate = addMonths(new Date(), i);
    const periodo = format(targetDate, 'yyyy-MM');

    // Predict with trend and contract impact
    let valorPredicho = recentAvg + trend * avgOccupancy * i - impactFromContracts * (i / monthsAhead);
    valorPredicho = Math.max(0, Math.min(100, valorPredicho));

    const confianza = 0.8 - i * 0.05; // Confidence decreases over time

    const factores = [
      `Ocupación actual: ${recentAvg.toFixed(1)}%`,
      `Contratos finalizando: ${contractsEnding}`,
      `Tendencia: ${trend > 0 ? 'positiva' : 'negativa'}`,
    ];

    predictions.push({
      tipo: 'ocupacion',
      valorPredicho: Math.round(valorPredicho * 10) / 10,
      confianza: Math.round(confianza * 100) / 100,
      factores,
      periodo,
    });

    await prisma.prediction.create({
      data: {
        companyId,
        tipo: 'ocupacion',
        periodo,
        valorPredicho,
        confianza,
        factores: JSON.stringify(factores),
        fechaObjetivo: targetDate,
      },
    });
  }

  return predictions;
}

/**
 * Predice riesgo de morosidad para un inquilino
 */
export async function predictTenantDefaultRisk(tenantId: string): Promise<number> {
  const payments = await prisma.payment.findMany({
    where: {
      contract: { tenantId },
    },
    orderBy: { fechaVencimiento: 'desc' },
    take: 12,
  });

  if (payments.length === 0) return 0.5; // Neutral risk for new tenants

  const latePayments = payments.filter(
    p => p.estado === 'pagado' && p.fechaPago && p.fechaPago > p.fechaVencimiento
  ).length;

  const pendingPayments = payments.filter(
    p => p.estado === 'pendiente' && new Date(p.fechaVencimiento) < new Date()
  ).length;

  // Calculate risk score
  let riskScore = 0;
  riskScore += (latePayments / payments.length) * 0.4;
  riskScore += (pendingPayments / Math.max(payments.length, 1)) * 0.6;

  return Math.min(1, riskScore);
}

/**
 * Genera recomendaciones basadas en analytics
 */
export async function generateRecommendations(companyId: string) {
  const recommendations = [];

  // Get latest snapshot
  const snapshot = await prisma.analyticsSnapshot.findFirst({
    where: { companyId },
    orderBy: { fecha: 'desc' },
  });

  if (!snapshot) return [];

  // Check occupancy rate
  if (snapshot.tasaOcupacion < 80) {
    recommendations.push({
      companyId,
      tipo: 'ocupacion',
      prioridad: 'alta',
      titulo: 'Baja tasa de ocupación detectada',
      descripcion: `La tasa de ocupación actual es del ${snapshot.tasaOcupacion.toFixed(1)}%. Se recomienda revisar estrategia de precios y marketing.`,
      impactoEstimado: (100 - snapshot.tasaOcupacion) * snapshot.ticketPromedio,
      accionSugerida:
        'Considerar: 1) Ajustar precios de renta, 2) Mejorar campañas de marketing, 3) Ofrecer incentivos para nuevos inquilinos',
    });
  }

  // Check default rate
  if (snapshot.tasaMorosidad > 10) {
    recommendations.push({
      companyId,
      tipo: 'morosidad',
      prioridad: 'alta',
      titulo: 'Alta tasa de morosidad',
      descripcion: `La tasa de morosidad es del ${snapshot.tasaMorosidad.toFixed(1)}%, con €${snapshot.morosidad.toFixed(2)} en pagos atrasados.`,
      impactoEstimado: snapshot.morosidad,
      accionSugerida:
        'Acciones recomendadas: 1) Contactar inquilinos morosos, 2) Ofrecer planes de pago, 3) Revisar proceso de selección de inquilinos',
    });
  }

  // Check maintenance backlog
  if (snapshot.mantenimientoPendiente > 5) {
    recommendations.push({
      companyId,
      tipo: 'mantenimiento',
      prioridad: 'media',
      titulo: 'Acumulación de solicitudes de mantenimiento',
      descripcion: `Hay ${snapshot.mantenimientoPendiente} solicitudes de mantenimiento pendientes.`,
      impactoEstimado: snapshot.mantenimientoPendiente * 200,
      accionSugerida:
        'Priorizar: 1) Solicitudes urgentes, 2) Asignar más recursos, 3) Considerar contratos de mantenimiento preventivo',
    });
  }

  // Check expiring contracts
  if (snapshot.contratosPorVencer > 3) {
    recommendations.push({
      companyId,
      tipo: 'contratos',
      prioridad: 'media',
      titulo: 'Contratos próximos a vencer',
      descripcion: `${snapshot.contratosPorVencer} contratos vencerán en los próximos 3 meses.`,
      impactoEstimado: snapshot.contratosPorVencer * snapshot.ticketPromedio * 3,
      accionSugerida:
        'Acciones: 1) Contactar inquilinos para renovación, 2) Evaluar ajustes de renta, 3) Preparar marketing para unidades potencialmente vacantes',
    });
  }

  // Save recommendations
  for (const rec of recommendations) {
    await prisma.recommendation.create({ data: rec });
  }

  return recommendations;
}
