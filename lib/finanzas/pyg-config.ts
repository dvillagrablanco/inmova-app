// ============================================================================
// CONFIGURACIÓN DEL PyG ANALÍTICA
// Mapeo completo de códigos contables del cuadro de mandos del CFO
// ============================================================================

/**
 * Estructura jerárquica del PyG Analítica.
 *
 * Mapea cada código contable (E3, E20a01, etc.) con:
 * - nombre: descripción legible
 * - categoria: categoría de Expense en Prisma (null si no aplica, ej: ingresos vienen de Payment)
 */

// ─── INGRESOS ────────────────────────────────────────────────────────────────

export const INGRESOS_CONFIG = {
  E3: { nombre: 'Ingresos por Arrendamientos', categoria: null },
  E4: { nombre: 'Otros ingresos', categoria: null },
} as const;

// ─── GASTOS - SERVICIOS EXTERIORES ──────────────────────────────────────────

export const SERVICIOS_EXTERIORES_CONFIG = {
  E20a01: { nombre: 'Arrendamientos', categoria: 'arrendamientos_gasto' },
  E20a02: { nombre: 'Reparac. y conservación', categoria: 'reparaciones' },
  E20a03: { nombre: 'Gastos Cdad vecinos', categoria: 'comunidad' },
  E20a04: { nombre: 'Serv. Profesionales', categoria: 'servicios_profesionales' },
  E20a05: { nombre: 'Transportes', categoria: 'transportes' },
  E20a06: { nombre: 'Seguros', categoria: 'seguros' },
  E20a07: { nombre: 'Servic. Bancarios', categoria: 'servicios_bancarios' },
  E20a08: { nombre: 'Publicidad', categoria: 'publicidad' },
  E20a10: { nombre: 'Suministros Luz', categoria: 'suministros_luz' },
  E20a11: { nombre: 'Suministros Agua', categoria: 'suministros_agua' },
  E20a12: { nombre: 'Suministros Gas', categoria: 'suministros_gas' },
  E20a13: { nombre: 'Suministros Telefonía', categoria: 'suministros_telefonia' },
  E20a19: { nombre: 'Suministros OTROS', categoria: 'suministros_otros' },
  E20a90: { nombre: 'Comisiones gestión inmuebles', categoria: 'comisiones_gestion' },
  E20a99: { nombre: 'Otros servicios', categoria: 'otro' },
} as const;

// ─── GASTOS - TRIBUTOS ──────────────────────────────────────────────────────

export const TRIBUTOS_CONFIG = {
  E21a: { nombre: 'IBI', categoria: 'ibi' },
  E21b: { nombre: 'Basuras y TGR', categoria: 'basuras' },
  E21c: { nombre: 'Otros tributos', categoria: 'tributos_otros' },
} as const;

// ─── GASTOS - COSTES SOCIALES ───────────────────────────────────────────────

export const COSTES_SOCIALES_CONFIG = {
  E16: { nombre: 'Sueldos y Salarios', categoria: 'sueldos_salarios' },
  E17: { nombre: 'Seguridad Social', categoria: 'seguridad_social' },
  E18: { nombre: 'Remuneraciones y simil. Consejeros', categoria: 'remuneraciones_consejeros' },
} as const;

// ─── POST-OPERATIVO ─────────────────────────────────────────────────────────

export const POST_OPERATIVO_CONFIG = {
  E24: { nombre: 'Amortizaciones', categoria: 'amortizaciones' },
  E999: { nombre: 'Rdos por enajenac. y otras inmuebles', categoria: 'enajenaciones' },
} as const;

// ─── RESULTADO FINANCIERO ───────────────────────────────────────────────────

export const FINANCIERO_CONFIG = {
  F4: { nombre: 'Ingr. de acciones, valores y otros', categoria: 'ingresos_financieros' },
  F7: { nombre: 'Intereses ccc, IPF y similares', categoria: 'intereses' },
  F10a: { nombre: 'Por comisiones y similares', categoria: 'comisiones_financieras' },
  F15: { nombre: 'Diferencias de cambio', categoria: 'diferencias_cambio' },
  F18b2: { nombre: 'Beneficios en participac. y valores', categoria: 'beneficios_participaciones' },
  F18b3: { nombre: 'Pérdidas en participac. y valores', categoria: 'perdidas_participaciones' },
} as const;

