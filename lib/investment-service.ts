/**
 * Investment Service - Servicio para sociedades inversoras/patrimoniales
 *
 * Calcula rentabilidad, cash-flow, amortizaciones y metricas fiscales
 * para grupos de sociedades tipo Viroda/Rovida/Vidaro.
 */

import { prisma } from './db';
import logger from './logger';

// ============================================================
// TIPOS
// ============================================================

export interface PortfolioSummary {
  totalAssets: number;
  totalInvestment: number;
  totalMarketValue: number;
  totalMortgageDebt: number;
  totalEquity: number; // marketValue - mortgageDebt
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMortgagePayments: number;
  monthlyCashFlow: number;
  grossYield: number; // %
  netYield: number; // %
  averageOccupancy: number; // %
  ltv: number; // Loan-to-Value %
}

export interface AssetPerformance {
  assetId: string;
  buildingName: string;
  unitNumber?: string;
  purchasePrice: number;
  totalInvestment: number;
  currentValue: number;
  monthlyRent: number;
  monthlyExpenses: number;
  mortgagePayment: number;
  monthlyCashFlow: number;
  grossYield: number;
  netYield: number;
  cashOnCash: number;
  capitalGain: number; // valorMercado - valorContable
  accumulatedDepreciation: number;
  occupancyRate: number;
}

export interface ConsolidatedReport {
  companies: CompanySummary[];
  consolidated: PortfolioSummary;
  period: { year: number; month?: number };
}

export interface CompanySummary {
  companyId: string;
  companyName: string;
  cif: string;
  portfolio: PortfolioSummary;
  assets: AssetPerformance[];
}

export interface FiscalSummary {
  companyId: string;
  companyName: string;
  year: number;
  ingresosBrutos: number;
  gastosDeducibles: number;
  amortizaciones: number;
  interesesHipoteca: number;
  baseImponible: number;
  cuotaIS: number; // 25%
  tipoEfectivo: number; // %
  pagosFraccionados: { trimestre: number; importe: number }[];
}

// ============================================================
// PORTFOLIO SUMMARY
// ============================================================

/**
 * Calcula el resumen de portfolio para una empresa
 */
