/**
 * API para gestionar una reserva específica del marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const reservation = await prisma.marketplaceBooking.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
      include: {
        service: { select: { nombre: true, categoria: true, provider: { select: { nombre: true } } } },
        tenant: { select: { nombreCompleto: true, email: true } },
        unit: { select: { numero: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: true, data: null, message: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    logger.error('[API Error] Get marketplace reservation:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH para cambiar estado de reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'confirm' | 'cancel' | 'complete'

    const existing = await prisma.marketplaceBooking.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    let message = '';
    let newStatus: string;

    switch (action) {
      case 'confirm':
        newStatus = 'confirmada';
        message = 'Reserva confirmada correctamente';
        break;
      case 'cancel':
        newStatus = 'cancelada';
        message = 'Reserva cancelada';
        break;
      case 'complete':
        newStatus = 'completada';
        message = 'Reserva marcada como completada';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const updated = await prisma.marketplaceBooking.update({
      where: { id: params.id },
      data: { estado: newStatus },
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, estado: updated.estado },
      message,
    });
  } catch (error) {
    logger.error('[API Error] Patch marketplace reservation:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existing = await prisma.marketplaceBooking.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    await prisma.marketplaceBooking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada correctamente',
    });
  } catch (error) {
    logger.error('[API Error] Delete marketplace reservation:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
