import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AirbnbClient, type AirbnbConfig } from '@/lib/airbnb-integration';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const messageSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required'),
  message: z.string().min(1, 'Message is required'),
});

/**
 * POST /api/airbnb/messages
 * Send message to guest
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
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
      logger.warn('[Airbnb Messages] Airbnb credentials not configured');
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
    const success = await client.sendMessage({
      reservationId: parsed.data.reservationId,
      message: parsed.data.message,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Airbnb Messages] Error:', error);
    return NextResponse.json(
      { error: 'Error sending message' },
      { status: 500 }
    );
  }
}
