/**
 * Liveness Probe
 * Simple check if application is running
 */

import { NextRequest, NextResponse } from 'next/server';
import { livenessCheck } from '@/lib/health-check';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const isAlive = await livenessCheck();
  
  if (isAlive) {
    return NextResponse.json({ status: 'alive' });
  }
  
  return NextResponse.json(
    { status: 'dead' },
    { status: 503 }
  );
}
