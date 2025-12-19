/**
 * Schemas de validación con Zod para las principales entidades del sistema
 */

import { z } from 'zod';
import {
  shortTextSchema,
  longTextSchema,
  emailSchema,
  phoneSchema,
  currencySchema,
  percentageSchema,
  dateSchema,
  uuidSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,
} from './input-sanitization';

// ============================================================================
// ROOM RENTAL SCHEMAS
// ============================================================================

/**
 * Schema para crear/actualizar habitación
 */
export const roomSchema = z.object({
  numero: shortTextSchema,
  unitId: uuidSchema,
  tipo: z.enum(['individual', 'doble', 'suite', 'otro']),
  precio: currencySchema,
  precioPorNoche: currencySchema.optional(),
  superficie: positiveNumberSchema.optional(),
  banoPrivado: z.boolean(),
  amueblada: z.boolean(),
  descripcion: longTextSchema,
  comodidades: z.array(shortTextSchema).optional().default([]),
  estado: z.enum(['disponible', 'ocupada', 'mantenimiento']).default('disponible'),
});

/**
 * Schema para prorrateo de gastos
 */
export const prorationSchema = z.object({
  unitId: uuidSchema,
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
  metodo: z.enum(['por_persona', 'por_habitacion', 'por_superficie']),
  gastos: z.array(
    z.object({
      concepto: shortTextSchema,
      monto: currencySchema,
      prorrateado: z.boolean().default(true),
    })
  ),
});

/**
 * Schema para contrato de habitación
 */
export const roomContractSchema = z.object({
  roomId: uuidSchema,
  tenantId: uuidSchema.optional(),
  tenantData: z
    .object({
      nombre: shortTextSchema,
      email: emailSchema,
      telefono: phoneSchema,
      dni: shortTextSchema.optional(),
    })
    .optional(),
  fechaInicio: dateSchema,
  fechaFin: dateSchema.optional(),
  precioMensual: currencySchema,
  deposito: currencySchema,
  gastosIncluidos: z.array(shortTextSchema).optional().default([]),
  normasConvivencia: longTextSchema,
  estado: z.enum(['activo', 'finalizado', 'cancelado']).default('activo'),
});

/**
 * Schema para horario de limpieza
 */
export const cleaningScheduleSchema = z.object({
  roomId: uuidSchema.optional(),
  unitId: uuidSchema,
  tipo: z.enum(['habitacion', 'zonas_comunes']),
  frecuencia: z.enum(['diaria', 'semanal', 'quincenal', 'mensual']),
  diaSemana: z.number().int().min(0).max(6).optional(),
  hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  duracionMinutos: positiveNumberSchema,
  asignadoA: shortTextSchema.optional(),
  notas: longTextSchema,
});

// ============================================================================
// CUPONES SCHEMAS
// ============================================================================

/**
 * Schema para crear/actualizar cupón
 */
export const couponSchema = z.object({
  codigo: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números, guiones y guiones bajos')
    .transform(val => val.toUpperCase()),
  descripcion: longTextSchema,
  tipo: z.enum(['porcentaje', 'fijo']),
  valor: z.number().positive('El valor debe ser positivo'),
  fechaInicio: dateSchema,
  fechaFin: dateSchema,
  usoMaximo: positiveNumberSchema.optional(),
  usosPorUsuario: positiveNumberSchema.optional().default(1),
  montoMinimo: currencySchema.optional(),
  aplicableA: z.enum(['todos', 'nuevos', 'existentes']).default('todos'),
  categorias: z.array(shortTextSchema).optional().default([]),
  activo: z.boolean().default(true),
});

/**
 * Schema para aplicar cupón
 */
export const applyCouponSchema = z.object({
  codigo: z.string().min(3).max(50).toUpperCase(),
  userId: uuidSchema.optional(),
  montoOriginal: currencySchema,
});

// ============================================================================
// CORE SCHEMAS (Edificios, Unidades, Contratos, etc.)
// ============================================================================

/**
 * Schema para edificio
 */
export const buildingSchema = z.object({
  nombre: shortTextSchema,
  direccion: shortTextSchema,
  ciudad: shortTextSchema,
  codigoPostal: z.string().regex(/^\d{5}$/, 'Código postal inválido'),
  pais: shortTextSchema.default('España'),
  tipo: z.enum(['residencial', 'comercial', 'mixto', 'industrial']),
  anoConstruccion: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  numeroUnidades: nonNegativeNumberSchema.optional(),
  descripcion: longTextSchema,
});

/**
 * Schema para unidad/propiedad
 */
