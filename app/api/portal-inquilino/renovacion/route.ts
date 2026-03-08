import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-inquilino/renovacion — Get renewal proposal for tenant
 * POST /api/portal-inquilino/renovacion — Accept/reject renewal
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

    const contract = await prisma.contract.findFirst({
      where: { tenantId, estado: 'activo' },
      include: {
        unit: { select: { numero: true, tipo: true, building: { select: { nombre: true, direccion: true } } } },
      },
      orderBy: { fechaFin: 'asc' },
    });

    if (!contract) return NextResponse.json({ error: 'No active contract' }, { status: 404 });

    const daysToExpiry = Math.ceil((contract.fechaFin.getTime() - Date.now()) / 86400000);
    const IPC = 3.2;
    const newRent = Math.round(contract.rentaMensual * (1 + IPC / 100) * 100) / 100;

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        edificio: contract.unit?.building?.nombre,
        unidad: contract.unit?.numero,
        direccion: contract.unit?.building?.direccion,
        rentaActual: contract.rentaMensual,
        fechaFin: contract.fechaFin.toISOString(),
        diasParaVencimiento: daysToExpiry,
      },
      propuesta: {
        nuevaRenta: newRent,
        incremento: IPC,
        incrementoEuros: Math.round((newRent - contract.rentaMensual) * 100) / 100,
        duracion: '1 año',
        nuevaFechaFin: new Date(contract.fechaFin.getTime() + 365 * 86400000).toISOString(),
      },
      estado: daysToExpiry <= 90 ? 'pendiente_respuesta' : 'no_requiere_accion',
    });
  } catch (error: any) {
    logger.error('[Tenant Renewal GET]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { contractId, decision, comentario } = await request.json();
    if (!contractId || !decision) {
      return NextResponse.json({ error: 'contractId y decision (aceptar/rechazar) requeridos' }, { status: 400 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, rentaMensual: true, fechaFin: true, tenantId: true, unit: { select: { building: { select: { companyId: true } } } } },
    });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

    if (decision === 'aceptar') {
      const IPC = 3.2;
      const newRent = Math.round(contract.rentaMensual * (1 + IPC / 100) * 100) / 100;
      const newEnd = new Date(contract.fechaFin.getTime() + 365 * 86400000);

      await prisma.contract.update({
        where: { id: contractId },
        data: {
          rentaMensual: newRent,
          fechaFin: newEnd,
          clausulasAdicionales: `Renovación aceptada por inquilino el ${new Date().toLocaleDateString('es-ES')}. IPC ${IPC}%. ${comentario || ''}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Renovación aceptada. Nueva renta: ' + newRent + '€/mes' });
    } else {
      // Tenant rejects — notify admin
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          clausulasAdicionales: `RENOVACIÓN RECHAZADA por inquilino el ${new Date().toLocaleDateString('es-ES')}. Motivo: ${comentario || 'Sin especificar'}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Renovación rechazada. Se notificará al administrador.' });
    }
  } catch (error: any) {
    logger.error('[Tenant Renewal POST]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
