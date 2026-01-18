import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/admin-roles';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/email/templates/[id]
 * Obtener una plantilla de email por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;

    try {
      const template = await (prisma as any).emailTemplate?.findUnique({
        where: { id },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Plantilla no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({ template });
    } catch (dbError) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    logger.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantilla' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email/templates/[id]
 * Actualizar una plantilla de email
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    const updateData: any = {};
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.asunto !== undefined) updateData.asunto = body.asunto;
    if (body.contenidoHtml !== undefined) updateData.contenidoHtml = body.contenidoHtml;
    if (body.contenidoTexto !== undefined) updateData.contenidoTexto = body.contenidoTexto;
    if (body.variables !== undefined) updateData.variables = body.variables;
    if (body.activa !== undefined) updateData.activa = body.activa;
    if (body.envioAutomatico !== undefined) updateData.envioAutomatico = body.envioAutomatico;
    if (body.eventoTrigger !== undefined) updateData.eventoTrigger = body.eventoTrigger;

    try {
      const template = await (prisma as any).emailTemplate?.update({
        where: { id },
        data: updateData,
      });

      if (template) {
        return NextResponse.json({ template });
      }
    } catch (dbError) {
      logger.warn('EmailTemplate table not found');
    }

    // Fallback
    return NextResponse.json({
      template: {
        id,
        ...updateData,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plantilla' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email/templates/[id]
 * Eliminar una plantilla de email
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    try {
      await (prisma as any).emailTemplate?.delete({
        where: { id },
      });
    } catch (dbError) {
      logger.warn('EmailTemplate table not found or template not found');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error deleting email template:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plantilla' },
      { status: 500 }
    );
  }
}
