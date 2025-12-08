

/**
 * Structured Logging Service
 * Provides different log levels and formats for development and production
 * Compatible with both server and client environments
 * Includes automatic PII sanitization in production
 */

/**
 * Patrones de PII para sanitizar
 */
const PII_PATTERNS = {
  // Email
  email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  // Tel\u00e9fono (varios formatos)
  phone: /(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  // DNI/NIE Espa\u00f1ol
  dni: /\b\d{8}[A-Z]\b/gi,
  nie: /\b[XYZ]\d{7}[A-Z]\b/gi,
  // Tarjetas de cr\u00e9dito (Visa, MasterCard, etc)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // IBAN
  iban: /\b[A-Z]{2}\d{2}[\s]?[\d]{4}[\s]?[\d]{4}[\s]?[\d]{2}[\s]?[\d]{10}\b/gi,
  // IPs
  ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  // API Keys y tokens (patrones comunes)
  apiKey: /\b[a-zA-Z0-9_-]{32,}\b/g,
  // Passwords en URLs o queries
  password: /(password|passwd|pwd|secret)=([^&\s]+)/gi,
};

/**
 * Campos sensibles que deben ser redactados
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'creditCard',
  'credit_card',
  'cvv',
  'ssn',
  'dni',
  'nie',
  'iban',
];

/**
 * Sanitiza un string reemplazando PII con texto enmascarado
 */
function sanitizeString(str: string): string {
  let sanitized = str;

  // Reemplazar emails
  sanitized = sanitized.replace(PII_PATTERNS.email, (match) => {
    const [username, domain] = match.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(Math.max(username.length - 2, 0)) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  });

  // Reemplazar tel\u00e9fonos
  sanitized = sanitized.replace(PII_PATTERNS.phone, (match) => {
    return '***-***-' + match.slice(-4);
  });

  // Reemplazar DNI/NIE
  sanitized = sanitized.replace(PII_PATTERNS.dni, '****####');
  sanitized = sanitized.replace(PII_PATTERNS.nie, '****####');

  // Reemplazar tarjetas de cr\u00e9dito
  sanitized = sanitized.replace(PII_PATTERNS.creditCard, (match) => {
    const last4 = match.slice(-4);
    return `****-****-****-${last4}`;
  });

  // Reemplazar IBAN
  sanitized = sanitized.replace(PII_PATTERNS.iban, (match) => {
    return match.substring(0, 4) + '************' + match.slice(-4);
  });

  // Reemplazar passwords en URLs
  sanitized = sanitized.replace(PII_PATTERNS.password, '$1=[REDACTED]');

  return sanitized;
}

/**
 * Sanitiza un objeto recursivamente
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Si el campo est\u00e1 en la lista de campos sensibles, redactar completamente
      if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
  }

  return sanitized;
}

/**
 * Sanitiza los metadatos antes de logear
 */
function sanitizeMetadata(meta?: any): any {
  if (!meta) return meta;

  // Solo sanitizar en producci\u00f3n
  if (process.env.NODE_ENV !== 'production') {
    return meta;
  }

  return sanitizeObject(meta);
}

// Simple console-based logger that works everywhere with PII sanitization
const logger = {
  error: (message: string, meta?: any) => {
    const sanitizedMeta = sanitizeMetadata(meta);
    const sanitizedMessage = typeof message === 'string' ? sanitizeString(message) : message;

    if (typeof window !== 'undefined') {
      console.error(sanitizedMessage, sanitizedMeta);
    } else {
      console.error(`[ERROR] ${sanitizedMessage}`, sanitizedMeta);
    }
  },
  warn: (message: string, meta?: any) => {
    const sanitizedMeta = sanitizeMetadata(meta);
    const sanitizedMessage = typeof message === 'string' ? sanitizeString(message) : message;

    if (typeof window !== 'undefined') {
      console.warn(sanitizedMessage, sanitizedMeta);
    } else {
      console.warn(`[WARN] ${sanitizedMessage}`, sanitizedMeta);
    }
  },
  info: (message: string, meta?: any) => {
    const sanitizedMeta = sanitizeMetadata(meta);
    const sanitizedMessage = typeof message === 'string' ? sanitizeString(message) : message;

    if (typeof window !== 'undefined') {
      console.info(sanitizedMessage, sanitizedMeta);
    } else {
      console.info(`[INFO] ${sanitizedMessage}`, sanitizedMeta);
    }
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[DEBUG] ${message}`, meta);
    }
  },
  log: (level: string, message: string, meta?: any) => {
    logger.info(`[${level.toUpperCase()}] ${message}`, meta);
  },
};

// Helper functions for common logging scenarios
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

export const logApiRequest = (method: string, url: string, userId?: string, duration?: number) => {
  logger.info('API Request', {
    method,
    url,
    userId,
    duration,
  });
};

export const logDatabaseQuery = (query: string, duration: number, success: boolean) => {
  logger.debug('Database Query', {
    query: query.substring(0, 100), // Limit query length
    duration,
    success,
  });
};

export const logSecurityEvent = (event: string, userId: string, details?: Record<string, any>) => {
  logger.warn('Security Event', {
    event,
    userId,
    ...details,
  });
};

export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger.log(level, 'Performance', {
    operation,
    duration,
    slow: duration > 1000,
    ...metadata,
  });
};

export default logger;
