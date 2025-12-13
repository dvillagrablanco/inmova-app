/**
 * Health Check Endpoint
 * Used by Docker HEALTHCHECK and Railway health monitoring
 */
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - can be extended to check DB, external services, etc.
    return NextResponse.json(
      { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
