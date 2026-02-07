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
    const sessionUser = session?.user as { role?: string | null } | undefined;
    if (!session?.user || sessionUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const invitation = await prisma.partnerInvitation.findUnique({
      where: { id: params.id },
      include: {
        partner: {
          select: { nombre: true, comisionPorcentaje: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    const metadata = (invitation.metadata ?? {}) as {
      empresa?: string;
      comisionOfrecida?: number;
    };

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        nombre: invitation.nombre || undefined,
        empresa: metadata.empresa || undefined,
        estado:
          invitation.estado === 'PENDING'
            ? 'pending'
            : invitation.estado === 'ACCEPTED'
            ? 'accepted'
            : invitation.estado === 'EXPIRED'
            ? 'expired'
            : 'rejected',
        comisionOfrecida:
          typeof metadata.comisionOfrecida === 'number'
            ? metadata.comisionOfrecida
            : invitation.partner?.comisionPorcentaje || 0,
        creadoEn: invitation.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
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
    const sessionUser = session?.user as { role?: string | null } | undefined;
    if (!session?.user || sessionUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const invitation = await prisma.partnerInvitation.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    const metadata = (invitation.metadata ?? {}) as {
      empresa?: string;
      comisionOfrecida?: number;
    };

    const updated = await prisma.partnerInvitation.update({
      where: { id: params.id },
      data: {
        email: typeof body.email === 'string' ? body.email : invitation.email,
        nombre: typeof body.nombre === 'string' ? body.nombre : invitation.nombre,
        mensaje: typeof body.mensaje === 'string' ? body.mensaje : invitation.mensaje,
        metadata: {
          ...metadata,
          empresa: typeof body.empresa === 'string' ? body.empresa : metadata.empresa,
          comisionOfrecida:
            typeof body.comisionOfrecida === 'number'
              ? body.comisionOfrecida
              : metadata.comisionOfrecida,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Invitación actualizada',
    });
  } catch (error: unknown) {
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
    const sessionUser = session?.user as { role?: string | null } | undefined;
    if (!session?.user || sessionUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const invitation = await prisma.partnerInvitation.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    // Solo permitir eliminar si está en estado PENDING
    if (invitation.estado !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar invitaciones pendientes' },
        { status: 400 }
      );
    }

    await prisma.partnerInvitation.update({
      where: { id: params.id },
      data: { estado: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitación eliminada correctamente',
    });
  } catch (error: unknown) {
    logger.error('[Partner Invitation DELETE Error]:', error);
    return NextResponse.json({ error: 'Error eliminando invitación' }, { status: 500 });
  }
}
