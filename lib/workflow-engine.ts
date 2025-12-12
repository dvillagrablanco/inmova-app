import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Engine } from 'node-rules-engine';

const prisma = new PrismaClient();

// Tipos para el motor de workflows
export type WorkflowContext = {
  companyId: string;
  userId?: string;
  eventType: string;
  data: any;
};

export type WorkflowTriggerConfig = {
  eventType?: string;
  conditions?: {
    fact: string;
    operator: string;
    value: any;
  }[];
  schedule?: {
    cron?: string;
    frequency?: string;
  };
  webhook?: {
    url: string;
    method: string;
  };
};

export type WorkflowActionConfig = {
  // Enviar notificación
  notificationTitle?: string;
  notificationMessage?: string;
  notificationUserId?: string;
  notificationUserRole?: string;
  
  // Enviar email
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  
  // Crear tarea
  taskTitle?: string;
  taskDescription?: string;
  taskAssignedTo?: string;
  taskPriority?: string;
  taskDueDate?: string;
  
  // Crear incidencia
  incidentTitle?: string;
  incidentDescription?: string;
  incidentPriority?: string;
  incidentBuildingId?: string;
  incidentUnitId?: string;
  
  // Actualizar registro
  model?: string;
  recordId?: string;
  updateData?: any;
  
  // Webhook
  webhookUrl?: string;
  webhookMethod?: string;
  webhookHeaders?: Record<string, string>;
  webhookBody?: any;
  
  // Script personalizado
  scriptCode?: string;
  
  // Generar documento
  documentTemplate?: string;
  documentData?: any;
  documentRecipient?: string;
};

/**
 * Motor de workflows que ejecuta automatizaciones
 */
export class WorkflowEngine {
  /**
   * Evalúa y ejecuta workflows que coincidan con el trigger
   */
  static async executeMatchingWorkflows(
    context: WorkflowContext
  ): Promise<{
    executed: number;
    results: any[];
    errors: any[];
  }> {
    const { companyId, eventType, data } = context;

    // Buscar workflows activos que coincidan con el evento
    const matchingWorkflows = await prisma.workflow.findMany({
      where: {
        companyId,
        isActive: true,
        status: 'activo',
        OR: [
          {
            triggerType: 'evento',
          },
          {
            triggerType: 'manual',
          },
        ],
      },
      include: {
        actions: {
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    const results: any[] = [];
    const errors: any[] = [];
    let executed = 0;

    for (const workflow of matchingWorkflows) {
      try {
        // Verificar si el trigger coincide
        const triggerConfig: WorkflowTriggerConfig = workflow.triggerConfig as WorkflowTriggerConfig;
        
        if (triggerConfig.eventType && triggerConfig.eventType !== eventType) {
          continue; // No coincide el tipo de evento
        }

        // Evaluar condiciones si existen
        if (triggerConfig.conditions && triggerConfig.conditions.length > 0) {
          const conditionsMet = await this.evaluateConditions(
            triggerConfig.conditions,
            data
          );
          
          if (!conditionsMet) {
            continue; // Condiciones no cumplidas
          }
        }

        // Ejecutar el workflow
        const executionResult = await this.executeWorkflow(
          workflow.id,
          context
        );
        
        results.push(executionResult);
        executed++;
      } catch (error: any) {
        errors.push({
          workflowId: workflow.id,
          workflowName: workflow.nombre,
          error: error.message,
        });
      }
    }

    return { executed, results, errors };
  }

  /**
   * Ejecuta un workflow específico
   */
  static async executeWorkflow(
    workflowId: string,
    context: WorkflowContext
  ): Promise<any> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        actions: {
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    if (!workflow) {
      throw new Error('Workflow no encontrado');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow no está activo');
    }

    // Crear registro de ejecución
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        triggerData: context.data as Prisma.InputJsonValue,
      },
    });

    const actionResults: any[] = [];

    try {
      // Ejecutar cada acción en orden
      for (const action of workflow.actions) {
        try {
          // Evaluar condiciones de la acción si existen
          if (action.conditions) {
            const conditions = action.conditions as any;
            if (conditions && Array.isArray(conditions)) {
              const conditionsMet = await this.evaluateConditions(
                conditions,
                context.data
              );
              
              if (!conditionsMet) {
                actionResults.push({
                  actionId: action.id,
                  actionType: action.actionType,
                  status: 'skipped',
                  reason: 'Condiciones no cumplidas',
                });
                continue;
              }
            }
          }

          // Ejecutar la acción
          const result = await this.executeAction(
            action.actionType,
            action.config as WorkflowActionConfig,
            context
          );

          actionResults.push({
            actionId: action.id,
            actionType: action.actionType,
            status: 'success',
            result,
          });
        } catch (actionError: any) {
          actionResults.push({
            actionId: action.id,
            actionType: action.actionType,
            status: 'error',
            error: actionError.message,
          });
          // Continuar con la siguiente acción aunque falle una
        }
      }

      // Actualizar ejecución como exitosa
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'success',
          finishedAt: new Date(),
          results: actionResults as Prisma.InputJsonValue,
        },
      });

