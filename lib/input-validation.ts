/**
 * Input Validation and Sanitization
 * Validación exhaustiva de inputs con Zod
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// ============================================
// VALIDACIONES COMUNES
// ============================================

export const emailSchema = z.string().email('Email inválido').toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

export const phoneSchema = z
  .string()
  .regex(/^(\+34|0034|34)?[6789]\d{8}$/, 'Teléfono español inválido');

export const postalCodeSchema = z
  .string()
  .regex(/^[0-9]{5}$/, 'Código postal español inválido (5 dígitos)');

export const nifSchema = z.string().regex(/^[0-9]{8}[A-Z]$/, 'NIF inválido (8 dígitos + letra)');

export const nieSchema = z
  .string()
  .regex(/^[XYZ][0-9]{7}[A-Z]$/, 'NIE inválido (letra + 7 dígitos + letra)');

export const cifSchema = z.string().regex(/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/, 'CIF inválido');

export const ibanSchema = z.string().regex(/^ES\d{22}$/, 'IBAN español inválido (ES + 22 dígitos)');

export const urlSchema = z.string().url('URL inválida');

// ============================================
// VALIDACIONES DE NEGOCIO
// ============================================

export const amountSchema = z
  .number()
  .positive('El monto debe ser positivo')
  .finite('El monto debe ser un número válido')
  .max(1000000, 'El monto no puede exceder €1,000,000');

export const percentageSchema = z
  .number()
  .min(0, 'El porcentaje no puede ser negativo')
  .max(100, 'El porcentaje no puede exceder 100');

export const dateSchema = z.coerce.date({
  required_error: 'La fecha es requerida',
  invalid_type_error: 'Fecha inválida',
});

export const futureDateSchema = dateSchema.refine((date) => date > new Date(), {
  message: 'La fecha debe ser futura',
});

export const pastDateSchema = dateSchema.refine((date) => date < new Date(), {
  message: 'La fecha debe ser pasada',
});

// ============================================
// SCHEMAS DE ENTIDADES
// ============================================

export const createBuildingSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  direccion: z.string().min(1, 'La dirección es requerida').max(500),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100),
  codigoPostal: postalCodeSchema,
  pais: z.string().default('España'),
  tipo: z.enum(['residencial', 'comercial', 'mixto']),
  unidades: z.number().int().positive().optional(),
  superficie: z.number().positive().optional(),
  anosConstruccion: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
});

export const createContractSchema = z
  .object({
    tenantId: z.string().uuid('ID de inquilino inválido'),
    unitId: z.string().uuid('ID de unidad inválida'),
    fechaInicio: dateSchema,
    fechaFin: dateSchema,
    renta: amountSchema,
    deposito: amountSchema.optional(),
    diaVencimiento: z.number().int().min(1).max(31),
    tipo: z.enum(['alquiler', 'str', 'coliving']),
  })
  .refine((data) => data.fechaFin > data.fechaInicio, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  });

export const createPaymentSchema = z.object({
  contractId: z.string().uuid('ID de contrato inválido'),
  monto: amountSchema,
  fecha: dateSchema,
  metodoPago: z.enum(['transferencia', 'tarjeta', 'efectivo', 'domiciliacion']),
  referencia: z.string().max(200).optional(),
  notas: z.string().max(1000).optional(),
  comprobante: z.string().url().optional(),
});

export const createTenantSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(200),
  email: emailSchema,
  telefono: phoneSchema.optional(),
  dni: z.union([nifSchema, nieSchema]).optional(),
  fechaNacimiento: pastDateSchema.optional(),
  nacionalidad: z.string().max(100).optional(),
  ocupacion: z.string().max(200).optional(),
});

export const updateUserSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  apellidos: z.string().min(1).max(100).optional(),
  telefono: phoneSchema.optional(),
  email: emailSchema.optional(),
  avatar: urlSchema.optional(),
  preferencias: z.record(z.any()).optional(),
});

// ============================================
// SANITIZACIÓN DE INPUTS
// ============================================

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: usar DOMPurify con jsdom
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title'],
    });
  }

  // Client-side
  return DOMPurify.sanitize(dirty);
}

/**
 * Sanitiza texto plano (elimina HTML)
 */
export function sanitizePlainText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Eliminar tags HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Sanitiza nombre de archivo
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Solo caracteres seguros
    .replace(/_{2,}/g, '_') // Eliminar underscores múltiples
    .slice(0, 255); // Limitar longitud
}

/**
 * Sanitiza URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Solo permitir http y https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Valida y sanitiza query parameters
 */
export function sanitizeQueryParams(params: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizePlainText(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

// ============================================
// HELPERS DE VALIDACIÓN
// ============================================

/**
 * Valida input con schema de Zod y retorna errores formateados
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }

  return { success: false, errors };
}

/**
 * Valida múltiples campos y retorna primer error
 */
export function validateFields(
  validations: Array<{ schema: z.ZodSchema; data: unknown; field: string }>
): { valid: true } | { valid: false; field: string; error: string } {
  for (const { schema, data, field } of validations) {
    const result = schema.safeParse(data);
    if (!result.success) {
      return {
        valid: false,
        field,
        error: result.error.issues[0].message,
      };
    }
  }

  return { valid: true };
}

/**
 * Middleware de validación para API routes
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: Response }> {
  try {
    const body = await request.json();
    const result = validateInput(schema, body);

    if (!result.success) {
      return {
        success: false,
        error: new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: result.errors,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'The request body is not valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }
}

// ============================================
// VALIDACIÓN DE TIPOS MIME
// ============================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

export function validateFileSize(size: number, maxSize: number = MAX_FILE_SIZE): boolean {
  return size > 0 && size <= maxSize;
}

export const fileUploadSchema = z
  .object({
    filename: z.string().min(1).max(255),
    mimeType: z.string(),
    size: z.number().positive().max(MAX_FILE_SIZE),
    data: z.string(), // Base64
  })
  .refine(
    (data) => {
      const isImage = validateFileType(data.mimeType, ALLOWED_IMAGE_TYPES);
      const isDocument = validateFileType(data.mimeType, ALLOWED_DOCUMENT_TYPES);
      return isImage || isDocument;
    },
    { message: 'Tipo de archivo no permitido' }
  );
