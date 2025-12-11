/**
 * Esquemas de validación Zod reutilizables para formularios
 * Asegura consistencia y accesibilidad en validación de formularios
 */

import { z } from 'zod';

// ========================================
// SCHEMAS BÁSICOS REUTILIZABLES
// ========================================

export const emailSchema = z
  .string()
  .min(1, 'El correo electrónico es requerido')
  .email('Correo electrónico inválido');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

export const phoneSchema = z
  .string()
  .min(1, 'El teléfono es requerido')
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Formato de teléfono inválido');

export const currencySchema = z
  .number()
  .min(0, 'El monto debe ser mayor o igual a 0')
  .or(z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0)));

export const percentageSchema = z
  .number()
  .min(0, 'El porcentaje debe ser mayor o igual a 0')
  .max(100, 'El porcentaje no puede ser mayor a 100');

// ========================================
// SCHEMA DE LOGIN
// ========================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ========================================
// SCHEMA DE REGISTRO
// ========================================

export const registerSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme su contraseña'),
    companyName: z.string().min(2, 'El nombre de la empresa es requerido'),
    phone: phoneSchema.optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Debe aceptar los términos y condiciones',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ========================================
// SCHEMA DE EDIFICIO
// ========================================

export const buildingSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  ciudad: z.string().min(2, 'La ciudad es requerida'),
  codigoPostal: z.string().min(4, 'El código postal es requerido'),
  pais: z.string().min(2, 'El país es requerido').default('España'),
  tipo: z.enum(['residencial', 'comercial', 'mixto'], {
    errorMap: () => ({ message: 'Seleccione un tipo válido' }),
  }),
  numeroUnidades: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'Debe haber al menos 1 unidad')
    .or(z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1))),
  anoConstructor: z
    .number()
    .int()
    .min(1800, 'Año inválido')
    .max(new Date().getFullYear() + 1, 'Año inválido')
    .optional()
    .or(
      z
        .string()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(z.number().int().min(1800).max(new Date().getFullYear() + 1).optional())
    ),
  descripcion: z.string().optional(),
});

export type BuildingFormData = z.infer<typeof buildingSchema>;

// ========================================
// SCHEMA DE UNIDAD
// ========================================

export const unitSchema = z.object({
  buildingId: z.string().min(1, 'Debe seleccionar un edificio'),
  numero: z.string().min(1, 'El número de unidad es requerido'),
  tipo: z.enum(['apartamento', 'casa', 'estudio', 'local', 'oficina', 'otro'], {
    errorMap: () => ({ message: 'Seleccione un tipo válido' }),
  }),
  superficie: z
    .number()
    .min(1, 'La superficie debe ser mayor a 0')
    .or(z.string().transform((val) => parseFloat(val)).pipe(z.number().min(1))),
  habitaciones: z
    .number()
    .int()
    .min(0, 'Las habitaciones no pueden ser negativas')
    .or(z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(0))),
  banos: z
    .number()
    .min(0, 'Los baños no pueden ser negativos')
    .or(z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0))),
  rentaMensual: currencySchema,
  estado: z.enum(['disponible', 'ocupada', 'mantenimiento', 'reservada'], {
    errorMap: () => ({ message: 'Seleccione un estado válido' }),
  }).default('disponible'),
  planta: z
    .number()
    .int()
    .optional()
    .or(
      z
        .string()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(z.number().int().optional())
    ),
  descripcion: z.string().optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;

// ========================================
// SCHEMA DE INQUILINO
// ========================================

export const tenantSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  email: emailSchema,
  telefono: phoneSchema,
  dni: z.string().min(8, 'El DNI/NIE es requerido'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  nacionalidad: z.string().min(2, 'La nacionalidad es requerida').default('España'),
  profesion: z.string().optional(),
  ingresosMensuales: currencySchema.optional(),
  direccionAnterior: z.string().optional(),
  contactoEmergencia: z.string().optional(),
  telefonoEmergencia: phoneSchema.optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

// ========================================
// SCHEMA DE CONTRATO
// ========================================

export const contractSchema = z.object({
  unitId: z.string().min(1, 'Debe seleccionar una unidad'),
  tenantId: z.string().min(1, 'Debe seleccionar un inquilino'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
  rentaMensual: currencySchema,
  deposito: currencySchema,
  diaCobranza: z
    .number()
    .int()
    .min(1, 'El día debe estar entre 1 y 31')
    .max(31, 'El día debe estar entre 1 y 31')
    .or(z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(31))),
  duracionMeses: z
    .number()
    .int()
    .min(1, 'La duración debe ser al menos 1 mes')
    .optional()
    .or(
      z
        .string()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(z.number().int().min(1).optional())
    ),
  condicionesEspeciales: z.string().optional(),
});

export type ContractFormData = z.infer<typeof contractSchema>;

// ========================================
// SCHEMA DE PAGO
// ========================================

export const paymentSchema = z.object({
  contractId: z.string().min(1, 'Debe seleccionar un contrato'),
  monto: currencySchema,
  fechaVencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres'),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro'], {
    errorMap: () => ({ message: 'Seleccione un método válido' }),
  }).optional(),
  notas: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// ========================================
// UTILIDADES DE VALIDACIÓN
// ========================================

/**
 * Obtiene mensajes de error accesibles para mostrar en formularios
 * @param errors - Objeto de errores de Zod
 * @param field - Nombre del campo
 * @returns Mensaje de error accesible o undefined
 */
export function getAccessibleErrorMessage(
  errors: Record<string, any>,
  field: string
): string | undefined {
  return errors[field]?.message;
}

/**
 * Genera ID único para vincular labels con inputs (accesibilidad)
 * @param fieldName - Nombre del campo
 * @returns ID único para el campo
 */
export function generateFieldId(fieldName: string): string {
  return `field-${fieldName}-${Date.now()}`;
}
