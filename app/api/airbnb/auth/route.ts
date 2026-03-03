import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAirbnbAuthUrl } from '@/lib/airbnb-integration';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/airbnb/auth
 * Returns OAuth URL for connecting Airbnb account
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stateSchema = z.string().min(1).optional();
    const stateResult = stateSchema.safeParse(searchParams.get('state'));

    const clientId = process.env.AIRBNB_CLIENT_ID || '';
    const redirectUri = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/airbnb/callback`;
    const state = stateResult.success && stateResult.data
      ? stateResult.data
      : `company_${session.user.companyId}_${Date.now()}`;

    if (!clientId) {
      logger.warn('[Airbnb Auth] AIRBNB_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'Airbnb integration not configured' },
        { status: 503 }
      );
    }

    const authUrl = getAirbnbAuthUrl(clientId, redirectUri, state);

    return NextResponse.json({ authUrl, redirectUri });
  } catch (error) {
    logger.error('[Airbnb Auth] Error:', error);
    return NextResponse.json(
      { error: 'Error generating OAuth URL' },
      { status: 500 }
    );
  }
}
