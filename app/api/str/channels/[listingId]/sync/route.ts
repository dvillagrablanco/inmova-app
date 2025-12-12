import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  syncCalendar,
  importBookings,
  updateChannelPrices,
} from '@/lib/str-channel-integration-service';
import type { ChannelType } from '@prisma/client';
import { addDays } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/str/channels/[listingId]/sync
 * Sincroniza datos con un canal externo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { listingId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { listingId } = params;
    const body = await request.json();
    const { channel, type, data } = body;

    if (!channel || !type) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 },
      );
    }

    // Validar que el canal es válido
    if (!Object.values(ChannelType).includes(channel)) {
      return NextResponse.json(
        { error: 'Canal no válido' },
        { status: 400 },
      );
    }

    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Usuario sin compañía asignada' },
        { status: 400 },
      );
    }

    logger.info(
      `[STR API] Sincronizando ${type} para listing ${listingId} en canal ${channel}`,
    );

    let result;

    switch (type) {
      case 'calendar':
        // Sincronizar calendario (por defecto 90 días)
        const startDate = data?.startDate ? new Date(data.startDate) : new Date();
        const endDate = data?.endDate
          ? new Date(data.endDate)
          : addDays(new Date(), 90);
        result = await syncCalendar(
          listingId,
          channel as ChannelType,
          startDate,
          endDate,
        );
        break;

      case 'bookings':
        // Importar reservas
        result = await importBookings(companyId, listingId, channel as ChannelType);
        break;

      case 'prices':
        // Actualizar precios
        if (!data || !data.priceUpdates) {
          return NextResponse.json(
            { error: 'Se requieren actualizaciones de precio' },
            { status: 400 },
          );
        }
        result = await updateChannelPrices(
          listingId,
          channel as ChannelType,
          data.priceUpdates,
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de sincronización no válido' },
          { status: 400 },
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Sincronización de ${type} completada`,
        result,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Error en sincronización de ${type}`,
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logError(error as Error, {
      context: 'POST /api/str/channels/[listingId]/sync',
    });
    return NextResponse.json(
      {
        error: 'Error al sincronizar',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
