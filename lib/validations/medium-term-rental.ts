/**
 * VALIDACIONES ZOD PARA ALQUILER A MEDIA ESTANCIA
 * 
 * Schemas de validación específicos para contratos de arrendamiento por temporada (LAU Art. 3.2)
 */

import { z } from 'zod';
import { differenceInDays, differenceInMonths, isBefore, isAfter, addMonths } from 'date-fns';

// ==========================================
// ENUMS Y CONSTANTES
// ==========================================

export const TipoArrendamientoEnum = z.enum([
  'vivienda_habitual',
  'temporada',
  'vacacional',
  'habitacion',
]);

export const MotivoTemporalidadEnum = z.enum([
  'trabajo',
  'estudios',
  'tratamiento_medico',
  'proyecto_profesional',
  'transicion',
  'turismo_extendido',
  'otro',
]);

export const EstadoInventarioEnum = z.enum([
  'pendiente',
  'entrada_completado',
  'salida_completado',
  'comparado',
  'con_incidencias',
]);

export const EstadoItemInventarioEnum = z.enum([
  'nuevo',
  'bueno',
  'aceptable',
  'deteriorado',
  'dañado',
]);

export const CategoriaItemInventarioEnum = z.enum([
  'mobiliario',
  'electrodomestico',
  'decoracion',
  'estructura',
  'otros',
]);

export const FrecuenciaLimpiezaEnum = z.enum([
  'semanal',
  'quincenal',
  'mensual',
]);

// ==========================================
// CONSTANTES DE CONFIGURACIÓN
// ==========================================

export const CONFIG_MEDIA_ESTANCIA = {
  // Límites de duración
  DURACION_MINIMA_DIAS: 30,
  DURACION_MAXIMA_MESES_TEMPORADA: 11,
  DURACION_MINIMA_VIVIENDA_HABITUAL_MESES: 12,
  
  // Fianzas según LAU
  MESES_FIANZA_TEMPORADA: 2,
  MESES_FIANZA_VIVIENDA_HABITUAL: 1,
  MESES_FIANZA_VACACIONAL: 1,
  
  // Preaviso
  DIAS_PREAVISO_MINIMO: 30,
  DIAS_PREAVISO_RECOMENDADO: 30,
  
  // Penalizaciones
  PENALIZACION_DESISTIMIENTO_DEFECTO: 50, // 50% del tiempo restante
} as const;

// ==========================================
// SCHEMAS DE SERVICIOS INCLUIDOS
// ==========================================

export const serviciosIncluidosSchema = z.object({
  wifi: z.boolean().default(false),
  agua: z.boolean().default(false),
  luz: z.boolean().default(false),
  gas: z.boolean().default(false),
  calefaccion: z.boolean().default(false),
  limpieza: z.boolean().default(false),
  limpiezaFrecuencia: FrecuenciaLimpiezaEnum.optional(),
  comunidad: z.boolean().default(false),
  seguro: z.boolean().default(false),
  parking: z.boolean().default(false),
  trastero: z.boolean().default(false),
  otros: z.array(z.string()).optional(),
}).refine((data) => {
  // Si limpieza está activo, debe especificarse la frecuencia
  if (data.limpieza && !data.limpiezaFrecuencia) {
    return false;
  }
  return true;
}, {
  message: 'Si se incluye limpieza, debe especificarse la frecuencia',
  path: ['limpiezaFrecuencia'],
});

export type ServiciosIncluidos = z.infer<typeof serviciosIncluidosSchema>;

// ==========================================
// SCHEMAS DE INVENTARIO
// ==========================================

export const itemInventarioSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  categoria: CategoriaItemInventarioEnum,
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  ubicacion: z.string().min(1, 'La ubicación es requerida').max(100),
  cantidad: z.number().int().min(0, 'La cantidad debe ser 0 o mayor'),
  estado: EstadoItemInventarioEnum,
  observaciones: z.string().max(500).optional(),
  fotos: z.array(z.string().url('URL de foto inválida')).default([]),
  valor: z.number().min(0).optional(),
});

export type ItemInventario = z.infer<typeof itemInventarioSchema>;

