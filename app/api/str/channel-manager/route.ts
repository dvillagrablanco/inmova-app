import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';

// GET - Obtener configuración de canales con métricas
export async function GET(request: NextRequest) {
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
          }
        }
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
      }
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
      exitosos: recentSyncs.filter(s => s.exitoso).length,
      fallidos: recentSyncs.filter(s => !s.exitoso).length,
      tasaExito: recentSyncs.length > 0 
        ? (recentSyncs.filter(s => s.exitoso).length / recentSyncs.length * 100).toFixed(1)
        : 100,
    };
    
    return NextResponse.json({
      channels,
      metrics,
      recentSyncs: recentSyncs.slice(0, 20),
      syncStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Sincronizar canal manualmente
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    
    const { channelId, tipoEvento } = data;
    
    // Registrar intento de sincronización
    const syncHistory = await prisma.sTRSyncHistory.create({
      data: {
        channelSyncId: channelId,
        tipoEvento: tipoEvento || 'availability_update',
        direccion: 'push',
        exitoso: false, // Se actualizará cuando termine
      }
    });
    
    // Simular sincronización (en producción esto llamaría a APIs reales)
    const startTime = Date.now();
    
    // Actualizar estado del canal
    await prisma.sTRChannelSync.update({
      where: { id: channelId },
      data: {
        ultimaSync: new Date(),
        estadoSync: 'sincronizando',
      }
    });
    
    // Simular proceso de sincronización
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const endTime = Date.now();
    const exitoso = Math.random() > 0.1; // 90% éxito simulado
    
    // Actualizar historial
    await prisma.sTRSyncHistory.update({
      where: { id: syncHistory.id },
      data: {
        exitoso,
        finalizadoEn: new Date(),
        duracionMs: endTime - startTime,
        mensajeError: exitoso ? null : 'Error de conexión con el canal',
      }
    });
    
    // Actualizar estado final del canal
    await prisma.sTRChannelSync.update({
      where: { id: channelId },
      data: {
        estadoSync: exitoso ? 'sincronizado' : 'error',
        erroresSync: exitoso ? 0 : { increment: 1 },
      }
    });
    
    return NextResponse.json({
      success: exitoso,
      syncId: syncHistory.id,
      message: exitoso ? 'Sincronización completada' : 'Error durante la sincronización',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