export const unitSchema = z.object({
  buildingId: uuidSchema,
  numero: shortTextSchema,
  tipo: z.enum(['apartamento', 'casa', 'local', 'oficina', 'parking', 'trastero', 'otro']),
  superficie: positiveNumberSchema,
  habitaciones: nonNegativeNumberSchema.optional(),
  banos: nonNegativeNumberSchema.optional(),
  precio: currencySchema.optional(),
  descripcion: longTextSchema,
  estado: z.enum(['disponible', 'ocupada', 'mantenimiento', 'vendida']).default('disponible'),
});

/**
 * Schema para inquilino
 */
export const tenantSchema = z.object({
  nombre: shortTextSchema,
  email: emailSchema,
  telefono: phoneSchema,
  dni: shortTextSchema.optional(),
  fechaNacimiento: dateSchema.optional(),
  nacionalidad: shortTextSchema.optional(),
  profesion: shortTextSchema.optional(),
  ingresos: currencySchema.optional(),
  referenciasLaborales: longTextSchema,
  contactoEmergencia: z
    .object({
      nombre: shortTextSchema,
      telefono: phoneSchema,
      relacion: shortTextSchema,
    })
    .optional(),
});

/**
 * Schema para contrato de alquiler
 */
export const contractSchema = z.object({
  unitId: uuidSchema,
  tenantId: uuidSchema,
  fechaInicio: dateSchema,
  fechaFin: dateSchema.optional(),
  precioMensual: currencySchema,
  deposito: currencySchema,
  diaVencimiento: z.number().int().min(1).max(31).default(1),
  gastosIncluidos: z.array(shortTextSchema).optional().default([]),
  clausulas: longTextSchema,
  renovacionAutomatica: z.boolean().default(false),
  estado: z.enum(['borrador', 'activo', 'finalizado', 'cancelado']).default('borrador'),
});

/**
 * Schema para pago
 */
export const paymentSchema = z.object({
  contractId: uuidSchema,
  concepto: shortTextSchema,
  monto: currencySchema,
  fechaVencimiento: dateSchema,
  fechaPago: dateSchema.optional(),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'domiciliacion', 'otro']).optional(),
  referencia: shortTextSchema.optional(),
  estado: z.enum(['pendiente', 'pagado', 'vencido', 'cancelado']).default('pendiente'),
  notas: longTextSchema,
});

/**
 * Schema para gasto/factura
 */
export const expenseSchema = z.object({
  buildingId: uuidSchema.optional(),
  unitId: uuidSchema.optional(),
  categoria: shortTextSchema,
  proveedor: shortTextSchema.optional(),
  concepto: shortTextSchema,
  monto: currencySchema,
  fecha: dateSchema,
  numeroFactura: shortTextSchema.optional(),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'otro']).optional(),
  estado: z.enum(['pendiente', 'pagado', 'cancelado']).default('pendiente'),
  notas: longTextSchema,
});

/**
 * Schema para orden de trabajo/mantenimiento
 */
export const workOrderSchema = z.object({
  buildingId: uuidSchema.optional(),
  unitId: uuidSchema.optional(),
  titulo: shortTextSchema,
  descripcion: longTextSchema,
  tipo: z.enum(['mantenimiento', 'reparacion', 'mejora', 'inspeccion', 'otro']),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).default('media'),
  estado: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']).default('pendiente'),
  fechaSolicitud: dateSchema.default(() => new Date()),
  fechaProgramada: dateSchema.optional(),
  fechaCompletada: dateSchema.optional(),
  asignadoA: shortTextSchema.optional(),
  costoEstimado: currencySchema.optional(),
  costoFinal: currencySchema.optional(),
});

/**
 * Schema para usuario
 */
export const userSchema = z.object({
  name: shortTextSchema,
  email: emailSchema,
  role: z.enum(['super_admin', 'administrador', 'gestor', 'operador', 'community_manager']),
  companyId: uuidSchema.optional(),
  activo: z.boolean().default(true),
});

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const schemas = {
  // Room Rental
  room: roomSchema,
  roomContract: roomContractSchema,
  proration: prorationSchema,
  cleaningSchedule: cleaningScheduleSchema,
  
  // Cupones
  coupon: couponSchema,
  applyCoupon: applyCouponSchema,
  
  // Core
  building: buildingSchema,
  unit: unitSchema,
  tenant: tenantSchema,
  contract: contractSchema,
  payment: paymentSchema,
  expense: expenseSchema,
  workOrder: workOrderSchema,
  user: userSchema,
};