export const lecturaContadoresSchema = z.object({
  luz: z.number().min(0).optional(),
  agua: z.number().min(0).optional(),
  gas: z.number().min(0).optional(),
});

export const inventarioCompletoSchema = z.object({
  items: z.array(itemInventarioSchema).min(1, 'El inventario debe tener al menos un item'),
  fechaRealizacion: z.date().or(z.string().datetime()),
  realizadoPor: z.string().min(1, 'Debe especificarse quién realizó el inventario'),
  firmaInquilino: z.string().optional(),
  firmaPropietario: z.string().optional(),
  observacionesGenerales: z.string().max(2000).optional(),
  lecturaContadores: lecturaContadoresSchema.optional(),
});

export type InventarioCompleto = z.infer<typeof inventarioCompletoSchema>;

// ==========================================
// SCHEMA PRINCIPAL DE CONTRATO MEDIA ESTANCIA
// ==========================================

export const contratoMediaEstanciaBaseSchema = z.object({
  // Identificadores
  unitId: z.string().cuid('ID de unidad inválido'),
  tenantId: z.string().cuid('ID de inquilino inválido'),
  
  // Fechas
  fechaInicio: z.date().or(z.string().datetime()).transform((val) => new Date(val)),
  fechaFin: z.date().or(z.string().datetime()).transform((val) => new Date(val)),
  
  // Económicos
  rentaMensual: z.number()
    .positive('La renta mensual debe ser mayor a 0')
    .max(50000, 'La renta mensual parece excesiva (máximo €50,000)'),
  
  depositoSuministros: z.number()
    .min(0, 'El depósito de suministros no puede ser negativo')
    .optional(),
  
  // Tipo de arrendamiento
  tipoArrendamiento: TipoArrendamientoEnum,
  
  // Motivo de temporalidad (requerido para tipo 'temporada')
  motivoTemporalidad: MotivoTemporalidadEnum.optional(),
  descripcionMotivo: z.string().max(1000).optional(),
  
  // Servicios incluidos
  serviciosIncluidos: serviciosIncluidosSchema.optional(),
  
  // Límites de consumo (si hay servicios incluidos)
  limiteConsumoLuz: z.number().min(0).optional(),
  limiteConsumoAgua: z.number().min(0).optional(),
  limiteConsumoGas: z.number().min(0).optional(),
  
  // Prorrateo
  prorrateable: z.boolean().default(true),
  
  // Condiciones de terminación
  penalizacionDesistimiento: z.number()
    .min(0, 'La penalización no puede ser negativa')
    .max(100, 'La penalización no puede exceder el 100%')
    .default(50),
  
  diasPreaviso: z.number()
    .int('Los días de preaviso deben ser un número entero')
    .min(15, 'El preaviso mínimo es de 15 días')
    .max(90, 'El preaviso máximo es de 90 días')
    .default(30),
  
  // Renovación
  renovacionPorPeriodoIgual: z.boolean().default(false),
  maximasProrrogas: z.number().int().min(0).max(12).optional(),
  
  // Cláusulas adicionales
  clausulasAdicionales: z.string().max(5000).optional(),
});

/**
 * Schema con validaciones de negocio completas
 */
export const contratoMediaEstanciaSchema = contratoMediaEstanciaBaseSchema
  .refine((data) => {
    // Fecha fin debe ser posterior a fecha inicio
    return isAfter(data.fechaFin, data.fechaInicio);
  }, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  })
  .refine((data) => {
    // Si es temporada, debe tener motivo
    if (data.tipoArrendamiento === 'temporada' && !data.motivoTemporalidad) {
      return false;
    }
    return true;
  }, {
    message: 'Los contratos de temporada requieren especificar el motivo de temporalidad',
    path: ['motivoTemporalidad'],
  })
  .refine((data) => {
    // Validar duración según tipo
    const duracionMeses = differenceInMonths(data.fechaFin, data.fechaInicio);
    const duracionDias = differenceInDays(data.fechaFin, data.fechaInicio);
    
    if (data.tipoArrendamiento === 'vacacional' && duracionDias > 31) {
      return false;
    }
    return true;
  }, {
    message: 'Los contratos vacacionales no pueden exceder 31 días',
    path: ['fechaFin'],
  })
  .refine((data) => {
    // Advertencia para temporada > 11 meses
    const duracionMeses = differenceInMonths(data.fechaFin, data.fechaInicio);
    
    if (data.tipoArrendamiento === 'temporada' && duracionMeses > 11) {
      return false;
    }
    return true;
  }, {
    message: 'Los contratos de temporada no pueden exceder 11 meses. Use "vivienda_habitual" para duraciones mayores.',
    path: ['tipoArrendamiento'],
  })
  .refine((data) => {
    // Duración mínima de 30 días excepto vacacional
    const duracionDias = differenceInDays(data.fechaFin, data.fechaInicio);
    
    if (data.tipoArrendamiento !== 'vacacional' && duracionDias < 30) {
      return false;
    }
    return true;
  }, {
    message: 'La duración mínima para contratos no vacacionales es de 30 días',
    path: ['fechaFin'],
  });

