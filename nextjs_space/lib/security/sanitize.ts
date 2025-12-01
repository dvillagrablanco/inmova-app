/**
 * Input Sanitization Service
 * Protects against XSS and other injection attacks
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

/**
 * Sanitize HTML content
 * Removes potentially dangerous tags and attributes
 */
export function sanitizeHtml(dirty: string, options?: DOMPurify.Config): string {
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'div', 'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)/i,
  };

  return DOMPurify.sanitize(dirty, { ...defaultConfig, ...options });
}

/**
 * Sanitize plain text input
 * Removes HTML tags and potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"']/g, '') // Remove potentially dangerous characters
    .slice(0, 10000); // Limit length to prevent DoS
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Sanitize URL
 * Ensures URL is safe and valid
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    return parsed.toString();
  } catch (error) {
    return '';
  }
}

/**
 * Sanitize phone number
 * Removes non-numeric characters
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+\-() ]/g, '').slice(0, 20);
}

/**
 * Sanitize alphanumeric input
 * Removes special characters
 */
export function sanitizeAlphanumeric(input: string): string {
  return input.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 1000);
}

/**
 * Sanitize file name
 * Removes path traversal and dangerous characters
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\./, '_')
    .slice(0, 255);
}

/**
 * Zod schemas with built-in sanitization
 */
export const sanitizedSchemas = {
  // Text field with sanitization
  text: (min = 1, max = 1000) =>
    z.string()
      .min(min, `Mínimo ${min} caracteres`)
      .max(max, `Máximo ${max} caracteres`)
      .transform(sanitizeInput),

  // Email with sanitization
  email: () =>
    z.string()
      .email('Email inválido')
      .transform(sanitizeEmail),

  // URL with validation and sanitization
  url: () =>
    z.string()
      .url('URL inválida')
      .transform(sanitizeUrl),

  // Phone with sanitization
  phone: () =>
    z.string()
      .transform(sanitizePhone)
      .refine((val) => val.length >= 9, 'Teléfono inválido'),

  // HTML content with sanitization
  html: () =>
    z.string()
      .transform(sanitizeHtml),

  // Alphanumeric with sanitization
  alphanumeric: (min = 1, max = 100) =>
    z.string()
      .min(min)
      .max(max)
      .transform(sanitizeAlphanumeric),

  // File name with sanitization
  fileName: () =>
    z.string()
      .min(1, 'Nombre de archivo requerido')
      .transform(sanitizeFileName),
};

/**
 * Common entity schemas with sanitization
 */
export const entitySchemas = {
  // Building schema
  building: z.object({
    nombre: sanitizedSchemas.text(1, 100),
    direccion: sanitizedSchemas.text(1, 200),
    numeroUnidades: z.number().int().positive().max(10000),
    descripcion: sanitizedSchemas.text(0, 2000).optional(),
    notas: sanitizedSchemas.text(0, 5000).optional(),
  }),

  // Tenant schema
  tenant: z.object({
    nombre: sanitizedSchemas.text(1, 100),
    apellidos: sanitizedSchemas.text(1, 100),
    email: sanitizedSchemas.email(),
    telefono: sanitizedSchemas.phone().optional(),
    dni: sanitizedSchemas.alphanumeric(5, 20).optional(),
    notas: sanitizedSchemas.text(0, 5000).optional(),
  }),

  // Contract schema
  contract: z.object({
    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date(),
    renta: z.number().positive(),
    deposito: z.number().nonnegative(),
    condiciones: sanitizedSchemas.html().optional(),
    notas: sanitizedSchemas.text(0, 5000).optional(),
  }),

  // Payment schema
  payment: z.object({
    monto: z.number().positive(),
    concepto: sanitizedSchemas.text(1, 200),
    referencia: sanitizedSchemas.alphanumeric(0, 50).optional(),
    notas: sanitizedSchemas.text(0, 1000).optional(),
  }),

  // Maintenance request schema
  maintenance: z.object({
    titulo: sanitizedSchemas.text(1, 200),
    descripcion: sanitizedSchemas.text(1, 5000),
    prioridad: z.enum(['baja', 'media', 'alta', 'urgente']),
    categoria: sanitizedSchemas.text(1, 50),
  }),

  // User schema
  user: z.object({
    nombre: sanitizedSchemas.text(1, 100),
    apellidos: sanitizedSchemas.text(1, 100).optional(),
    email: sanitizedSchemas.email(),
    telefono: sanitizedSchemas.phone().optional(),
  }),

  // Company schema
  company: z.object({
    nombre: sanitizedSchemas.text(1, 100),
    cif: sanitizedSchemas.alphanumeric(0, 20).optional(),
    direccion: sanitizedSchemas.text(0, 200).optional(),
    telefono: sanitizedSchemas.phone().optional(),
    email: sanitizedSchemas.email().optional(),
    contactoPrincipal: sanitizedSchemas.text(0, 100).optional(),
    notasAdmin: sanitizedSchemas.text(0, 5000).optional(),
  }),
};

/**
 * Validate and sanitize request body
 */
export async function validateAndSanitize<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; details: z.ZodError }> {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Datos de entrada inválidos',
        details: error,
      };
    }
    return {
      success: false,
      error: 'Error de validación',
      details: error as z.ZodError,
    };
  }
}

/**
 * Sanitize object recursively
 * Useful for complex nested objects
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Example usage in API route:
 * 
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const body = await request.json();
 *   
 *   const result = await validateAndSanitize(body, entitySchemas.building);
 *   
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: result.error, details: result.details.errors },
 *       { status: 400 }
 *     );
 *   }
 *   
 *   // Use result.data (sanitized and validated)
 *   const building = await prisma.building.create({
 *     data: result.data,
 *   });
 *   
 *   return NextResponse.json(building);
 * }
 * ```
 */