export async function getCompanyPortfolio(companyId: string): Promise<PortfolioSummary> {
  const [assets, buildings, units, payments, expenses, mortgages] = await Promise.all([
    prisma.assetAcquisition.findMany({
      where: { companyId },
      include: { mortgages: true },
    }),
    prisma.building.findMany({
      where: { companyId },
      include: { units: { include: { contracts: { where: { estado: 'activo' } } } } },
    }),
    prisma.unit.findMany({
      where: { building: { companyId } },
      include: {
        contracts: { where: { estado: 'activo' } },
        building: { select: { companyId: true } },
      },
    }),
    // Pagos del ultimo mes
    prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId } } },
        estado: 'pagado',
        fechaPago: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Gastos del ultimo mes
    prisma.expense.findMany({
      where: {
        building: { companyId },
        fecha: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.mortgage.findMany({
      where: { companyId, estado: 'activa' },
    }),
  ]);

  const totalInvestment = assets.reduce((sum, a) => sum + (a.inversionTotal || a.precioCompra), 0);
  const totalMarketValue = assets.reduce((sum, a) => sum + (a.valorMercadoEstimado || a.precioCompra), 0);
  const totalMortgageDebt = mortgages.reduce((sum, m) => sum + m.capitalPendiente, 0);
  const totalEquity = totalMarketValue - totalMortgageDebt;

  const totalMonthlyIncome = payments.reduce((sum, p) => sum + p.monto, 0);
  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.monto, 0);
  const totalMortgagePayments = mortgages.reduce((sum, m) => sum + m.cuotaMensual, 0);
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses - totalMortgagePayments;

  const annualIncome = totalMonthlyIncome * 12;
  const annualExpenses = totalMonthlyExpenses * 12;
  const grossYield = totalInvestment > 0 ? (annualIncome / totalInvestment) * 100 : 0;
  const netYield = totalInvestment > 0 ? ((annualIncome - annualExpenses) / totalInvestment) * 100 : 0;

  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.contracts.length > 0).length;
  const averageOccupancy = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  const ltv = totalMarketValue > 0 ? (totalMortgageDebt / totalMarketValue) * 100 : 0;

  return {
    totalAssets: assets.length,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    totalMarketValue: Math.round(totalMarketValue * 100) / 100,
    totalMortgageDebt: Math.round(totalMortgageDebt * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
    totalMonthlyExpenses: Math.round(totalMonthlyExpenses * 100) / 100,
    totalMortgagePayments: Math.round(totalMortgagePayments * 100) / 100,
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    averageOccupancy: Math.round(averageOccupancy * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
  };
}

// ============================================================
// CONSOLIDATED MULTI-SOCIETY REPORT
// ============================================================

/**
 * Dashboard consolidado para grupo de sociedades
 * Agrega datos de empresa matriz + todas sus filiales
 */
export async function getConsolidatedReport(parentCompanyId: string): Promise<ConsolidatedReport> {
  // Obtener empresa matriz + filiales
  const parentCompany = await prisma.company.findUnique({
    where: { id: parentCompanyId },
    include: { childCompanies: true },
  });

  if (!parentCompany) {
    throw new Error('Company not found');
  }

  const allCompanyIds = [parentCompany.id, ...parentCompany.childCompanies.map(c => c.id)];
  const companies: CompanySummary[] = [];

  for (const companyId of allCompanyIds) {
    const company = companyId === parentCompany.id
      ? parentCompany
      : parentCompany.childCompanies.find(c => c.id === companyId);

    if (!company) continue;

    const portfolio = await getCompanyPortfolio(companyId);

    companies.push({
      companyId: company.id,
      companyName: company.nombre,
      cif: company.cif || '',
      portfolio,
      assets: [], // Se populan bajo demanda
    });
  }

  // Consolidar
  const consolidated: PortfolioSummary = {
    totalAssets: companies.reduce((s, c) => s + c.portfolio.totalAssets, 0),
    totalInvestment: companies.reduce((s, c) => s + c.portfolio.totalInvestment, 0),
    totalMarketValue: companies.reduce((s, c) => s + c.portfolio.totalMarketValue, 0),
    totalMortgageDebt: companies.reduce((s, c) => s + c.portfolio.totalMortgageDebt, 0),
    totalEquity: companies.reduce((s, c) => s + c.portfolio.totalEquity, 0),
    totalMonthlyIncome: companies.reduce((s, c) => s + c.portfolio.totalMonthlyIncome, 0),
    totalMonthlyExpenses: companies.reduce((s, c) => s + c.portfolio.totalMonthlyExpenses, 0),
    totalMortgagePayments: companies.reduce((s, c) => s + c.portfolio.totalMortgagePayments, 0),
    monthlyCashFlow: companies.reduce((s, c) => s + c.portfolio.monthlyCashFlow, 0),
    grossYield: 0,
    netYield: 0,
    averageOccupancy: 0,
    ltv: 0,
  };

  // Recalcular ratios consolidados
  const totalAnnualIncome = consolidated.totalMonthlyIncome * 12;
  const totalAnnualExpenses = consolidated.totalMonthlyExpenses * 12;
  consolidated.grossYield = consolidated.totalInvestment > 0
    ? Math.round((totalAnnualIncome / consolidated.totalInvestment) * 10000) / 100
    : 0;
  consolidated.netYield = consolidated.totalInvestment > 0
    ? Math.round(((totalAnnualIncome - totalAnnualExpenses) / consolidated.totalInvestment) * 10000) / 100
    : 0;
  consolidated.averageOccupancy = companies.length > 0
    ? Math.round(companies.reduce((s, c) => s + c.portfolio.averageOccupancy, 0) / companies.length * 100) / 100
    : 0;
  consolidated.ltv = consolidated.totalMarketValue > 0
    ? Math.round((consolidated.totalMortgageDebt / consolidated.totalMarketValue) * 10000) / 100
    : 0;

  return {
    companies,
    consolidated,
    period: { year: new Date().getFullYear() },
  };
}

// ============================================================
// FISCAL CALCULATOR FOR IS (Impuesto de Sociedades)
// ============================================================

/**
 * Calcula el resumen fiscal para IS de una sociedad patrimonial
 */
export async function calculateFiscalSummary(
  companyId: string,
  year: number
): Promise<FiscalSummary> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true, cif: true },
  });

  // Ingresos: pagos recibidos en el ano
  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId } } },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
  });
  const ingresosBrutos = payments.reduce((s, p) => s + p.monto, 0);

  // Gastos deducibles
  const expenses = await prisma.expense.findMany({
    where: {
      building: { companyId },
      fecha: { gte: startDate, lte: endDate },
    },
  });
  const gastosDeducibles = expenses.reduce((s, e) => s + e.monto, 0);

  // Amortizaciones del ano
  const depreciations = await prisma.depreciationEntry.findMany({
    where: {
      asset: { companyId },
      ano: year,
    },
  });
  const amortizaciones = depreciations.reduce((s, d) => s + d.cuotaAnual, 0);

  // Intereses de hipoteca del ano (gasto deducible adicional)
  const mortgagePayments = await prisma.mortgagePayment.findMany({
    where: {
      mortgage: { companyId },
      fecha: { gte: startDate, lte: endDate },
      pagado: true,
    },
  });
  const interesesHipoteca = mortgagePayments.reduce((s, mp) => s + mp.intereses, 0);

  // Base imponible IS
  const baseImponible = Math.max(0,
    ingresosBrutos - gastosDeducibles - amortizaciones - interesesHipoteca
  );

  // Cuota IS al 25%
  const TIPO_IS = 25;
  const cuotaIS = Math.round(baseImponible * TIPO_IS / 100 * 100) / 100;
  const tipoEfectivo = ingresosBrutos > 0
    ? Math.round((cuotaIS / ingresosBrutos) * 10000) / 100
    : 0;

  // Pagos fraccionados (modelo 202): 3 pagos al ano
  // Cada pago = 18% del ultimo IS pagado (simplificado)
  const pagoFraccionado = Math.round(cuotaIS * 0.18 * 100) / 100;
  const pagosFraccionados = [
    { trimestre: 1, importe: pagoFraccionado }, // Abril
    { trimestre: 2, importe: pagoFraccionado }, // Octubre
    { trimestre: 3, importe: pagoFraccionado }, // Diciembre
  ];

  return {
    companyId,
    companyName: company?.nombre || '',
    year,
    ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
    gastosDeducibles: Math.round(gastosDeducibles * 100) / 100,
    amortizaciones: Math.round(amortizaciones * 100) / 100,
    interesesHipoteca: Math.round(interesesHipoteca * 100) / 100,
    baseImponible: Math.round(baseImponible * 100) / 100,
    cuotaIS,
    tipoEfectivo,
    pagosFraccionados,
  };
}

