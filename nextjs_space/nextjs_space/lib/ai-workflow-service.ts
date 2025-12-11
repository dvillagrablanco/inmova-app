/**
 * Servicio de IA con Tool Calling - Integración con Claude/Abacus.AI
 * Permite al asistente IA ejecutar acciones en el sistema
 */

import logger from './logger';
import { executeWorkflow } from './workflow-service';
import { prisma } from './db';

// Definición de herramientas disponibles para el asistente IA
export const AVAILABLE_TOOLS = [
  {
    name: 'create_workflow',
    description: 'Crea un nuevo workflow de automatización en el sistema',
    input_schema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          description: 'Nombre descriptivo del workflow',
        },
        descripcion: {
          type: 'string',
          description: 'Descripción detallada de lo que hace el workflow',
        },
        triggerType: {
          type: 'string',
          enum: ['manual', 'evento', 'programado', 'webhook'],
          description: 'Tipo de disparador del workflow',
        },
        actionType: {
          type: 'string',
          enum: ['enviar_notificacion', 'crear_tarea', 'enviar_email', 'actualizar_registro', 'crear_incidencia'],
          description: 'Tipo de acción a ejecutar',
        },
        actionConfig: {
          type: 'object',
          description: 'Configuración específica de la acción',
        },
      },
      required: ['nombre', 'triggerType', 'actionType'],
    },
  },
  {
    name: 'execute_workflow',
    description: 'Ejecuta un workflow existente manualmente',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'ID del workflow a ejecutar',
        },
        triggerData: {
          type: 'object',
          description: 'Datos del contexto para la ejecución',
        },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'search_workflows',
    description: 'Busca workflows por nombre o descripción',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda',
        },
        status: {
          type: 'string',
          enum: ['activo', 'inactivo', 'borrador'],
          description: 'Filtrar por estado',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_workflow_stats',
    description: 'Obtiene estadísticas de workflows de la empresa',
    input_schema: {
      type: 'object',
      properties: {
        companyId: {
          type: 'string',
          description: 'ID de la empresa',
        },
      },
      required: ['companyId'],
    },
  },
  {
    name: 'create_notification',
    description: 'Crea una notificación directa para un usuario',
    input_schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario destinatario',
        },
        titulo: {
          type: 'string',
          description: 'Título de la notificación',
        },
        mensaje: {
          type: 'string',
          description: 'Contenido del mensaje',
        },
        nivel: {
          type: 'string',
          enum: ['info', 'advertencia', 'critico'],
          description: 'Nivel de prioridad',
        },
      },
      required: ['userId', 'titulo', 'mensaje'],
    },
  },
];

/**
 * Ejecuta una herramienta solicitada por la IA
 */
export async function executeTool(
  toolName: string,
  toolInput: any,
  context: { companyId: string; userId: string }
): Promise<any> {
  try {
    logger.info('Ejecutando herramienta de IA', { toolName, context });

    switch (toolName) {
      case 'create_workflow':
        return await handleCreateWorkflow(toolInput, context);
      
      case 'execute_workflow':
        return await handleExecuteWorkflow(toolInput, context);
      
      case 'search_workflows':
        return await handleSearchWorkflows(toolInput, context);
      
      case 'get_workflow_stats':
        return await handleGetWorkflowStats(context);
      
      case 'create_notification':
        return await handleCreateNotification(toolInput, context);
      
      default:
        throw new Error(`Herramienta no reconocida: ${toolName}`);
    }
  } catch (error) {
    logger.error('Error ejecutando herramienta de IA', { toolName, error });
    throw error;
  }
}

/**
 * Handler: Crear workflow
 */
