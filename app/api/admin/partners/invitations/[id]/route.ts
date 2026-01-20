/**
 * API para gestionar una invitación específica de partner
 * 
 * GET /api/admin/partners/invitations/[id] - Obtener invitación
 * PUT /api/admin/partners/invitations/[id] - Actualizar invitación
 * DELETE /api/admin/partners/invitations/[id] - Eliminar invitación
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
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const invitation = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        nombre: invitation.contactName,
        empresa: invitation.companyName,
        estado: invitation.status === 'PENDING' ? 'pending' : invitation.status === 'ACTIVE' ? 'accepted' : 'expired',
        comisionOfrecida: invitation.commissionRate || 15,
        creadoEn: invitation.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('[Partner Invitation GET Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo invitación' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const invitation = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    // Actualizar invitación (partner PENDING)
    const updated = await prisma.partner.update({
      where: { id: params.id },
      data: {
        email: body.email || invitation.email,
        contactName: body.nombre || invitation.contactName,
        companyName: body.empresa || invitation.companyName,
        commissionRate: body.comisionOfrecida || invitation.commissionRate,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Invitación actualizada',
    });
  } catch (error: any) {
    logger.error('[Partner Invitation PUT Error]:', error);
    return NextResponse.json({ error: 'Error actualizando invitación' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const invitation = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    // Solo permitir eliminar si está en estado PENDING
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar invitaciones pendientes' },
        { status: 400 }
      );
    }

    // Eliminar invitación (partner PENDING)
    await prisma.partner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitación eliminada correctamente',
    });
  } catch (error: any) {
    logger.error('[Partner Invitation DELETE Error]:', error);
    return NextResponse.json({ error: 'Error eliminando invitación' }, { status: 500 });
  }
}
