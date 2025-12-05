/**
 * Servicio de Renovaciones Inteligentes - Versión Simplificada
 */
import { prisma } from '@/lib/db';
import { addDays, differenceInDays, addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface AnalyzeContractParams {
  contractId: string;
}

export interface CreateRenewalParams {
  contractId: string;
  aplicarIPC?: boolean;
  incrementoManual?: number;
  duracionMeses?: number;
}

export async function analyzeContractForRenewal(contractId: string) {
  const contrato = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      tenant: true,
      unit: { include: { building: true } },
      payments: {
        where: { estado: { in: ['pagado', 'pendiente'] } },
        orderBy: { fechaVencimiento: 'desc' },
      },
    },
  });

  if (!contrato) throw new Error('Contrato no encontrado');

  let probabilidadRenovacion = 50;
  const factores: any[] = [];

  // Factor 1: Puntualidad en pagos
  const pagosPuntuales = contrato.payments.filter(p => {
    if (!p.fechaPago) return false;
    return p.fechaPago <= p.fechaVencimiento;
  });
  const porcentajePuntualidad = contrato.payments.length > 0
    ? (pagosPuntuales.length / contrato.payments.length) * 100
    : 100;

  if (porcentajePuntualidad >= 90) {
    probabilidadRenovacion += 15;
    factores.push({ factor: 'Puntualidad en pagos', impacto: +15, detalle: `${porcentajePuntualidad.toFixed(0)}% pagos a tiempo` });
  } else if (porcentajePuntualidad < 70) {
    probabilidadRenovacion -= 10;
    factores.push({ factor: 'Morosidad', impacto: -10, detalle: `Solo ${porcentajePuntualidad.toFixed(0)}% pagos a tiempo` });
  }

  // Factor 2: Antigüedad
  const mesesContrato = differenceInDays(new Date(), contrato.fechaInicio) / 30;
  if (mesesContrato > 24) {
    probabilidadRenovacion += 10;
    factores.push({ factor: 'Antigüedad', impacto: +10, detalle: `${Math.floor(mesesContrato)} meses` });
  }

  // Factor 3: Renta vs mercado (simplificado)
  const rentaMercado = 900; // Valor fijo para simplificar
  const diferenciaRenta = ((contrato.rentaMensual || 0) - rentaMercado) / rentaMercado * 100;

  if (diferenciaRenta < -15) {
    probabilidadRenovacion += 15;
    factores.push({ factor: 'Renta competitiva', impacto: +15 });
  } else if (diferenciaRenta > 10) {
    probabilidadRenovacion -= 12;
    factores.push({ factor: 'Renta alta', impacto: -12 });
  }

  probabilidadRenovacion = Math.max(0, Math.min(100, probabilidadRenovacion));

  const ipcAnual = 3.5;
  const nuevaRentaSugerida = (contrato.rentaMensual || 0) * (1 + ipcAnual / 100);

  let recomendacion: 'renovar' | 'negociar' | 'no_renovar' = 'renovar';
  if (probabilidadRenovacion < 40) {
    recomendacion = 'no_renovar';
  } else if (probabilidadRenovacion < 65) {
    recomendacion = 'negociar';
  }

  const diasHastaFin = differenceInDays(contrato.fechaFin, new Date());

  return {
    contratoId: contractId,
    tenant: contrato.tenant.nombreCompleto,
    unidad: contrato.unit.numero,
    probabilidadRenovacion: Math.round(probabilidadRenovacion),
    factores,
    recomendacion,
    rentaActual: contrato.rentaMensual,
    rentaSugeridaRenovacion: Math.round(nuevaRentaSugerida),
    ipcAplicado: ipcAnual,
    diasHastaVencimiento: diasHastaFin,
  };
}

export async function generateRenewalRecommendations(companyId: string) {
  const fechaLimiteInicio = addDays(new Date(), 90);
  const fechaLimiteFin = addDays(new Date(), 180);

  const contratos = await prisma.contract.findMany({
    where: {
      companyId,
      estado: 'activo',
      fechaFin: {
        gte: fechaLimiteInicio,
        lte: fechaLimiteFin,
      },
    },
    include: {
      tenant: true,
      unit: { include: { building: true } },
    },
  });

  const recomendaciones = [];

  for (const contrato of contratos) {
    try {
      const analisis = await analyzeContractForRenewal(contrato.id);
      recomendaciones.push(analisis);
    } catch (error) {
      console.error(`Error analizando contrato ${contrato.id}:`, error);
    }
  }

  recomendaciones.sort((a, b) => b.probabilidadRenovacion - a.probabilidadRenovacion);

  return recomendaciones;
}

