/**
 * API para gestionar una categoría específica del marketplace
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
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Conectar con modelo real
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Categoría no encontrada',
    }, { status: 404 });
  } catch (error) {
    console.error('[API Error] Get marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Simular actualización exitosa
    return NextResponse.json({
      success: true,
      data: { id: params.id, ...body, updatedAt: new Date().toISOString() },
      message: 'Categoría actualizada correctamente',
    });
  } catch (error) {
    console.error('[API Error] Update marketplace category:', error);
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

    // Simular eliminación exitosa
    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente',
    });
  } catch (error) {
    console.error('[API Error] Delete marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH para activar/desactivar
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
    const { activo } = body;

    return NextResponse.json({
      success: true,
      data: { id: params.id, activo },
      message: activo ? 'Categoría activada' : 'Categoría desactivada',
    });
  } catch (error) {
    console.error('[API Error] Patch marketplace category:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
