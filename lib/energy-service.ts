import { prisma } from './db';
import { format, subMonths } from 'date-fns';

// Definiciones de tipos inline (reemplaza imports de @prisma/client)
type EnergyType = 'electricidad' | 'agua' | 'gas' | 'calefaccion' | 'otro';
type AlertType =
  | 'consumo_alto'
  | 'consumo_bajo'
  | 'incremento_repentino'
  | 'fuga_posible'
  | 'anomalia_patron';

/**
 * PAQUETE 13: GESTIÓN DE ENERGÍA - SERVICE LAYER
 */

// Calcular consumo promedio
export async function calculateAverageConsumption(
  companyId: string,
  tipo: EnergyType,
  buildingId?: string,
  unitId?: string,
  months: number = 6
) {
  const now = new Date();
  const sixMonthsAgo = subMonths(now, months);
  const periodo = format(sixMonthsAgo, 'yyyy-MM');

  const readings = await prisma.energyReading.findMany({
    where: {
      companyId,
      tipo,
      ...(buildingId && { buildingId }),
      ...(unitId && { unitId }),
      periodo: { gte: periodo },
    },
  });

  if (readings.length === 0) return 0;

  const totalConsumption = readings.reduce((sum, r) => sum + r.consumo, 0);
  return parseFloat((totalConsumption / readings.length).toFixed(2));
}

// Detectar consumo anormal
export async function detectAbnormalConsumption(companyId: string, readingId: string) {
  const reading = await prisma.energyReading.findUnique({
    where: { id: readingId },
    include: { building: true, unit: true },
  });

  if (!reading) return null;

  const avgConsumption = await calculateAverageConsumption(
    companyId,
    reading.tipo,
    reading.buildingId || undefined,
    reading.unitId || undefined
  );

  if (avgConsumption === 0) return null;

  const deviation = ((reading.consumo - avgConsumption) / avgConsumption) * 100;

  let alertType: AlertType | null = null;
  let severidad = 'baja';

  if (deviation > 50) {
    alertType = 'consumo_alto';
    severidad = deviation > 100 ? 'alta' : 'media';
  } else if (deviation < -50) {
    alertType = 'consumo_bajo';
    severidad = 'media';
  } else if (Math.abs(deviation) > 30) {
    alertType = 'incremento_repentino';
    severidad = 'media';
  }

  if (!alertType) return null;

  // Crear alerta
  const alert = await prisma.energyAlert.create({
    data: {
      companyId,
      buildingId: reading.buildingId,
      unitId: reading.unitId,
      tipo: reading.tipo,
      tipoAlerta: alertType,
      titulo: `Consumo ${alertType === 'consumo_alto' ? 'Alto' : 'Anormal'} Detectado`,
      descripcion: `El consumo de ${reading.tipo} es ${Math.abs(deviation).toFixed(1)}% ${deviation > 0 ? 'superior' : 'inferior'} al promedio.`,
      consumoActual: reading.consumo,
      consumoPromedio: avgConsumption,
      desviacionPorcentaje: parseFloat(deviation.toFixed(2)),
      severidad,
    },
  });

  return alert;
}

// Calcular eficiencia energética
export async function calculateEnergyEfficiency(companyId: string, buildingId?: string) {
  const readings = await prisma.energyReading.findMany({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
    },
    orderBy: { fechaLectura: 'desc' },
    take: 100,
  });

  if (readings.length === 0) {
    return {
      consumoPromedio: 0,
      costoPromedio: 0,
      eficienciaScore: 0,
      recomendaciones: [],
    };
  }

  const avgConsumption = readings.reduce((sum, r) => sum + r.consumo, 0) / readings.length;
  const avgCost =
    readings.filter((r) => r.costo).reduce((sum, r) => sum + (r.costo || 0), 0) /
    readings.filter((r) => r.costo).length;

  // Score simple basado en consumo (menor es mejor)
  // Normalizado a 0-100 donde 100 es el más eficiente
  const maxConsumption = Math.max(...readings.map((r) => r.consumo));
  const eficienciaScore =
    maxConsumption > 0 ? parseFloat(((1 - avgConsumption / maxConsumption) * 100).toFixed(2)) : 0;

  // Recomendaciones básicas
  const recomendaciones = [];
  if (eficienciaScore < 50) {
    recomendaciones.push('Considerar auditoría energética profesional');
    recomendaciones.push('Revisar sistemas de calefacción/refrigeración');
  }
  if (avgCost > 0) {
    recomendaciones.push('Evaluar cambio a tarifas de energía más económicas');
  }

  return {
    consumoPromedio: parseFloat(avgConsumption.toFixed(2)),
    costoPromedio: parseFloat((avgCost || 0).toFixed(2)),
    eficienciaScore,
    recomendaciones,
  };
}

