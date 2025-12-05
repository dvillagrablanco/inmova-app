import { PrismaClient } from '@prisma/client';
import { addMonths, differenceInMonths, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

// ============================================
// ANÁLISIS DE IPC Y ACTUALIZACIÓN DE RENTAS
// ============================================

// IPC anual de España (datos de ejemplo, deberían obtenerse de una API real)
const IPC_HISTORICO: Record<number, number> = {
  2020: 0.6,
  2021: 3.1,
  2022: 8.4,
  2023: 3.5,
  2024: 3.2,
  2025: 2.8, // Previsión
};

function calcularIPCAplicable(year: number): number {
  return IPC_HISTORICO[year] || 2.5; // Por defecto 2.5%
}

function calcularNuevaRenta(rentaActual: number, ipc: number): number {
  return rentaActual * (1 + ipc / 100);
}

// ============================================
// ANÁLISIS DE MERCADO
// ============================================

interface MarketAnalysis {
  rentaPromedio: number;
  rentaMinima: number;
  rentaMaxima: number;
  desviacion: number;
  recomendacion: 'aumentar' | 'mantener' | 'reducir';
  porcentajeSugerido: number;
}

export async function analyzeMarketPrice(unitId: string): Promise<MarketAnalysis> {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      building: true,
      contracts: {
        where: { estado: 'activo' },
        orderBy: { fechaInicio: 'desc' },
        take: 1,
      },
    },
  });

  if (!unit) throw new Error('Unidad no encontrada');

  // Buscar unidades similares en la misma zona
  const unidadesSimilares = await prisma.unit.findMany({
    where: {
      building: {
        ciudad: unit.building?.ciudad,
        codigoPostal: unit.building?.codigoPostal,
      },
      tipo: unit.tipo,
      superficie: {
        gte: (unit.superficie || 0) * 0.8,
        lte: (unit.superficie || 0) * 1.2,
      },
      contracts: {
        some: {
          estado: 'activo',
        },
      },
    },
    include: {
      contracts: {
        where: { estado: 'activo' },
        orderBy: { fechaInicio: 'desc' },
        take: 1,
      },
    },
    take: 20,
  });

  const rentas = unidadesSimilares
    .map((u) => u.contracts[0]?.renta)
    .filter((r): r is number => r !== null && r !== undefined);

  if (rentas.length === 0) {
    // No hay datos suficientes, devolver análisis conservador
    const rentaActual = unit.contracts[0]?.renta || 0;
    return {
      rentaPromedio: rentaActual,
      rentaMinima: rentaActual * 0.9,
      rentaMaxima: rentaActual * 1.1,
      desviacion: 0,
      recomendacion: 'mantener',
      porcentajeSugerido: 0,
    };
  }

  const rentaPromedio = rentas.reduce((sum, r) => sum + r, 0) / rentas.length;
  const rentaMinima = Math.min(...rentas);
  const rentaMaxima = Math.max(...rentas);

  // Calcular desviación estándar
  const varianza = rentas.reduce((sum, r) => sum + Math.pow(r - rentaPromedio, 2), 0) / rentas.length;
  const desviacion = Math.sqrt(varianza);

  const rentaActual = unit.contracts[0]?.renta || 0;
  const diferencia = ((rentaPromedio - rentaActual) / rentaActual) * 100;

  let recomendacion: 'aumentar' | 'mantener' | 'reducir';
  let porcentajeSugerido = 0;

  if (diferencia > 10) {
    recomendacion = 'aumentar';
    porcentajeSugerido = Math.min(diferencia, 15); // Máximo 15% de aumento
  } else if (diferencia < -10) {
    recomendacion = 'reducir';
    porcentajeSugerido = Math.max(diferencia, -10); // Máximo 10% de reducción
  } else {
    recomendacion = 'mantener';
    porcentajeSugerido = 0;
  }

  return {
    rentaPromedio,
    rentaMinima,
    rentaMaxima,
    desviacion,
    recomendacion,
    porcentajeSugerido,
  };
}

// ============================================
// PREDICCIÓN DE INTENCIÓN DE RENOVACIÓN
// ============================================

interface RenewalPrediction {
  probabilidad: number; // 0-100
  factoresPositivos: string[];
  factoresNegativos: string[];
  recomendaciones: string[];
}

