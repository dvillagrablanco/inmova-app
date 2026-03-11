// ============================================================================
// SERVICIO DE LÓGICA DE NEGOCIO - CUADRO DE MANDOS FINANCIERO
// Calcula PyG Analítica, KPIs de cartera y agrupación por centro de coste
// ============================================================================

import { prisma } from '@/lib/db';
import {
  SERVICIOS_EXTERIORES_CONFIG,
  TRIBUTOS_CONFIG,
  COSTES_SOCIALES_CONFIG,
  POST_OPERATIVO_CONFIG,
  FINANCIERO_CONFIG,
  EXTRAORDINARIO_CONFIG,
} from './pyg-config';
import type {
  PygLine,
  PygGroup,
  PygData,
  CarteraKpis,
  EjercicioComparativo,
  CentroCosteData,
  CuadroMandosResponse,
  FiltrosDisponibles,
  CuadroMandosFilters,
} from '@/types/finanzas';

// ─── HELPERS ────────────────────────────────────────────────────────────────

export function makePygLine(
  codigo: string,
  nombre: string,
  importe: number,
  totalRentas: number,
  valorInversion: number
): PygLine {
  return {
    codigo,
    nombre,
    importe,
    pctSobreRentas: totalRentas !== 0 ? importe / totalRentas : 0,
    pctSobreInversion: valorInversion !== 0 ? importe / valorInversion : 0,
  };
}

export function makePygGroup(
  subtotalCodigo: string,
  subtotalNombre: string,
  detalle: PygLine[],
  totalRentas: number,
  valorInversion: number
): PygGroup {
  const sumImporte = detalle.reduce((acc, d) => acc + d.importe, 0);
  return {
    subtotal: makePygLine(subtotalCodigo, subtotalNombre, sumImporte, totalRentas, valorInversion),
    detalle,
  };
}

function buildEmptyPyg(totalRentas: number, valorInversion: number): PygData {
  const zero = (codigo: string, nombre: string) =>
    makePygLine(codigo, nombre, 0, totalRentas, valorInversion);

  return {
    totalIngresos: zero('TOTAL_INGRESOS', 'TOTAL INGRESOS'),
    ingresosArrendamientos: zero('E3', 'Ingresos por Arrendamientos'),
    otrosIngresos: zero('E4', 'Otros ingresos'),
    totalGastos: zero('TOTAL_GASTOS', 'TOTAL GASTOS'),
    serviciosExteriores: { subtotal: zero('SERV_EXT', 'Servicios Exteriores'), detalle: [] },
    tributos: { subtotal: zero('TRIBUTOS', 'Tributos'), detalle: [] },
    costesSociales: { subtotal: zero('COSTES_SOC', 'Costes Sociales'), detalle: [] },
    ebitda: zero('EBITDA', 'EBITDA'),
    amortizaciones: zero('E24', 'Amortizaciones'),
    resultadoEnajenaciones: zero('E999', 'Rdos por enajenac. y otras inmuebles'),
    resultadoExplotacion: zero('RDO_EXPL', 'RESULTADO DE EXPLOTACIÓN'),
    resultadoFinanciero: zero('RDO_FIN', 'RESULTADO FINANCIERO'),
    detalleFinanciero: [],
    ingresosGtosExtraordinarios: zero('F3', 'INGR. Y GTOS OP. EXTRAORDINARIAS'),
    impuestoSociedades: zero('S1', 'Impuesto sobre Sociedades'),
    resultadoPeriodo: zero('RDO_PERIODO', 'RESULTADO DE PERIODO'),
  };
}

// ─── QUERY: GASTOS AGRUPADOS POR CATEGORÍA ─────────────────────────────────

interface ExpenseAggregate {
  categoria: string;
  costCenterId: string | null;
  _sum: { monto: number | null };
}