      return {
        executionId: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.nombre,
        status: 'success',
        actions: actionResults,
      };
    } catch (error: any) {
      // Actualizar ejecución como fallida
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          error: error.message,
          results: actionResults as Prisma.InputJsonValue,
        },
      });

      throw error;
    }
  }

  /**
   * Evalúa condiciones usando el motor de reglas
   */
  private static async evaluateConditions(
    conditions: any[],
    data: any
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    // Crear reglas para el motor
    const rules = conditions.map((condition, index) => ({
      id: `condition_${index}`,
      conditions: condition,
      event: {
        type: 'conditionMet',
        params: { conditionIndex: index },
      },
    }));

    const engine = new Engine(rules);

    return new Promise((resolve) => {
      let conditionsMet = 0;

      engine.on('success', () => {
        conditionsMet++;
      });

      engine.run(data).then(() => {
        // Todas las condiciones deben cumplirse (AND)
        resolve(conditionsMet === conditions.length);
      });
    });
  }

  /**
   * Ejecuta una acción específica
   */
  private static async executeAction(
    actionType: string,
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    switch (actionType) {
      case 'enviar_notificacion':
        return await this.sendNotification(config, context);
      
      case 'enviar_email':
        return await this.sendEmail(config, context);
      
      case 'crear_tarea':
        return await this.createTask(config, context);
      
      case 'crear_incidencia':
        return await this.createIncident(config, context);
      
      case 'actualizar_registro':
        return await this.updateRecord(config, context);
      
      case 'webhook':
        return await this.callWebhook(config, context);
      
      case 'ejecutar_script':
        return await this.executeScript(config, context);
      
      case 'generar_documento':
        return await this.generateDocument(config, context);
      
      default:
        throw new Error(`Tipo de acción no soportado: ${actionType}`);
    }
  }

  /**
   * Envía una notificación
   */
  private static async sendNotification(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { companyId } = context;
    const { notificationTitle, notificationMessage, notificationUserId, notificationUserRole } = config;

    // Crear notificación
    const notification = await prisma.notification.create({
      data: {
        companyId,
        userId: notificationUserId || null,
        titulo: notificationTitle || 'Notificación automática',
        mensaje: notificationMessage || '',
        tipo: 'info',
        leida: false,
      },
    });

    return { notificationId: notification.id };
  }

  /**
   * Envía un email
   */
  private static async sendEmail(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { emailTo, emailSubject, emailBody } = config;

    // Aquí integrarías con tu servicio de email (nodemailer, sendgrid, etc.)
    // Por ahora retornamos un placeholder
    
    return {
      emailSent: true,
      to: emailTo,
      subject: emailSubject,
    };
  }

  /**
   * Crea una tarea
   */
  private static async createTask(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { companyId } = context;
    const {
      taskTitle,
      taskDescription,
      taskAssignedTo,
      taskPriority,
      taskDueDate,
    } = config;

    const task = await prisma.task.create({
      data: {
        companyId,
        titulo: taskTitle || 'Tarea automática',
        descripcion: taskDescription || '',
        asignadoA: taskAssignedTo || null,
        prioridad: (taskPriority as any) || 'media',
        fechaLimite: taskDueDate ? new Date(taskDueDate) : null,
        creadoPor: taskAssignedTo || companyId,
      },
    });

    return { taskId: task.id };
  }

  /**
   * Crea una incidencia
   */
  private static async createIncident(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { companyId } = context;
    const {
      incidentTitle,
      incidentDescription,
      incidentPriority,
      incidentBuildingId,
      incidentUnitId,
    } = config;

    const incident = await prisma.maintenanceRequest.create({
      data: {
        unitId: incidentUnitId || '',
        titulo: incidentTitle || 'Incidencia automática',
        descripcion: incidentDescription || '',
        prioridad: (incidentPriority as any) || 'media',
        estado: 'pendiente',
      },
    });

    return { incidentId: incident.id };
  }

  /**
   * Actualiza un registro
   */
  private static async updateRecord(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { model, recordId, updateData } = config;

    if (!model || !recordId || !updateData) {
      throw new Error('Configuración incompleta para actualizar registro');
    }

    // Esta es una simplificación, en producción necesitarías
    // validar el modelo y los permisos
    const modelName = model.toLowerCase() as any;
    
    if (!(prisma as any)[modelName]) {
      throw new Error(`Modelo ${model} no encontrado`);
    }

    const updated = await (prisma as any)[modelName].update({
      where: { id: recordId },
      data: updateData,
    });

    return { updated: true, model, recordId };
  }

  /**
   * Llama a un webhook
   */
  private static async callWebhook(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { webhookUrl, webhookMethod, webhookHeaders, webhookBody } = config;

    if (!webhookUrl) {
      throw new Error('URL del webhook no configurada');
    }

    const response = await fetch(webhookUrl, {
      method: webhookMethod || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...webhookHeaders,
      },
      body: JSON.stringify(webhookBody || context.data),
    });

    const responseData = await response.json().catch(() => null);

    return {
      webhookCalled: true,
      url: webhookUrl,
      status: response.status,
      response: responseData,
    };
  }

  /**
   * Ejecuta un script personalizado
   */
  private static async executeScript(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { scriptCode } = config;

    if (!scriptCode) {
      throw new Error('Código del script no configurado');
    }

    // IMPORTANTE: Esto es un placeholder
    // En producción, deberías usar un sandbox seguro como vm2 o similar
    // para ejecutar código personalizado de forma segura
    
    try {
      // eslint-disable-next-line no-new-func
      const scriptFunction = new Function('context', 'prisma', scriptCode);
      const result = await scriptFunction(context, prisma);
      
      return { scriptExecuted: true, result };
    } catch (error: any) {
      throw new Error(`Error ejecutando script: ${error.message}`);
    }
  }

  /**
   * Genera un documento
   */
  private static async generateDocument(
    config: WorkflowActionConfig,
    context: WorkflowContext
  ): Promise<any> {
    const { documentTemplate, documentData, documentRecipient } = config;

    // Esta es una simplificación
    // En producción integrarías con tu sistema de generación de documentos
    
    return {
      documentGenerated: true,
      template: documentTemplate,
      recipient: documentRecipient,
    };
  }
}

/**
 * Triggers predefinidos comunes
 */
export const WORKFLOW_TRIGGERS = {
  // Contratos
  CONTRATO_CREADO: 'contrato.creado',
  CONTRATO_VENCE_PRONTO: 'contrato.vence_pronto',
  CONTRATO_VENCIDO: 'contrato.vencido',
  
  // Pagos
  PAGO_RECIBIDO: 'pago.recibido',
  PAGO_ATRASADO: 'pago.atrasado',
  PAGO_RECHAZADO: 'pago.rechazado',
  
  // Mantenimiento
  INCIDENCIA_CREADA: 'incidencia.creada',
  INCIDENCIA_CRITICA: 'incidencia.critica',
  INCIDENCIA_RESUELTA: 'incidencia.resuelta',
  
  // Inquilinos
  INQUILINO_NUEVO: 'inquilino.nuevo',
  INQUILINO_INACTIVO: 'inquilino.inactivo',
  
  // Propietarios
  PROPIETARIO_NUEVO: 'propietario.nuevo',
  
  // Tareas
  TAREA_VENCIDA: 'tarea.vencida',
  TAREA_COMPLETADA: 'tarea.completada',
  
  // Custom
  CUSTOM: 'custom',
};
