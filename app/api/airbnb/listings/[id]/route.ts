import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AirbnbClient, type AirbnbConfig } from '@/lib/airbnb-integration';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/airbnb/listings/[id]
 * Get single listing detail
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await context.params;
    const idSchema = z.string().min(1, 'Listing ID is required');
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ID de listing inválido', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const config: AirbnbConfig = {
      clientId: process.env.AIRBNB_CLIENT_ID || '',
      clientSecret: process.env.AIRBNB_CLIENT_SECRET || '',
      accessToken: process.env.AIRBNB_ACCESS_TOKEN,
      refreshToken: process.env.AIRBNB_REFRESH_TOKEN,
      enabled: true,
    };

    if (!config.clientId || !config.clientSecret) {
      logger.warn('[Airbnb Listing] Airbnb credentials not configured');
      return NextResponse.json(
        { error: 'Airbnb integration not configured' },
        { status: 503 }
      );
    }

    if (!config.accessToken && !config.refreshToken) {
      return NextResponse.json(
        { error: 'Airbnb account not connected. Complete OAuth flow first.' },
        { status: 401 }
      );
    }

    const client = new AirbnbClient(config);
    const listing = await client.getListing(parsed.data);

    return NextResponse.json({ listing });
  } catch (error) {
    logger.error('[Airbnb Listing] Error:', error);
    return NextResponse.json(
      { error: 'Error fetching listing' },
      { status: 500 }
    );
  }
}