async function getExpensesByCategory(
  companyBuildingIds: string[],
  ejercicio: number,
  buildingFilter?: string[],
  costCenterFilter?: string[]
): Promise<ExpenseAggregate[]> {
  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio + 1, 0, 1);

  const targetBuildingIds =
    buildingFilter && buildingFilter.length > 0 ? buildingFilter : companyBuildingIds;

  const whereClause: Record<string, unknown> = {
    buildingId: { in: targetBuildingIds },
    fecha: { gte: startDate, lt: endDate },
    isDemo: false,
  };

  if (costCenterFilter && costCenterFilter.length > 0) {
    whereClause.costCenterId = { in: costCenterFilter };
  }

  const result = await prisma.expense.groupBy({
    by: ['categoria', 'costCenterId'],
    where: whereClause,
    _sum: { monto: true },
  });

  return result as unknown as ExpenseAggregate[];
}

// ─── QUERY: INGRESOS POR ARRENDAMIENTOS ─────────────────────────────────────

async function getIngresosArrendamientos(
  companyBuildingIds: string[],
  ejercicio: number,
  buildingFilter?: string[]
): Promise<number> {
  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio + 1, 0, 1);

  const targetBuildingIds =
    buildingFilter && buildingFilter.length > 0 ? buildingFilter : companyBuildingIds;

  // Obtener unit IDs de los buildings filtrados
  const units = await prisma.unit.findMany({
    where: { buildingId: { in: targetBuildingIds } },
    select: { id: true },
  });

  const unitIds = units.map((u) => u.id);
  if (unitIds.length === 0) return 0;

  // Pagos recibidos en el ejercicio (contratos activos)
  const payments = await prisma.payment.aggregate({
    where: {
      contract: { unitId: { in: unitIds } },
      fechaPago: { gte: startDate, lt: endDate },
      estado: 'pagado',
    },
    _sum: { monto: true },
  });

  return payments._sum.monto || 0;
}

// ─── QUERY: OTROS INGRESOS ──────────────────────────────────────────────────

async function getOtrosIngresos(
  companyBuildingIds: string[],
  ejercicio: number,
  buildingFilter?: string[]
): Promise<number> {
  // Los "otros ingresos" se modelan como gastos con monto positivo
  // o con categorías específicas del cuadro de mandos
  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio + 1, 0, 1);

  const targetBuildingIds =
    buildingFilter && buildingFilter.length > 0 ? buildingFilter : companyBuildingIds;

  const result = await prisma.expense.aggregate({
    where: {
      buildingId: { in: targetBuildingIds },
      fecha: { gte: startDate, lt: endDate },
      monto: { gt: 0 },
      categoria: { in: ['ingresos_financieros', 'beneficios_participaciones', 'extraordinarios'] },
      isDemo: false,
    },
    _sum: { monto: true },
  });

  return result._sum.monto || 0;
}

// ─── CALCULAR PyG ───────────────────────────────────────────────────────────

