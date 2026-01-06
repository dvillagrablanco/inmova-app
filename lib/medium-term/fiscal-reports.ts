/**
 * SERVICIO DE REPORTES FISCALES
 * 
 * Generación de informes para declaración de impuestos y contabilidad
 */

import { prisma } from '../db';
import { 
  startOfYear, 
  endOfYear, 
  startOfQuarter, 
  endOfQuarter,
  format,
  eachMonthOfInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// TIPOS
// ==========================================

export interface FiscalReport {
  period: {
    type: 'annual' | 'quarterly' | 'monthly';
    year: number;
    quarter?: number;
    month?: number;
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    taxableBase: number;
    estimatedTax: number;
    effectiveTaxRate: number;
  };
  incomeBreakdown: IncomeItem[];
  expenseBreakdown: ExpenseItem[];
  propertyDetails: PropertyFiscalData[];
  deposits: DepositSummary;
  deductions: Deduction[];
  documents: FiscalDocument[];
}

export interface IncomeItem {
  category: string;
  description: string;
  amount: number;
  taxable: boolean;
  propertyId?: string;
  propertyAddress?: string;
}

export interface ExpenseItem {
  category: string;
  description: string;
  amount: number;
  deductible: boolean;
  deductiblePercent: number;
  propertyId?: string;
  propertyAddress?: string;
}

export interface PropertyFiscalData {
  propertyId: string;
  address: string;
  cadastralRef?: string;
  cadastralValue?: number;
  income: number;
  expenses: number;
  netIncome: number;
  occupancyDays: number;
  emptyDays: number;
  contracts: number;
}

export interface DepositSummary {
  depositsReceived: number;
  depositsReturned: number;
  depositsRetained: number;
  pendingDeposits: number;
}

export interface Deduction {
  type: string;
  description: string;
  amount: number;
  percentage: number;
  applicable: boolean;
  documentation?: string;
}

export interface FiscalDocument {
  type: string;
  name: string;
  url?: string;
  generated: boolean;
  required: boolean;
}

export interface TaxModel {
  model: string;
  name: string;
  deadline: Date;
  status: 'pending' | 'prepared' | 'submitted';
  amount?: number;
}

// ==========================================
// TASAS IMPOSITIVAS
// ==========================================

const IRPF_BRACKETS_2024 = [
  { min: 0, max: 12450, rate: 19 },
  { min: 12450, max: 20200, rate: 24 },
  { min: 20200, max: 35200, rate: 30 },
  { min: 35200, max: 60000, rate: 37 },
  { min: 60000, max: 300000, rate: 45 },
  { min: 300000, max: Infinity, rate: 47 },
];

const IVA_ARRENDAMIENTO = 0; // Exento para vivienda
const RETENCIÓN_ARRENDAMIENTO = 19; // % si es a empresa

const GASTOS_DEDUCIBLES = {
  intereses_hipoteca: { deducible: true, max: 100 },
  ibe_seguros: { deducible: true, max: 100 },
  comunidad: { deducible: true, max: 100 },
  mantenimiento: { deducible: true, max: 100 },
  suministros: { deducible: true, max: 100 },
  amortizacion: { deducible: true, max: 3 }, // 3% del valor catastral
  gestion: { deducible: true, max: 100 },
  abogados_procuradores: { deducible: true, max: 100 },
  publicidad: { deducible: true, max: 100 },
};

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Genera reporte fiscal anual
 */
export async function generateAnnualReport(
  companyId: string,
  year: number
): Promise<FiscalReport> {
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(new Date(year, 0, 1));

  return generateFiscalReport(companyId, {
    type: 'annual',
    year,
    startDate,
    endDate,
  });
}

/**
 * Genera reporte fiscal trimestral
 */
export async function generateQuarterlyReport(
  companyId: string,
  year: number,
  quarter: 1 | 2 | 3 | 4
): Promise<FiscalReport> {
  const quarterDate = new Date(year, (quarter - 1) * 3, 1);
  const startDate = startOfQuarter(quarterDate);
  const endDate = endOfQuarter(quarterDate);

  return generateFiscalReport(companyId, {
    type: 'quarterly',
    year,
    quarter,
    startDate,
    endDate,
  });
}

/**
 * Genera reporte fiscal genérico
 */
async function generateFiscalReport(
  companyId: string,
  period: FiscalReport['period']
): Promise<FiscalReport> {
  // Obtener contratos de media estancia del período
  const contracts = await prisma.contract.findMany({
    where: {
      companyId,
      tipoArrendamiento: 'temporada',
      OR: [
        { fechaInicio: { lte: period.endDate, gte: period.startDate } },
        { fechaFin: { lte: period.endDate, gte: period.startDate } },
        { fechaInicio: { lte: period.startDate }, fechaFin: { gte: period.endDate } },
      ],
    },
    include: {
      unit: { include: { building: true } },
      payments: true,
      tenant: true,
    },
  });

  // Calcular ingresos
  const incomeBreakdown: IncomeItem[] = [];
  let totalIncome = 0;

  for (const contract of contracts) {
    const contractPayments = contract.payments.filter(p =>
      p.status === 'pagado' &&
      new Date(p.fecha) >= period.startDate &&
      new Date(p.fecha) <= period.endDate &&
      p.type !== 'deposito'
    );

    const rentIncome = contractPayments
      .filter(p => p.type === 'renta' || p.type === 'mensualidad')
      .reduce((sum, p) => sum + p.amount, 0);

    if (rentIncome > 0) {
      incomeBreakdown.push({
        category: 'Rentas de alquiler temporal',
        description: `${contract.unit.direccion} - ${contract.tenant.nombre}`,
        amount: rentIncome,
        taxable: true,
        propertyId: contract.unit.id,
        propertyAddress: contract.unit.direccion || '',
      });
      totalIncome += rentIncome;
    }

    // Otros ingresos (servicios, limpieza, etc.)
    const otherIncome = contractPayments
      .filter(p => p.type !== 'renta' && p.type !== 'mensualidad')
      .reduce((sum, p) => sum + p.amount, 0);

    if (otherIncome > 0) {
      incomeBreakdown.push({
        category: 'Servicios adicionales',
        description: `Servicios - ${contract.unit.direccion}`,
        amount: otherIncome,
        taxable: true,
        propertyId: contract.unit.id,
        propertyAddress: contract.unit.direccion || '',
      });
      totalIncome += otherIncome;
    }
  }

  // Calcular gastos
  const expenses = await prisma.expense.findMany({
    where: {
      companyId,
      fecha: { gte: period.startDate, lte: period.endDate },
    },
    include: {
      unit: true,
    },
  });

  const expenseBreakdown: ExpenseItem[] = [];
  let totalExpenses = 0;
  let totalDeductible = 0;

  for (const expense of expenses) {
    const deductibleConfig = GASTOS_DEDUCIBLES[expense.category as keyof typeof GASTOS_DEDUCIBLES];
    const isDeductible = deductibleConfig?.deducible || false;
    const deductiblePercent = isDeductible ? (deductibleConfig?.max || 0) : 0;

    expenseBreakdown.push({
      category: expense.category,
      description: expense.description || expense.category,
      amount: expense.amount,
      deductible: isDeductible,
      deductiblePercent,
      propertyId: expense.unitId || undefined,
      propertyAddress: expense.unit?.direccion || undefined,
    });

    totalExpenses += expense.amount;
    if (isDeductible) {
      totalDeductible += expense.amount * (deductiblePercent / 100);
    }
  }

  // Calcular amortización de inmuebles
  const units = await prisma.unit.findMany({
    where: { building: { companyId } },
    include: { building: true },
  });

  for (const unit of units) {
    const cadastralValue = unit.valorCatastral || 0;
    const amortization = cadastralValue * 0.03; // 3% anual

    if (amortization > 0 && period.type === 'annual') {
      expenseBreakdown.push({
        category: 'Amortización',
        description: `Amortización inmueble ${unit.direccion}`,
        amount: amortization,
        deductible: true,
        deductiblePercent: 100,
        propertyId: unit.id,
        propertyAddress: unit.direccion || undefined,
      });
      totalExpenses += amortization;
      totalDeductible += amortization;
    }
  }

  // Datos por propiedad
  const propertyDetails: PropertyFiscalData[] = [];

  for (const unit of units) {
    const unitContracts = contracts.filter(c => c.unitId === unit.id);
    const unitIncome = incomeBreakdown
      .filter(i => i.propertyId === unit.id)
      .reduce((sum, i) => sum + i.amount, 0);
    const unitExpenses = expenseBreakdown
      .filter(e => e.propertyId === unit.id)
      .reduce((sum, e) => sum + e.amount, 0);

    // Calcular días ocupados
    let occupancyDays = 0;
    for (const contract of unitContracts) {
      const start = contract.fechaInicio > period.startDate ? contract.fechaInicio : period.startDate;
      const end = contract.fechaFin < period.endDate ? contract.fechaFin : period.endDate;
      occupancyDays += Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const periodDays = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));

    propertyDetails.push({
      propertyId: unit.id,
      address: `${unit.direccion}, ${unit.building?.city}`,
      cadastralRef: unit.referenciaCatastral || undefined,
      cadastralValue: unit.valorCatastral || undefined,
      income: unitIncome,
      expenses: unitExpenses,
      netIncome: unitIncome - unitExpenses,
      occupancyDays,
      emptyDays: periodDays - occupancyDays,
      contracts: unitContracts.length,
    });
  }

  // Resumen de depósitos
  const depositsReceived = contracts
    .flatMap(c => c.payments)
    .filter(p => p.type === 'deposito' && p.status === 'pagado' && new Date(p.fecha) >= period.startDate)
    .reduce((sum, p) => sum + p.amount, 0);

  const depositsReturned = contracts
    .flatMap(c => c.payments)
    .filter(p => p.type === 'devolucion_deposito' && new Date(p.fecha) >= period.startDate)
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  // Calcular base imponible y estimación de impuestos
  const netIncome = totalIncome - totalDeductible;
  const taxableBase = Math.max(0, netIncome);
  const estimatedTax = calculateIRPF(taxableBase);
  const effectiveTaxRate = taxableBase > 0 ? (estimatedTax / taxableBase) * 100 : 0;

  // Deducciones aplicables
  const deductions: Deduction[] = [
    {
      type: 'reduccion_60',
      description: 'Reducción 60% rendimiento neto vivienda habitual',
      amount: netIncome * 0.6,
      percentage: 60,
      applicable: false, // No aplica a media estancia
      documentation: 'No aplicable a arrendamiento por temporada (Art. 3.2 LAU)',
    },
    {
      type: 'gastos_deducibles',
      description: 'Gastos deducibles computados',
      amount: totalDeductible,
      percentage: (totalDeductible / totalExpenses) * 100,
      applicable: true,
    },
  ];

  // Documentos fiscales a generar
  const documents: FiscalDocument[] = [
    {
      type: 'modelo_100',
      name: 'Modelo 100 - Declaración IRPF',
      generated: false,
      required: period.type === 'annual',
    },
    {
      type: 'modelo_115',
      name: 'Modelo 115 - Retenciones alquiler',
      generated: false,
      required: contracts.some(c => c.tenant.esSociedadJuridica),
    },
    {
      type: 'resumen_ingresos',
      name: 'Resumen de ingresos por alquiler',
      generated: true,
      required: true,
    },
    {
      type: 'resumen_gastos',
      name: 'Resumen de gastos deducibles',
      generated: true,
      required: true,
    },
    {
      type: 'certificado_fianzas',
      name: 'Certificado de fianzas depositadas',
      generated: false,
      required: true,
    },
  ];

  return {
    period,
    summary: {
      totalIncome,
      totalExpenses,
      netIncome,
      taxableBase,
      estimatedTax,
      effectiveTaxRate,
    },
    incomeBreakdown,
    expenseBreakdown,
    propertyDetails,
    deposits: {
      depositsReceived,
      depositsReturned,
      depositsRetained: 0, // TODO: Calcular
      pendingDeposits: depositsReceived - depositsReturned,
    },
    deductions,
    documents,
  };
}

