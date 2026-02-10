import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logger, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/workflows/[id]/execute - Ejecuta un workflow manualmente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const body = await request.json();
    const { triggerData } = body;

    // Verificar que el workflow existe y pertenece a la empresa
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        actions: {
          orderBy: {
            orden: 'asc',
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

    if (!workflow.isActive) {
      return NextResponse.json(
        { error: 'El workflow no está activo' },
        { status: 400 }
      );
    }

    // Crear registro de ejecución
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: 'en_progreso',
        startedAt: new Date(),
        triggerData: triggerData || {},
      },
    });

    // Simular ejecución de acciones
    try {
      const results: any[] = [];

      for (const action of workflow.actions) {
        // Simular procesamiento de acción
        const actionResult = await executeAction(action, triggerData || {});
        results.push({
          actionId: action.id,
          actionType: action.actionType,
          ...actionResult,
        });
      }

      // Actualizar ejecución como completada
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completada',
          finishedAt: new Date(),
          results: { actions: results },
        },
      });

      logger.info(`Workflow executed: ${workflow.id}`, {
        workflowId: workflow.id,
        executionId: execution.id,
        userId: session.user.id,
      });

      return NextResponse.json({
        success: true,
        executionId: execution.id,
        results,
      });
    } catch (actionError) {
      // Actualizar ejecución como fallida
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'fallida',
          finishedAt: new Date(),
          error: (actionError as Error).message,
        },
      });

      throw actionError;
    }
  } catch (error) {
    logError(error as Error, { context: 'POST /api/workflows/[id]/execute' });
    return NextResponse.json(
      { error: 'Error al ejecutar workflow' },
      { status: 500 }
    );
  }
}

/**
 * Ejecuta una acción individual del workflow
 */
async function executeAction(action: any, triggerData: any) {
  // Implementación simulada - en producción, aquí iría la lógica real
  const { actionType, config } = action;

  switch (actionType) {
    case 'enviar_notificacion':
      return {
        success: true,
        message: `Notificación enviada: ${config.mensaje || 'Sin mensaje'}`,
      };

    case 'crear_tarea':
      return {
        success: true,
        message: `Tarea creada: ${config.titulo || 'Sin título'}`,
      };

    case 'enviar_email':
      return {
        success: true,
        message: `Email enviado a: ${config.destinatario || 'Sin destinatario'}`,
      };

    case 'ejecutar_script':
      return {
        success: true,
        message: 'Script ejecutado correctamente',
      };

    case 'actualizar_registro':
      return {
        success: true,
        message: `Registro actualizado: ${config.modelo || 'Sin modelo'}`,
      };

    case 'crear_incidencia':
      return {
        success: true,
        message: `Incidencia creada: ${config.titulo || 'Sin título'}`,
      };

    case 'generar_documento':
      return {
        success: true,
        message: `Documento generado: ${config.plantilla || 'Sin plantilla'}`,
      };

    case 'webhook':
      return {
        success: true,
        message: `Webhook llamado: ${config.url || 'Sin URL'}`,
      };

    default:
      return {
        success: false,
        message: `Tipo de acción desconocido: ${actionType}`,
      };
  }
}