export function buildPygFromExpenses(
  expenses: ExpenseAggregate[],
  ingresosArrendamientos: number,
  otrosIngresos: number,
  valorInversion: number,
  costCenterFilter?: string | null
): PygData {
  // Filtrar gastos por centro de coste si se especifica
  const filtered = costCenterFilter
    ? expenses.filter((e) => e.costCenterId === costCenterFilter)
    : expenses;

  // Mapa de categoría → monto total (negativos = gastos)
  const categoriaMap: Record<string, number> = {};
  for (const exp of filtered) {
    const cat = exp.categoria;
    const monto = exp._sum.monto || 0;
    categoriaMap[cat] = (categoriaMap[cat] || 0) + monto;
  }

  // Helper para obtener monto negativo de una categoría
  const getGasto = (cat: string): number => -Math.abs(categoriaMap[cat] || 0);

  const totalRentas = ingresosArrendamientos;

  // Construir líneas de detalle para cada grupo
  const servExtDetalle: PygLine[] = Object.entries(SERVICIOS_EXTERIORES_CONFIG).map(
    ([code, config]) =>
      makePygLine(code, config.nombre, getGasto(config.categoria), totalRentas, valorInversion)
  );

  const tributosDetalle: PygLine[] = Object.entries(TRIBUTOS_CONFIG).map(([code, config]) =>
    makePygLine(code, config.nombre, getGasto(config.categoria), totalRentas, valorInversion)
  );

  const costesSocDetalle: PygLine[] = Object.entries(COSTES_SOCIALES_CONFIG).map(([code, config]) =>
    makePygLine(code, config.nombre, getGasto(config.categoria), totalRentas, valorInversion)
  );

  // Grupos con subtotales
  const servExt = makePygGroup(
    'SERV_EXT',
    'Servicios Exteriores',
    servExtDetalle,
    totalRentas,
    valorInversion
  );
  const tributos = makePygGroup(
    'TRIBUTOS',
    'Tributos',
    tributosDetalle,
    totalRentas,
    valorInversion
  );
  const costesSoc = makePygGroup(
    'COSTES_SOC',
    'Costes Sociales',
    costesSocDetalle,
    totalRentas,
    valorInversion
  );

  // Totales
  const totalGastosImporte =
    servExt.subtotal.importe + tributos.subtotal.importe + costesSoc.subtotal.importe;
  const totalIngresosImporte = ingresosArrendamientos + otrosIngresos;
  const ebitdaImporte = totalIngresosImporte + totalGastosImporte; // gastos son negativos

  // Post-operativo
  const amortImporte = getGasto(POST_OPERATIVO_CONFIG.E24.categoria);
  const enajenImporte = categoriaMap[POST_OPERATIVO_CONFIG.E999.categoria] || 0;
  const rdoExplotacion = ebitdaImporte + amortImporte + enajenImporte;

  // Financiero
  const detalleFinanciero: PygLine[] = Object.entries(FINANCIERO_CONFIG).map(([code, config]) => {
    const importe = categoriaMap[config.categoria] || 0;
    return makePygLine(code, config.nombre, importe, totalRentas, valorInversion);
  });
  const rdoFinancieroImporte = detalleFinanciero.reduce((acc, l) => acc + l.importe, 0);

  // Extraordinario
  const extraImporte = categoriaMap[EXTRAORDINARIO_CONFIG.F3.categoria] || 0;
  const isoImporte = getGasto(EXTRAORDINARIO_CONFIG.S1.categoria);

  const rdoPeriodo = rdoExplotacion + rdoFinancieroImporte + extraImporte + isoImporte;

  return {
    totalIngresos: makePygLine(
      'TOTAL_INGRESOS',
      'TOTAL INGRESOS',
      totalIngresosImporte,
      totalRentas,
      valorInversion
    ),
    ingresosArrendamientos: makePygLine(
      'E3',
      'Ingresos por Arrendamientos',
      ingresosArrendamientos,
      totalRentas,
      valorInversion
    ),
    otrosIngresos: makePygLine('E4', 'Otros ingresos', otrosIngresos, totalRentas, valorInversion),
    totalGastos: makePygLine(
      'TOTAL_GASTOS',
      'TOTAL GASTOS',
      totalGastosImporte,
      totalRentas,
      valorInversion
    ),
    serviciosExteriores: servExt,
    tributos,
    costesSociales: costesSoc,
    ebitda: makePygLine('EBITDA', 'EBITDA', ebitdaImporte, totalRentas, valorInversion),
    amortizaciones: makePygLine('E24', 'Amortizaciones', amortImporte, totalRentas, valorInversion),
    resultadoEnajenaciones: makePygLine(
      'E999',
      'Rdos por enajenac. y otras inmuebles',
      enajenImporte,
      totalRentas,
      valorInversion
    ),
    resultadoExplotacion: makePygLine(
      'RDO_EXPL',
      'RESULTADO DE EXPLOTACIÓN',
      rdoExplotacion,
      totalRentas,
      valorInversion
    ),
    resultadoFinanciero: makePygLine(
      'RDO_FIN',
      'RESULTADO FINANCIERO',
      rdoFinancieroImporte,
      totalRentas,
      valorInversion
    ),
    detalleFinanciero,
    ingresosGtosExtraordinarios: makePygLine(
      'F3',
      'INGR. Y GTOS OP. EXTRAORDINARIAS',
      extraImporte,
      totalRentas,
      valorInversion
    ),
    impuestoSociedades: makePygLine(
      'S1',
      'Impuesto sobre Sociedades',
      isoImporte,
      totalRentas,
      valorInversion
    ),
    resultadoPeriodo: makePygLine(
      'RDO_PERIODO',
      'RESULTADO DE PERIODO',
      rdoPeriodo,
      totalRentas,
      valorInversion
    ),
  };
}

