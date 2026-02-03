/**
 * Esquemas de validación Zod centralizados
 *
 * Este archivo contiene todos los esquemas de validación para las entidades principales
 * del sistema, garantizando la seguridad y consistencia de los datos.
 */

import { z } from 'zod';

// ====================================
// EDIFICIOS (BUILDINGS)
// ====================================

export const buildingCreateSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  direccion: z
    .string()
    .min(1, 'La dirección es requerida')
    .max(500, 'La dirección no puede exceder 500 caracteres')
    .trim(),
  ciudad: z
    .string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim(),
  codigoPostal: z
    .string()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos')
    .optional()
    .or(z.literal('')),
  pais: z
    .string()
    .min(1, 'El país es requerido')
    .max(100, 'El país no puede exceder 100 caracteres')
    .trim()
    .default('España'),
  numeroUnidades: z
    .number()
    .int('Debe ser un número entero')
    .nonnegative('Debe ser un número positivo')
    .max(10000, 'El número de unidades no puede exceder 10,000')
    .optional(),
  tipo: z.enum(['residencial', 'comercial', 'mixto', 'otro']).optional().default('residencial'),
  anoConstructor: z
    .number()
    .int('Debe ser un año válido')
    .min(1800, 'El año no puede ser anterior a 1800')
    .max(new Date().getFullYear() + 10, 'El año no puede ser superior al actual + 10')
    .optional(),
  descripcion: z.string().max(2000, 'La descripción no puede exceder 2000 caracteres').optional(),
});

export const buildingUpdateSchema = buildingCreateSchema.partial();

// ====================================
// UNIDADES (UNITS)
// ====================================

export const unitCreateSchema = z.object({
  buildingId: z.string().uuid('ID de edificio inválido'),
  numero: z
    .string()
    .min(1, 'El número de unidad es requerido')
    .max(50, 'El número no puede exceder 50 caracteres')
    .trim(),
  piso: z.string().max(20, 'El piso no puede exceder 20 caracteres').optional(),
  tipo: z.enum(['vivienda', 'local', 'garaje', 'trastero']).optional().default('vivienda'),
  estado: z.enum(['disponible', 'ocupada', 'en_mantenimiento']).optional().default('disponible'),
  habitaciones: z
    .number()
    .int('Debe ser un número entero')
    .nonnegative('Debe ser cero o más')
    .max(50, 'El número de habitaciones no puede exceder 50')
    .optional(),
  banos: z
    .number()
    .int('Debe ser un número entero')
    .nonnegative('Debe ser cero o más')
    .max(20, 'El número de baños no puede exceder 20')
    .optional(),
  superficie: z
    .number()
    .positive('La superficie debe ser mayor a 0')
    .max(100000, 'La superficie no puede exceder 100,000 m²')
    .optional(),
  rentaMensual: z
    .number()
    .nonnegative('La renta debe ser cero o mayor')
    .max(1000000, 'La renta mensual no puede exceder 1,000,000')
    .optional(),
  descripcion: z.string().max(2000, 'La descripción no puede exceder 2000 caracteres').optional(),
});

export const unitUpdateSchema = unitCreateSchema.partial().omit({ buildingId: true });

// ====================================
// INQUILINOS (TENANTS)
// ====================================

export const tenantCreateSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  apellidos: z
    .string()
    .min(1, 'Los apellidos son requeridos')
    .max(200, 'Los apellidos no pueden exceder 200 caracteres')
    .trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  telefono: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Teléfono inválido'
    )
    .trim(),
  dni: z
    .string()
    .regex(/^[0-9]{8}[A-Z]$/, 'DNI/NIE inválido (formato: 12345678A)')
    .toUpperCase()
    .trim()
    .optional()
    .or(z.literal('')),
  fechaNacimiento: z.string().datetime({ message: 'Fecha inválida' }).or(z.date()).optional(),
  nacionalidad: z.string().max(100, 'La nacionalidad no puede exceder 100 caracteres').optional(),
  estado: z.enum(['activo', 'inactivo', 'moroso', 'pendiente']).optional().default('activo'),
  ocupacion: z.string().max(200, 'La ocupación no puede exceder 200 caracteres').optional(),
  ingresosMensuales: z
    .number()
    .nonnegative('Los ingresos deben ser cero o mayores')
    .max(10000000, 'Los ingresos mensuales no pueden exceder 10,000,000')
    .optional(),
  notasInternas: z
    .string()
    .max(5000, 'Las notas internas no pueden exceder 5000 caracteres')
    .optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

// ====================================
// CONTRATOS (CONTRACTS)
// ====================================

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateOrDateTimeString = (message: string) =>
  z.string().datetime({ message }).or(z.string().regex(dateOnlyRegex, message));