// Obtener tendencias de consumo
export async function getConsumptionTrends(
  companyId: string,
  tipo: EnergyType,
  months: number = 6,
  buildingId?: string,
  unitId?: string
) {
  const trends = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const periodo = format(date, 'yyyy-MM');

    const readings = await prisma.energyReading.findMany({
      where: {
        companyId,
        tipo,
        periodo,
        ...(buildingId && { buildingId }),
        ...(unitId && { unitId }),
      },
    });

    const totalConsumption = readings.reduce((sum, r) => sum + r.consumo, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.costo || 0), 0);

    trends.push({
      periodo,
      consumo: parseFloat(totalConsumption.toFixed(2)),
      costo: parseFloat(totalCost.toFixed(2)),
      lecturas: readings.length,
    });
  }

  return trends;
}

// Calcular facturación a inquilinos
export async function calculateTenantBilling(companyId: string, periodo: string) {
  const readings = await prisma.energyReading.findMany({
    where: {
      companyId,
      periodo,
      unitId: { not: null },
    },
    include: {
      unit: {
        include: {
          tenant: true,
        },
      },
    },
  });

  const billingByTenant: Record<string, any> = {};

  readings.forEach((reading) => {
    if (!reading.unit?.tenant) return;

    const tenantId = reading.unit.tenant.id;
    if (!billingByTenant[tenantId]) {
      billingByTenant[tenantId] = {
        tenantId,
        tenantName: reading.unit.tenant.nombreCompleto,
        unitNumber: reading.unit.numero,
        consumos: [],
        costoTotal: 0,
      };
    }

    billingByTenant[tenantId].consumos.push({
      tipo: reading.tipo,
      consumo: reading.consumo,
      costo: reading.costo || 0,
    });

    billingByTenant[tenantId].costoTotal += reading.costo || 0;
  });

  return Object.values(billingByTenant).map((billing) => ({
    ...billing,
    costoTotal: parseFloat(billing.costoTotal.toFixed(2)),
  }));
}

// Obtener estadísticas globales de energía
export async function getEnergyStats(companyId: string) {
  const now = new Date();
  const currentPeriod = format(now, 'yyyy-MM');
  const lastPeriod = format(subMonths(now, 1), 'yyyy-MM');

  const [currentReadings, lastReadings, totalAlerts, unresolvedAlerts] = await Promise.all([
    prisma.energyReading.findMany({
      where: { companyId, periodo: currentPeriod },
    }),
    prisma.energyReading.findMany({
      where: { companyId, periodo: lastPeriod },
    }),
    prisma.energyAlert.count({ where: { companyId } }),
    prisma.energyAlert.count({ where: { companyId, resuelta: false } }),
  ]);

  const currentConsumption = currentReadings.reduce((sum, r) => sum + r.consumo, 0);
  const lastConsumption = lastReadings.reduce((sum, r) => sum + r.consumo, 0);
  const currentCost = currentReadings.reduce((sum, r) => sum + (r.costo || 0), 0);

  const consumptionVariation =
    lastConsumption > 0 ? ((currentConsumption - lastConsumption) / lastConsumption) * 100 : 0;

  return {
    currentPeriod,
    totalReadings: currentReadings.length,
    currentConsumption: parseFloat(currentConsumption.toFixed(2)),
    currentCost: parseFloat(currentCost.toFixed(2)),
    consumptionVariation: parseFloat(consumptionVariation.toFixed(2)),
    totalAlerts,
    unresolvedAlerts,
  };
}