// ─── CALCULAR KPIs DE CARTERA ───────────────────────────────────────────────

async function getCarteraKpis(
  companyBuildingIds: string[],
  ejercicio: number,
  buildingFilter?: string[]
): Promise<CarteraKpis> {
  const targetBuildingIds =
    buildingFilter && buildingFilter.length > 0 ? buildingFilter : companyBuildingIds;

  // Obtener unidades con datos de valoración
  const units = await prisma.unit.findMany({
    where: { buildingId: { in: targetBuildingIds } },
    select: {
      id: true,
      precioCompra: true,
      valorMercado: true,
      estado: true,
      rentaMensual: true,
    },
  });

  // Intentar obtener datos históricos del ejercicio
  const unitIds = units.map((u) => u.id);
  const historicos = await prisma.propertyValuationHistory.findMany({
    where: { unitId: { in: unitIds }, ejercicio },
  });

  const historicoMap = new Map(historicos.map((h) => [h.unitId, h]));
  const currentYear = new Date().getFullYear();
  const allowCurrentFallback = ejercicio === currentYear;

  let valorInversion = 0;
  let valorMercado = 0;
  let totalUnidades = 0;
  let unidadesDisponibles = 0;
  let unidadesOcupadas = 0;

  for (const unit of units) {
    const historico = historicoMap.get(unit.id);

    if (historico) {
      valorInversion += historico.valorInversion;
      valorMercado += historico.valorMercado;
      if (historico.tasaDisponibilidad !== null)
        unidadesDisponibles += historico.tasaDisponibilidad;
      if (historico.tasaOcupacion !== null) unidadesOcupadas += historico.tasaOcupacion;
      totalUnidades += 1;
    } else if (allowCurrentFallback) {
      // Usar datos actuales de la unidad
      valorInversion += unit.precioCompra || 0;
      valorMercado += unit.valorMercado || 0;
      totalUnidades += 1;

      const estado = unit.estado;
      if (estado === 'disponible' || estado === 'ocupada') {
        unidadesDisponibles += 1;
      }
      if (estado === 'ocupada') {
        unidadesOcupadas += 1;
      }
    }
  }

  return {
    valorInversion,
    valorMercado,
    plusvaliaLatente: valorMercado - valorInversion,
    tasaDisponibilidad: totalUnidades > 0 ? unidadesDisponibles / totalUnidades : 0,
    tasaOcupacion: totalUnidades > 0 ? unidadesOcupadas / totalUnidades : 0,
  };
}

// ─── API PRINCIPAL ──────────────────────────────────────────────────────────

