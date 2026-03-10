/**
 * API: Liquidación por ID
 * GET, PUT, DELETE para una liquidación específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getLiquidacionById,
  updateLiquidacion,
  softDeleteLiquidacion,
  type LiquidacionEstado,
} from '../route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const liquidacion = getLiquidacionById(id);

    if (!liquidacion) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    if (liquidacion.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: liquidacion,
    });
  } catch (error: unknown) {
    console.error('[Liquidación GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener liquidación' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const liquidacion = getLiquidacionById(id);

    if (!liquidacion) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    if (liquidacion.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const updates: { estado?: LiquidacionEstado; notas?: string } = {};

    if (body.estado !== undefined) {
      const validEstados: LiquidacionEstado[] = ['pendiente', 'pagada', 'anulada'];
      if (validEstados.includes(body.estado)) {
        updates.estado = body.estado;
      }
    }
    if (body.notas !== undefined) {
      updates.notas = String(body.notas);
    }

    const updated = updateLiquidacion(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Error al actualizar liquidación' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Liquidación actualizada correctamente',
    });
  } catch (error: unknown) {
    console.error('[Liquidación PUT]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar liquidación' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const liquidacion = getLiquidacionById(id);

    if (!liquidacion) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    if (liquidacion.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const ok = softDeleteLiquidacion(id);

    if (!ok) {
      return NextResponse.json(
        { error: 'Error al eliminar liquidación' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Liquidación anulada correctamente',
    });
  } catch (error: unknown) {
    console.error('[Liquidación DELETE]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar liquidación' },
      { status: 500 }
    );
  }
}
