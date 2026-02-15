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
 * Calcula el resumen de portfolio para una empresa.
 * Usa AssetAcquisition si existen, sino calcula KPIs directamente
 * de buildings/units/contracts/payments (datos operativos reales).
 */
export async function getCompanyPortfolio(companyId: string): Promise<PortfolioSummary> {
  const [assets, buildings, units, contracts, payments, expenses, mortgages] = await Promise.all([
    prisma.assetAcquisition.findMany({
      where: { companyId },
      include: { mortgages: true },
    }),
    prisma.building.findMany({
      where: { companyId, isDemo: false },
      include: { units: true },
    }),
    prisma.unit.findMany({
      where: { building: { companyId, isDemo: false } },
      include: {
        contracts: { where: { estado: 'activo' } },
      },
    }),
    prisma.contract.findMany({
      where: { unit: { building: { companyId, isDemo: false } }, estado: 'activo' },
      select: { rentaMensual: true },
    }),
    // Pagos del ultimo mes
    prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId, isDemo: false } } },
        estado: 'pagado',
        fechaPago: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Gastos del ultimo mes
    prisma.expense.findMany({
      where: {
        building: { companyId, isDemo: false },
        fecha: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.mortgage.findMany({
      where: { companyId, estado: 'activa' },
    }),
  ]);

  // Ingresos: usa pagos reales del ultimo mes, o renta contratada si no hay pagos
  const paymentsTotal = payments.reduce((sum, p) => sum + p.monto, 0);
  const contractedRent = contracts.reduce((sum, c) => sum + c.rentaMensual, 0);
  const totalMonthlyIncome = paymentsTotal > 0 ? paymentsTotal : contractedRent;

  // Gastos
  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.monto, 0);

  // Hipotecas
  const totalMortgageDebt = mortgages.reduce((sum, m) => sum + m.capitalPendiente, 0);
  const totalMortgagePayments = mortgages.reduce((sum, m) => sum + m.cuotaMensual, 0);

  // Inversion y valor: desde AssetAcquisition o estimacion
  let totalInvestment = assets.reduce((sum, a) => sum + (a.inversionTotal || a.precioCompra), 0);
  let totalMarketValue = assets.reduce((sum, a) => sum + (a.valorMercadoEstimado || a.precioCompra), 0);

  // Si no hay assets registrados, estimar valor como multiplo de renta anual
  // (PER 15 = multiplicador tipico mercado espanol residencial)
  if (totalInvestment === 0 && contractedRent > 0) {
    const estimatedByPER = contractedRent * 12 * 15;
    totalInvestment = estimatedByPER;
    totalMarketValue = estimatedByPER;
  }

  const totalEquity = totalMarketValue - totalMortgageDebt;
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
    totalAssets: assets.length > 0 ? assets.length : buildings.length,
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
// ASSET PERFORMANCE PER COMPANY
// ============================================================

/**
 * Calcula la rentabilidad de cada activo de una sociedad.
 * Usado por Vidaro (holding) para ver el detalle de Viroda y Rovida.
 */
