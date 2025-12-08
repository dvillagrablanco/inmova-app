import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/workflows/[id] - Obtener un workflow específico
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        actions: {
          orderBy: {
            orden: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        executions: {
          take: 10,
          orderBy: {
            startedAt: 'desc',
          },
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
  } catch (error: any) {
    console.error('Error obteniendo workflow:', error);
    return NextResponse.json(
      { error: 'Error obteniendo workflow' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/[id] - Actualizar un workflow
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // Verificar que el workflow pertenece a la empresa
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow no encontrado' },
        { status: 404 }
      );
    }

    const {
      nombre,
      descripcion,
      triggerType,
      triggerConfig,
      actions,
      isActive,
      status,
    } = body;

    // Eliminar acciones existentes si se envían nuevas
    if (actions) {
      await prisma.workflowAction.deleteMany({
        where: {
          workflowId: id,
        },
      });
    }

    // Actualizar workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(triggerType && { triggerType }),
        ...(triggerConfig && { triggerConfig }),
        ...(isActive !== undefined && { isActive }),
        ...(status && { status }),
        version: existingWorkflow.version + 1,
        ...(actions && {
          actions: {
            create: actions.map((action: any, index: number) => ({
              orden: index + 1,
              actionType: action.actionType,
              config: action.config,
              conditions: action.conditions || null,
            })),
          },
        }),
      },
      include: {
        actions: {
          orderBy: {
            orden: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error: any) {
    console.error('Error actualizando workflow:', error);
    return NextResponse.json(
      { error: 'Error actualizando workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id] - Eliminar un workflow
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que el workflow pertenece a la empresa
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar workflow (cascade elimina acciones y ejecuciones)
    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Workflow eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando workflow:', error);
    return NextResponse.json(
      { error: 'Error eliminando workflow' },
      { status: 500 }
    );
  }
}
