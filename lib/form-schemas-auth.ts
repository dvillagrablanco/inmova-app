/**
 * Esquemas de validación para formularios de autenticación
 * Separado para mayor organización
 */

import { z } from 'zod';

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

// Schema simplificado para login (solo valida que haya algo)
export const loginPasswordSchema = z.string().min(1, 'La contraseña es requerida');

// ========================================
// SCHEMA DE LOGIN
// ========================================

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ========================================
// SCHEMA DE REGISTRO
// ========================================

export const businessVerticals = [
  'alquiler_tradicional',
  'str_vacacional',
  'coliving',
  'construccion',
  'flipping',
  'servicios_profesionales',
  'mixto',
] as const;

export type BusinessVertical = typeof businessVerticals[number];

export const registerSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: emailSchema,
    recoveryEmail: z.string().email('Email de recuperación inválido').optional().or(z.literal('')),
    businessVertical: z.enum(businessVerticals, {
      errorMap: () => ({ message: 'Seleccione un tipo de negocio válido' }),
    }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme su contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => !data.recoveryEmail || data.recoveryEmail !== data.email, {
    message: 'El email de recuperación debe ser diferente al email principal',
    path: ['recoveryEmail'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ========================================
// LABELS PARA BUSINESS VERTICALS
// ========================================

export const businessVerticalLabels: Record<BusinessVertical, string> = {
  alquiler_tradicional: 'Alquiler Tradicional (Residencial/Comercial)',
  str_vacacional: 'STR / Alquiler Vacacional (Airbnb, Booking)',
  coliving: 'Coliving / Alquiler por Habitaciones',
  flipping: 'Inversión Inmobiliaria (Flipping)',
  construccion: 'Construcción / Promoción',
  servicios_profesionales: 'Servicios Profesionales (Arquitectura, Asesoría)',
  mixto: 'Mixto / Varios Tipos',
};
