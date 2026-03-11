import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectChannel, ChannelCredentials } from '@/lib/str-channel-integration-service';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
type ExternalChannelType = 'AIRBNB' | 'BOOKING' | 'VRBO' | 'HOMEAWAY';

const connectChannelSchema = z.object({
  listingId: z.string().min(1),
  channel: z.enum(['airbnb', 'booking', 'vrbo', 'homeaway']),
  credentials: z.record(z.unknown()).optional(),
});
export const runtime = 'nodejs';

const channelMap: Record<'airbnb' | 'booking' | 'vrbo' | 'homeaway', ExternalChannelType> = {
  airbnb: 'AIRBNB',
  booking: 'BOOKING',
  vrbo: 'VRBO',
  homeaway: 'HOMEAWAY',
};

/**
 * POST /api/str/channels/connect
 * Conecta un listing con un canal externo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = connectChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { listingId, channel, credentials } = parsed.data;

    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin compañía asignada' }, { status: 400 });
    }

    logger.info(`[STR API] Conectando canal ${channel} para listing ${listingId}`);

    const result = await connectChannel(
      companyId,
      listingId,
      channelMap[channel],
      (credentials || {}) as ChannelCredentials
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Canal ${channel} conectado exitosamente`,
        result,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Error al conectar el canal',
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logError(error as Error, { context: 'POST /api/str/channels/connect' });
    return NextResponse.json(
      {
        error: 'Error al conectar el canal',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
