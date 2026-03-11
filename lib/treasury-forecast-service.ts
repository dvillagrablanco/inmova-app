// @ts-nocheck
/**
 * Treasury Forecast Service — Previsión de tesorería a 12 meses
 *
 * Calendario mensual con:
 * - Cobros esperados: alquileres por contrato
 * - Pagos comprometidos: hipotecas, IBI, comunidad, seguros
 * - Pagos fiscales: Modelo 202, 303
 * - Saldo proyectado acumulado
 *
 * Para sociedades patrimoniales (Vidaro/Viroda/Rovida)
 */

import logger from '@/lib/logger';

export interface TreasuryMonth {
  mes: number; // 1-12
  año: number;
  label: string; // "Mar 2026"
  // Cobros
  alquileresResidencial: number;
  alquileresComercial: number;
  otrosCobros: number;
  totalCobros: number;
  // Pagos
  hipotecas: number;
  ibi: number;
  comunidad: number;
  seguros: number;
  mantenimiento: number;
  gestionAdmin: number;
  otrosPagos: number;
  totalPagos: number;
  // Fiscal
  modelo202: number; // Pago fraccionado IS
  modelo303: number; // IVA trimestral
  modelo200: number; // Declaración anual IS (julio)
  totalFiscal: number;
  // Resultado
  flujoNeto: number; // totalCobros - totalPagos - totalFiscal
  saldoAcumulado: number; // Desde saldo inicial + flujos
}

export interface TreasuryForecast {
  companyId: string;
  companyName: string;
  saldoInicial: number;
  meses: TreasuryMonth[];
  resumen: {
    totalCobros12m: number;
    totalPagos12m: number;
    totalFiscal12m: number;
    flujoNeto12m: number;
    mesMinLiquidez: string;
    mesMaxLiquidez: string;
    saldoFinal: number;
  };
}

const MONTHS_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

/**
 * Genera previsión de tesorería a 12 meses para una empresa
 */
