import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-propietario/approvals?ownerId=xxx — Pending approvals
 * POST /api/portal-propietario/approvals — Approve/reject
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 });

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: { ownerBuildings: { select: { buildingId: true } } },
    });
    if (!owner) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const buildingIds = owner.ownerBuildings.map(ob => ob.buildingId);

    // Pending contract renewals
    const renewals = await prisma.contract.findMany({
      where: { estado: 'activo', unit: { buildingId: { in: buildingIds } }, fechaFin: { lte: new Date(Date.now() + 90 * 86400000) } },
      select: { id: true, rentaMensual: true, fechaFin: true, tenant: { select: { nombreCompleto: true } }, unit: { select: { numero: true, building: { select: { nombre: true } } } } },
    });

    // Pending maintenance requests (high cost)
    const maintenance = await prisma.maintenanceRequest.findMany({
      where: { unit: { buildingId: { in: buildingIds } }, estado: 'pendiente', costoEstimado: { gt: 500 } },
      select: { id: true, titulo: true, costoEstimado: true, prioridad: true, unit: { select: { numero: true, building: { select: { nombre: true } } } } },
    });

    return NextResponse.json({
      success: true,
      approvals: {
        renovaciones: renewals.map(r => ({ id: r.id, tipo: 'renovacion', edificio: r.unit?.building?.nombre, unidad: r.unit?.numero, inquilino: r.tenant?.nombreCompleto, renta: r.rentaMensual, vencimiento: r.fechaFin })),
        mantenimiento: maintenance.map(m => ({ id: m.id, tipo: 'mantenimiento', edificio: m.unit?.building?.nombre, unidad: m.unit?.numero, titulo: m.titulo, coste: m.costoEstimado, prioridad: m.prioridad })),
      },
      totalPendientes: renewals.length + maintenance.length,
    });
  } catch (error: any) {
    logger.error('[Owner Approvals]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { itemId, tipo, decision, comentario } = await request.json();
    if (!itemId || !tipo || !decision) return NextResponse.json({ error: 'itemId, tipo, decision required' }, { status: 400 });

    if (tipo === 'mantenimiento') {
      await prisma.maintenanceRequest.update({
        where: { id: itemId },
        data: { estado: decision === 'aprobar' ? 'aprobada' : 'rechazada' },
      });
    }

    return NextResponse.json({ success: true, message: `${tipo} ${decision === 'aprobar' ? 'aprobado' : 'rechazado'}` });
  } catch (error: any) {
    logger.error('[Owner Approval POST]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
