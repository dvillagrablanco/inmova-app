/**
 * Validation Schemas
 * Centralized validation schemas using Zod
 */

import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  nombre: z.string().min(1).max(100),
  apellidos: z.string().max(100).optional(),
  email: z.string().email('Email inválido'),
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
  nombre: z.string().min(1).max(100),
  direccion: z.string().min(1).max(200),
  ciudad: z.string().min(0).max(100).optional(),
  codigoPostal: z.string().min(0).max(10).optional(),
  pais: z.string().min(0).max(100).optional(),
  numeroUnidades: z.number().int().positive().max(10000),
  anosConstruccion: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
  descripcion: z.string().min(0).max(2000).optional(),
  notas: z.string().min(0).max(5000).optional(),
});

export const buildingUpdateSchema = buildingCreateSchema.partial();

// Unit schemas
export const unitCreateSchema = z.object({
  buildingId: z.string().cuid(),
  numero: z.string().min(1).max(20),
  piso: z.string().min(0).max(10).optional(),
  tipo: z.enum(['apartamento', 'oficina', 'local', 'garaje', 'trastero', 'otro']),
  habitaciones: z.number().int().nonnegative().optional(),
  banos: z.number().int().nonnegative().optional(),
  metrosCuadrados: z.number().positive().optional(),
  estado: z.enum(['disponible', 'ocupado', 'mantenimiento', 'renovacion']),
  renta: z.number().nonnegative().optional(),
  descripcion: z.string().min(0).max(2000).optional(),
});

export const unitUpdateSchema = unitCreateSchema.partial().omit({ buildingId: true });

// Tenant schemas
export const tenantCreateSchema = z.object({
  nombre: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  email: z.string().email(),
  telefono: z.string().optional(),
  telefonoAlternativo: z.string().optional(),
  dni: z.string().min(5).max(20).optional(),
  fechaNacimiento: z.coerce.date().optional(),
  ocupacion: z.string().min(0).max(100).optional(),
  empresaTrabajo: z.string().min(0).max(100).optional(),
  referencias: z.string().min(0).max(1000).optional(),
  notas: z.string().min(0).max(5000).optional(),
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
  condiciones: z.string().optional(),
  notas: z.string().min(0).max(5000).optional(),
}).refine((data) => {
  const fechaFin = typeof data.fechaFin === 'string' ? new Date(data.fechaFin) : data.fechaFin;
  const fechaInicio = typeof data.fechaInicio === 'string' ? new Date(data.fechaInicio) : data.fechaInicio;
  return fechaFin > fechaInicio;
}, {
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
  condiciones: z.string().optional(),
  notas: z.string().min(0).max(5000).optional(),
}).omit({ unitId: true, tenantId: true });

// Payment schemas
export const paymentCreateSchema = z.object({
  contractId: z.string().cuid(),
  monto: z.number().positive(),
  fechaPago: z.coerce.date(),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro']),
  concepto: z.string().min(1).max(200),
  referencia: z.string().min(0).max(50).optional(),
  estado: z.enum(['pendiente', 'pagado', 'parcial', 'atrasado', 'cancelado']),
  notas: z.string().min(0).max(1000).optional(),
});

export const paymentUpdateSchema = paymentCreateSchema.partial()
  .omit({ contractId: true });

// Maintenance schemas
export const maintenanceCreateSchema = z.object({
  unitId: z.string().cuid(),
  titulo: z.string().min(1).max(200),
  descripcion: z.string().min(1).max(5000),
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
  nombre: z.string(),
  tipo: z.enum(['contrato', 'identificacion', 'comprobante', 'factura', 'otro']),
  descripcion: z.string().min(0).max(500).optional(),
  entidadTipo: z.enum(['building', 'unit', 'tenant', 'contract', 'payment', 'maintenance']),
  entidadId: z.string().cuid(),
});

// User schemas
export const userCreateSchema = z.object({
  nombre: z.string().min(1).max(100),
  apellidos: z.string().min(0).max(100).optional(),
  email: z.string().email(),
  telefono: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'agent', 'user']),
  password: z.string().min(8),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

// Company schemas
export const companyCreateSchema = z.object({
  nombre: z.string().min(1).max(100),
  cif: z.string().min(0).max(20).optional(),
  direccion: z.string().min(0).max(200).optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  contactoPrincipal: z.string().min(0).max(100).optional(),
  emailContacto: z.string().email().optional(),
  telefonoContacto: z.string().optional(),
  maxUsuarios: z.number().int().positive().optional(),
  maxPropiedades: z.number().int().positive().optional(),
  maxEdificios: z.number().int().positive().optional(),
  subscriptionPlanId: z.string().cuid().optional(),
  estadoCliente: z.enum(['activo', 'prueba', 'suspendido', 'cancelado']).optional(),
  notasAdmin: z.string().min(0).max(5000).optional(),
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
  query: z.string().min(0).max(200).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const buildingFilterSchema = searchSchema.extend({
  ciudad: z.string().min(0).max(100).optional(),
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
