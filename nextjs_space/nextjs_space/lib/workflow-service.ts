/**
 * Servicio de Workflows - Automatización Inteligente
 * Gestiona la creación, ejecución y monitoreo de workflows automatizados
 */

import { prisma } from './db';
import { WorkflowStatus, WorkflowTriggerType, WorkflowActionType } from '@prisma/client';
import logger from './logger';

/**
 * Crea un nuevo workflow
 */
export async function createWorkflow(data: {
  companyId: string;
  nombre: string;
  descripcion?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig: any;
  actions: Array<{
    orden: number;
    actionType: WorkflowActionType;
    config: any;
    conditions?: any;
  }>;
  createdBy: string;
}) {
  try {
    const workflow = await prisma.workflow.create({
      data: {
        companyId: data.companyId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        status: 'borrador',
        isActive: false,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        createdBy: data.createdBy,
        actions: {
          create: data.actions,
        },
      },
      include: {
        actions: true,
      },
    });

    logger.info('Workflow creado', { workflowId: workflow.id, companyId: data.companyId });
    return workflow;
  } catch (error) {
    logger.error('Error al crear workflow', { error });
    throw error;
  }
}

/**
 * Ejecuta un workflow
 */
export async function executeWorkflow(workflowId: string, triggerData: any) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        actions: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!workflow) {
      throw new Error('Workflow no encontrado');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow inactivo');
    }

    // Crear registro de ejecución
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: 'en_proceso',
        startedAt: new Date(),
        triggerData,
      },
    });

    try {
      const results: any[] = [];

      // Ejecutar cada acción en orden
      for (const action of workflow.actions) {
        // Verificar condiciones si existen
        if (action.conditions) {
          const conditionsMet = await evaluateConditions(action.conditions, triggerData);
          if (!conditionsMet) {
            logger.info('Condiciones no cumplidas, saltando acción', {
              actionId: action.id,
              executionId: execution.id,
            });
            continue;
          }
        }

        // Ejecutar la acción
        const actionResult = await executeAction(action.actionType, action.config, triggerData);
        results.push({
          actionId: action.id,
          actionType: action.actionType,
          result: actionResult,
          timestamp: new Date(),
        });
      }

      // Actualizar ejecución como completada
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completado',
          finishedAt: new Date(),
          results,
        },
      });

      logger.info('Workflow ejecutado exitosamente', {
        workflowId: workflow.id,
        executionId: execution.id,
      });

      return { success: true, executionId: execution.id, results };
    } catch (error) {
      // Actualizar ejecución como fallida
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'fallido',
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : 'Error desconocido',
        },
      });

      logger.error('Error al ejecutar workflow', {
        workflowId: workflow.id,
        executionId: execution.id,
        error,
      });

      throw error;
    }
  } catch (error) {
    logger.error('Error en executeWorkflow', { error });
    throw error;
  }
}

/**
 * Evalúa las condiciones de una acción
 */
async function evaluateConditions(conditions: any, triggerData: any): Promise<boolean> {
  try {
    // Implementación básica de evaluación de condiciones
    if (conditions.operator === 'and') {
      return conditions.rules.every((rule: any) => evaluateRule(rule, triggerData));
    } else if (conditions.operator === 'or') {
      return conditions.rules.some((rule: any) => evaluateRule(rule, triggerData));
    }
    return true;
  } catch (error) {
    logger.error('Error evaluando condiciones', { error });
    return false;
  }
}

/**
 * Evalúa una regla individual
 */
function evaluateRule(rule: any, data: any): boolean {
  const value = getNestedValue(data, rule.field);
  
  switch (rule.operator) {
    case 'equals':
      return value === rule.value;
    case 'not_equals':
      return value !== rule.value;
    case 'greater_than':
      return value > rule.value;
    case 'less_than':
      return value < rule.value;
    case 'contains':
      return typeof value === 'string' && value.includes(rule.value);
    default:
      return false;
  }
}

/**
 * Obtiene un valor anidado de un objeto
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Ejecuta una acción específica
 */
async function executeAction(
  actionType: WorkflowActionType,
  config: any,
  triggerData: any
): Promise<any> {
  try {
    switch (actionType) {
      case 'enviar_notificacion':
        return await sendNotification(config, triggerData);
      case 'crear_tarea':
        return await createTask(config, triggerData);
      case 'enviar_email':
        return await sendEmail(config, triggerData);
      case 'actualizar_registro':
        return await updateRecord(config, triggerData);
      case 'crear_incidencia':
        return await createIncident(config, triggerData);
      default:
        logger.warn('Tipo de acción no soportado', { actionType });
        return { success: false, message: 'Tipo de acción no soportado' };
    }
  } catch (error) {
    logger.error('Error ejecutando acción', { actionType, error });
    throw error;
  }
}