/**
 * Calcula IRPF según tramos
 */
function calculateIRPF(taxableBase: number): number {
  let tax = 0;
  let remaining = taxableBase;

  for (const bracket of IRPF_BRACKETS_2024) {
    if (remaining <= 0) break;

    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    tax += taxableInBracket * (bracket.rate / 100);
    remaining -= taxableInBracket;
  }

  return Math.round(tax * 100) / 100;
}

/**
 * Obtiene modelos fiscales pendientes
 */
export async function getPendingTaxModels(
  companyId: string,
  year: number
): Promise<TaxModel[]> {
  const models: TaxModel[] = [];
  const now = new Date();

  // Modelo 100 - Anual
  models.push({
    model: '100',
    name: 'Declaración de la Renta',
    deadline: new Date(year + 1, 5, 30), // 30 junio siguiente
    status: now > new Date(year + 1, 5, 30) ? 'submitted' : 'pending',
  });

  // Modelo 115 - Trimestral (si hay retenciones)
  for (let q = 1; q <= 4; q++) {
    const month = q * 3; // Abril, Julio, Octubre, Enero
    const deadlineYear = q === 4 ? year + 1 : year;
    const deadlineMonth = q === 4 ? 0 : month;

    models.push({
      model: '115',
      name: `Retenciones T${q}`,
      deadline: new Date(deadlineYear, deadlineMonth, 20),
      status: 'pending',
    });
  }

  // Modelo 180 - Resumen anual retenciones
  models.push({
    model: '180',
    name: 'Resumen anual retenciones alquiler',
    deadline: new Date(year + 1, 0, 31),
    status: 'pending',
  });

  return models.filter(m => m.deadline >= now);
}