export async function getCompanyAssetPerformance(companyId: string): Promise<AssetPerformance[]> {
  // Primero intentar desde AssetAcquisition (datos completos de inversion)
  const assets = await prisma.assetAcquisition.findMany({
    where: { companyId },
    include: {
      building: {
        select: {
          nombre: true,
          direccion: true,
          units: {
            select: {
              id: true,
              numero: true,
              rentaMensual: true,
              gastosComunidad: true,
              ibiAnual: true,
              contracts: {
                where: { estado: 'activo' },
                select: { id: true, rentaMensual: true },
              },
            },
          },
        },
      },
      unit: {
        select: {
          numero: true,
          rentaMensual: true,
          gastosComunidad: true,
          ibiAnual: true,
          contracts: {
            where: { estado: 'activo' },
            select: { id: true, rentaMensual: true },
          },
        },
      },
      mortgages: {
        where: { estado: 'activa' },
        select: { cuotaMensual: true, capitalPendiente: true },
      },
    },
  });

  const result = assets.map((asset) => {
    const totalInvestment = asset.inversionTotal || asset.precioCompra;
    const currentValue = asset.valorMercadoEstimado || asset.precioCompra;

    // Calcular renta mensual del activo
    let monthlyRent = 0;
    let totalUnits = 0;
    let occupiedUnits = 0;

    if (asset.building) {
      for (const unit of asset.building.units) {
        totalUnits++;
        if (unit.contracts.length > 0) {
          occupiedUnits++;
          monthlyRent += unit.contracts[0].rentaMensual;
        }
      }
    } else if (asset.unit) {
      totalUnits = 1;
      if (asset.unit.contracts.length > 0) {
        occupiedUnits = 1;
        monthlyRent = asset.unit.contracts[0].rentaMensual;
      }
    }

    // Gastos mensuales estimados
    const monthlyExpenses = asset.building
      ? asset.building.units.reduce((s, u) => s + (u.gastosComunidad || 0), 0) +
        (asset.building.units.reduce((s, u) => s + (u.ibiAnual || 0), 0) / 12)
      : (asset.unit?.gastosComunidad || 0) + ((asset.unit?.ibiAnual || 0) / 12);

    const mortgagePayment = asset.mortgages.reduce((s, m) => s + m.cuotaMensual, 0);
    const monthlyCashFlow = monthlyRent - monthlyExpenses - mortgagePayment;
    const annualRent = monthlyRent * 12;
    const annualExpenses = monthlyExpenses * 12;

    const grossYield = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;
    const noi = annualRent - annualExpenses;
    const netYield = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;

    // Cash-on-cash: cash-flow / capital propio (inversion - hipoteca)
    const mortgageDebt = asset.mortgages.reduce((s, m) => s + m.capitalPendiente, 0);
    const ownCapital = totalInvestment - mortgageDebt;
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCash = ownCapital > 0 ? (annualCashFlow / ownCapital) * 100 : 0;

    const capitalGain = currentValue - (totalInvestment - asset.amortizacionAcumulada);
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    return {
      assetId: asset.id,
      buildingName: asset.building?.nombre || 'Unidad individual',
      unitNumber: asset.unit?.numero,
      purchasePrice: asset.precioCompra,
      totalInvestment: Math.round(totalInvestment * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      monthlyRent: Math.round(monthlyRent * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      mortgagePayment: Math.round(mortgagePayment * 100) / 100,
      monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
      grossYield: Math.round(grossYield * 100) / 100,
      netYield: Math.round(netYield * 100) / 100,
      cashOnCash: Math.round(cashOnCash * 100) / 100,
      capitalGain: Math.round(capitalGain * 100) / 100,
      accumulatedDepreciation: asset.amortizacionAcumulada,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  });

  // Fallback: si no hay AssetAcquisitions, generar desde buildings reales
  if (result.length === 0) {
    const buildings = await prisma.building.findMany({
      where: { companyId, isDemo: false },
      include: {
        units: {
          include: {
            contracts: { where: { estado: 'activo' }, select: { rentaMensual: true } },
          },
        },
      },
    });

    return buildings.map((b) => {
      let monthlyRent = 0;
      let totalUnits = b.units.length;
      let occupiedUnits = 0;

      for (const u of b.units) {
        if (u.contracts.length > 0) {
          occupiedUnits++;
          monthlyRent += u.contracts[0].rentaMensual;
        }
      }

      const annualRent = monthlyRent * 12;
      const estimatedValue = annualRent > 0 ? annualRent * 15 : 0; // PER 15
      const monthlyExpenses = (b.gastosComunidad || 0) + ((b.ibiAnual || 0) / 12);
      const noi = annualRent - (monthlyExpenses * 12);
      const grossYield = estimatedValue > 0 ? (annualRent / estimatedValue) * 100 : 0;
      const netYield = estimatedValue > 0 ? (noi / estimatedValue) * 100 : 0;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      return {
        assetId: b.id,
        buildingName: b.nombre,
        unitNumber: undefined,
        purchasePrice: 0,
        totalInvestment: Math.round(estimatedValue * 100) / 100,
        currentValue: Math.round(estimatedValue * 100) / 100,
        monthlyRent: Math.round(monthlyRent * 100) / 100,
        monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
        mortgagePayment: 0,
        monthlyCashFlow: Math.round((monthlyRent - monthlyExpenses) * 100) / 100,
        grossYield: Math.round(grossYield * 100) / 100,
        netYield: Math.round(netYield * 100) / 100,
        cashOnCash: Math.round(grossYield * 100) / 100, // Sin hipoteca = mismo que gross
        capitalGain: 0,
        accumulatedDepreciation: 0,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      };
    });
  }

  return result;
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

    // Cargar activos con rentabilidad para la comparativa
    const companyAssets = await getCompanyAssetPerformance(companyId);

    companies.push({
      companyId: company.id,
      companyName: company.nombre,
      cif: company.cif || '',
      portfolio,
      assets: companyAssets,
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