export async function predictRenewalIntention(contractId: string): Promise<RenewalPrediction> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      tenant: true,
      payments: {
        orderBy: { fechaVencimiento: 'desc' },
        take: 12,
      },
      unit: {
        include: {
          maintenanceRequests: {
            where: {
              createdAt: {
                gte: addMonths(new Date(), -6),
              },
            },
          },
        },
      },
    },
  });

  if (!contract) throw new Error('Contrato no encontrado');

  const factoresPositivos: string[] = [];
  const factoresNegativos: string[] = [];
  let score = 50; // Base 50%

  // Factor 1: Historial de pagos
  const pagosPuntuales = contract.payments.filter(
    (p) => p.estado === 'pagado' && p.fechaPago && p.fechaPago <= p.fechaVencimiento
  ).length;
  const totalPagos = contract.payments.length;

  if (totalPagos > 0) {
    const tasaPuntualidad = (pagosPuntuales / totalPagos) * 100;
    if (tasaPuntualidad > 90) {
      score += 15;
      factoresPositivos.push(`Excelente historial de pagos (${tasaPuntualidad.toFixed(1)}% puntualidad)`);
    } else if (tasaPuntualidad < 70) {
      score -= 15;
      factoresNegativos.push(`Historial de pagos irregular (${tasaPuntualidad.toFixed(1)}% puntualidad)`);
    }
  }

  // Factor 2: Antigüedad en la propiedad
  const mesesEnPropiedad = differenceInMonths(new Date(), contract.fechaInicio);
  if (mesesEnPropiedad > 24) {
    score += 10;
    factoresPositivos.push(`Inquilino estable (${Math.floor(mesesEnPropiedad / 12)} años en la propiedad)`);
  } else if (mesesEnPropiedad < 12) {
    score -= 5;
    factoresNegativos.push('Inquilino reciente (menos de 1 año)');
  }

  // Factor 3: Incidencias de mantenimiento
  const incidencias = contract.unit?.maintenanceRequests || [];
  if (incidencias.length > 5) {
    score -= 10;
    factoresNegativos.push(`Alto número de incidencias (${incidencias.length} en 6 meses)`);
  } else if (incidencias.length === 0) {
    score += 5;
    factoresPositivos.push('Sin incidencias de mantenimiento recientes');
  }

  // Factor 4: Relación renta/mercado
  try {
    const marketAnalysis = await analyzeMarketPrice(contract.unitId);
    const rentaActual = contract.renta || 0;
    const diferenciaConMercado = ((marketAnalysis.rentaPromedio - rentaActual) / rentaActual) * 100;

    if (diferenciaConMercado > 15) {
      score -= 15;
      factoresNegativos.push(`Renta por debajo del mercado (+${diferenciaConMercado.toFixed(1)}% vs mercado)`);
    } else if (diferenciaConMercado < -10) {
      score += 10;
      factoresPositivos.push(`Renta competitiva (${Math.abs(diferenciaConMercado).toFixed(1)}% por debajo del mercado)`);
    } else {
      factoresPositivos.push('Renta ajustada al mercado');
    }
  } catch (error) {
    // Si falla el análisis de mercado, continuar sin este factor
  }

  // Factor 5: Tiempo hasta vencimiento
  const diasHastaVencimiento = differenceInDays(contract.fechaFin, new Date());
  if (diasHastaVencimiento < 60) {
    score -= 10;
    factoresNegativos.push('Próximo a vencimiento (menos de 2 meses)');
  }

  // Asegurar que el score esté entre 0 y 100
  score = Math.max(0, Math.min(100, score));

  // Generar recomendaciones
  const recomendaciones: string[] = [];
  if (score > 70) {
    recomendaciones.push('Iniciar contacto proactivo para renovación');
    recomendaciones.push('Considerar ofrecer condiciones actuales o con ajuste moderado');
  } else if (score > 50) {
    recomendaciones.push('Evaluar condiciones de renovación antes de contactar');
    recomendaciones.push('Preparar opciones de mejora si es necesario');
  } else {
    recomendaciones.push('Probabilidad baja de renovación - preparar plan de búsqueda de nuevo inquilino');
    recomendaciones.push('Evaluar si vale la pena ofrecer incentivos');
  }

  return {
    probabilidad: score,
    factoresPositivos,
    factoresNegativos,
    recomendaciones,
  };
}

// ============================================
// GESTIÓN DE RENOVACIONES
// ============================================