/**
 * Exporta datos para importar en programa de contabilidad
 */
export async function exportToAccountingSoftware(
  companyId: string,
  year: number,
  format: 'csv' | 'excel' | 'a3' | 'sage'
): Promise<{ filename: string; content: string | Buffer }> {
  const report = await generateAnnualReport(companyId, year);

  if (format === 'csv') {
    // Generar CSV
    const lines: string[] = [
      'Tipo,Fecha,Concepto,Importe,Deducible,Propiedad',
    ];

    for (const income of report.incomeBreakdown) {
      lines.push(`Ingreso,${format(new Date(), 'yyyy-MM-dd')},${income.description},${income.amount},N/A,${income.propertyAddress || ''}`);
    }

    for (const expense of report.expenseBreakdown) {
      lines.push(`Gasto,${format(new Date(), 'yyyy-MM-dd')},${expense.description},${expense.amount},${expense.deductible ? 'Sí' : 'No'},${expense.propertyAddress || ''}`);
    }

    return {
      filename: `informe_fiscal_${year}.csv`,
      content: lines.join('\n'),
    };
  }

  // TODO: Implementar otros formatos
  return {
    filename: `informe_fiscal_${year}.csv`,
    content: 'Formato no implementado',
  };
}

/**
 * Genera informe de fianzas depositadas
 */