// ─── EXTRAORDINARIO E IMPUESTOS ─────────────────────────────────────────────

export const EXTRAORDINARIO_CONFIG = {
  F3: { nombre: 'INGR. Y GTOS OP. EXTRAORDINARIAS', categoria: 'extraordinarios' },
  S1: { nombre: 'Impuesto sobre Sociedades', categoria: 'impuesto_sociedades' },
} as const;

// ─── TODAS LAS CATEGORÍAS DE GASTO POSIBLES ────────────────────────────────

/**
 * Lista completa de categorías de gasto mapeadas desde la PyG analítica.
 * Incluye las originales de Prisma + las nuevas del cuadro de mandos.
 */
export const ALL_EXPENSE_CATEGORIES = [
  // Originales Prisma
  'mantenimiento',
  'impuestos',
  'seguros',
  'servicios',
  'reparaciones',
  'comunidad',
  'otro',
  // Nuevas del cuadro de mandos
  'arrendamientos_gasto',
  'servicios_profesionales',
  'transportes',
  'servicios_bancarios',
  'publicidad',
  'suministros_luz',
  'suministros_agua',
  'suministros_gas',
  'suministros_telefonia',
  'suministros_otros',
  'comisiones_gestion',
  'ibi',
  'basuras',
  'tributos_otros',
  'sueldos_salarios',
  'seguridad_social',
  'remuneraciones_consejeros',
  'amortizaciones',
  'enajenaciones',
  'ingresos_financieros',
  'intereses',
  'comisiones_financieras',
  'diferencias_cambio',
  'beneficios_participaciones',
  'perdidas_participaciones',
  'extraordinarios',
  'impuesto_sociedades',
] as const;

// ─── MAPEO INVERSO: categoría → código PyG ─────────────────────────────────

const allConfigs = {
  ...SERVICIOS_EXTERIORES_CONFIG,
  ...TRIBUTOS_CONFIG,
  ...COSTES_SOCIALES_CONFIG,
  ...POST_OPERATIVO_CONFIG,
  ...FINANCIERO_CONFIG,
  ...EXTRAORDINARIO_CONFIG,
};

export const CATEGORIA_TO_PYG_CODE: Record<string, string> = {};
for (const [code, config] of Object.entries(allConfigs)) {
  if (config.categoria) {
    CATEGORIA_TO_PYG_CODE[config.categoria] = code;
  }
}

// ─── MAPEO DE CATEGORÍAS LEGACY → NUEVAS ───────────────────────────────────

/**
 * Mapeo de categorías legacy del Expense model a las nuevas categorías.
 * Para gastos existentes que usen la categoría "impuestos", se pueden reclasificar
 * mirando el concepto o subcategoría. Por defecto mapean al grupo genérico.
 */
export const LEGACY_CATEGORY_MAP: Record<string, string[]> = {
  impuestos: ['ibi', 'basuras', 'tributos_otros'],
  servicios: ['servicios_profesionales', 'servicios_bancarios'],
  mantenimiento: ['reparaciones'],
};

// ─── CENTROS DE COSTE POR DEFECTO ───────────────────────────────────────────

export const DEFAULT_COST_CENTERS = [
  {
    codigo: 'DIR',
    nombre: 'Costes Directos',
    tipo: 'directo' as const,
    responsable: null,
  },
  {
    codigo: 'CDI',
    nombre: 'Costes Directos Imputados (Administración)',
    tipo: 'imputado' as const,
    responsable: null,
  },
  {
    codigo: 'DF-GEN',
    nombre: 'Dirección Financiera',
    tipo: 'direccion' as const,
    responsable: null,
  },
  {
    codigo: 'DI-COGE',
    nombre: 'Dirección (Costes generales)',
    tipo: 'direccion' as const,
    responsable: null,
  },
];

// ─── HELPERS DE FORMATO ─────────────────────────────────────────────────────

const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const euroFormatterDecimals = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pctFormatter = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatEuro(value: number, decimals = false): string {
  return decimals ? euroFormatterDecimals.format(value) : euroFormatter.format(value);
}

export function formatPct(value: number): string {
  return pctFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Formatea un valor grande en formato compacto (ej: 20.8M €)
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M €`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}K €`;
  }
  return `${sign}${abs.toFixed(0)} €`;
}
