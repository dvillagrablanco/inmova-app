/**
 * Funciones de sanitización y seguridad para inputs del usuario
 */

// Sanitizar HTML para prevenir XSS
export function sanitizeHtml(html: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  const reg = /[&<>"'\/]/gi;
  return html.replace(reg, (match) => map[match]);
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

// Sanitizar nombre de archivo
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255);
}

// Validar tipo MIME de archivo
export function isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.slice(0, -1));
    }
    return mimeType === type;
  });
}

// Sanitizar input general
export function sanitizeInput(input: string, options?: {
  allowHtml?: boolean;
  maxLength?: number;
  trim?: boolean;
}): string {
  const { allowHtml = false, maxLength, trim = true } = options || {};
  
  let sanitized = input;
  
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  if (!allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  }
  
  if (maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Generar token CSRF
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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

  return commonPatterns.some(pattern => pattern.test(password));
}