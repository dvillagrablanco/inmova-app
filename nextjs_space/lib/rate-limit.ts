/**
 * Rate Limiting Service
 * Protects APIs from abuse and ensures fair usage
 */

import rateLimit from 'next-rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

// Define rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Demasiados intentos de autenticación. Por favor, intente más tarde.',
  },
  
  // Standard limits for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Demasiadas solicitudes. Por favor, intente más tarde.',
  },
  
  // Relaxed limits for read-only endpoints
  read: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Demasiadas solicitudes de lectura. Por favor, intente más tarde.',
  },
  
  // Strict limits for write operations
  write: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Demasiadas operaciones de escritura. Por favor, intente más tarde.',
  },
  
  // Very strict limits for expensive operations
  expensive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Límite de operaciones costosas alcanzado. Por favor, intente más tarde.',
  },
};

// Create rate limiter instance
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Get client identifier (IP or user ID)
function getClientId(request: NextRequest): string {
  // Try to get user ID from session/headers first
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

// Apply rate limiting middleware
export async function applyRateLimit(
  request: NextRequest,
  type: keyof typeof rateLimitConfigs = 'api'
): Promise<NextResponse | null> {
  try {
    const clientId = getClientId(request);
    const config = rateLimitConfigs[type];
    
    // Use checkNext which returns headers
    const headers = await limiter.checkNext(request, config.max);
    
    // Check if rate limit was exceeded
    const remaining = headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 0) {
      throw new Error('Rate limit exceeded');
    }
    
    // Successfully passed rate limit
    return null;
  } catch (error) {
    // Rate limit exceeded
    const config = rateLimitConfigs[type];
    const clientId = getClientId(request);
    
    logger.warn('Rate limit exceeded', {
      clientId,
      type,
      path: request.nextUrl.pathname,
    });
    
    return NextResponse.json(
      {
        error: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(config.windowMs / 1000)),
          'X-RateLimit-Limit': String(config.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + config.windowMs),
        },
      }
    );
  }
}

// Middleware wrapper for easy integration
export function withRateLimit(type: keyof typeof rateLimitConfigs = 'api') {
  return async (request: NextRequest) => {
    const rateLimitResponse = await applyRateLimit(request, type);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return null; // Continue to next middleware/handler
  };
}