const contractBaseSchema = z.object({
  unitId: z.string().uuid('ID de unidad inválido'),
  tenantId: z.string().uuid('ID de inquilino inválido'),
  fechaInicio: dateOrDateTimeString('Fecha de inicio inválida').or(z.date()),
  fechaFin: dateOrDateTimeString('Fecha de fin inválida').or(z.date()),
  rentaMensual: z
    .number()
    .positive('La renta mensual debe ser mayor a 0')
    .max(1000000, 'La renta mensual no puede exceder 1,000,000'),
  diaCobranza: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'El día debe estar entre 1 y 31')
    .max(31, 'El día debe estar entre 1 y 31')
    .optional()
    .default(1),
  deposito: z
    .number()
    .nonnegative('El depósito debe ser cero o mayor')
    .max(10000000, 'El depósito no puede exceder 10,000,000')
    .optional(),
  estado: z.enum(['activo', 'vencido', 'cancelado']).optional().default('activo'),
  clausulasEspeciales: z
    .string()
    .max(5000, 'Las cláusulas especiales no pueden exceder 5000 caracteres')
    .optional(),
  renovacionAutomatica: z.boolean().optional().default(false),
});

export const contractCreateSchema = contractBaseSchema.refine(
  (data) => {
    const inicio = new Date(data.fechaInicio);
    const fin = new Date(data.fechaFin);
    return fin > inicio;
  },
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  }
);

export const contractUpdateSchema = contractBaseSchema
  .partial()
  .omit({ unitId: true, tenantId: true });

// ====================================
// PAGOS (PAYMENTS)
// ====================================

export const paymentCreateSchema = z.object({
  contractId: z.string().uuid('ID de contrato inválido'),
  monto: z
    .number()
    .positive('El monto debe ser positivo')
    .max(10000000, 'El monto no puede exceder 10,000,000'),
  fechaVencimiento: dateOrDateTimeString('Fecha de vencimiento inválida').or(z.date()),
  concepto: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(500, 'El concepto no puede exceder 500 caracteres')
    .trim(),
  estado: z.enum(['pendiente', 'pagado', 'atrasado', 'cancelado']).optional().default('pendiente'),
  metodoPago: z
    .enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'domiciliacion', 'otro'])
    .optional(),
  fechaPago: dateOrDateTimeString('Fecha de pago inválida').or(z.date()).optional(),
  referencia: z.string().max(200, 'La referencia no puede exceder 200 caracteres').optional(),
  notas: z.string().max(2000, 'Las notas no pueden exceder 2000 caracteres').optional(),
});

export const paymentUpdateSchema = paymentCreateSchema.partial().omit({ contractId: true });

// ====================================
// MANTENIMIENTO (MAINTENANCE)
// ====================================

export const maintenanceCreateSchema = z.object({
  unitId: z.string().uuid('ID de unidad inválido').optional(),
  buildingId: z.string().uuid('ID de edificio inválido'),
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .trim(),
  tipo: z
    .enum(['correctivo', 'preventivo', 'emergencia', 'mejora'])
    .optional()
    .default('correctivo'),
  prioridad: z.enum(['baja', 'media', 'alta']).optional().default('media'),
  estado: z
    .enum(['pendiente', 'en_progreso', 'programado', 'completado'])
    .optional()
    .default('pendiente'),
  fechaProgramada: z
    .string()
    .datetime({ message: 'Fecha programada inválida' })
    .or(z.date())
    .optional(),
  costoEstimado: z
    .number()
    .nonnegative('El costo estimado debe ser cero o mayor')
    .max(10000000, 'El costo estimado no puede exceder 10,000,000')
    .optional(),
  costoFinal: z
    .number()
    .nonnegative('El costo final debe ser cero o mayor')
    .max(10000000, 'El costo final no puede exceder 10,000,000')
    .optional(),
  asignadoA: z.string().uuid('ID de proveedor inválido').optional(),
});

export const maintenanceUpdateSchema = maintenanceCreateSchema.partial().omit({ buildingId: true });

// ====================================
// PROVEEDORES (PROVIDERS)
// ====================================

export const providerCreateSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  tipo: z
    .string()
    .min(1, 'El tipo es requerido')
    .max(100, 'El tipo no puede exceder 100 caracteres')
    .trim(),
  email: z.string().email('Email inválido').toLowerCase().trim().optional(),
  telefono: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Teléfono inválido'
    )
    .trim(),
  direccion: z.string().max(500, 'La dirección no puede exceder 500 caracteres').optional(),
  rating: z
    .number()
    .min(0, 'La calificación mínima es 0')
    .max(5, 'La calificación máxima es 5')
    .optional(),
  notas: z.string().max(5000, 'Las notas no pueden exceder 5000 caracteres').optional(),
});