export async function generateDepositReport(
  companyId: string,
  year: number
): Promise<{
  totalDeposited: number;
  byProperty: { address: string; amount: number; agency: string }[];
  pendingDeposits: { contractId: string; tenantName: string; amount: number; dueDate: Date }[];
}> {
  const contracts = await prisma.contract.findMany({
    where: {
      companyId,
      tipoArrendamiento: 'temporada',
      fechaInicio: {
        gte: startOfYear(new Date(year, 0, 1)),
        lte: endOfYear(new Date(year, 0, 1)),
      },
    },
    include: {
      unit: { include: { building: true } },
      tenant: true,
    },
  });

  const byProperty: { address: string; amount: number; agency: string }[] = [];
  const pendingDeposits: { contractId: string; tenantName: string; amount: number; dueDate: Date }[] = [];
  let totalDeposited = 0;

  for (const contract of contracts) {
    const address = `${contract.unit.direccion}, ${contract.unit.building?.city}`;
    const amount = contract.deposito;

    // Verificar si está depositada en organismo
    if (contract.fianzaDepositada) {
      const existing = byProperty.find(p => p.address === address);
      if (existing) {
        existing.amount += amount;
      } else {
        byProperty.push({
          address,
          amount,
          agency: contract.unit.building?.province === 'Madrid' ? 'IVIMA' : 
                  contract.unit.building?.province === 'Barcelona' ? 'INCASOL' : 'Organismo autonómico',
        });
      }
      totalDeposited += amount;
    } else {
      // Pendiente de depositar
      pendingDeposits.push({
        contractId: contract.id,
        tenantName: contract.tenant.nombre,
        amount,
        dueDate: new Date(contract.fechaInicio.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 días
      });
    }
  }

  return {
    totalDeposited,
    byProperty,
    pendingDeposits,
  };
}

export default {
  generateAnnualReport,
  generateQuarterlyReport,
  getPendingTaxModels,
  exportToAccountingSoftware,
  generateDepositReport,
  IRPF_BRACKETS_2024,
  GASTOS_DEDUCIBLES,
};