async function handleCreateWorkflow(
  input: any,
  context: { companyId: string; userId: string }
) {
  const workflow = await prisma.workflow.create({
    data: {
      companyId: context.companyId,
      nombre: input.nombre,
      descripcion: input.descripcion || '',
      triggerType: input.triggerType,
      triggerConfig: { aiCreated: true },
      status: 'borrador',
      isActive: false,
      createdBy: context.userId,
      actions: {
        create: [
          {
            orden: 1,
            actionType: input.actionType,
            config: input.actionConfig || {},
          },
        ],
      },
    },
    include: {
      actions: true,
    },
  });

  return {
    success: true,
    message: `Workflow "${workflow.nombre}" creado exitosamente`,
    workflowId: workflow.id,
    workflow,
  };
}

/**
 * Handler: Ejecutar workflow
 */
async function handleExecuteWorkflow(
  input: any,
  context: { companyId: string; userId: string }
) {
  // Verificar que el workflow pertenece a la empresa
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: input.workflowId,
      companyId: context.companyId,
    },
  });

  if (!workflow) {
    throw new Error('Workflow no encontrado o sin permisos');
  }

  const result = await executeWorkflow(input.workflowId, {
    ...input.triggerData,
    companyId: context.companyId,
    userId: context.userId,
    aiTriggered: true,
  });

  return {
    success: true,
    message: 'Workflow ejecutado por el asistente IA',
    executionId: result.executionId,
    results: result.results,
  };
}

/**
 * Handler: Buscar workflows
 */
async function handleSearchWorkflows(
  input: any,
  context: { companyId: string; userId: string }
) {
  const workflows = await prisma.workflow.findMany({
    where: {
      companyId: context.companyId,
      OR: [
        { nombre: { contains: input.query, mode: 'insensitive' } },
        { descripcion: { contains: input.query, mode: 'insensitive' } },
      ],
      ...(input.status && { status: input.status }),
    },
    include: {
      actions: {
        select: {
          actionType: true,
        },
      },
      _count: {
        select: {
          executions: true,
        },
      },
    },
    take: 10,
  });

  return {
    success: true,
    count: workflows.length,
    workflows: workflows.map((w) => ({
      id: w.id,
      nombre: w.nombre,
      descripcion: w.descripcion,
      status: w.status,
      isActive: w.isActive,
      triggerType: w.triggerType,
      actionsCount: w.actions.length,
      executionsCount: w._count.executions,
    })),
  };
}

/**
 * Handler: Obtener estadísticas de workflows
 */
