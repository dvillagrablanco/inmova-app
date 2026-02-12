export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { addDays } from 'date-fns';
import {

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
  syncCalendar,
  importBookings,
  updateChannelPrices,
} from '@/lib/str-channel-integration-service';

// GET - Obtener configuración de canales con métricas
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    // Obtener sincronizaciones de canales
    const channels = await prisma.sTRChannelSync.findMany({
      where: {
        companyId: user.companyId,
        ...(listingId && { listingId }),
      },
      include: {
        listing: {
          select: {
            id: true,
            titulo: true,
            precioPorNoche: true,
            tasaOcupacion: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Obtener métricas recientes por canal
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await prisma.sTRChannelMetrics.groupBy({
      by: ['canal'],
      where: {
        listing: { companyId: user.companyId },
        periodo: { gte: thirtyDaysAgo },
      },
      _sum: {
        reservasRecibidas: true,
        ingresosBrutos: true,
        comisionesCanal: true,
        nochesReservadas: true,
      },
      _avg: {
        tasaOcupacion: true,
        adr: true,
        ratingPromedio: true,
      },
    });

    // Historial de sincronizaciones recientes
    const recentSyncs = await prisma.sTRSyncHistory.findMany({
      where: {
        iniciadoEn: { gte: thirtyDaysAgo },
      },
      orderBy: { iniciadoEn: 'desc' },
      take: 50,
    });

    // Calcular estadísticas de sincronización
    const syncStats = {
      total: recentSyncs.length,
      exitosos: recentSyncs.filter((s) => s.exitoso).length,
      fallidos: recentSyncs.filter((s) => !s.exitoso).length,
      tasaExito:
        recentSyncs.length > 0
          ? ((recentSyncs.filter((s) => s.exitoso).length / recentSyncs.length) * 100).toFixed(1)
          : 100,
    };

    return NextResponse.json({
      channels,
      metrics,
      recentSyncs: recentSyncs.slice(0, 20),
      syncStats,
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Sincronizar canal manualmente
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const data = await request.json();

    const { channelId, tipoEvento } = data;

    const channelSync = await prisma.sTRChannelSync.findUnique({
      where: { id: channelId },
    });

    if (!channelSync) {
      return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 });
    }
    if (!channelSync.activo) {
      return NextResponse.json({ error: 'Canal inactivo' }, { status: 400 });
    }

    // Registrar intento de sincronización
    const syncHistory = await prisma.sTRSyncHistory.create({
      data: {
        channelSyncId: channelId,
        tipoEvento: tipoEvento || 'availability_update',
        direccion: 'push',
        exitoso: false, // Se actualizará cuando termine
      },
    });

    // Simular sincronización (en producción esto llamaría a APIs reales)
    const startTime = Date.now();

    // Actualizar estado del canal
    await prisma.sTRChannelSync.update({
      where: { id: channelId },
      data: {
        ultimaSync: new Date(),
        estadoSync: 'sincronizando',
      },
    });
    let result;

    switch (tipoEvento) {
      case 'availability_update':
      case 'calendar':
        result = await syncCalendar(
          channelSync.listingId,
          channelSync.canal as any,
          new Date(),
          addDays(new Date(), 90)
        );
        break;
      case 'bookings':
        result = await importBookings(
          user.companyId,
          channelSync.listingId,
          channelSync.canal as any
        );
        break;
      case 'pricing':
        if (!data?.priceUpdates) {
          return NextResponse.json(
            { error: 'priceUpdates requerido para pricing' },
            { status: 400 }
          );
        }
        result = await updateChannelPrices(
          channelSync.listingId,
          channelSync.canal as any,
          data.priceUpdates
        );
        break;
      default:
        return NextResponse.json({ error: 'Tipo de sincronización no válido' }, { status: 400 });
    }

    const endTime = Date.now();
    const exitoso = Boolean(result?.success);

    await prisma.sTRSyncHistory.update({
      where: { id: syncHistory.id },
      data: {
        exitoso,
        finalizadoEn: new Date(),
        duracionMs: endTime - startTime,
        mensajeError: exitoso ? null : (result?.errors || ['Error de sincronización'])[0],
      },
    });

    await prisma.sTRChannelSync.update({
      where: { id: channelId },
      data: {
        estadoSync: exitoso ? 'sincronizado' : 'error',
        erroresSync: exitoso ? 0 : { increment: 1 },
      },
    });

    return NextResponse.json({
      success: exitoso,
      syncId: syncHistory.id,
      message: exitoso ? 'Sincronización completada' : 'Error durante la sincronización',
      result,
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