export async function createContractRenewal(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!contract) throw new Error('Contrato no encontrado');

  const rentaActual = contract.renta || 0;
  const year = contract.fechaFin.getFullYear();
  const ipcAplicado = calcularIPCAplicable(year);
  const ajusteIPC = (rentaActual * ipcAplicado) / 100;

  // Análisis de mercado
  let analisisMercado = 0;
  try {
    const marketAnalysis = await analyzeMarketPrice(contract.unitId);
    const diferencia = marketAnalysis.rentaPromedio - rentaActual;
    analisisMercado = (diferencia / rentaActual) * 100;
  } catch (error) {
    console.error('Error en análisis de mercado:', error);
  }

  const rentaPropuesta = calcularNuevaRenta(rentaActual, ipcAplicado);

  // Predicción de renovación
  let prediccion: RenewalPrediction | null = null;
  try {
    prediccion = await predictRenewalIntention(contractId);
  } catch (error) {
    console.error('Error en predicción:', error);
  }

  return await prisma.contractRenewal.create({
    data: {
      companyId: contract.unit?.building?.companyId || '',
      contractId,
      tipo: 'automatica',
      fechaVencimiento: contract.fechaFin,
      rentaActual,
      ipcAplicado,
      ajusteIPC,
      analisisMercado,
      rentaPropuesta,
      scoreProbabilidad: prediccion?.probabilidad || null,
      factoresPositivos: prediccion?.factoresPositivos || [],
      factoresNegativos: prediccion?.factoresNegativos || [],
    },
  });
}

export async function updateRenewalDecision(
  renewalId: string,
  data: {
    propietarioAcepta?: boolean;
    inquilinoAcepta?: boolean;
    rentaFinal?: number;
    motivoRechazo?: string;
    observaciones?: string;
  }
) {
  const renewal = await prisma.contractRenewal.findUnique({
    where: { id: renewalId },
  });

  if (!renewal) throw new Error('Renovación no encontrada');

  let nuevoEstado = renewal.estado;

  if (data.propietarioAcepta === true && data.inquilinoAcepta === true) {
    nuevoEstado = 'completada';
  } else if (data.propietarioAcepta === false || data.inquilinoAcepta === false) {
    nuevoEstado = 'rechazada';
  } else if (data.propietarioAcepta === true || data.inquilinoAcepta === true) {
    nuevoEstado = 'en_proceso';
  }

  return await prisma.contractRenewal.update({
    where: { id: renewalId },
    data: {
      ...data,
      estado: nuevoEstado,
    },
  });
}

export async function getContractRenewals(companyId: string, estado?: string) {
  return await prisma.contractRenewal.findMany({
    where: {
      companyId,
      ...(estado && { estado }),
    },
    include: {
      contract: {
        include: {
          tenant: {
            select: {
              nombre: true,
              apellidos: true,
              email: true,
            },
          },
          unit: {
            select: {
              numero: true,
              piso: true,
              building: {
                select: {
                  nombre: true,
                  direccion: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { fechaVencimiento: 'asc' },
  });
}

export async function checkUpcomingRenewals(companyId: string, diasAnticipacion: number = 90) {
  const fechaLimite = addMonths(new Date(), Math.floor(diasAnticipacion / 30));

  const contratos = await prisma.contract.findMany({
    where: {
      estado: 'activo',
      fechaFin: {
        lte: fechaLimite,
        gte: new Date(),
      },
      unit: {
        building: {
          companyId,
        },
      },
    },
    include: {
      tenant: true,
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  const renovaciones = [];

  for (const contrato of contratos) {
    // Verificar si ya existe una renovación para este contrato
    const renovacionExistente = await prisma.contractRenewal.findFirst({
      where: {
        contractId: contrato.id,
      },
    });

    if (!renovacionExistente) {
      const renewal = await createContractRenewal(contrato.id);
      renovaciones.push(renewal);
    }
  }

  return renovaciones;
}

// ============================================
// ESTADÍSTICAS Y REPORTES
// ============================================

export async function getRenewalStats(companyId: string) {
  const renovaciones = await prisma.contractRenewal.findMany({
    where: { companyId },
  });

  const total = renovaciones.length;
  const completadas = renovaciones.filter((r) => r.estado === 'completada').length;
  const rechazadas = renovaciones.filter((r) => r.estado === 'rechazada').length;
  const pendientes = renovaciones.filter((r) => r.estado === 'pendiente').length;
  const enProceso = renovaciones.filter((r) => r.estado === 'en_proceso').length;

  const tasaRenovacion = total > 0 ? (completadas / total) * 100 : 0;

  const ajusteIPCPromedio =
    renovaciones.length > 0
      ? renovaciones.reduce((sum, r) => sum + r.ajusteIPC, 0) / renovaciones.length
      : 0;

  return {
    total,
    completadas,
    rechazadas,
    pendientes,
    enProceso,
    tasaRenovacion,
    ajusteIPCPromedio,
  };
}
