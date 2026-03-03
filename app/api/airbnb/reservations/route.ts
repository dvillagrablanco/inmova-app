import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AirbnbClient, type AirbnbConfig } from '@/lib/airbnb-integration';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  listingId: z.string().optional(),
});

/**
 * GET /api/airbnb/reservations
 * List reservations with optional filters: startDate, endDate, listingId
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      listingId: searchParams.get('listingId') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const params: { startDate?: Date; endDate?: Date; listingId?: string } = {};
    if (parsed.data.startDate) {
      params.startDate = new Date(parsed.data.startDate);
    }
    if (parsed.data.endDate) {
      params.endDate = new Date(parsed.data.endDate);
    }
    if (parsed.data.listingId) {
      params.listingId = parsed.data.listingId;
    }

    const config: AirbnbConfig = {
      clientId: process.env.AIRBNB_CLIENT_ID || '',
      clientSecret: process.env.AIRBNB_CLIENT_SECRET || '',
      accessToken: process.env.AIRBNB_ACCESS_TOKEN,
      refreshToken: process.env.AIRBNB_REFRESH_TOKEN,
      enabled: true,
    };

    if (!config.clientId || !config.clientSecret) {
      logger.warn('[Airbnb Reservations] Airbnb credentials not configured');
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
    const reservations = await client.getReservations(
      Object.keys(params).length > 0 ? params : undefined
    );

    return NextResponse.json({ reservations });
  } catch (error) {
    logger.error('[Airbnb Reservations] Error:', error);
    return NextResponse.json(
      { error: 'Error fetching reservations' },
      { status: 500 }
    );
  }
}
