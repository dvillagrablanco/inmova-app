import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { disconnectChannel } from '@/lib/str-channel-integration-service';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const disconnectChannelSchema = z.object({
  listingId: z.string().min(1),
  channel: z.enum(['airbnb', 'booking', 'vrbo', 'homeaway']),
});
export const runtime = 'nodejs';

/**
 * POST /api/str/channels/disconnect
 * Desconecta un listing de un canal externo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = disconnectChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { listingId, channel } = parsed.data;

    logger.info(`[STR API] Desconectando canal ${channel} de listing ${listingId}`);

    const success = await disconnectChannel(listingId, channel as any);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Canal ${channel} desconectado exitosamente`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Error al desconectar el canal',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logError(error as Error, { context: 'POST /api/str/channels/disconnect' });
    return NextResponse.json(
      {
        error: 'Error al desconectar el canal',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
