import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notification-rules/[id]
 * Obtiene una regla de notificación específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const rule = await prisma.notificationRule.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        template: true,
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Regla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error: any) {
    logger.error('Error al obtener regla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener regla de notificación' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notification-rules/[id]
 * Actualiza una regla de notificación
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Verificar que la regla pertenece a la empresa del usuario
    const existingRule = await prisma.notificationRule.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Regla no encontrada' },
        { status: 404 }
      );
    }

    const rule = await prisma.notificationRule.update({
      where: {
        id: params.id,
      },
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        activa: body.activa,
        tipoEvento: body.tipoEvento,
        condiciones: body.condiciones,
        diasAnticipo: body.diasAnticipo,
        canales: body.canales,
        rolesDestinatarios: body.rolesDestinatarios,
        usuariosEspecificos: body.usuariosEspecificos,
        templateId: body.templateId,
        asunto: body.asunto,
        mensaje: body.mensaje,
        prioridad: body.prioridad,
      },
      include: {
        template: true,
      },
    });

    logger.info(`Regla de notificación actualizada: ${rule.id}`, { userId: user.id });

    return NextResponse.json(rule);
  } catch (error: any) {
    logger.error('Error al actualizar regla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar regla de notificación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notification-rules/[id]
 * Elimina una regla de notificación
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Verificar que la regla pertenece a la empresa del usuario
    const existingRule = await prisma.notificationRule.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Regla no encontrada' },
        { status: 404 }
      );
    }

    await prisma.notificationRule.delete({
      where: {
        id: params.id,
      },
    });

    logger.info(`Regla de notificación eliminada: ${params.id}`, { userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error al eliminar regla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al eliminar regla de notificación' },
      { status: 500 }
    );
  }
}