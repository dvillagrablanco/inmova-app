/**
 * API Route: /api/ewoorker/referrals/leaderboard
 *
 * GET: Obtener leaderboard de referidos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerReferral } from '@/lib/ewoorker-referral-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const leaderboard = await ewoorkerReferral.getReferralLeaderboard(limit);

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error: any) {
    logger.error('[API EwoorkerReferrals Leaderboard] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
