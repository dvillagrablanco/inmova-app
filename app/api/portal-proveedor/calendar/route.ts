import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-proveedor/calendar?providerId=xxx
 * Returns work orders as calendar events for the provider
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    if (!providerId) return NextResponse.json({ error: 'providerId required' }, { status: 400 });

    const workOrders = await prisma.maintenanceRequest.findMany({
      where: { proveedorAsignado: providerId },
      select: {
        id: true, titulo: true, descripcion: true, estado: true, prioridad: true,
        fechaSolicitud: true, fechaCompletado: true, costoEstimado: true,
        unit: { select: { numero: true, building: { select: { nombre: true, direccion: true } } } },
      },
      orderBy: { fechaSolicitud: 'desc' },
      take: 50,
    });

    const events = workOrders.map(wo => ({
      id: wo.id,
      title: wo.titulo,
      description: wo.descripcion,
      location: `${wo.unit?.building?.nombre || ''} ${wo.unit?.numero || ''}`,
      address: wo.unit?.building?.direccion || '',
      date: wo.fechaSolicitud.toISOString(),
      completedDate: wo.fechaCompletado?.toISOString() || null,
      status: wo.estado,
      priority: wo.prioridad,
      cost: wo.costoEstimado,
    }));

    const stats = {
      total: events.length,
      pendientes: events.filter(e => e.status === 'pendiente').length,
      enProgreso: events.filter(e => e.status === 'en_progreso').length,
      completados: events.filter(e => e.status === 'completado').length,
    };

    return NextResponse.json({ success: true, events, stats });
  } catch (error: any) {
    logger.error('[Provider Calendar]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