/**
 * Envía una notificación
 */
async function sendNotification(config: any, triggerData: any): Promise<any> {
  try {
    const notification = await prisma.notification.create({
      data: {
        companyId: triggerData.companyId,
        userId: config.userId || triggerData.userId,
        tipo: config.tipo || 'sistema',
        titulo: replaceTemplateVariables(config.titulo, triggerData),
        mensaje: replaceTemplateVariables(config.mensaje, triggerData),
        prioridad: config.prioridad || 'bajo',
        leida: false,
      },
    });

    return { success: true, notificationId: notification.id };
  } catch (error) {
    logger.error('Error enviando notificación', { error });
    throw error;
  }
}

/**
 * Crea una tarea
 */
async function createTask(config: any, triggerData: any): Promise<any> {
  try {
    const task = await prisma.task.create({
      data: {
        companyId: triggerData.companyId,
        creadoPor: triggerData.userId,
        titulo: replaceTemplateVariables(config.titulo, triggerData),
        descripcion: replaceTemplateVariables(config.descripcion, triggerData),
        prioridad: config.prioridad || 'media',
        estado: 'pendiente',
        fechaLimite: config.fechaLimite ? new Date(config.fechaLimite) : undefined,
        asignadoA: config.asignadoA,
      },
    });

    return { success: true, taskId: task.id };
  } catch (error) {
    logger.error('Error creando tarea', { error });
    throw error;
  }
}

/**
 * Envía un email (simulado)
 */
async function sendEmail(config: any, triggerData: any): Promise<any> {
  try {
    logger.info('Enviando email', {
      to: config.to,
      subject: replaceTemplateVariables(config.subject, triggerData),
    });

    // En producción, aquí se integraría con un servicio de email real
    return { success: true, message: 'Email enviado' };
  } catch (error) {
    logger.error('Error enviando email', { error });
    throw error;
  }
}

/**
 * Actualiza un registro
 */
async function updateRecord(config: any, triggerData: any): Promise<any> {
  try {
    // Implementación básica - en producción se expandiría según el tipo de entidad
    logger.info('Actualizando registro', {
      entity: config.entity,
      id: config.id || triggerData.entityId,
    });

    return { success: true, message: 'Registro actualizado' };
  } catch (error) {
    logger.error('Error actualizando registro', { error });
    throw error;
  }
}

/**
 * Crea una incidencia
 */
async function createIncident(config: any, triggerData: any): Promise<any> {
  try {
    const incident = await prisma.communityIncident.create({
      data: {
        companyId: triggerData.companyId,
        buildingId: config.buildingId || triggerData.buildingId,
        reportedBy: triggerData.userId,
        reporterType: 'user',
        titulo: replaceTemplateVariables(config.titulo, triggerData),
        descripcion: replaceTemplateVariables(config.descripcion, triggerData),
        tipo: config.tipo || 'general',
        prioridad: config.prioridad || 'media',
        estado: 'abierta',
      },
    });

    return { success: true, incidentId: incident.id };
  } catch (error) {
    logger.error('Error creando incidencia', { error });
    throw error;
  }
}

/**
 * Reemplaza variables de plantilla en un texto
 */
function replaceTemplateVariables(template: string, data: any): string {
  if (!template) return '';
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Obtiene workflows de una empresa
 */
export async function getCompanyWorkflows(companyId: string, filters?: {
  status?: WorkflowStatus;
  isActive?: boolean;
}) {
  try {
    const workflows = await prisma.workflow.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        actions: {
          orderBy: { orden: 'asc' },
        },
        executions: {
          take: 5,
          orderBy: { startedAt: 'desc' },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return workflows;
  } catch (error) {
    logger.error('Error obteniendo workflows', { error });
    throw error;
  }
}

/**
 * Activa o desactiva un workflow
 */
export async function toggleWorkflow(workflowId: string, isActive: boolean) {
  try {
    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        isActive,
        status: isActive ? 'activo' : 'inactivo',
      },
    });

    logger.info('Workflow actualizado', { workflowId, isActive });
    return workflow;
  } catch (error) {
    logger.error('Error actualizando workflow', { error });
    throw error;
  }
}

/**
 * Elimina un workflow
 */
export async function deleteWorkflow(workflowId: string) {
  try {
    await prisma.workflow.delete({
      where: { id: workflowId },
    });

    logger.info('Workflow eliminado', { workflowId });
    return { success: true };
  } catch (error) {
    logger.error('Error eliminando workflow', { error });
    throw error;
  }
}
