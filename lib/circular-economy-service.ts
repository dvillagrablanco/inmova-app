import { prisma } from './db';
import { addDays } from 'date-fns';

// ==========================================
// MÓDULO: ECONOMÍA CIRCULAR
// ==========================================

/**
 * Crea un item en el marketplace circular
 */
export async function createCircularItem(data: {
  marketplaceId: string;
  tenantId?: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  tipo?: string;
  precioMoneda?: number;
  precioPuntos?: number;
  fotos?: string[];
  ubicacion?: string;
  condicion?: string;
}) {
  const item = await prisma.circularItem.create({
    data: {
      ...data,
      estado: 'disponible',
      interesados: [],
    },
  });

  return item;
}

/**
 * Registra interés en un item
 */
export async function expressInterest(itemId: string, tenantId: string) {
  const item = await prisma.circularItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.estado !== 'disponible') {
    throw new Error('Item no disponible');
  }

  const interesados = [...(item.interesados || []), tenantId];

  const updatedItem = await prisma.circularItem.update({
    where: { id: itemId },
    data: {
      interesados,
    },
  });

  return updatedItem;
}

/**
 * Reserva un item
 */
export async function reserveItem(itemId: string, tenantId: string) {
  const item = await prisma.circularItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.estado !== 'disponible') {
    throw new Error('Item no disponible');
  }

  const updatedItem = await prisma.circularItem.update({
    where: { id: itemId },
    data: {
      estado: 'reservado',
      reservadoPor: tenantId,
      fechaReserva: new Date(),
    },
  });

  return updatedItem;
}

/**
 * Completa una transacción
 */
export async function completeTransaction(itemId: string) {
  const item = await prisma.circularItem.update({
    where: { id: itemId },
    data: {
      transaccionCompletada: true,
      fechaTransaccion: new Date(),
      estado: 'intercambiado',
    },
  });

  return item;
}

/**
 * Crea un jardín urbano
 */
export async function createUrbanGarden(data: {
  companyId: string;
  buildingId: string;
  nombre: string;
  descripcion?: string;
  ubicacion: string;
  metrosCuadrados: number;
  tipoCultivo?: string;
  fotos?: string[];
  reglas?: any;
}) {
  const garden = await prisma.urbanGarden.create({
    data: {
      ...data,
      activo: true,
    },
  });

  return garden;
}

/**
 * Crea parcelas en un jardín
 */
export async function createGardenPlots(
  gardenId: string,
  numParcelas: number,
  metrosPorParcela: number
) {
  const plots = [];

  for (let i = 1; i <= numParcelas; i++) {
    const plot = await prisma.gardenPlot.create({
      data: {
        gardenId,
        numeroParcela: `P${i.toString().padStart(2, '0')}`,
        metrosCuadrados: metrosPorParcela,
        estado: 'disponible',
      },
    });

    plots.push(plot);
  }

  return plots;
}

/**
 * Asigna una parcela a un inquilino
 */
export async function assignGardenPlot(plotId: string, tenantId: string, meses: number = 6) {
  const plot = await prisma.gardenPlot.findUnique({
    where: { id: plotId },
  });

  if (!plot || plot.estado !== 'disponible') {
    throw new Error('Parcela no disponible');
  }

  const updatedPlot = await prisma.gardenPlot.update({
    where: { id: plotId },
    data: {
      tenantId,
      reservadaDesde: new Date(),
      reservadaHasta: addDays(new Date(), meses * 30),
      estado: 'asignada',
    },
  });

  return updatedPlot;
}

/**
 * Registra métricas de reciclaje
 */
export async function recordRecyclingMetrics(data: {
  companyId: string;
  buildingId?: string;
  periodo: string;
  residuosGenerados: number;
  residuosReciclados: number;
  residuosOrganicos: number;
  participantes?: number;
  puntosOtorgados?: number;
}) {
  const tasaReciclaje =
    data.residuosGenerados > 0 ? (data.residuosReciclados / data.residuosGenerados) * 100 : 0;

  // Cálculo simplificado de ahorros de CO2
  // Aproximadamente 0.5 kg CO2 ahorrado por kg reciclado
  const ahorrosCO2 = data.residuosReciclados * 0.5;

  const metric = await prisma.recyclingMetric.create({
    data: {
      ...data,
      tasaReciclaje,
      ahorrosCO2,
    },
  });

  return metric;
}

/**
 * Calcula puntos de gamificación por reciclaje
 */
export function calculateRecyclingPoints(data: {
  residuosReciclados: number;
  residuosOrganicos: number;
  separacionCorrecta: boolean;
}) {
  let puntos = 0;

  // Puntos base por reciclaje
  puntos += data.residuosReciclados * 10;

  // Bonus por compostaje/orgánicos
  puntos += data.residuosOrganicos * 5;

  // Bonus por separación correcta
  if (data.separacionCorrecta) {
    puntos += 20;
  }

  return puntos;
}

/**
 * Obtiene estadísticas de economía circular
 */
export async function getCircularEconomyStats(companyId: string) {
  const marketplace = await prisma.circularMarketplace.findFirst({
    where: { companyId },
    include: {
      items: true,
    },
  });

  const gardens = await prisma.urbanGarden.count({
    where: { companyId },
  });

  const metrics = await prisma.recyclingMetric.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  const totalReciclado = metrics.reduce((sum, m) => sum + m.residuosReciclados, 0);
  const totalCO2Ahorrado = metrics.reduce((sum, m) => sum + (m.ahorrosCO2 || 0), 0);
  const tasaReciclajePromedio =
    metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.tasaReciclaje, 0) / metrics.length : 0;

  return {
    itemsCirculares: marketplace?.items.length || 0,
    itemsIntercambiados: marketplace?.items.filter((i) => i.transaccionCompletada).length || 0,
    jardinesUrbanos: gardens,
    totalReciclado,
    totalCO2Ahorrado,
    tasaReciclajePromedio,
  };
}
