import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AirbnbClient, type AirbnbConfig } from '@/lib/airbnb-integration';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const pricingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  basePrice: z.number().positive('Base price must be positive'),
  weekendPrice: z.number().positive().optional(),
  minNights: z.number().int().positive().optional(),
  maxNights: z.number().int().positive().optional(),
});

/**
 * POST /api/airbnb/pricing
 * Update pricing rules for a listing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pricingSchema.safeParse(body);

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
      logger.warn('[Airbnb Pricing] Airbnb credentials not configured');
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
    const success = await client.updatePricing({
      listingId: parsed.data.listingId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      basePrice: parsed.data.basePrice,
      weekendPrice: parsed.data.weekendPrice,
      minNights: parsed.data.minNights,
      maxNights: parsed.data.maxNights,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update pricing' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Airbnb Pricing] Error:', error);
    return NextResponse.json(
      { error: 'Error updating pricing' },
      { status: 500 }
    );
  }
}
