/**
 * Funciones de sanitización y seguridad para inputs del usuario
 */

// Sanitizar input general - remueve caracteres peligrosos
export function sanitizeInput(input: string, maxLength = 10000): string {
  return input
    .replace(/[<>"']/g, '') // Remover < > " '
    .trim()
    .substring(0, maxLength);
}

// Sanitizar email
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().substring(0, 254);
}

// Validar y sanitizar URLs
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Solo permitir protocolos seguros
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

// Sanitizar número de teléfono
export function sanitizePhone(phone: string): string {
  return phone
    .replace(/[^0-9+\-() ]/g, '') // Solo números y símbolos comunes
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .trim()
    .substring(0, 20);
}

// Sanitizar alfanumérico (solo letras, números y espacios)
export function sanitizeAlphanumeric(input: string): string {
  return input.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 1000);
}

// Sanitizar nombre de archivo
export function sanitizeFileName(filename: string): string {
  // Primero reemplazar .. con _ para prevenir path traversal
  let sanitized = filename.replace(/\.\./g, '_');

  // Luego reemplazar otros caracteres especiales
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // No debe empezar con punto
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized.substring(1);
  }

  return sanitized.substring(0, 255);
}

// Backward compatibility
export const sanitizeFilename = sanitizeFileName;

// Sanitizar HTML - permite tags seguros
export function sanitizeHtml(html: string): string {
  // Esta es una implementación básica. En producción, usar DOMPurify o similar
  // Por ahora, simplemente remueve scripts y atributos peligrosos
  let sanitized = html;

  // Remover script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remover event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remover javascript: en hrefs
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

// Sanitizar texto para prevenir inyección SQL (aunque esto debe hacerse en el backend)
export function sanitizeSql(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// Validar tipo MIME de archivo
export function isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.slice(0, -1));
    }
    return mimeType === type;
  });
}

// Generar token CSRF
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Verificar fortaleza de contraseña
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Longitud
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  else if (password.length < 8) {
    feedback.push('La contraseña debe tener al menos 8 caracteres');
  }

  // Mayúsculas
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Agregar letras mayúsculas');
  }

  // Minúsculas
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Agregar letras minúsculas');
  }

  // Números
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Agregar números');
  }

  // Caracteres especiales
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('Agregar caracteres especiales');
  }

  return { score, feedback };
}

// Detectar patrones comunes inseguros
export function hasCommonPatterns(password: string): boolean {
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /(.)\1{2,}/, // Caracteres repetidos
  ];

  return commonPatterns.some((pattern) => pattern.test(password));
}
