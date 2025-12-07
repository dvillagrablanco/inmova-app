/**
 * Sanitización HTML con DOMPurify
 * Protección contra ataques XSS
 */

import DOMPurify from 'isomorphic-dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

/**
 * Sanitiza contenido HTML para prevenir XSS
 */
export function sanitizeHtml(
  dirty: string,
  options?: SanitizeOptions
): string {
  if (!dirty) return '';

  const config: any = {};

  if (options?.allowedTags) {
    config.ALLOWED_TAGS = options.allowedTags;
  }

  if (options?.allowedAttributes) {
    config.ALLOWED_ATTR = options.allowedAttributes;
  }

  return String(DOMPurify.sanitize(dirty, config));
}

/**
 * Sanitiza texto plano (elimina todas las etiquetas HTML)
 */
export function sanitizePlainText(text: string): string {
  return String(DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }));
}

/**
 * Sanitiza contenido de formularios
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  fieldsToSanitize: (keyof T)[]
): T {
  const sanitized = { ...data };

  for (const field of fieldsToSanitize) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeHtml(sanitized[field] as string) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Opciones predefinidas para diferentes contextos
 */
export const SANITIZE_PRESETS = {
  // Solo texto plano
  text: {
    allowedTags: [],
    allowedAttributes: {},
  },
  // Formato rico básico
  basic: {
    allowedTags: ['b', 'i', 'u', 'strong', 'em', 'p', 'br'],
    allowedAttributes: {},
  },
  // Formato rico con enlaces
  rich: {
    allowedTags: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'a', 'ul', 'ol', 'li'],
    allowedAttributes: { a: ['href', 'title', 'target'] },
  },
};
