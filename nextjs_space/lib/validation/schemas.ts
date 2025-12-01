/**
 * Schemas de validación con Zod
 * Proporciona validación y sanitización centralizada de datos
 */

import { z } from 'zod';

/**
 * Funciones helper para sanitización
 */
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>"']/g, '') // Remove potentially dangerous characters
    .slice(0, 500); // Limit length
};

const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^0-9+\-\s()]/g, '').trim();
};

/**
 * Schemas comunes
 */
export const commonSchemas = {
  email: z.string()
    .email('Email inválido')
    .transform(sanitizeEmail),
  
  phone: z.string()
    .min(9, 'Teléfono muy corto')
    .max(20, 'Teléfono muy largo')
    .transform(sanitizePhone),
  
  url: z.string()
    .url('URL inválida')
    .max(500, 'URL demasiado larga'),
  
  postalCode: z.string()
    .min(4, 'Código postal inválido')
    .max(10, 'Código postal inválido')
    .transform(s => s.replace(/\s/g, '').toUpperCase()),
  
  currency: z.number()
    .positive('El monto debe ser positivo')
    .max(9999999999, 'El monto es demasiado grande'),
  
  percentage: z.number()
    .min(0, 'El porcentaje no puede ser negativo')
    .max(100, 'El porcentaje no puede ser mayor a 100'),
  
  date: z.coerce.date({
    errorMap: () => ({ message: 'Fecha inválida' }),
  }),
  
  futureDate: z.coerce.date()
    .refine((date) => date > new Date(), {
      message: 'La fecha debe ser futura',
    }),
  
  pastDate: z.coerce.date()
    .refine((date) => date <= new Date(), {
      message: 'La fecha no puede ser futura',
    }),
};

/**
 * Schema para Edificios
 */
export const buildingSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo')
    .transform(sanitizeString),
  
  direccion: z.string()
    .min(1, 'La dirección es requerida')
    .max(200, 'La dirección es demasiado larga')
    .transform(sanitizeString),
  
  ciudad: z.string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'La ciudad es demasiado larga')
    .transform(sanitizeString),
  
  codigoPostal: commonSchemas.postalCode.optional(),
  
  numeroUnidades: z.number()
    .int('Debe ser un número entero')
    .positive('Debe ser mayor a 0')
    .max(10000, 'Número de unidades demasiado grande'),
  
  anosConstruccion: z.number()
    .int()
    .min(1800, 'Año inválido')
    .max(new Date().getFullYear() + 5, 'Año inválido')
    .optional(),
  
  descripcion: z.string()
    .max(1000, 'La descripción es demasiado larga')
    .transform(sanitizeString)
    .optional(),
  
  companyId: z.string().uuid('ID de compañía inválido'),
});

export type BuildingInput = z.infer<typeof buildingSchema>;

/**
 * Schema para Unidades
 */
export const unitSchema = z.object({
  numero: z.string()
    .min(1, 'El número es requerido')
    .max(20, 'El número es demasiado largo')
    .transform(sanitizeString),
  
  tipo: z.enum(['APARTAMENTO', 'CASA', 'LOCAL_COMERCIAL', 'OFICINA', 'ESTUDIO', 'LOFT', 'PARKING', 'BODEGA'], {
    errorMap: () => ({ message: 'Tipo de unidad inválido' }),
  }),
  
  estado: z.enum(['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO', 'RESERVADA'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
  
  tamano: z.number()
    .positive('El tamaño debe ser positivo')
    .max(100000, 'Tamaño demasiado grande')
    .optional(),
  
  habitaciones: z.number()
    .int()
    .min(0, 'Número inválido')
    .max(50, 'Número demasiado grande')
    .optional(),
  
  banos: z.number()
    .int()
    .min(0, 'Número inválido')
    .max(20, 'Número demasiado grande')
    .optional(),
  
  piso: z.number()
    .int()
    .min(-10, 'Piso inválido')
    .max(200, 'Piso inválido')
    .optional(),
  
  rentaMensual: commonSchemas.currency.optional(),
  
  descripcion: z.string()
    .max(1000, 'La descripción es demasiado larga')
    .transform(sanitizeString)
    .optional(),
  
  buildingId: z.string().uuid('ID de edificio inválido'),
});

export type UnitInput = z.infer<typeof unitSchema>;

/**
 * Schema para Inquilinos
 */
export const tenantSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo')
    .transform(sanitizeString),
  
  apellido: z.string()
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido es demasiado largo')
    .transform(sanitizeString),
  
  email: commonSchemas.email,
  
  telefono: commonSchemas.phone.optional(),
  
  dni: z.string()
    .min(5, 'DNI muy corto')
    .max(20, 'DNI muy largo')
    .transform(s => s.replace(/[^A-Z0-9]/gi, '').toUpperCase())
    .optional(),
  
  fechaNacimiento: commonSchemas.pastDate.optional(),
  
  ocupacion: z.string()
    .max(100, 'Ocupación demasiado larga')
    .transform(sanitizeString)
    .optional(),
  
  ingresosMensuales: commonSchemas.currency.optional(),
  
  contactoEmergencia: z.string()
    .max(100, 'Nombre demasiado largo')
    .transform(sanitizeString)
    .optional(),
  
  telefonoEmergencia: commonSchemas.phone.optional(),
  
  companyId: z.string().uuid('ID de compañía inválido'),
});

