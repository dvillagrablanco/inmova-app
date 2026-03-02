// ============================================================================
// TIPOS PARA EL CUADRO DE MANDOS FINANCIERO
// Replica la estructura del Excel del Director Financiero
// ============================================================================

/** Línea individual del PyG Analítica */
export interface PygLine {
  codigo: string;
  nombre: string;
  importe: number;
  pctSobreRentas: number;
  pctSobreInversion: number;
}

/** Grupo de líneas con subtotal y detalle expandible */
export interface PygGroup {
  subtotal: PygLine;
  detalle: PygLine[];
}

/** Estructura completa del PyG Analítica */
export interface PygData {
  // Ingresos
  totalIngresos: PygLine;
  ingresosArrendamientos: PygLine;
  otrosIngresos: PygLine;

  // Gastos
  totalGastos: PygLine;
  serviciosExteriores: PygGroup;
  tributos: PygGroup;
  costesSociales: PygGroup;

  // Resultado operativo
  ebitda: PygLine;
  amortizaciones: PygLine;
  resultadoEnajenaciones: PygLine;
  resultadoExplotacion: PygLine;

  // Resultado financiero
  resultadoFinanciero: PygLine;
  detalleFinanciero: PygLine[];

  // Resultado extraordinario + impuestos
  ingresosGtosExtraordinarios: PygLine;
  impuestoSociedades: PygLine;

  // Resultado final
  resultadoPeriodo: PygLine;
}

/** KPIs de cartera inmobiliaria */
export interface CarteraKpis {
  valorInversion: number;
  valorMercado: number;
  plusvaliaLatente: number;
  tasaDisponibilidad: number;
  tasaOcupacion: number;
}

/** KPIs comparativos por ejercicio */
export interface EjercicioComparativo extends CarteraKpis {
  ejercicio: number;
}

/** Datos de un centro de coste con su PyG */
export interface CentroCosteData {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'directo' | 'imputado' | 'direccion';
  responsable?: string | null;
  pyg: PygData;
}

/** Respuesta completa del API de cuadro de mandos */
export interface CuadroMandosResponse {
  ejercicio: number;
  kpis: CarteraKpis;
  ejerciciosComparativos: EjercicioComparativo[];
  pygTotal: PygData;
  centrosCoste: CentroCosteData[];
}

/** Datos de filtros disponibles */
export interface FiltrosDisponibles {
  ejercicios: number[];
  edificios: {
    id: string;
    nombre: string;
    unidades: {
      id: string;
      numero: string;
      tipo: string;
    }[];
  }[];
  centrosCoste: {
    id: string;
    codigo: string;
    nombre: string;
    tipo: string;
  }[];
}

/** Parámetros de filtro para el cuadro de mandos */
export interface CuadroMandosFilters {
  ejercicio: number;
  buildingIds?: string[];
  costCenterIds?: string[];
}

/** Mapeo de código PyG a categoría de gasto */
export interface PygCategoriaMap {
  nombre: string;
  categoria: string | null;
}
