import { PrismaClient, RiskLevel, PaymentStatus } from '@prisma/client';
import { addMonths, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

// ============================================
// PREVISIÓN DE CASH FLOW
// ============================================

export async function generateCashFlowForecast(companyId: string, buildingId?: string, meses: number = 6) {
  const forecasts = [];
  const hoy = new Date();

  for (let i = 0; i < meses; i++) {
    const mes = addMonths(hoy, i);
    const mesStr = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`;

    // Calcular ingresos previstos
    const contratos = await prisma.contract.findMany({
      where: {
        ...(buildingId && {
          unit: {
            buildingId,
          },
        }),
        estado: 'activo',
      },
      include: {
        unit: true,
      },
    });

    const ingresosRecurrentes = contratos.reduce((sum, c) => sum + (c.renta || 0), 0);

    // Calcular cuotas de comunidad esperadas
    const cuotasEsperadas = await prisma.communityFee.findMany({
      where: {
        companyId,
        ...(buildingId && { buildingId }),
        periodo: mesStr,
      },
    });

    const ingresosVariables = cuotasEsperadas.reduce((sum, c) => sum + c.importeTotal, 0);
    const ingresosPrevistos = ingresosRecurrentes + ingresosVariables;

    // Calcular gastos previstos
    const gastosMantenimiento = await prisma.maintenanceRequest.count({
      where: {
        ...(buildingId && { buildingId }),
        estado: 'pendiente',
      },
    });

    // Estimación de gastos (simplificado)
    const gastosRecurrentes = contratos.length * 50; // Gasto base por unidad
    const gastosVariables = gastosMantenimiento * 200; // Estimación por mantenimiento
    const gastosPrevistos = gastosRecurrentes + gastosVariables;

    const saldoFinal = ingresosPrevistos - gastosPrevistos;

    // Escenarios optimista y pesimista
    const escenarioOptimista = saldoFinal * 1.15;
    const escenarioPesimista = saldoFinal * 0.85;

    // Verificar si ya existe el forecast para este mes
    const existente = await prisma.cashFlowForecast.findUnique({
      where: {
        companyId_buildingId_mes: {
          companyId,
          buildingId: buildingId || null,
          mes: mesStr,
        },
      },
    });

    if (existente) {
      const updated = await prisma.cashFlowForecast.update({
        where: { id: existente.id },
        data: {
          ingresosPrevistos,
          ingresosRecurrentes,
          ingresosVariables,
          gastosPrevistos,
          gastosRecurrentes,
          gastosVariables,
          saldoFinal,
          escenarioOptimista,
          escenarioPesimista,
          calculadoEn: new Date(),
        },
      });
      forecasts.push(updated);
    } else {
      const nuevo = await prisma.cashFlowForecast.create({
        data: {
          companyId,
          buildingId: buildingId || null,
          mes: mesStr,
          ingresosPrevistos,
          ingresosRecurrentes,
          ingresosVariables,
          gastosPrevistos,
          gastosRecurrentes,
          gastosVariables,
          saldoFinal,
          escenarioOptimista,
          escenarioPesimista,
        },
      });
      forecasts.push(nuevo);
    }
  }

  return forecasts;
}

export async function getCashFlowForecasts(companyId: string, buildingId?: string) {
  return await prisma.cashFlowForecast.findMany({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
    },
    orderBy: { mes: 'asc' },
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });
}

// ============================================
// GESTIÓN DE FIANZAS
// ============================================

export async function createDepositManagement(data: {
  companyId: string;
  contractId: string;
  importeFianza: number;
  tipoFianza: string;
  depositadoOficialmente?: boolean;
  entidadDeposito?: string;
  numeroDeposito?: string;
  fechaDeposito?: Date;
}) {
  return await prisma.depositManagement.create({
    data,
  });
}

export async function markDepositAsOfficial(depositId: string, data: {
  entidadDeposito: string;
  numeroDeposito: string;
  fechaDeposito: Date;
}) {
  return await prisma.depositManagement.update({
    where: { id: depositId },
    data: {
      depositadoOficialmente: true,
      ...data,
    },
  });
}

export async function processDepositReturn(depositId: string, data: {
  importeDevuelto: number;
  deducciones?: number;
  motivoDeducciones?: string;
}) {
  return await prisma.depositManagement.update({
    where: { id: depositId },
    data: {
      devuelto: true,
      importeDevuelto: data.importeDevuelto,
      deducciones: data.deducciones || 0,
      motivoDeducciones: data.motivoDeducciones,
      fechaDevolucion: new Date(),
    },
  });
}

export async function getDepositManagements(companyId: string, filters?: {
  depositadoOficialmente?: boolean;
  devuelto?: boolean;
}) {
  return await prisma.depositManagement.findMany({
    where: {
      companyId,
      ...(filters?.depositadoOficialmente !== undefined && {
        depositadoOficialmente: filters.depositadoOficialmente,
      }),
      ...(filters?.devuelto !== undefined && { devuelto: filters.devuelto }),
    },
    include: {
      contract: {
        include: {
          tenant: {
            select: {
              nombre: true,
              apellidos: true,
            },
          },
          unit: {
            select: {
              numero: true,
              piso: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// PROVISIÓN AUTOMÁTICA DE IMPAGOS
// ============================================

function calcularProvisionPorAntigüedad(diasRetraso: number): {
  porcentaje: number;
  riesgo: RiskLevel;
} {
  if (diasRetraso < 30) {
    return { porcentaje: 0, riesgo: RiskLevel.bajo };
  } else if (diasRetraso < 90) {
    return { porcentaje: 25, riesgo: RiskLevel.medio };
  } else if (diasRetraso < 180) {
    return { porcentaje: 50, riesgo: RiskLevel.alto };
  } else {
    return { porcentaje: 100, riesgo: RiskLevel.critico };
  }
}

export async function createOrUpdateBadDebtProvision(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      contract: {
        include: {
          unit: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  if (!payment || payment.estado !== PaymentStatus.atrasado) {
    return null;
  }

  const diasRetraso = differenceInDays(new Date(), payment.fechaVencimiento);
  const { porcentaje, riesgo } = calcularProvisionPorAntigüedad(diasRetraso);
  const montoProvision = (payment.monto * porcentaje) / 100;

  // Verificar si ya existe una provisión para este pago
  const existente = await prisma.badDebtProvision.findUnique({
    where: { paymentId },
  });

  if (existente) {
    return await prisma.badDebtProvision.update({
      where: { id: existente.id },
      data: {
        diasRetraso,
        categoriaRiesgo: riesgo,
        porcentajeProvision: porcentaje,
        montoProvision,
      },
    });
  } else {
    return await prisma.badDebtProvision.create({
      data: {
        companyId: payment.contract?.unit?.building?.companyId || '',
        paymentId,
        montoOriginal: payment.monto,
        diasRetraso,
        categoriaRiesgo: riesgo,
        porcentajeProvision: porcentaje,
        montoProvision,
      },
    });
  }
}

export async function markProvisionAsRecovered(provisionId: string, montoRecuperado: number) {
  return await prisma.badDebtProvision.update({
    where: { id: provisionId },
    data: {
      recuperado: true,
      montoRecuperado,
      fechaRecuperacion: new Date(),
    },
  });
}

export async function getBadDebtProvisions(companyId: string, categoriaRiesgo?: RiskLevel) {
  return await prisma.badDebtProvision.findMany({
    where: {
      companyId,
      ...(categoriaRiesgo && { categoriaRiesgo }),
    },
    include: {
      payment: {
        include: {
          contract: {
            include: {
              tenant: {
                select: {
                  nombre: true,
                  apellidos: true,
                },
              },
              unit: {
                select: {
                  numero: true,
                  piso: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { diasRetraso: 'desc' },
  });
}

export async function updateAllProvisions(companyId: string) {
  // Obtener todos los pagos atrasados
  const pagosAtrasados = await prisma.payment.findMany({
    where: {
      estado: PaymentStatus.atrasado,
      contract: {
        unit: {
          building: {
            companyId,
          },
        },
      },
    },
  });

  const provisiones = [];
  for (const pago of pagosAtrasados) {
    const provision = await createOrUpdateBadDebtProvision(pago.id);
    if (provision) provisiones.push(provision);
  }

  return provisiones;
}

// ============================================
// ALERTAS FINANCIERAS
// ============================================

export async function createFinancialAlert(data: {
  companyId: string;
  buildingId?: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  severidad: RiskLevel;
  monto?: number;
  metadata?: any;
}) {
  return await prisma.financialAlert.create({
    data: {
      ...data,
      metadata: data.metadata || {},
    },
  });
}

export async function resolveFinancialAlert(alertId: string, data: {
  responsable: string;
  accionTomada: string;
}) {
  return await prisma.financialAlert.update({
    where: { id: alertId },
    data: {
      estado: 'resuelto',
      fechaResolucion: new Date(),
      ...data,
    },
  });
}

export async function getFinancialAlerts(companyId: string, filters?: {
  tipo?: string;
  estado?: string;
  severidad?: RiskLevel;
}) {
  return await prisma.financialAlert.findMany({
    where: {
      companyId,
      ...(filters?.tipo && { tipo: filters.tipo }),
      ...(filters?.estado && { estado: filters.estado }),
      ...(filters?.severidad && { severidad: filters.severidad }),
    },
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    orderBy: { fechaDeteccion: 'desc' },
  });
}

export async function detectFinancialIssues(companyId: string) {
  const alerts = [];

  // Detectar descuadres contables (ejemplo simplificado)
  const cashFlows = await prisma.cashFlowForecast.findMany({
    where: { companyId },
    orderBy: { mes: 'desc' },
    take: 3,
  });

  for (const cf of cashFlows) {
    if (cf.saldoFinal < 0) {
      const alert = await createFinancialAlert({
        companyId,
        buildingId: cf.buildingId || undefined,
        tipo: 'cash_flow',
        titulo: 'Previsión de saldo negativo',
        descripcion: `Se prevé un saldo negativo de ${cf.saldoFinal.toFixed(2)}€ para ${cf.mes}`,
        severidad: cf.saldoFinal < -5000 ? RiskLevel.alto : RiskLevel.medio,
        monto: Math.abs(cf.saldoFinal),
      });
      alerts.push(alert);
    }
  }

  // Detectar impagos críticos
  const provisionesCriticas = await prisma.badDebtProvision.findMany({
    where: {
      companyId,
      categoriaRiesgo: RiskLevel.critico,
      recuperado: false,
    },
  });

  if (provisionesCriticas.length > 0) {
    const totalImpagos = provisionesCriticas.reduce((sum, p) => sum + p.montoProvision, 0);
    const alert = await createFinancialAlert({
      companyId,
      tipo: 'impago',
      titulo: 'Impagos críticos detectados',
      descripcion: `Se han detectado ${provisionesCriticas.length} impagos críticos por un total de ${totalImpagos.toFixed(2)}€`,
      severidad: RiskLevel.critico,
      monto: totalImpagos,
    });
    alerts.push(alert);
  }

  return alerts;
}
