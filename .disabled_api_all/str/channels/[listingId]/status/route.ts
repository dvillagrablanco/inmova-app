import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getChannelStatus,
  getSupportedChannels,
  getChannelConfig,
} from '@/lib/str-channel-integration-service';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/str/channels/[listingId]/status
 * Obtiene el estado de todas las conexiones de un listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { listingId } = params;
    const companyId = session?.user?.companyId;

    // Verificar que el listing pertenece a la compañía
    const listing = await prisma.sTRListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Listing no encontrado' },
        { status: 404 },
      );
    }

    // Obtener estado de todos los canales soportados
    const channels = getSupportedChannels();
    const channelStatuses = await Promise.all(
      channels.map(async (channel) => {
        const status = await getChannelStatus(listingId, channel);
        const config = getChannelConfig(channel);
        return {
          channel,
          name: config.name,
          status,
          config,
        };
      }),
    );

    return NextResponse.json({
      listingId,
      channels: channelStatuses,
    });
  } catch (error) {
    logError(error as Error, {
      context: 'GET /api/str/channels/[listingId]/status',
    });
    return NextResponse.json(
      {
        error: 'Error al obtener estado de canales',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
