import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  toggleWorkflow,
  deleteWorkflow,
  executeWorkflow,
} from '@/lib/workflow-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workflows/[id] - Obtiene un workflow específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        actions: {
          orderBy: { orden: 'asc' },
        },
        executions: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    logger.error({ context: 'Error obteniendo workflow' });
    return NextResponse.json(
      { error: 'Error al obtener workflow' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/[id] - Actualiza un workflow
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Verificar que el workflow pertenece a la empresa
    const existing = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow no encontrado' },
        { status: 404 }
      );
    }

    // Manejar acción especial de activar/desactivar
    if (body.action === 'toggle') {
      const workflow = await toggleWorkflow(params.id, body.isActive);
      return NextResponse.json(workflow);
    }

    // Manejar acción especial de ejecutar
    if (body.action === 'execute') {
      const result = await executeWorkflow(params.id, body.triggerData || {});
      return NextResponse.json(result);
    }

    // Actualización general
    const updateData: any = {};
    if (body.nombre) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.triggerConfig) updateData.triggerConfig = body.triggerConfig;

    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: updateData,
      include: {
        actions: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    logger.info('Workflow actualizado', { workflowId: params.id });

    return NextResponse.json(workflow);
  } catch (error) {
    logger.error({ context: 'Error actualizando workflow' });
    return NextResponse.json(
      { error: 'Error al actualizar workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id] - Elimina un workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el workflow pertenece a la empresa
    const existing = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow no encontrado' },
        { status: 404 }
      );
    }

    await deleteWorkflow(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ context: 'Error eliminando workflow' });
    return NextResponse.json(
      { error: 'Error al eliminar workflow' },
      { status: 500 }
    );
  }
}
