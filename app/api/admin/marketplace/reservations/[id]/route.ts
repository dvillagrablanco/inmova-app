/**
 * API para gestionar una reserva específica del marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Conectar con modelo real
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Reserva no encontrada',
    }, { status: 404 });
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
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'confirm' | 'cancel' | 'complete'

    let message = '';
    let newStatus = '';

    switch (action) {
      case 'confirm':
        newStatus = 'confirmed';
        message = 'Reserva confirmada correctamente';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        message = 'Reserva cancelada';
        break;
      case 'complete':
        newStatus = 'completed';
        message = 'Reserva marcada como completada';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // TODO: Conectar con modelo real y actualizar en BD

    return NextResponse.json({
      success: true,
      data: { id: params.id, estado: newStatus },
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
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Conectar con modelo real

    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada correctamente',
    });
  } catch (error) {
    logger.error('[API Error] Delete marketplace reservation:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