// ============================================================
// DEPRECIATION CALCULATOR
// ============================================================

/**
 * Genera o actualiza la tabla de amortizacion de un activo
 * Inmuebles se amortizan al 3% sobre valor de construccion
 */
export async function generateDepreciationTable(assetId: string): Promise<void> {
  const asset = await prisma.assetAcquisition.findUnique({
    where: { id: assetId },
  });

  if (!asset) throw new Error('Asset not found');

  // Base amortizable: valor construccion (catastral) + reformas capitalizables
  // Si no hay desglose catastral, usar 50% del precio de compra como construccion
  const valorConstruccion = asset.valorCatastralConstruccion
    || (asset.precioCompra * 0.5);
  const baseAmortizable = valorConstruccion + asset.reformasCapitalizadas;

  const PORCENTAJE_AMORTIZACION = 3; // 3% anual para inmuebles
  const cuotaAnual = Math.round(baseAmortizable * PORCENTAJE_AMORTIZACION / 100 * 100) / 100;

  const anoInicio = asset.fechaAdquisicion.getFullYear();
  const anoActual = new Date().getFullYear();
  const anosMax = Math.ceil(100 / PORCENTAJE_AMORTIZACION); // ~33 anos
  const anoFin = Math.min(anoActual, anoInicio + anosMax);

  let acumulada = 0;
  for (let ano = anoInicio; ano <= anoFin; ano++) {
    acumulada += cuotaAnual;
    // No amortizar mas del 100%
    if (acumulada > baseAmortizable) {
      acumulada = baseAmortizable;
    }

    await prisma.depreciationEntry.upsert({
      where: { assetId_ano: { assetId, ano } },
      update: {
        baseAmortizable,
        porcentaje: PORCENTAJE_AMORTIZACION,
        cuotaAnual: acumulada <= baseAmortizable ? cuotaAnual : 0,
        amortizacionAcumulada: acumulada,
      },
      create: {
        assetId,
        ano,
        baseAmortizable,
        porcentaje: PORCENTAJE_AMORTIZACION,
        cuotaAnual: acumulada <= baseAmortizable ? cuotaAnual : 0,
        amortizacionAcumulada: acumulada,
      },
    });
  }

  // Actualizar amortizacion acumulada en el asset
  await prisma.assetAcquisition.update({
    where: { id: assetId },
    data: {
      amortizacionAcumulada: acumulada,
      valorContableNeto: (asset.inversionTotal || asset.precioCompra) - acumulada,
      plusvaliaLatente: asset.valorMercadoEstimado
        ? asset.valorMercadoEstimado - ((asset.inversionTotal || asset.precioCompra) - acumulada)
        : null,
    },
  });

  logger.info(`[Depreciation] Generated table for asset ${assetId}: ${anoInicio}-${anoFin}`);
}