export const providerUpdateSchema = providerCreateSchema.partial();

// ====================================
// USUARIOS (USERS)
// ====================================

export const userCreateSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
    ),
  role: z.enum(['administrador', 'gestor', 'operador', 'super_admin']).optional().default('gestor'),
  companyId: z.string().uuid('ID de compañía inválido').optional(),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

// ====================================
// GASTOS (EXPENSES)
// ====================================

export const expenseCreateSchema = z.object({
  buildingId: z.string().uuid('ID de edificio inválido').optional(),
  unitId: z.string().uuid('ID de unidad inválido').optional(),
  providerId: z.string().uuid('ID de proveedor inválido').optional(),
  concepto: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(500, 'El concepto no puede exceder 500 caracteres')
    .trim(),
  categoria: z.enum([
    'mantenimiento',
    'servicios',
    'impuestos',
    'seguros',
    'suministros',
    'personal',
    'marketing',
    'legal',
    'tecnologia',
    'otro',
  ]),
  monto: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(10000000, 'El monto no puede exceder 10,000,000'),
  fecha: z.string().datetime({ message: 'Fecha inválida' }).or(z.date()),
  facturaPdfPath: z
    .string()
    .max(1000, 'La ruta del archivo no puede exceder 1000 caracteres')
    .optional(),
  numeroFactura: z
    .string()
    .max(100, 'El número de factura no puede exceder 100 caracteres')
    .optional(),
  notas: z.string().max(5000, 'Las notas no pueden exceder 5000 caracteres').optional(),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

// ====================================
// TAREAS (TASKS)
// ====================================

export const taskCreateSchema = z.object({
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  descripcion: z.string().max(5000, 'La descripción no puede exceder 5000 caracteres').optional(),
  estado: z
    .enum(['pendiente', 'en_progreso', 'completado', 'cancelado'])
    .optional()
    .default('pendiente'),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional().default('media'),
  fechaLimite: z.string().datetime({ message: 'Fecha límite inválida' }).or(z.date()).optional(),
  fechaInicio: z.string().datetime({ message: 'Fecha de inicio inválida' }).or(z.date()).optional(),
  asignadoA: z.string().uuid('ID de usuario asignado inválido').optional(),
  notas: z.string().max(5000, 'Las notas no pueden exceder 5000 caracteres').optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

// ====================================
// DOCUMENTOS (DOCUMENTS)
// ====================================

export const documentCreateSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(500, 'El nombre no puede exceder 500 caracteres')
    .trim(),
  tipo: z.enum([
    'contrato',
    'factura',
    'recibo',
    'escritura',
    'cedula',
    'seguro',
    'certificado',
    'otro',
  ]),
  buildingId: z.string().uuid('ID de edificio inválido').optional(),
  unitId: z.string().uuid('ID de unidad inválido').optional(),
  tenantId: z.string().uuid('ID de inquilino inválido').optional(),
  contractId: z.string().uuid('ID de contrato inválido').optional(),
  cloud_storage_path: z
    .string()
    .min(1, 'La ruta del archivo es requerida')
    .max(2000, 'La ruta del archivo no puede exceder 2000 caracteres'),
  fileSize: z
    .number()
    .positive('El tamaño del archivo debe ser mayor a 0')
    .max(104857600, 'El tamaño del archivo no puede exceder 100MB'),
  mimeType: z.string().max(200, 'El tipo MIME no puede exceder 200 caracteres').optional(),
  descripcion: z.string().max(2000, 'La descripción no puede exceder 2000 caracteres').optional(),
  fechaVencimiento: z
    .string()
    .datetime({ message: 'Fecha de vencimiento inválida' })
    .or(z.date())
    .optional(),
});

export const documentUpdateSchema = documentCreateSchema
  .partial()
  .omit({ cloud_storage_path: true });

// ====================================
// TIPOS DE EXPORTACIÓN
// ====================================

export type BuildingCreateInput = z.infer<typeof buildingCreateSchema>;
export type BuildingUpdateInput = z.infer<typeof buildingUpdateSchema>;
export type UnitCreateInput = z.infer<typeof unitCreateSchema>;
export type UnitUpdateInput = z.infer<typeof unitUpdateSchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
export type ContractCreateInput = z.infer<typeof contractCreateSchema>;
export type ContractUpdateInput = z.infer<typeof contractUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
export type MaintenanceCreateInput = z.infer<typeof maintenanceCreateSchema>;
export type MaintenanceUpdateInput = z.infer<typeof maintenanceUpdateSchema>;
export type ProviderCreateInput = z.infer<typeof providerCreateSchema>;
export type ProviderUpdateInput = z.infer<typeof providerUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
