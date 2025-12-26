import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectChannel, ChannelCredentials } from '@/lib/str-channel-integration-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
    const { listingId, channel, credentials } = body;

    if (!listingId || !channel) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Validar que el canal es válido
    if (!['airbnb', 'booking', 'vrbo', 'homeaway'].includes(channel)) {
      return NextResponse.json({ error: 'Canal no válido' }, { status: 400 });
    }

    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin compañía asignada' }, { status: 400 });
    }

    logger.info(`[STR API] Conectando canal ${channel} para listing ${listingId}`);

    const result = await connectChannel(
      companyId,
      listingId,
      channel as any,
      credentials as ChannelCredentials
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