async function handleGetWorkflowStats(context: { companyId: string; userId: string }) {
  const [total, activos, ejecuciones] = await Promise.all([
    prisma.workflow.count({
      where: { companyId: context.companyId },
    }),
    prisma.workflow.count({
      where: { companyId: context.companyId, isActive: true },
    }),
    prisma.workflowExecution.count({
      where: {
        workflow: { companyId: context.companyId },
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        },
      },
    }),
  ]);

  const exitosas = await prisma.workflowExecution.count({
    where: {
      workflow: { companyId: context.companyId },
      status: 'completado',
      startedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    success: true,
    stats: {
      totalWorkflows: total,
      workflowsActivos: activos,
      ejecucionesUltimos30Dias: ejecuciones,
      tasaExito: ejecuciones > 0 ? ((exitosas / ejecuciones) * 100).toFixed(1) : 0,
    },
  };
}

/**
 * Handler: Crear notificación
 */
async function handleCreateNotification(
  input: any,
  context: { companyId: string; userId: string }
) {
  const notification = await prisma.notification.create({
    data: {
      companyId: context.companyId,
      userId: input.userId,
      tipo: 'alerta_sistema',
      titulo: input.titulo,
      mensaje: input.mensaje,
      prioridad: input.prioridad || input.nivel || 'bajo',
      leida: false,
    },
  });

  return {
    success: true,
    message: 'Notificación creada exitosamente',
    notificationId: notification.id,
  };
}

/**
 * Procesa una consulta del usuario con el asistente IA
 * Esta función debe ser llamada desde el endpoint de chat
 */
export async function processAIQuery(
  query: string,
  context: { companyId: string; userId: string },
  conversationHistory: any[] = []
): Promise<{
  response: string;
  toolsUsed: string[];
  success: boolean;
}> {
  try {
    // En producción, aquí se integraría con la API de Claude o Abacus.AI
    // Por ahora, una implementación de demostración

    logger.info('Procesando consulta de IA', { query, context });

    // Detectar intención y extraer parámetros
    const intent = detectIntent(query);
    const toolsUsed: string[] = [];
    let response = '';

    switch (intent.type) {
      case 'create_workflow':
        const createResult = await executeTool('create_workflow', intent.params, context);
        toolsUsed.push('create_workflow');
        response = `He creado el workflow "${intent.params.nombre}" exitosamente. ${createResult.message}`;
        break;

      case 'list_workflows':
        const searchResult = await executeTool(
          'search_workflows',
          { query: intent.params.query || '', status: intent.params.status },
          context
        );
        toolsUsed.push('search_workflows');
        response = `He encontrado ${searchResult.count} workflows. ${searchResult.workflows
          .map((w: any) => `- ${w.nombre} (${w.status})`)
          .join('\n')}`;
        break;

      case 'get_stats':
        const statsResult = await executeTool('get_workflow_stats', {}, context);
        toolsUsed.push('get_workflow_stats');
        response = `Estadísticas de workflows:\n- Total: ${statsResult.stats.totalWorkflows}\n- Activos: ${statsResult.stats.workflowsActivos}\n- Ejecuciones últimos 30 días: ${statsResult.stats.ejecucionesUltimos30Dias}\n- Tasa de éxito: ${statsResult.stats.tasaExito}%`;
        break;

      default:
        response =
          'Entiendo tu consulta. Puedo ayudarte a:\n- Crear workflows de automatización\n- Buscar y listar workflows existentes\n- Obtener estadísticas de workflows\n- Ejecutar workflows manualmente\n\n¿Qué te gustaría hacer?';
    }

    return {
      response,
      toolsUsed,
      success: true,
    };
  } catch (error) {
    logger.error('Error procesando consulta de IA', { error });
    return {
      response: 'Lo siento, hubo un error procesando tu solicitud. Por favor, intenta de nuevo.',
      toolsUsed: [],
      success: false,
    };
  }
}

/**
 * Detecta la intención del usuario (implementación básica)
 */
function detectIntent(query: string): { type: string; params: any } {
  const lowerQuery = query.toLowerCase();

  // Crear workflow
  if (
    lowerQuery.includes('crear') &&
    (lowerQuery.includes('workflow') || lowerQuery.includes('automatización'))
  ) {
    return {
      type: 'create_workflow',
      params: {
        nombre: extractWorkflowName(query),
        triggerType: 'manual',
        actionType: 'enviar_notificacion',
        actionConfig: {},
      },
    };
  }

  // Listar workflows
  if (
    lowerQuery.includes('lista') ||
    lowerQuery.includes('mostrar') ||
    lowerQuery.includes('ver') ||
    lowerQuery.includes('workflows')
  ) {
    return {
      type: 'list_workflows',
      params: {
        query: '',
        status: lowerQuery.includes('activo') ? 'activo' : undefined,
      },
    };
  }

  // Estadísticas
  if (
    lowerQuery.includes('estadística') ||
    lowerQuery.includes('cuánto') ||
    lowerQuery.includes('total')
  ) {
    return {
      type: 'get_stats',
      params: {},
    };
  }

  return { type: 'unknown', params: {} };
}

/**
 * Extrae el nombre del workflow de la consulta
 */
function extractWorkflowName(query: string): string {
  // Implementación básica - en producción usar NLP más sofisticado
  const match = query.match(/crear(?:\s+un)?\s+workflow\s+"([^"]+)"/i);
  if (match) return match[1];

  const match2 = query.match(/workflow\s+llamado\s+"([^"]+)"/i);
  if (match2) return match2[1];

  return 'Workflow creado por IA';
}
