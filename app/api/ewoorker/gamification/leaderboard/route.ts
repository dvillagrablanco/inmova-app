/**
 * API Route: /api/ewoorker/gamification/leaderboard
 *
 * GET: Obtener leaderboard de puntos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerGamification, LEVELS } from '@/lib/ewoorker-gamification-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const leaderboard = await ewoorkerGamification.getLeaderboard(limit);

    return NextResponse.json({
      success: true,
      leaderboard,
      levels: LEVELS,
    });
  } catch (error: any) {
    logger.error('[API EwoorkerGamification Leaderboard] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
