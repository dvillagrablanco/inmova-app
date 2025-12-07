/**
 * Servicio de Tesorería Avanzada - Versión Simplificada
 */
import { prisma } from '@/lib/db';
import { TreasuryForecast, DefaultProvision, TreasuryAlert, FinancialAlert } from '@prisma/client';
import { addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Tipos básicos para evitar conflictos con Prisma
export interface CashFlowForecastParams {
  companyId: string;
  mesesAdelante?: number;
}

export interface DepositManagementParams {
  contractId: string;
  monto: number;
  cuentaDeposito: string;
  numeroRegistro?: string;
}

export interface BadDebtProvisionParams {
  companyId: string;
}

export interface GenerateFinancialAlertsParams {
  companyId: string;
}

// Funciones simplificadas que evitan conflictos con el schema
export async function generateCashFlowForecast(params: CashFlowForecastParams) {
  const meses = params.mesesAdelante || 6;
  const forecasts: TreasuryForecast[] = [];

  for (let i = 0; i < meses; i++) {
    const mes = addMonths(new Date(), i);
    const mesStr = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`;

    // Valores simulados (en producción se calcularían de verdad)
    const ingresos = 5000 + Math.random() * 2000;
    const gastos = 3000 + Math.random() * 1500;

    const forecast = await prisma.cashFlowForecast.create({
      data: {
        companyId: params.companyId,
        mes: mesStr,
        ingresosPrevistos: ingresos,
        ingresosRecurrentes: ingresos * 0.8,
        ingresosVariables: ingresos * 0.2,
        gastosPrevistos: gastos,
        gastosRecurrentes: gastos * 0.7,
        gastosVariables: gastos * 0.3,
        saldoFinal: ingresos - gastos,
      },
    });

    forecasts.push(forecast);
  }

  return forecasts;
}

export async function registerDeposit(params: DepositManagementParams) {
  const contrato = await prisma.contract.findUnique({
    where: { id: params.contractId },
    include: {
      tenant: true,
    },
  });

  if (!contrato) throw new Error('Contrato no encontrado');

  return await prisma.depositManagement.create({
    data: {
      contractId: params.contractId,
      companyId: contrato.tenant.companyId,
      importeFianza: params.monto,
      tipoFianza: 'legal',
      depositadoOficialmente: true,
      entidadDeposito: params.cuentaDeposito,
      numeroDeposito: params.numeroRegistro,
      fechaDeposito: new Date(),
    },
  });
}

export async function returnDeposit(depositId: string, importeDevuelto: number, deducciones: any[]) {
  const deduccionesTotal = deducciones.reduce((sum, d) => sum + d.monto, 0);

  return await prisma.depositManagement.update({
    where: { id: depositId },
    data: {
      devuelto: true,
      fechaDevolucion: new Date(),
      importeDevuelto,
      deducciones: deduccionesTotal,
      motivoDeducciones: deducciones.map(d => d.motivo).join('; '),
    },
  });
}

export async function calculateBadDebtProvisions(params: BadDebtProvisionParams) {
  // Get tenants for this company
  const tenants = await prisma.tenant.findMany({
    where: {
      companyId: params.companyId,
    },
  });

  const tenantIds = tenants.map(t => t.id);

  // Get contracts for these tenants
  const contracts = await prisma.contract.findMany({
    where: {
      tenantId: {
        in: tenantIds,
      },
    },
    include: {
      payments: {
        where: {
          estado: 'pendiente',
        },
      },
      tenant: true,
    },
  });

  const provisions: DefaultProvision[] = [];

  for (const contract of contracts) {
    for (const pago of contract.payments) {
      const diasVencido = Math.floor(
        (new Date().getTime() - pago.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasVencido <= 0) continue;

      let porcentajeProvisionValue = 0;
      let categoriaRiesgoValue: 'bajo' | 'medio' | 'alto' | 'critico' = 'bajo';

      if (diasVencido <= 30) {
        porcentajeProvisionValue = 10;
        categoriaRiesgoValue = 'bajo';
      } else if (diasVencido <= 60) {
        porcentajeProvisionValue = 25;
        categoriaRiesgoValue = 'medio';
      } else if (diasVencido <= 90) {
        porcentajeProvisionValue = 50;
        categoriaRiesgoValue = 'alto';
      } else {
        porcentajeProvisionValue = 100;
        categoriaRiesgoValue = 'critico';
      }

      const montoProvision = pago.monto * (porcentajeProvisionValue / 100);

      const provision = await prisma.badDebtProvision.upsert({
        where: { paymentId: pago.id },
        create: {
          paymentId: pago.id,
          companyId: params.companyId,
          montoOriginal: pago.monto,
          diasRetraso: diasVencido,
          porcentajeProvision: porcentajeProvisionValue,
          montoProvision,
          categoriaRiesgo: categoriaRiesgoValue,
        },
        update: {
          diasRetraso: diasVencido,
          porcentajeProvision: porcentajeProvisionValue,
          montoProvision,
          categoriaRiesgo: categoriaRiesgoValue,
        },
      });

      provisions.push(provision);
    }
  }

  return provisions;
}

export async function generateFinancialAlerts(params: GenerateFinancialAlertsParams) {
  const alerts: FinancialAlert[] = [];

  // Get tenants for this company
  const tenants = await prisma.tenant.findMany({
    where: {
      companyId: params.companyId,
    },
  });

  const tenantIds = tenants.map(t => t.id);

  // Alerta 1: Pagos vencidos
  const contracts = await prisma.contract.findMany({
    where: {
      tenantId: {
        in: tenantIds,
      },
    },
    include: {
      payments: {
        where: {
          estado: 'pendiente',
          fechaVencimiento: { lte: subMonths(new Date(), 1) },
        },
      },
    },
  });

  const pagosVencidos = contracts.reduce((count, c) => count + c.payments.length, 0);

  if (pagosVencidos > 0) {
    const severidad = pagosVencidos > 5 ? 'alto' : 'medio';
    alerts.push(await prisma.financialAlert.create({
      data: {
        companyId: params.companyId,
        tipo: 'morosidad',
        severidad,
        titulo: `${pagosVencidos} pagos vencidos hace más de 30 días`,
        descripcion: `Hay ${pagosVencidos} pagos pendientes con más de 30 días de retraso.`,
        fechaDeteccion: new Date(),
        estado: 'pendiente',
      },
    }));
  }

  // Alerta 2: Cash flow negativo proyectado
  const cashFlowProximo = await prisma.cashFlowForecast.findFirst({
    where: {
      companyId: params.companyId,
      saldoFinal: { lt: 0 },
    },
    orderBy: { mes: 'asc' },
  });

  if (cashFlowProximo) {
    alerts.push(await prisma.financialAlert.create({
      data: {
        companyId: params.companyId,
        tipo: 'cashflow',
        severidad: 'alto',
        titulo: `Cash flow negativo proyectado en ${cashFlowProximo.mes}`,
        descripcion: `Se proyecta un déficit de €${Math.abs(cashFlowProximo.saldoFinal).toFixed(2)}`,
        fechaDeteccion: new Date(),
        estado: 'pendiente',
      },
    }));
  }

  return alerts;
}
