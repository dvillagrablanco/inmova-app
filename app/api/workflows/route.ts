import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createWorkflow,
  getCompanyWorkflows,
} from '@/lib/workflow-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workflows - Obtiene workflows de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');

    const workflows = await getCompanyWorkflows(
      session.user.companyId,
      {
        ...(status && { status: status as any }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      }
    );

    return NextResponse.json(workflows);
  } catch (error) {
    logger.error('Error obteniendo workflows');
    return NextResponse.json(
      { error: 'Error al obtener workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows - Crea un nuevo workflow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar campos requeridos
    if (!body.nombre || !body.triggerType || !body.actions) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const workflow = await createWorkflow({
      companyId: session.user.companyId,
      nombre: body.nombre,
      descripcion: body.descripcion,
      triggerType: body.triggerType,
      triggerConfig: body.triggerConfig || {},
      actions: body.actions,
      createdBy: session.user.id,
    });

    logger.info('Workflow creado vía API', {
      workflowId: workflow.id,
      userId: session.user.id,
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    logger.error('Error creando workflow');
    return NextResponse.json(
      { error: 'Error al crear workflow' },
      { status: 500 }
    );
  }
}