export type ContratoMediaEstanciaInput = z.infer<typeof contratoMediaEstanciaSchema>;

// ==========================================
// SCHEMA DE ACTUALIZACIÓN
// ==========================================

export const actualizarContratoMediaEstanciaSchema = contratoMediaEstanciaBaseSchema
  .partial()
  .omit({ unitId: true, tenantId: true });

export type ActualizarContratoMediaEstanciaInput = z.infer<typeof actualizarContratoMediaEstanciaSchema>;

// ==========================================
// SCHEMA DE PRORRATEO
// ==========================================

export const calcularProrrateoSchema = z.object({
  fechaInicio: z.date().or(z.string().datetime()),
  fechaFin: z.date().or(z.string().datetime()),
  rentaMensual: z.number().positive(),
}).refine((data) => {
  const inicio = new Date(data.fechaInicio);
  const fin = new Date(data.fechaFin);
  return isAfter(fin, inicio);
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin'],
});

// ==========================================
// SCHEMA DE RENOVACIÓN
// ==========================================

export const renovarContratoSchema = z.object({
  contractId: z.string().cuid('ID de contrato inválido'),
  nuevaFechaFin: z.date().or(z.string().datetime()),
  nuevaRentaMensual: z.number().positive().optional(),
  motivo: z.string().max(500).optional(),
}).refine((data) => {
  // La nueva fecha fin debe ser futura
  const nuevaFin = new Date(data.nuevaFechaFin);
  return isAfter(nuevaFin, new Date());
}, {
  message: 'La nueva fecha de fin debe ser futura',
  path: ['nuevaFechaFin'],
});

export type RenovarContratoInput = z.infer<typeof renovarContratoSchema>;

// ==========================================
// SCHEMA DE DESISTIMIENTO
// ==========================================

export const desistimientoContratoSchema = z.object({
  contractId: z.string().cuid('ID de contrato inválido'),
  fechaDesistimiento: z.date().or(z.string().datetime()),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(1000),
  solicitadoPor: z.enum(['inquilino', 'propietario']),
});

export type DesistimientoContratoInput = z.infer<typeof desistimientoContratoSchema>;

// ==========================================
// SCHEMA DE LIQUIDACIÓN FINAL
// ==========================================

export const liquidacionFinalSchema = z.object({
  contractId: z.string().cuid('ID de contrato inválido'),
  
  // Fianza
  fianzaInicial: z.number().min(0),
  fianzaDevuelta: z.number().min(0),
  retencionFianza: z.number().min(0),
  motivoRetencion: z.string().max(500).optional(),
  
  // Daños del inventario
  importeDaños: z.number().min(0),
  detallesDaños: z.string().max(2000).optional(),
  
  // Consumos pendientes
  consumosPendientes: z.number().min(0),
  detalleConsumos: z.string().max(1000).optional(),
  
  // Otros cargos/abonos
  otrosCargos: z.number().default(0),
  otrosAbonos: z.number().default(0),
  descripcionOtros: z.string().max(500).optional(),
  
  // Fecha de liquidación
  fechaLiquidacion: z.date().or(z.string().datetime()),
  
  // Observaciones
  observaciones: z.string().max(2000).optional(),
}).refine((data) => {
  // Fianza devuelta + retención = fianza inicial
  const total = data.fianzaDevuelta + data.retencionFianza;
  return Math.abs(total - data.fianzaInicial) < 0.01; // Tolerancia de 1 céntimo
}, {
  message: 'La suma de fianza devuelta y retención debe ser igual a la fianza inicial',
  path: ['fianzaDevuelta'],
});

