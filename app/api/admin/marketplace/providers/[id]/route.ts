/**
 * API para gestionar un proveedor específico del marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: {
        marketplaceServices: {
          select: { id: true, categoria: true },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: provider.id,
        nombre: provider.nombre,
        email: provider.email || '',
        telefono: provider.telefono,
        website: null,
        direccion: provider.direccion || null,
        descripcion: provider.notas || null,
        categoria: provider.marketplaceServices[0]?.categoria || provider.tipo || 'General',
        serviciosCount: provider.marketplaceServices.length,
        rating: provider.rating || 0,
        transaccionesTotal: 0,
        estado: provider.activo ? 'active' : 'suspended',
        createdAt: provider.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.error('[API Error] Get marketplace provider:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};

    const provider = await prisma.provider.update({
      where: { id: params.id },
      data: {
        nombre: typeof payload.nombre === 'string' ? payload.nombre : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        telefono: typeof payload.telefono === 'string' ? payload.telefono : undefined,
        direccion: typeof payload.direccion === 'string' ? payload.direccion : undefined,
        tipo: typeof payload.categoria === 'string' ? payload.categoria : undefined,
        notas: typeof payload.descripcion === 'string' ? payload.descripcion : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: provider.id,
        nombre: provider.nombre,
        email: provider.email || '',
        telefono: provider.telefono,
        website: null,
        direccion: provider.direccion || null,
        descripcion: provider.notas || null,
        categoria: provider.tipo || 'General',
        serviciosCount: 0,
        rating: provider.rating || 0,
        transaccionesTotal: 0,
        estado: provider.activo ? 'active' : 'suspended',
        updatedAt: provider.updatedAt.toISOString(),
      },
      message: 'Proveedor actualizado correctamente',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Update marketplace provider:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.provider.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Proveedor eliminado correctamente',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Delete marketplace provider:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// Endpoint específico para aprobar/suspender
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const action =
      typeof body === 'object' && body !== null ? (body as { action?: string }).action : undefined; // 'approve' | 'suspend' | 'activate'

    let message = '';
    let newStatus = '';

    switch (action) {
      case 'approve':
        newStatus = 'active';
        message = 'Proveedor aprobado correctamente';
        break;
      case 'suspend':
        newStatus = 'suspended';
        message = 'Proveedor suspendido';
        break;
      case 'activate':
        newStatus = 'active';
        message = 'Proveedor activado correctamente';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    await prisma.provider.update({
      where: { id: params.id },
      data: { activo: newStatus === 'active' },
    });

    return NextResponse.json({
      success: true,
      data: { id: params.id, estado: newStatus },
      message,
    });
  } catch (error: unknown) {
    logger.error('[API Error] Patch marketplace provider:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
