

/**
 * Structured Logging Service
 * Provides different log levels and formats for development and production
 * Compatible with both server and client environments
 */

// Simple console-based logger that works everywhere
const logger = {
  error: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.error(message, meta);
    } else {
      console.error(`[ERROR] ${message}`, meta);
    }
  },
  warn: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.warn(message, meta);
    } else {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
  info: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.info(message, meta);
    } else {
      console.info(`[INFO] ${message}`, meta);
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
