/**
 * Readiness Probe
 * Check if application is ready to serve traffic
 */

import { NextRequest, NextResponse } from 'next/server';
import { readinessCheck } from '@/lib/health-check';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const isReady = await readinessCheck();
  
  if (isReady) {
    return NextResponse.json({ status: 'ready' });
  }
  
  return NextResponse.json(
    { status: 'not ready' },
    { status: 503 }
  );
}
