// @ts-nocheck
/**
 * SISTEMA DE SUGERENCIAS INTELIGENTES DE GESTIÓN
 *
 * Motor de análisis que recorre datos de empresa/grupo, detecta patrones,
 * anomalías y oportunidades, y genera sugerencias accionables.
 *
 * 4 áreas: Inmobiliario, Financiero, Operacional, Fiscal
 */

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

interface SuggestionInput {
  companyId: string;
  area: 'inmobiliario' | 'financiero' | 'operacional' | 'fiscal';
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  codigo: string;
  titulo: string;
  descripcion: string;
  accion?: string;
  enlace?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  targetRole?: string;
}

async function createSuggestion(input: SuggestionInput) {
  // Avoid duplicates: check if same codigo+entityId exists and is pending
  const existing = await prisma.smartSuggestion.findFirst({
    where: {
      companyId: input.companyId,
      codigo: input.codigo,
      entityId: input.entityId || undefined,
      estado: 'pendiente',
    },
  });
  if (existing) return null;

  return prisma.smartSuggestion.create({ data: input });
}

// ═══════════════════════════════════════════════════════════════
// 🏠 INMOBILIARIO
// ═══════════════════════════════════════════════════════════════

async function analyzeInmobiliario(companyIds: string[]) {
  const suggestions: SuggestionInput[] = [];

  // 1. Contratos próximos a vencer sin renovación
  const in30days = new Date();
  in30days.setDate(in30days.getDate() + 30);
  const in60days = new Date();
  in60days.setDate(in60days.getDate() + 60);

  const expiringContracts = await prisma.contract.findMany({
    where: {
      unit: { building: { companyId: { in: companyIds } } },
      estado: 'activo',
      fechaFin: { lte: in60days, gte: new Date() },
      renovacionAutomatica: false,
    },
    include: { unit: { include: { building: true } }, tenant: true },
  });

  for (const c of expiringContracts) {
    const daysLeft = Math.ceil(
      (new Date(c.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    suggestions.push({
      companyId: c.unit.building.companyId,
      area: 'inmobiliario',
      prioridad: daysLeft <= 7 ? 'critica' : daysLeft <= 30 ? 'alta' : 'media',
      codigo: 'CONTRACT_EXPIRING',
      titulo: `Contrato vence en ${daysLeft} días`,
      descripcion: `El contrato de ${c.tenant?.nombre || 'inquilino'} en ${c.unit.building.nombre} - ${c.unit.numero} vence el ${new Date(c.fechaFin).toLocaleDateString('es-ES')}. Renta: €${c.rentaMensual}/mes.`,
      accion: 'Iniciar renovación o buscar nuevo inquilino',
      enlace: `/dashboard/contracts`,
      entityType: 'contract',
      entityId: c.id,
      metadata: { daysLeft, rentaMensual: c.rentaMensual, tenant: c.tenant?.nombre },
      targetRole: 'gestor',
    });
  }

  // 2. Unidades vacías > 30 días
  const vacantUnits = await prisma.unit.findMany({
    where: {
      building: { companyId: { in: companyIds } },
      estado: 'disponible',
      contracts: { none: { estado: 'activo' } },
    },
    include: { building: true },
  });

  for (const u of vacantUnits) {
    suggestions.push({
      companyId: u.building.companyId,
      area: 'inmobiliario',
      prioridad: 'media',
      codigo: 'UNIT_VACANT',
      titulo: `Unidad vacía: ${u.building.nombre} - ${u.numero}`,
      descripcion: `La unidad ${u.numero} en ${u.building.nombre} está disponible sin contrato activo. Renta objetivo: €${u.rentaMensual}/mes.`,
      accion: 'Revisar precio o publicar en portales',
      enlace: `/dashboard/properties`,
      entityType: 'unit',
      entityId: u.id,
      metadata: { rentaMensual: u.rentaMensual, building: u.building.nombre },
      targetRole: 'gestor',
    });
  }

  // 3. Fianzas no depositadas
  const fianzasPendientes = await prisma.fianzaDeposit.findMany({
    where: {
      companyId: { in: companyIds },
      estado: 'pendiente_deposito',
    },
    include: { contract: { include: { unit: { include: { building: true } } } } },
  });

  for (const f of fianzasPendientes) {
    suggestions.push({
      companyId: f.companyId,
      area: 'inmobiliario',
      prioridad: 'alta',
      codigo: 'FIANZA_NOT_DEPOSITED',
      titulo: `Fianza sin depositar: €${f.importeFianza}`,
      descripcion: `La fianza de €${f.importeFianza} no ha sido depositada en el organismo autonómico. Inmueble: ${f.contract?.unit?.building?.nombre || 'N/A'}.`,
      accion: 'Depositar fianza en IVIMA/organismo correspondiente',
      enlace: '/inversiones/fianzas',
      entityType: 'fianza',
      entityId: f.id,
      metadata: { importe: f.importeFianza },
      targetRole: 'administrador',
    });
  }

  return suggestions;
}

// ═══════════════════════════════════════════════════════════════
// 💰 FINANCIERO
// ═══════════════════════════════════════════════════════════════

async function analyzeFinanciero(companyIds: string[]) {
  const suggestions: SuggestionInput[] = [];

  // 1. Fondos PE con TVPI < 0.8
  const lowPE = await prisma.participation.findMany({
    where: {
      companyId: { in: companyIds },
      tipo: 'pe_fund',
      activa: true,
      tvpi: { lt: 0.8, not: null },
    },
  });

  for (const p of lowPE) {
    suggestions.push({
      companyId: p.companyId,
      area: 'financiero',
      prioridad: 'alta',
      codigo: 'PE_TVPI_LOW',
      titulo: `PE con TVPI bajo: ${p.targetCompanyName}`,
      descripcion: `El fondo ${p.targetCompanyName} tiene un TVPI de ${p.tvpi?.toFixed(2)}x (por debajo de 0.8x). Compromiso: €${p.compromisoTotal?.toLocaleString('es-ES')}.`,
      accion: 'Revisar con gestora y evaluar provisión',
      enlace: '/family-office/pe',
      entityType: 'participation',
      entityId: p.id,
      metadata: { tvpi: p.tvpi, compromiso: p.compromisoTotal },
      targetRole: 'administrador',
    });
  }

  // 2. Capital calls pendientes (desembolsos pendientes altos)
  const pendingCalls = await prisma.participation.findMany({
    where: {
      companyId: { in: companyIds },
      tipo: 'pe_fund',
      activa: true,
      capitalPendiente: { gt: 100000 },
    },
  });

  const totalPending = pendingCalls.reduce((s, p) => s + (p.capitalPendiente || 0), 0);
  if (totalPending > 500000) {
    suggestions.push({
      companyId: companyIds[0],
      area: 'financiero',
      prioridad: 'media',
      codigo: 'PE_CAPITAL_CALLS_HIGH',
      titulo: `Capital calls pendientes: €${(totalPending / 1000000).toFixed(1)}M`,
      descripcion: `Hay ${pendingCalls.length} fondos PE con desembolsos pendientes totales de €${totalPending.toLocaleString('es-ES')}. Asegurar liquidez disponible.`,
      accion: 'Revisar previsión de tesorería',
      enlace: '/family-office/pe',
      metadata: { totalPending, funds: pendingCalls.length },
      targetRole: 'administrador',
    });
  }

  // 3. Cuentas con saldo excesivo sin invertir (>500K en cuenta corriente)
  const highBalanceAccounts = await prisma.financialAccount.findMany({
    where: {
      companyId: { in: companyIds },
      activa: true,
      saldoActual: { gt: 500000 },
      tipoEntidad: 'banca_comercial',
    },
  });

  for (const a of highBalanceAccounts) {
    suggestions.push({
      companyId: a.companyId,
      area: 'financiero',
      prioridad: 'baja',
      codigo: 'HIGH_CASH_BALANCE',
      titulo: `Saldo elevado sin invertir: ${a.entidad}`,
      descripcion: `La cuenta ${a.alias || a.entidad} tiene €${a.saldoActual.toLocaleString('es-ES')} en saldo. Considerar mover a productos de mayor rentabilidad.`,
      accion: 'Consultar con asesor financiero',
      enlace: '/family-office/cuentas',
      entityType: 'account',
      entityId: a.id,
      metadata: { saldo: a.saldoActual, entidad: a.entidad },
      targetRole: 'administrador',
    });
  }

  return suggestions;
}

// ═══════════════════════════════════════════════════════════════
// 📊 OPERACIONAL
// ═══════════════════════════════════════════════════════════════

async function analyzeOperacional(companyIds: string[]) {
  const suggestions: SuggestionInput[] = [];

  // 1. Gastos de comunidad crecientes
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  for (const cid of companyIds) {
    const currentIBI = await prisma.expense.aggregate({
      where: { building: { companyId: cid }, ejercicio: currentYear, categoria: 'ibi' },
      _sum: { monto: true },
    });
    const prevIBI = await prisma.expense.aggregate({
      where: { building: { companyId: cid }, ejercicio: prevYear, categoria: 'ibi' },
      _sum: { monto: true },
    });

    const curr = currentIBI._sum.monto || 0;
    const prev = prevIBI._sum.monto || 0;

    if (prev > 0 && curr > prev * 1.1) {
      const pctIncrease = (((curr - prev) / prev) * 100).toFixed(1);
      suggestions.push({
        companyId: cid,
        area: 'operacional',
        prioridad: 'media',
        codigo: 'IBI_INCREASE',
        titulo: `IBI incrementado ${pctIncrease}% vs año anterior`,
        descripcion: `El IBI total ha pasado de €${prev.toLocaleString('es-ES')} a €${curr.toLocaleString('es-ES')} (+${pctIncrease}%).`,
        accion: 'Verificar si hay revalorización catastral o error',
        enlace: '/finanzas/cuadro-de-mandos',
        metadata: { current: curr, previous: prev, pctIncrease },
        targetRole: 'administrador',
      });
    }
  }

  return suggestions;
}

// ═══════════════════════════════════════════════════════════════
// 📋 FISCAL
// ═══════════════════════════════════════════════════════════════

async function analyzeFiscal(companyIds: string[]) {
  const suggestions: SuggestionInput[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;

  // Plazos de modelos tributarios
  const deadlines: Array<{ model: string; month: number; day: number; desc: string }> = [
    { model: '202', month: 4, day: 20, desc: 'Pago fraccionado IS (1P)' },
    { model: '303', month: 4, day: 20, desc: 'IVA trimestral (1T)' },
    { model: '202', month: 10, day: 20, desc: 'Pago fraccionado IS (2P)' },
    { model: '303', month: 10, day: 20, desc: 'IVA trimestral (3T)' },
    { model: '202', month: 12, day: 20, desc: 'Pago fraccionado IS (3P)' },
    { model: '200', month: 7, day: 25, desc: 'Impuesto Sociedades anual' },
    { model: '347', month: 2, day: 28, desc: 'Operaciones >3.005,06€' },
    { model: '720', month: 3, day: 31, desc: 'Bienes en el extranjero' },
  ];

  for (const d of deadlines) {
    const deadline = new Date(now.getFullYear(), d.month - 1, d.day);
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 0 && daysUntil <= 30) {
      for (const cid of companyIds) {
        suggestions.push({
          companyId: cid,
          area: 'fiscal',
          prioridad: daysUntil <= 7 ? 'critica' : 'alta',
          codigo: `TAX_DEADLINE_${d.model}`,
          titulo: `Modelo ${d.model} vence en ${daysUntil} días`,
          descripcion: `${d.desc}. Fecha límite: ${deadline.toLocaleDateString('es-ES')}.`,
          accion: `Preparar y presentar modelo ${d.model}`,
          enlace: '/inversiones/fiscal/modelos',
          metadata: { modelo: d.model, deadline: deadline.toISOString(), daysUntil },
          targetRole: 'administrador',
        });
      }
    }
  }

  // Modelo 720: cuentas extranjeras sin declarar
  const foreignAccounts = await prisma.financialAccount.findMany({
    where: {
      companyId: { in: companyIds },
      activa: true,
      numeroCuenta: { not: { startsWith: 'ES' } },
      saldoActual: { gt: 50000 },
    },
  });

  if (foreignAccounts.length > 0 && month <= 3) {
    suggestions.push({
      companyId: companyIds[0],
      area: 'fiscal',
      prioridad: 'alta',
      codigo: 'MODELO_720_REQUIRED',
      titulo: `Modelo 720: ${foreignAccounts.length} cuentas extranjeras >50K€`,
      descripcion: `Hay ${foreignAccounts.length} cuentas en el extranjero con saldo superior a 50.000€. Obligación de declarar antes del 31 de marzo.`,
      accion: 'Preparar declaración Modelo 720',
      enlace: '/inversiones/modelo-720',
      metadata: { accounts: foreignAccounts.length },
      targetRole: 'administrador',
    });
  }

  return suggestions;
}

// ═══════════════════════════════════════════════════════════════
// MOTOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function runSmartAnalysis(companyId: string): Promise<{
  created: number;
  skipped: number;
  areas: Record<string, number>;
}> {
  // Get holding + children
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, childCompanies: { select: { id: true } } },
  });

  const allIds = company
    ? [company.id, ...company.childCompanies.map((c: { id: string }) => c.id)]
    : [companyId];

  logger.info(`[SmartSuggestions] Analyzing ${allIds.length} companies`);

  const allSuggestions: SuggestionInput[] = [
    ...(await analyzeInmobiliario(allIds)),
    ...(await analyzeFinanciero(allIds)),
    ...(await analyzeOperacional(allIds)),
    ...(await analyzeFiscal(allIds)),
  ];

  let created = 0;
  let skipped = 0;
  const areas: Record<string, number> = {};

  for (const s of allSuggestions) {
    const result = await createSuggestion(s);
    if (result) {
      created++;
      areas[s.area] = (areas[s.area] || 0) + 1;
    } else {
      skipped++;
    }
  }

  logger.info(`[SmartSuggestions] Created: ${created}, Skipped: ${skipped}`);
  return { created, skipped, areas };
}

/**
 * Obtener sugerencias pendientes para una empresa/grupo
 */
export async function getSuggestions(
  companyId: string,
  filters?: {
    area?: string;
    prioridad?: string;
    estado?: string;
    limit?: number;
  }
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, childCompanies: { select: { id: true } } },
  });
  const allIds = company
    ? [company.id, ...company.childCompanies.map((c: { id: string }) => c.id)]
    : [companyId];

  return prisma.smartSuggestion.findMany({
    where: {
      companyId: { in: allIds },
      ...(filters?.area && { area: filters.area as never }),
      ...(filters?.prioridad && { prioridad: filters.prioridad as never }),
      estado: (filters?.estado as never) || 'pendiente',
    },
    orderBy: [{ prioridad: 'asc' }, { createdAt: 'desc' }],
    take: filters?.limit || 50,
  });
}