export type TenantInput = z.infer<typeof tenantSchema>;

/**
 * Schema para Contratos
 */
export const contractSchema = z.object({
  fechaInicio: commonSchemas.date,
  
  fechaFin: commonSchemas.futureDate,
  
  rentaMensual: commonSchemas.currency,
  
  diaPago: z.number()
    .int()
    .min(1, 'Día inválido')
    .max(31, 'Día inválido'),
  
  deposito: commonSchemas.currency.optional(),
  
  clausulas: z.string()
    .max(5000, 'Cláusulas demasiado largas')
    .optional(),
  
  estado: z.enum(['ACTIVO', 'FINALIZADO', 'CANCELADO', 'PENDIENTE'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }).default('ACTIVO'),
  
  unitId: z.string().uuid('ID de unidad inválido'),
  tenantId: z.string().uuid('ID de inquilino inválido'),
  companyId: z.string().uuid('ID de compañía inválido'),
}).refine(
  (data) => data.fechaFin > data.fechaInicio,
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  }
);

export type ContractInput = z.infer<typeof contractSchema>;

/**
 * Schema para Pagos
 */
export const paymentSchema = z.object({
  monto: commonSchemas.currency,
  
  fechaPago: commonSchemas.date,
  
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE', 'OTRO'], {
    errorMap: () => ({ message: 'Método de pago inválido' }),
  }),
  
  concepto: z.string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto es demasiado largo')
    .transform(sanitizeString),
  
  referencia: z.string()
    .max(100, 'Referencia demasiado larga')
    .transform(sanitizeString)
    .optional(),
  
  notas: z.string()
    .max(500, 'Notas demasiado largas')
    .transform(sanitizeString)
    .optional(),
  
  estado: z.enum(['PENDIENTE', 'COMPLETADO', 'RECHAZADO', 'REEMBOLSADO'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }).default('COMPLETADO'),
  
  contractId: z.string().uuid('ID de contrato inválido'),
  companyId: z.string().uuid('ID de compañía inválido'),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

/**
 * Schema para Mantenimiento
 */
export const maintenanceSchema = z.object({
  titulo: z.string()
    .min(1, 'El título es requerido')
    .max(150, 'El título es demasiado largo')
    .transform(sanitizeString),
  
  descripcion: z.string()
    .min(1, 'La descripción es requerida')
    .max(2000, 'La descripción es demasiado larga')
    .transform(sanitizeString),
  
  tipo: z.enum(['PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA', 'MEJORA'], {
    errorMap: () => ({ message: 'Tipo inválido' }),
  }),
  
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE'], {
    errorMap: () => ({ message: 'Prioridad inválida' }),
  }),
  
  estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }).default('PENDIENTE'),
  
  fechaProgramada: commonSchemas.date.optional(),
  
  costo: commonSchemas.currency.optional(),
  
  unitId: z.string().uuid('ID de unidad inválido').optional(),
  buildingId: z.string().uuid('ID de edificio inválido'),
  companyId: z.string().uuid('ID de compañía inválido'),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

/**
 * Schema para autenticación
 */
export const authSchemas = {
  login: z.object({
    email: commonSchemas.email,
    password: z.string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(100, 'Contraseña demasiado larga'),
  }),
  
  register: z.object({
    email: commonSchemas.email,
    password: z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'Contraseña demasiado larga')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
    nombre: z.string()
      .min(1, 'El nombre es requerido')
      .max(100, 'El nombre es demasiado largo')
      .transform(sanitizeString),
    apellido: z.string()
      .min(1, 'El apellido es requerido')
      .max(100, 'El apellido es demasiado largo')
      .transform(sanitizeString),
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    }
  ),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'Contraseña demasiado larga')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmNewPassword: z.string(),
  }).refine(
    (data) => data.newPassword === data.confirmNewPassword,
    {
      message: 'Las contraseñas no coinciden',
      path: ['confirmNewPassword'],
    }
  ).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: 'La nueva contraseña debe ser diferente a la actual',
      path: ['newPassword'],
    }
  ),
};

/**
 * Helper para validar y sanitizar datos
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Helper para formatear errores de Zod para respuestas de API
 */
export function formatZodErrors(error: z.ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
