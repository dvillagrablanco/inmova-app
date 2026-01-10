/**
 * API para gestionar una comisión específica del marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Conectar con modelo real
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Comisión no encontrada',
    }, { status: 404 });
  } catch (error) {
    console.error('[API Error] Get marketplace commission:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT para actualizar configuración de comisión
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { commissionType, commissionRate, status } = body;

    // TODO: Conectar con modelo real y actualizar en BD

    return NextResponse.json({
      success: true,
      data: { 
        id: params.id, 
        commissionType,
        commissionRate,
        status,
        updatedAt: new Date().toISOString(),
      },
      message: 'Configuración de comisión actualizada',
    });
  } catch (error) {
    console.error('[API Error] Update marketplace commission:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH para cambiar estado de comisión
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'activate' | 'pause' | 'process' | 'pay'

    let message = '';
    let newStatus = '';

    switch (action) {
      case 'activate':
        newStatus = 'active';
        message = 'Comisión activada';
        break;
      case 'pause':
        newStatus = 'paused';
        message = 'Comisión pausada';
        break;
      case 'process':
        newStatus = 'processed';
        message = 'Comisión procesada';
        break;
      case 'pay':
        newStatus = 'paid';
        message = 'Comisión marcada como pagada';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { id: params.id, status: newStatus },
      message,
    });
  } catch (error) {
    console.error('[API Error] Patch marketplace commission:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Conectar con modelo real

    return NextResponse.json({
      success: true,
      message: 'Comisión eliminada correctamente',
    });
  } catch (error) {
    console.error('[API Error] Delete marketplace commission:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
