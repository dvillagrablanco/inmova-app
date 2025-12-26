/**
 * Sistema de sanitización de inputs para prevenir XSS, SQL Injection y otros ataques
 *
 * IMPORTANTE: Prisma ya protege contra SQL Injection automáticamente,
 * pero aún necesitamos sanitizar inputs para XSS en el frontend.
 */

import { z } from 'zod';

/**
 * Sanitiza una cadena de texto eliminando código malicioso
 * - Elimina tags HTML peligrosos
 * - Elimina scripts
 * - Elimina event handlers (onclick, onerror, etc.)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return (
    input
      // Eliminar tags script
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Eliminar event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
      // Eliminar javascript: protocol
      .replace(/javascript:/gi, '')
      // Eliminar data: protocol (excepto images que serán manejadas por Next/Image)
      .replace(/data:(?!image\/)\w+\/\w+/gi, '')
      // Trim
      .trim()
  );
}

/**
 * Sanitiza recursivamente todos los strings en un objeto
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Valida y sanitiza el body de una request
 * Combina validación de Zod con sanitización de strings
 */
export async function validateAndSanitize<T extends z.ZodType>(
  schema: T,
  data: unknown
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: z.ZodError }> {
  try {
    // Primero validar con Zod
    const validated = await schema.parseAsync(data);

    // Luego sanitizar strings
    const sanitized = sanitizeObject(validated);

    return { success: true, data: sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Schemas de validación comunes con Zod
 */

// Email
export const emailSchema = z.string().email('Email inválido').toLowerCase();

// Teléfono (formato internacional)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido')
  .optional();

// URL
export const urlSchema = z.string().url('URL inválida').optional();

// Texto corto (nombres, títulos, etc.)
export const shortTextSchema = z
  .string()
  .min(1, 'Campo requerido')
  .max(255, 'Máximo 255 caracteres')
  .transform(sanitizeString);

// Texto largo (descripciones, notas, etc.)
export const longTextSchema = z
  .string()
  .max(10000, 'Máximo 10,000 caracteres')
  .transform(sanitizeString)
  .optional();

// Número positivo
export const positiveNumberSchema = z.number().positive('Debe ser un número positivo');

// Número no negativo
export const nonNegativeNumberSchema = z.number().nonnegative('No puede ser negativo');

// Fecha (string ISO o Date)
export const dateSchema = z.union([z.string().datetime(), z.date()]);

// UUID
export const uuidSchema = z.string().uuid('ID inválido');

// Moneda (2 decimales)
export const currencySchema = z
  .number()
  .nonnegative('No puede ser negativo')
  .refine((val) => Number.isFinite(val), 'Monto inválido')
  .transform((val) => Math.round(val * 100) / 100); // Redondear a 2 decimales

// Porcentaje (0-100)
export const percentageSchema = z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%');

/**
 * Helper para crear respuestas de error de validación
 */
export function validationErrorResponse(error: z.ZodError) {
  return {
    error: 'Datos inválidos',
    details: error.flatten().fieldErrors,
  };
}

/**
 * Ejemplo de uso en una API route:
 *
 * import { validateAndSanitize, shortTextSchema, currencySchema } from '@/lib/input-sanitization';
 * import { z } from 'zod';
 *
 * const roomSchema = z.object({
 *   numero: shortTextSchema,
 *   precio: currencySchema,
 *   descripcion: longTextSchema,
 * });
 *
 * export async function POST(req: NextRequest) {
 *   const body = await req.json();
 *   const result = await validateAndSanitize(roomSchema, body);
 *
 *   if (!result.success) {
 *     return NextResponse.json(
 *       validationErrorResponse(result.error),
 *       { status: 400 }
 *     );
 *   }
 *
 *   // Usar result.data (ya validado y sanitizado)
 *   const room = await prisma.room.create({ data: result.data });
 *   return NextResponse.json(room);
 * }
 */
