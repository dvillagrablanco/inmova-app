/**
 * API para gestionar un proveedor específico del marketplace
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

    const provider = await prisma.provider.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });

    if (!provider) {
      return NextResponse.json(
        { success: true, data: null, message: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    logger.error('[API Error] Get marketplace provider:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const existing = await prisma.provider.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const updated = await prisma.provider.update({
      where: { id: params.id },
      data: {
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono,
        website: body.website || null,
        direccion: body.direccion || null,
        descripcion: body.descripcion || null,
        tipo: body.categoria,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Proveedor actualizado correctamente',
    });
  } catch (error) {
    logger.error('[API Error] Update marketplace provider:', error);
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

    const existing = await prisma.provider.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    await prisma.provider.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    logger.error('[API Error] Delete marketplace provider:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el proveedor' }, { status: 500 });
  }
}

// Endpoint específico para aprobar/suspender
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
    const { action } = body; // 'approve' | 'suspend' | 'activate'

    const existing = await prisma.provider.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    let message = '';
    let newStatus: 'active' | 'pending' | 'suspended';
    let activo = true;

    switch (action) {
      case 'approve':
        newStatus = 'active';
        activo = true;
        message = 'Proveedor aprobado correctamente';
        break;
      case 'suspend':
        newStatus = 'suspended';
        activo = false;
        message = 'Proveedor suspendido';
        break;
      case 'activate':
        newStatus = 'active';
        activo = true;
        message = 'Proveedor activado correctamente';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const updated = await prisma.provider.update({
      where: { id: params.id },
      data: {
        estado: newStatus,
        activo,
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, estado: updated.estado },
      message,
    });
  } catch (error) {
    logger.error('[API Error] Patch marketplace provider:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
