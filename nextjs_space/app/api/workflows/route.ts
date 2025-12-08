import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/workflows - Listar workflows de la empresa
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const workflows = await prisma.workflow.findMany({
      where,
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
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(workflows);
  } catch (error: any) {
    console.error('Error obteniendo workflows:', error);
    return NextResponse.json(
      { error: 'Error obteniendo workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows - Crear un nuevo workflow
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      nombre,
      descripcion,
      triggerType,
      triggerConfig,
      actions,
      isActive,
    } = body;

    // Validaciones básicas
    if (!nombre || !triggerType || !triggerConfig) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear workflow con sus acciones
    const workflow = await prisma.workflow.create({
      data: {
        companyId: session.user.companyId,
        createdBy: session.user.id,
        nombre,
        descripcion,
        triggerType,
        triggerConfig,
        isActive: isActive !== undefined ? isActive : false,
        status: isActive ? 'activo' : 'borrador',
        actions: {
          create: actions?.map((action: any, index: number) => ({
            orden: index + 1,
            actionType: action.actionType,
            config: action.config,
            conditions: action.conditions || null,
          })) || [],
        },
      },
      include: {
        actions: true,
        creator: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error: any) {
    console.error('Error creando workflow:', error);
    return NextResponse.json(
      { error: 'Error creando workflow' },
      { status: 500 }
    );
  }
}
