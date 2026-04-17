/**
 * Esquemas de validación Zod centralizados
 *
 * Este archivo contiene todos los esquemas de validación para las entidades principales
 * del sistema, garantizando la seguridad y consistencia de los datos.
 */

import { z } from 'zod';

// ====================================
// HELPERS COMUNES
// ====================================

// IDs en esta app son CUID (Prisma @default(cuid())), no UUID. Aceptamos string
// no vacío de longitud razonable para ser tolerantes a cuid/uuid/identifiers.
const idStringSchema = z.string().min(1, 'ID requerido').max(64, 'ID inválido');

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
  ciudad: z.string().max(100, 'La ciudad no puede exceder 100 caracteres').trim().optional(),
  codigoPostal: z
    .string()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos')
    .optional()
    .or(z.literal('')),
  pais: z
    .string()
    .max(100, 'El país no puede exceder 100 caracteres')
    .trim()
    .optional()
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
  buildingId: idStringSchema,
  numero: z
    .string()
    .min(1, 'El número de unidad es requerido')
    .max(50, 'El número no puede exceder 50 caracteres')
    .trim(),
  piso: z.string().max(20, 'El piso no puede exceder 20 caracteres').optional(),
  tipo: z
    .enum([
      'vivienda',
      'local',
      'garaje',
      'trastero',
      'oficina',
      'nave_industrial',
      'coworking_space',
    ])
    .optional()
    .default('vivienda'),
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
  gastosComunidad: z
    .number()
    .nonnegative('Los gastos de comunidad deben ser cero o mayor')
    .nullable()
    .optional(),
  ibiAnual: z.number().nonnegative('El IBI debe ser cero o mayor').nullable().optional(),
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
  email: z.string().email('Email inválido').toLowerCase().trim()
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .max(30, 'Teléfono no puede exceder 30 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  dni: z
    .string()
    .max(20, 'DNI/NIE no puede exceder 20 caracteres')
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
  iban: z.string().max(34).optional(),
  bic: z.string().max(11).optional(),
  metodoPago: z.string().max(50).optional(),
  personaContacto: z.string().max(200).optional(),
  ciudad: z.string().max(100).optional(),
  codigoPostal: z.string().max(20).optional(),
  provincia: z.string().max(100).optional(),
  pais: z.string().max(100).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

// ====================================
// CONTRATOS (CONTRACTS)
// ====================================

const contractBaseSchema = z.object({
  unitId: idStringSchema,
  tenantId: idStringSchema,
  fechaInicio: z.string().datetime({ message: 'Fecha de inicio inválida' }).or(z.date()),
  fechaFin: z.string().datetime({ message: 'Fecha de fin inválida' }).or(z.date()),
  rentaMensual: z
    .number()
    .positive('La renta mensual debe ser mayor a 0')
    .max(1000000, 'La renta mensual no puede exceder 1,000,000'),
  baseImponible: z.number().nonnegative().optional(),
  ivaPorcentaje: z.number().min(0).max(100).optional().default(0),
  importeIva: z.number().nonnegative().optional(),
  rentaTotal: z.number().nonnegative().optional(),
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
  codigoOperacion: z.string().max(100).optional(),
  suministrosProvisionales: z.number().nonnegative().optional(),
  ibiRepercutido: z.number().nonnegative().optional(),
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

const paymentBaseSchema = z.object({
  contractId: idStringSchema,
  monto: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(10000000, 'El monto no puede exceder 10,000,000'),
  fechaVencimiento: z.string().datetime({ message: 'Fecha de vencimiento inválida' }).or(z.date()),
  concepto: z.string().max(500, 'El concepto no puede exceder 500 caracteres').trim().optional(),
  estado: z.enum(['pendiente', 'pagado', 'atrasado']).optional().default('pendiente'),
  metodoPago: z
    .enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'domiciliacion', 'otro'])
    .optional(),
  fechaPago: z.string().datetime({ message: 'Fecha de pago inválida' }).or(z.date()).optional(),
  referencia: z.string().max(200, 'La referencia no puede exceder 200 caracteres').optional(),
  baseImponible: z.number().optional(),
  iva: z.number().optional(),
  irpf: z.number().optional(),
  notas: z.string().max(2000, 'Las notas no pueden exceder 2000 caracteres').optional(),
  periodo: z.string().max(200).optional(),
});

// Validación adicional: fechaVencimiento no más de 5 años en el futuro
const validateFutureDate = (data: { fechaVencimiento?: string | Date }) => {
  if (!data.fechaVencimiento) return true;
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  const fecha =
    typeof data.fechaVencimiento === 'string'
      ? new Date(data.fechaVencimiento)
      : data.fechaVencimiento;
  return fecha <= maxDate;
};

export const paymentCreateSchema = paymentBaseSchema.refine(validateFutureDate, {
  message: 'La fecha de vencimiento no puede ser más de 5 años en el futuro',
  path: ['fechaVencimiento'],
});

export const paymentUpdateSchema = paymentBaseSchema
  .partial()
  .omit({ contractId: true })
  .refine(validateFutureDate, {
    message: 'La fecha de vencimiento no puede ser más de 5 años en el futuro',
    path: ['fechaVencimiento'],
  });

// ====================================
// MANTENIMIENTO (MAINTENANCE)
// ====================================

export const maintenanceCreateSchema = z.object({
  unitId: idStringSchema.optional(),
  buildingId: idStringSchema,
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
  asignadoA: idStringSchema.optional(),
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
  companyId: idStringSchema.optional(),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

// ====================================
// GASTOS (EXPENSES)
// ====================================

export const expenseCreateSchema = z.object({
  buildingId: z.string().min(1, 'ID de edificio inválido').optional().nullable(),
  unitId: z.string().min(1, 'ID de unidad inválido').optional().nullable(),
  providerId: z.string().min(1, 'ID de proveedor inválido').optional().nullable(),
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
    'reparaciones',
    'comunidad',
    'suministros',
    'personal',
    'marketing',
    'legal',
    'tecnologia',
    'otro',
  ]),
  monto: z
    .union([z.number(), z.string().transform((v) => parseFloat(v))])
    .pipe(
      z
        .number()
        .positive('El monto debe ser mayor a 0')
        .max(10000000, 'El monto no puede exceder 10,000,000')
    ),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida (formato YYYY-MM-DD)')
    .or(z.string().datetime())
    .or(z.date()),
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
    .enum(['pendiente', 'en_progreso', 'completada', 'cancelada'])
    .optional()
    .default('pendiente'),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional().default('media'),
  fechaLimite: z.string().optional(),
  fechaInicio: z.string().optional(),
  asignadoA: idStringSchema.optional(),
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
  buildingId: idStringSchema.optional(),
  unitId: idStringSchema.optional(),
  tenantId: idStringSchema.optional(),
  contractId: idStringSchema.optional(),
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