export async function getCuadroMandosData(
  companyId: string,
  filters: CuadroMandosFilters
): Promise<CuadroMandosResponse> {
  const { ejercicio, buildingIds, costCenterIds } = filters;

  // 1. Obtener buildings de la empresa + filiales (vista consolidada)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, childCompanies: { select: { id: true } } },
  });
  const allCompanyIds = company
    ? [company.id, ...company.childCompanies.map((c: { id: string }) => c.id)]
    : [companyId];

  const buildings = await prisma.building.findMany({
    where: { companyId: { in: allCompanyIds } },
    select: { id: true },
  });
  const companyBuildingIds = buildings.map((b) => b.id);

  if (companyBuildingIds.length === 0) {
    return {
      ejercicio,
      kpis: {
        valorInversion: 0,
        valorMercado: 0,
        plusvaliaLatente: 0,
        tasaDisponibilidad: 0,
        tasaOcupacion: 0,
      },
      ejerciciosComparativos: [],
      pygTotal: buildEmptyPyg(0, 0),
      centrosCoste: [],
    };
  }

  // 2. KPIs de cartera
  const kpis = await getCarteraKpis(companyBuildingIds, ejercicio, buildingIds);

  // 3. Ingresos
  const ingresosArrendamientos = await getIngresosArrendamientos(
    companyBuildingIds,
    ejercicio,
    buildingIds
  );
  const otrosIngresos = await getOtrosIngresos(companyBuildingIds, ejercicio, buildingIds);

  // 4. Gastos agrupados
  const expenses = await getExpensesByCategory(
    companyBuildingIds,
    ejercicio,
    buildingIds,
    costCenterIds
  );

  // 5. PyG Total (todos los centros de coste)
  const pygTotal = buildPygFromExpenses(
    expenses,
    ingresosArrendamientos,
    otrosIngresos,
    kpis.valorInversion
  );

  // 6. Centros de coste
  const costCenters = await prisma.costCenter.findMany({
    where: { companyId: { in: allCompanyIds }, activo: true },
    orderBy: { codigo: 'asc' },
  });

  const centrosCosteData: CentroCosteData[] = costCenters.map((cc) => ({
    id: cc.id,
    codigo: cc.codigo,
    nombre: cc.nombre,
    tipo: cc.tipo as 'directo' | 'imputado' | 'direccion',
    responsable: cc.responsable,
    pyg: buildPygFromExpenses(
      expenses,
      // Solo el centro DIR tiene ingresos directos; otros centros solo tienen gastos
      cc.tipo === 'directo' ? ingresosArrendamientos : 0,
      cc.tipo === 'directo' ? otrosIngresos : 0,
      kpis.valorInversion,
      cc.id
    ),
  }));

  // 7. Ejercicios comparativos — solo años con histórico real + ejercicio actual
  const currentYear = new Date().getFullYear();
  const historicalYears = await prisma.propertyValuationHistory.findMany({
    where: {
      unit: { buildingId: { in: companyBuildingIds } },
    },
    distinct: ['ejercicio'],
    select: { ejercicio: true },
    orderBy: { ejercicio: 'asc' },
  });
  const ejerciciosRange = Array.from(
    new Set([...historicalYears.map((row) => row.ejercicio), currentYear])
  )
    .filter((year) => year >= currentYear - 3 && year <= currentYear)
    .sort((a, b) => a - b);
  const ejerciciosComparativos: EjercicioComparativo[] = [];

  for (const ej of ejerciciosRange) {
    const ejKpis = await getCarteraKpis(companyBuildingIds, ej, buildingIds);
    ejerciciosComparativos.push({ ejercicio: ej, ...ejKpis });
  }

  return {
    ejercicio,
    kpis,
    ejerciciosComparativos,
    pygTotal,
    centrosCoste: centrosCosteData,
  };
}

// ─── FILTROS DISPONIBLES ────────────────────────────────────────────────────

export async function getFiltrosDisponibles(companyId: string): Promise<FiltrosDisponibles> {
  // Include child companies for consolidated view
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { childCompanies: { select: { id: true } } },
  });
  const allCompanyIds = company
    ? [companyId, ...company.childCompanies.map((c: { id: string }) => c.id)]
    : [companyId];

  // Edificios con unidades (across all group companies)
  const edificios = await prisma.building.findMany({
    where: { companyId: { in: allCompanyIds } },
    select: {
      id: true,
      nombre: true,
      units: { select: { id: true, numero: true, tipo: true }, orderBy: { numero: 'asc' } },
    },
    orderBy: { nombre: 'asc' },
  });

  // Centros de coste (across all group companies)
  const centrosCoste = await prisma.costCenter.findMany({
    where: { companyId: { in: allCompanyIds }, activo: true },
    select: { id: true, codigo: true, nombre: true, tipo: true },
    orderBy: { codigo: 'asc' },
  });

  // Ejercicios disponibles (basado en gastos existentes)
  const currentYear = new Date().getFullYear();
  const ejercicios: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    ejercicios.push(y);
  }

  return {
    ejercicios,
    edificios: edificios.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      unidades: e.units.map((u) => ({
        id: u.id,
        numero: u.numero,
        tipo: u.tipo,
      })),
    })),
    centrosCoste: centrosCoste.map((cc) => ({
      id: cc.id,
      codigo: cc.codigo,
      nombre: cc.nombre,
      tipo: cc.tipo,
    })),
  };
}