export async function generateTreasuryForecast(
  companyId: string,
  saldoInicial: number = 0
): Promise<TreasuryForecast> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true },
  });

  if (!company) throw new Error('Empresa no encontrada');

  const now = new Date();
  const meses: TreasuryMonth[] = [];

  // --- Datos base ---

  // Contratos activos → renta mensual esperada
  const contracts = await prisma.contract.findMany({
    where: {
      unit: { building: { companyId } },
      estado: 'activo',
    },
    select: { rentaMensual: true, fechaFin: true },
  });
  const rentaMensualTotal = contracts.reduce((s, c) => s + c.rentaMensual, 0);

  // Alquileres comerciales activos
  const commercialLeases = await prisma.commercialLease.findMany({
    where: {
      space: { building: { companyId } },
      estado: 'activo',
    },
    select: { rentaMensualBase: true, fechaFin: true },
  });
  const rentaComercialMensual = commercialLeases.reduce((s, l) => s + l.rentaMensualBase, 0);

  // Hipotecas activas
  const mortgages = await prisma.mortgage.findMany({
    where: { companyId, estado: 'activa' },
    select: { cuotaMensual: true, fechaVencimiento: true },
  });
  const cuotaHipotecaMensual = mortgages.reduce((s, m) => s + m.cuotaMensual, 0);

  // Gastos recurrentes (promedio últimos 6 meses)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const expenses = await prisma.expense.findMany({
    where: {
      building: { companyId },
      fecha: { gte: sixMonthsAgo },
    },
    select: { monto: true, categoria: true },
  });

  const gastoMensual = {
    ibi: 0,
    comunidad: 0,
    seguros: 0,
    mantenimiento: 0,
    gestion: 0,
    otros: 0,
  };

  for (const e of expenses) {
    const cat = String(e.categoria || '');
    switch (cat) {
      case 'impuestos':
        gastoMensual.ibi += e.monto;
        break;
      case 'comunidad':
        gastoMensual.comunidad += e.monto;
        break;
      case 'seguros':
        gastoMensual.seguros += e.monto;
        break;
      case 'mantenimiento':
      case 'reparaciones':
        gastoMensual.mantenimiento += e.monto;
        break;
      case 'servicios':
        gastoMensual.gestion += e.monto;
        break;
      default:
        gastoMensual.otros += e.monto;
    }
  }

  // Convertir a mensual (dividir entre 6)
  for (const key of Object.keys(gastoMensual) as (keyof typeof gastoMensual)[]) {
    gastoMensual[key] = Math.round((gastoMensual[key] / 6) * 100) / 100;
  }

  // Fiscal: último IS calculado para estimar pagos fraccionados
  const { calculateFiscalSummary } = await import('@/lib/investment-service');
  let cuotaIS = 0;
  try {
    const fiscal = await calculateFiscalSummary(companyId, now.getFullYear() - 1);
    cuotaIS = fiscal.cuotaIS;
  } catch {
    /* sin datos fiscales previos */
  }

  const pagoFraccionado = Math.round(cuotaIS * 0.18 * 100) / 100;

  // --- Generar 12 meses ---
  let saldoAcumulado = saldoInicial;

  for (let i = 0; i < 12; i++) {
    const fecha = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const mes = fecha.getMonth() + 1; // 1-12
    const año = fecha.getFullYear();

    // Cobros
    const alqResidencial = rentaMensualTotal;
    const alqComercial = rentaComercialMensual;
    const totalCobros = alqResidencial + alqComercial;

    // Pagos fijos
    const hipotecas = cuotaHipotecaMensual;
    const ibi = gastoMensual.ibi;
    const comunidad = gastoMensual.comunidad;
    const seguros = gastoMensual.seguros;
    const mantenimiento = gastoMensual.mantenimiento;
    const gestionAdmin = gastoMensual.gestion;
    const otrosPagos = gastoMensual.otros;
    const totalPagos =
      hipotecas + ibi + comunidad + seguros + mantenimiento + gestionAdmin + otrosPagos;

    // Fiscal
    // Modelo 202: abril (mes 4), octubre (10), diciembre (12)
    const modelo202 = [4, 10, 12].includes(mes) ? pagoFraccionado : 0;
    // Modelo 303: abril, julio, octubre, enero
    const ivaComercial = rentaComercialMensual * 3 * 0.21; // IVA trimestral
    const modelo303 = [1, 4, 7, 10].includes(mes) ? ivaComercial : 0;
    // Modelo 200: julio
    const modelo200 = mes === 7 ? Math.max(0, cuotaIS - pagoFraccionado * 3) : 0;
    const totalFiscal = modelo202 + modelo303 + modelo200;

    const flujoNeto = Math.round((totalCobros - totalPagos - totalFiscal) * 100) / 100;
    saldoAcumulado = Math.round((saldoAcumulado + flujoNeto) * 100) / 100;

    meses.push({
      mes,
      año,
      label: `${MONTHS_ES[mes - 1]} ${año}`,
      alquileresResidencial: Math.round(alqResidencial * 100) / 100,
      alquileresComercial: Math.round(alqComercial * 100) / 100,
      otrosCobros: 0,
      totalCobros: Math.round(totalCobros * 100) / 100,
      hipotecas: Math.round(hipotecas * 100) / 100,
      ibi: Math.round(ibi * 100) / 100,
      comunidad: Math.round(comunidad * 100) / 100,
      seguros: Math.round(seguros * 100) / 100,
      mantenimiento: Math.round(mantenimiento * 100) / 100,
      gestionAdmin: Math.round(gestionAdmin * 100) / 100,
      otrosPagos: Math.round(otrosPagos * 100) / 100,
      totalPagos: Math.round(totalPagos * 100) / 100,
      modelo202: Math.round(modelo202 * 100) / 100,
      modelo303: Math.round(modelo303 * 100) / 100,
      modelo200: Math.round(modelo200 * 100) / 100,
      totalFiscal: Math.round(totalFiscal * 100) / 100,
      flujoNeto,
      saldoAcumulado,
    });
  }

  const totalCobros12m = meses.reduce((s, m) => s + m.totalCobros, 0);
  const totalPagos12m = meses.reduce((s, m) => s + m.totalPagos, 0);
  const totalFiscal12m = meses.reduce((s, m) => s + m.totalFiscal, 0);

  const minLiquidez = meses.reduce(
    (min, m) => (m.saldoAcumulado < min.saldoAcumulado ? m : min),
    meses[0]
  );
  const maxLiquidez = meses.reduce(
    (max, m) => (m.saldoAcumulado > max.saldoAcumulado ? m : max),
    meses[0]
  );

  return {
    companyId,
    companyName: company.nombre,
    saldoInicial,
    meses,
    resumen: {
      totalCobros12m: Math.round(totalCobros12m * 100) / 100,
      totalPagos12m: Math.round(totalPagos12m * 100) / 100,
      totalFiscal12m: Math.round(totalFiscal12m * 100) / 100,
      flujoNeto12m: Math.round((totalCobros12m - totalPagos12m - totalFiscal12m) * 100) / 100,
      mesMinLiquidez: minLiquidez.label,
      mesMaxLiquidez: maxLiquidez.label,
      saldoFinal: meses[meses.length - 1].saldoAcumulado,
    },
  };
}