export async function createContractRenewal(params: CreateRenewalParams) {
  const contrato = await prisma.contract.findUnique({
    where: { id: params.contractId },
    include: {
      tenant: true,
      unit: { include: { building: true } },
    },
  });

  if (!contrato) throw new Error('Contrato no encontrado');

  const analisis = await analyzeContractForRenewal(params.contractId);

  let porcentajeIncremento = 0;
  if (params.incrementoManual !== undefined) {
    porcentajeIncremento = params.incrementoManual;
  } else if (params.aplicarIPC !== false) {
    porcentajeIncremento = 3.5; // IPC fijo
  }

  const nuevaRenta = contrato.rentaMensual * (1 + porcentajeIncremento / 100);
  const duracion = params.duracionMeses || 12;
  const nuevaFechaInicio = addDays(contrato.fechaFin, 1);
  const nuevaFechaFin = addMonths(nuevaFechaInicio, duracion);

  const renovacion = await prisma.contractRenewal.create({
    data: {
      contractId: params.contractId,
      companyId: contrato.companyId || '',
      fechaPropuesta: new Date(),
      estadoRenovacion: 'propuesta_enviada',
      rentaAnterior: contrato.rentaMensual,
      rentaPropuesta: nuevaRenta,
      incrementoPorcentaje: porcentajeIncremento,
      duracionMeses: duracion,
      fechaInicioRenovacion: nuevaFechaInicio,
      fechaFinRenovacion: nuevaFechaFin,
      probabilidadAceptacion: analisis.probabilidadRenovacion,
      factoresAnalisis: analisis.factores,
      documentoPropuesta: `Propuesta de renovación generada automáticamente`,
    },
  });

  return renovacion;
}

export async function acceptRenewal(renewalId: string) {
  const renovacion = await prisma.contractRenewal.findUnique({
    where: { id: renewalId },
    include: {
      contract: true,
    },
  });

  if (!renovacion) throw new Error('Renovación no encontrada');

  await prisma.contract.update({
    where: { id: renovacion.contractId },
    data: {
      fechaFin: renovacion.fechaInicioRenovacion,
    },
  });

  const nuevoContrato = await prisma.contract.create({
    data: {
      unitId: renovacion.contract.unitId,
      tenantId: renovacion.contract.tenantId,
      companyId: renovacion.contract.companyId,
      buildingId: renovacion.contract.buildingId,
      fechaInicio: renovacion.fechaInicioRenovacion,
      fechaFin: renovacion.fechaFinRenovacion,
      rentaMensual: renovacion.rentaPropuesta,
      deposito: renovacion.contract.deposito,
      estado: 'activo',
      tipo: renovacion.contract.tipo,
    },
  });

  await prisma.contractRenewal.update({
    where: { id: renewalId },
    data: {
      estadoRenovacion: 'aceptada',
      fechaAceptacion: new Date(),
    },
  });

  return nuevoContrato;
}

export async function rejectRenewal(renewalId: string, motivo: string) {
  return await prisma.contractRenewal.update({
    where: { id: renewalId },
    data: {
      estadoRenovacion: 'rechazada',
      fechaRespuesta: new Date(),
      motivoRechazo: motivo,
    },
  });
}

export async function getRenewalStats(companyId: string) {
  const renovaciones = await prisma.contractRenewal.findMany({
    where: { companyId },
  });

  const totalRenewals = renovaciones.length;
  const successfulRenewals = renovaciones.filter((r: any) => r.estadoRenovacion === 'aceptada').length;
  const pendingRenewals = renovaciones.filter((r: any) => r.estadoRenovacion === 'propuesta_enviada').length;
  const rejectedRenewals = renovaciones.filter((r: any) => r.estadoRenovacion === 'rechazada').length;

  const averageProbability = renovaciones.length > 0
    ? renovaciones.reduce((sum: number, r: any) => sum + (r.probabilidadAceptacion || 0), 0) / renovaciones.length
    : 0;

  const averageIncrease = renovaciones.length > 0
    ? renovaciones.reduce((sum: number, r: any) => sum + r.incrementoPorcentaje, 0) / renovaciones.length
    : 0;

  return {
    totalRenewals,
    successfulRenewals,
    pendingRenewals,
    rejectedRenewals,
    averageProbability: Math.round(averageProbability),
    averageIncrease: Math.round(averageIncrease * 100) / 100,
    successRate: totalRenewals > 0 ? (successfulRenewals / totalRenewals) * 100 : 0,
  };
}
