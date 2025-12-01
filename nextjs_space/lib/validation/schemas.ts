/**
 * Validation Schemas
 * Centralized validation schemas using Zod
 */

import { z } from 'zod';
import { sanitizedSchemas } from '@/lib/security/sanitize';

// Auth schemas
export const loginSchema = z.object({
  email: sanitizedSchemas.email(),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  nombre: sanitizedSchemas.text(1, 100),
  apellidos: sanitizedSchemas.text(0, 100).optional(),
  email: sanitizedSchemas.email(),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Building schemas
export const buildingCreateSchema = z.object({
  nombre: sanitizedSchemas.text(1, 100),
  direccion: sanitizedSchemas.text(1, 200),
  ciudad: sanitizedSchemas.text(0, 100).optional(),
  codigoPostal: sanitizedSchemas.alphanumeric(0, 10).optional(),
  pais: sanitizedSchemas.text(0, 100).optional(),
  numeroUnidades: z.number().int().positive().max(10000),
  anosConstruccion: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
  descripcion: sanitizedSchemas.text(0, 2000).optional(),
  notas: sanitizedSchemas.text(0, 5000).optional(),
});

export const buildingUpdateSchema = buildingCreateSchema.partial();

// Unit schemas
export const unitCreateSchema = z.object({
  buildingId: z.string().cuid(),
  numero: sanitizedSchemas.text(1, 20),
  piso: sanitizedSchemas.text(0, 10).optional(),
  tipo: z.enum(['apartamento', 'oficina', 'local', 'garaje', 'trastero', 'otro']),
  habitaciones: z.number().int().nonnegative().optional(),
  banos: z.number().int().nonnegative().optional(),
  metrosCuadrados: z.number().positive().optional(),
  estado: z.enum(['disponible', 'ocupado', 'mantenimiento', 'renovacion']),
  renta: z.number().nonnegative().optional(),
  descripcion: sanitizedSchemas.text(0, 2000).optional(),
});

export const unitUpdateSchema = unitCreateSchema.partial().omit({ buildingId: true });

// Tenant schemas
export const tenantCreateSchema = z.object({
  nombre: sanitizedSchemas.text(1, 100),
  apellidos: sanitizedSchemas.text(1, 100),
  email: sanitizedSchemas.email(),
  telefono: sanitizedSchemas.phone().optional(),
  telefonoAlternativo: sanitizedSchemas.phone().optional(),
  dni: sanitizedSchemas.alphanumeric(5, 20).optional(),
  fechaNacimiento: z.coerce.date().optional(),
  ocupacion: sanitizedSchemas.text(0, 100).optional(),
  empresaTrabajo: sanitizedSchemas.text(0, 100).optional(),
  referencias: sanitizedSchemas.text(0, 1000).optional(),
  notas: sanitizedSchemas.text(0, 5000).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

// Contract schemas
export const contractCreateSchema = z.object({
  unitId: z.string().cuid(),
  tenantId: z.string().cuid(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  renta: z.number().positive(),
  diaCobranza: z.number().int().min(1).max(31),
  deposito: z.number().nonnegative(),
  duracionMeses: z.number().int().positive(),
  renovacionAutomatica: z.boolean().optional(),
  condiciones: sanitizedSchemas.html().optional(),
  notas: sanitizedSchemas.text(0, 5000).optional(),
}).refine((data) => data.fechaFin > data.fechaInicio, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin'],
});

export const contractUpdateSchema = z.object({
  unitId: z.string().cuid().optional(),
  tenantId: z.string().cuid().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
  renta: z.number().positive().optional(),
  diaCobranza: z.number().int().min(1).max(31).optional(),
  deposito: z.number().nonnegative().optional(),
  duracionMeses: z.number().int().positive().optional(),
  renovacionAutomatica: z.boolean().optional(),
  condiciones: sanitizedSchemas.html().optional(),
  notas: sanitizedSchemas.text(0, 5000).optional(),
}).omit({ unitId: true, tenantId: true });

// Payment schemas
export const paymentCreateSchema = z.object({
  contractId: z.string().cuid(),
  monto: z.number().positive(),
  fechaPago: z.coerce.date(),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro']),
  concepto: sanitizedSchemas.text(1, 200),
  referencia: sanitizedSchemas.alphanumeric(0, 50).optional(),
  estado: z.enum(['pendiente', 'pagado', 'parcial', 'atrasado', 'cancelado']),
  notas: sanitizedSchemas.text(0, 1000).optional(),
});

export const paymentUpdateSchema = paymentCreateSchema.partial()
  .omit({ contractId: true });

// Maintenance schemas
export const maintenanceCreateSchema = z.object({
  unitId: z.string().cuid(),
  titulo: sanitizedSchemas.text(1, 200),
  descripcion: sanitizedSchemas.text(1, 5000),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']),
  categoria: z.enum([
    'fontaneria',
    'electricidad',
    'climatizacion',
    'estructura',
    'pintura',
    'limpieza',
    'jardineria',
    'seguridad',
    'electrodomesticos',
    'otro',
  ]),
  estado: z.enum(['abierto', 'en_progreso', 'en_espera', 'resuelto', 'cancelado']),
  costoEstimado: z.number().nonnegative().optional(),
  fechaLimite: z.coerce.date().optional(),
});

export const maintenanceUpdateSchema = maintenanceCreateSchema.partial()
  .omit({ unitId: true });

// Document schemas
export const documentUploadSchema = z.object({
  nombre: sanitizedSchemas.fileName(),
  tipo: z.enum(['contrato', 'identificacion', 'comprobante', 'factura', 'otro']),
  descripcion: sanitizedSchemas.text(0, 500).optional(),
  entidadTipo: z.enum(['building', 'unit', 'tenant', 'contract', 'payment', 'maintenance']),
  entidadId: z.string().cuid(),
});

// User schemas
export const userCreateSchema = z.object({
  nombre: sanitizedSchemas.text(1, 100),
  apellidos: sanitizedSchemas.text(0, 100).optional(),
  email: sanitizedSchemas.email(),
  telefono: sanitizedSchemas.phone().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'agent', 'user']),
  password: z.string().min(8),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

// Company schemas
export const companyCreateSchema = z.object({
  nombre: sanitizedSchemas.text(1, 100),
  cif: sanitizedSchemas.alphanumeric(0, 20).optional(),
  direccion: sanitizedSchemas.text(0, 200).optional(),
  telefono: sanitizedSchemas.phone().optional(),
  email: sanitizedSchemas.email().optional(),
  contactoPrincipal: sanitizedSchemas.text(0, 100).optional(),
  emailContacto: sanitizedSchemas.email().optional(),
  telefonoContacto: sanitizedSchemas.phone().optional(),
  maxUsuarios: z.number().int().positive().optional(),
  maxPropiedades: z.number().int().positive().optional(),
  maxEdificios: z.number().int().positive().optional(),
  subscriptionPlanId: z.string().cuid().optional(),
  estadoCliente: z.enum(['activo', 'prueba', 'suspendido', 'cancelado']).optional(),
  notasAdmin: sanitizedSchemas.text(0, 5000).optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial();

// Bulk operations
export const bulkOperationSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'changePlan', 'changeStatus', 'delete']),
  ids: z.array(z.string().cuid()).min(1, 'Al menos un ID es requerido'),
  subscriptionPlanId: z.string().cuid().optional(),
  estadoCliente: z.enum(['activo', 'prueba', 'suspendido', 'cancelado']).optional(),
}).refine(
  (data) => {
    if (data.action === 'changePlan') {
      return !!data.subscriptionPlanId;
    }
    if (data.action === 'changeStatus') {
      return !!data.estadoCliente;
    }
    return true;
  },
  {
    message: 'Parámetros requeridos para la acción seleccionada',
    path: ['action'],
  }
);

// Search and filter schemas
export const searchSchema = z.object({
  query: sanitizedSchemas.text(0, 200).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const buildingFilterSchema = searchSchema.extend({
  ciudad: sanitizedSchemas.text(0, 100).optional(),
  minUnidades: z.number().int().nonnegative().optional(),
  maxUnidades: z.number().int().positive().optional(),
});

export const tenantFilterSchema = searchSchema.extend({
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export const contractFilterSchema = searchSchema.extend({
  estado: z.enum(['activo', 'vencido', 'cancelado']).optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
});

export const paymentFilterSchema = searchSchema.extend({
  estado: z.enum(['pendiente', 'pagado', 'parcial', 'atrasado', 'cancelado']).optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  minMonto: z.number().nonnegative().optional(),
  maxMonto: z.number().positive().optional(),
});

export const maintenanceFilterSchema = searchSchema.extend({
  estado: z.enum(['abierto', 'en_progreso', 'en_espera', 'resuelto', 'cancelado']).optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  categoria: z.string().optional(),
});
