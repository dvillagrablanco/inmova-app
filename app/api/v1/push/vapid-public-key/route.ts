/**
 * API Endpoint: VAPID Public Key
 * 
 * GET /api/v1/push/vapid-public-key
 */

import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      publicKey,
    });

  } catch (error: any) {
    logger.error('Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Error getting public key' },
      { status: 500 }
    );
  }
}
