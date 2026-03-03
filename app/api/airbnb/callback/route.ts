import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AirbnbClient, type AirbnbConfig } from '@/lib/airbnb-integration';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const callbackQuerySchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

/**
 * GET /api/airbnb/callback
 * OAuth callback handler. Receives code and state query params.
 * Exchanges code for tokens and returns them.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = callbackQuerySchema.safeParse({
      code: searchParams.get('code'),
      state: searchParams.get('state'),
    });

    if (!parsed.success) {
      logger.warn('[Airbnb Callback] Invalid query params:', parsed.error.errors);
      return NextResponse.json(
        { error: 'Código de autorización requerido', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const config: AirbnbConfig = {
      clientId: process.env.AIRBNB_CLIENT_ID || '',
      clientSecret: process.env.AIRBNB_CLIENT_SECRET || '',
      enabled: true,
    };

    if (!config.clientId || !config.clientSecret) {
      logger.warn('[Airbnb Callback] Airbnb credentials not configured');
      return NextResponse.json(
        { error: 'Airbnb integration not configured' },
        { status: 503 }
      );
    }

    const client = new AirbnbClient(config);
    const tokens = await client.authenticate(parsed.data.code);

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      state: parsed.data.state,
    });
  } catch (error) {
    logger.error('[Airbnb Callback] Error:', error);
    return NextResponse.json(
      { error: 'Error exchanging authorization code' },
      { status: 500 }
    );
  }
}
