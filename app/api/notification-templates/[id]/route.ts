import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notification-templates/[id]
 * Obtiene una plantilla de notificación específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { companyId: user.companyId },
          { esPlantillaGlobal: true },
        ],
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al obtener plantilla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener plantilla de notificación' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notification-templates/[id]
 * Actualiza una plantilla de notificación (solo personalizadas)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Verificar que la plantilla pertenece a la empresa y no es global
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        esPlantillaGlobal: false,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada o no editable' },
        { status: 404 }
      );
    }

    const template = await prisma.notificationTemplate.update({
      where: {
        id: params.id,
      },
      data: {
        nombre: body.nombre,
        categoria: body.categoria,
        asuntoEmail: body.asuntoEmail,
        mensajeEmail: body.mensajeEmail,
        mensajePush: body.mensajePush,
        mensajeSMS: body.mensajeSMS,
        variables: body.variables,
        activa: body.activa,
      },
    });

    logger.info(`Plantilla de notificación actualizada: ${template.id}`, { userId: user.id });

    return NextResponse.json(template);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al actualizar plantilla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar plantilla de notificación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notification-templates/[id]
 * Elimina una plantilla de notificación (solo personalizadas)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Verificar que la plantilla pertenece a la empresa y no es global
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        esPlantillaGlobal: false,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada o no eliminable' },
        { status: 404 }
      );
    }

    await prisma.notificationTemplate.delete({
      where: {
        id: params.id,
      },
    });

    logger.info(`Plantilla de notificación eliminada: ${params.id}`, { userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al eliminar plantilla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al eliminar plantilla de notificación' },
      { status: 500 }
    );
  }
}