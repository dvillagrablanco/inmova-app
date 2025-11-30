/**
 * Structured Logging Service with Winston
 * Provides different log levels and formats for development and production
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for development (readable)
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
  ),
  defaultMeta: {
    service: 'inmova',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

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
