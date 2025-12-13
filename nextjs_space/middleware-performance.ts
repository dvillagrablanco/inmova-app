/**
 * Performance Monitoring Middleware
 * 
 * This middleware tracks API response times and logs slow requests.
 * To use: Rename this file to middleware.ts (backup existing middleware.ts first)
 * or merge this code into your existing middleware.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logger from '@/lib/logger';

// Threshold for slow API warnings (in ms)
const SLOW_API_THRESHOLD = 500;
const VERY_SLOW_API_THRESHOLD = 1000;

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  
  // Only track API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  const response = NextResponse.next();
  
  // Calculate response time
  const duration = Date.now() - startTime;
  
  // Add performance header
  response.headers.set('X-Response-Time', `${duration}ms`);
  
  // Log based on duration
  if (duration > VERY_SLOW_API_THRESHOLD) {
    logger.error(`❌ VERY SLOW API: ${pathname} took ${duration}ms`);
  } else if (duration > SLOW_API_THRESHOLD) {
    logger.warn(`⚠️  SLOW API: ${pathname} took ${duration}ms`);
  } else {
    logger.debug(`✅ ${pathname}: ${duration}ms`);
  }
  
  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: '/api/:path*',
};