export type LiquidacionFinalInput = z.infer<typeof liquidacionFinalSchema>;

// ==========================================
// FUNCIONES DE VALIDACIÓN HELPER
// ==========================================

/**
 * Valida si una duración es válida para un tipo de arrendamiento
 */
export function validarDuracionPorTipo(
  duracionMeses: number,
  tipoArrendamiento: z.infer<typeof TipoArrendamientoEnum>
): { valido: boolean; mensaje?: string } {
  switch (tipoArrendamiento) {
    case 'vacacional':
      if (duracionMeses > 1) {
        return { 
          valido: false, 
          mensaje: 'Los contratos vacacionales no pueden exceder 1 mes' 
        };
      }
      break;
    
    case 'temporada':
      if (duracionMeses < 1) {
        return { 
          valido: false, 
          mensaje: 'Los contratos de temporada deben ser de al menos 1 mes' 
        };
      }
      if (duracionMeses > 11) {
        return { 
          valido: false, 
          mensaje: 'Los contratos de temporada no pueden exceder 11 meses' 
        };
      }
      break;
    
    case 'vivienda_habitual':
      if (duracionMeses < 12) {
        return { 
          valido: false, 
          mensaje: 'Los contratos de vivienda habitual deben ser de al menos 12 meses' 
        };
      }
      break;
  }
  
  return { valido: true };
}

/**
 * Calcula la fianza requerida según el tipo de arrendamiento
 */
export function calcularFianzaRequerida(
  rentaMensual: number,
  tipoArrendamiento: z.infer<typeof TipoArrendamientoEnum>
): { meses: number; importe: number } {
  let meses: number;
  
  switch (tipoArrendamiento) {
    case 'temporada':
      meses = CONFIG_MEDIA_ESTANCIA.MESES_FIANZA_TEMPORADA;
      break;
    case 'vivienda_habitual':
      meses = CONFIG_MEDIA_ESTANCIA.MESES_FIANZA_VIVIENDA_HABITUAL;
      break;
    default:
      meses = 1;
  }
  
  return {
    meses,
    importe: rentaMensual * meses,
  };
}

/**
 * Valida el motivo de temporalidad según la duración
 */
export function validarMotivoYDuracion(
  motivo: z.infer<typeof MotivoTemporalidadEnum>,
  duracionMeses: number
): { valido: boolean; advertencia?: string } {
  const rangosPorMotivo: Record<string, { min: number; max: number }> = {
    trabajo: { min: 1, max: 11 },
    estudios: { min: 3, max: 11 },
    tratamiento_medico: { min: 1, max: 11 },
    proyecto_profesional: { min: 1, max: 11 },
    transicion: { min: 1, max: 6 },
    turismo_extendido: { min: 1, max: 3 },
    otro: { min: 1, max: 11 },
  };
  
  const rango = rangosPorMotivo[motivo];
  
  if (duracionMeses < rango.min || duracionMeses > rango.max) {
    return {
      valido: true, // Es una advertencia, no un error
      advertencia: `La duración de ${duracionMeses} meses es inusual para el motivo "${motivo}". ` +
        `Rango habitual: ${rango.min}-${rango.max} meses.`,
    };
  }
  
  return { valido: true };
}

export default {
  // Schemas principales
  contratoMediaEstanciaSchema,
  actualizarContratoMediaEstanciaSchema,
  serviciosIncluidosSchema,
  inventarioCompletoSchema,
  itemInventarioSchema,
  
  // Schemas de operaciones
  calcularProrrateoSchema,
  renovarContratoSchema,
  desistimientoContratoSchema,
  liquidacionFinalSchema,
  
  // Enums
  TipoArrendamientoEnum,
  MotivoTemporalidadEnum,
  EstadoInventarioEnum,
  
  // Config
  CONFIG_MEDIA_ESTANCIA,
  
  // Helpers
  validarDuracionPorTipo,
  calcularFianzaRequerida,
  validarMotivoYDuracion,
};
