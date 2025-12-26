/**
 * Servicio Mejorado de Asistente IA - Fase 3
 *
 * Capacidades:
 * 1. Detección de intenciones con LLM
 * 2. Ejecución automática de acciones
 * 3. Auto-resolución de consultas comunes
 * 4. Contexto de usuario y memoria de conversación
 */

import { prisma } from './db';
import logger from '@/lib/logger';

// ============================================================================
// CONFIGURACIÓN LLM
// ============================================================================
const LLM_API_URL = 'https://apps.abacus.ai/v1/chat/completions';
const LLM_API_KEY = process.env.ABACUSAI_API_KEY;
const DEFAULT_MODEL = 'gpt-4.1-mini';

// ============================================================================
// TIPOS
// ============================================================================
export interface IntentDetectionResult {
  intent:
    | 'create_maintenance_request'
    | 'check_payment'
    | 'view_contract'
    | 'schedule_visit'
    | 'general_inquiry'
    | 'complaint'
    | 'document_request'
    | 'unknown';
  confidence: number;
  entities: Record<string, any>;
  response: string;
}

export interface ActionExecutionResult {
  success: boolean;
  action: string;
  result?: any;
  message: string;
}

export interface AssistantContext {
  userId: string;
  userType: 'tenant' | 'landlord' | 'admin' | 'provider';
  userName: string;
  userEmail: string;
  companyId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// ============================================================================
// DETECCIÓN DE INTENCIONES CON LLM
// ============================================================================
export async function detectIntent(
  userMessage: string,
  context: AssistantContext
): Promise<IntentDetectionResult> {
  try {
    const systemPrompt = `Eres un asistente IA experto en gestión inmobiliaria. Analiza el mensaje del usuario y detecta su intención.

INTENCIONES DISPONIBLES:
1. create_maintenance_request: Solicitar reparación o mantenimiento
2. check_payment: Consultar estado de pagos o próximas cuotas
3. view_contract: Ver o consultar sobre el contrato de arrendamiento
4. schedule_visit: Agendar visita o inspección
5. general_inquiry: Consulta general sobre la propiedad
6. complaint: Queja o reclamo
7. document_request: Solicitar un documento específico
8. unknown: No se puede determinar la intención

RESPONDE EN FORMATO JSON:
{
  "intent": "<intent_name>",
  "confidence": 0.95,
  "entities": {
    // Extrae información relevante como fechas, ubicaciones, tipos, etc.
  },
  "response": "<respuesta amigable en español explicando qué acción se va a tomar>"
}

Información del usuario:
- Nombre: ${context.userName}
- Tipo: ${context.userType}
- Email: ${context.userEmail}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.conversationHistory || []),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    const result = JSON.parse(resultText);

    logger.info(`🧠 Intent detected: ${result.intent} (confidence: ${result.confidence})`);

    return result as IntentDetectionResult;
  } catch (error) {
    logger.error('Error detecting intent:', error);
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
      response: 'Lo siento, no pude entender tu solicitud. ¿Podrías reformularla?',
    };
  }
}

// ============================================================================
// EJECUCIÓN DE ACCIONES AUTOMATIZADAS
// ============================================================================
export async function executeAction(
  intent: IntentDetectionResult,
  context: AssistantContext
): Promise<ActionExecutionResult> {
  try {
    switch (intent.intent) {
      case 'create_maintenance_request':
        return await createMaintenanceRequest(intent, context);

      case 'check_payment':
        return await checkPaymentStatus(intent, context);

      case 'view_contract':
        return await getContractInfo(intent, context);

      case 'schedule_visit':
        return await scheduleVisit(intent, context);

      case 'document_request':
        return await handleDocumentRequest(intent, context);

      default:
        return {
          success: false,
          action: 'none',
          message: intent.response,
        };
    }
  } catch (error) {
    logger.error('Error executing action:', error);
    return {
      success: false,
      action: intent.intent,
      message: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.',
    };
  }
}

// ============================================================================
// ACCIONES ESPECÍFICAS
// ============================================================================

async function createMaintenanceRequest(
  intent: IntentDetectionResult,
  context: AssistantContext
): Promise<ActionExecutionResult> {
  try {
    // Buscar el tenant/unit del usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        email: context.userEmail,
        companyId: context.companyId,
      },
      include: {
        contracts: {
          where: { estado: 'activo' },
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenant || !tenant.contracts[0]) {
      return {
        success: false,
        action: 'create_maintenance_request',
        message: 'No se encontró un contrato activo asociado a tu cuenta.',
      };
    }

    const contract = tenant.contracts[0];

    // Crear solicitud de mantenimiento
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        titulo: intent.entities.title || 'Solicitud de mantenimiento',
        descripcion: intent.entities.description || 'Solicitud creada desde el asistente IA',
        prioridad: intent.entities.priority || 'media',
        estado: 'pendiente',
        unitId: contract.unitId,
      },
    });

    logger.info(`✅ Mantenimiento creado automáticamente: ${maintenanceRequest.id}`);

    return {
      success: true,
      action: 'create_maintenance_request',
      result: maintenanceRequest,
      message: `✅ ¡Perfecto! He creado tu solicitud de mantenimiento #${maintenanceRequest.id.slice(0, 8)}. Un técnico se pondrá en contacto contigo pronto. Puedes ver el estado en la sección de Mantenimiento.`,
    };
  } catch (error) {
    logger.error('Error creating maintenance request:', error);
    return {
      success: false,
      action: 'create_maintenance_request',
      message:
        'No pude crear la solicitud de mantenimiento. Por favor, inténtalo manualmente desde la sección de Mantenimiento.',
    };
  }
}

async function checkPaymentStatus(
  intent: IntentDetectionResult,
  context: AssistantContext
): Promise<ActionExecutionResult> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        email: context.userEmail,
        companyId: context.companyId,
      },
    });

    if (!tenant) {
      return {
        success: false,
        action: 'check_payment',
        message: 'No se encontró información de pagos para tu cuenta.',
      };
    }

    // Obtener próximos pagos a través de los contratos del tenant
    const upcomingPayments = await prisma.payment.findMany({
      where: {
        estado: 'pendiente',
        contract: {
          tenantId: tenant.id,
          estado: 'activo',
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
      take: 3,
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (upcomingPayments.length === 0) {
      return {
        success: true,
        action: 'check_payment',
        result: { payments: [] },
        message:
          '🎉 ¡Excelente! No tienes pagos pendientes en este momento. Todos tus pagos están al día.',
      };
    }

    const paymentDetails = upcomingPayments
      .map((p) => {
        const vencimiento = new Date(p.fechaVencimiento);
        const dias = Math.ceil((vencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `- $${p.monto.toLocaleString()} - Vence en ${dias} días (${vencimiento.toLocaleDateString('es-ES')})`;
      })
      .join('\n');

    return {
      success: true,
      action: 'check_payment',
      result: { payments: upcomingPayments },
      message: `💳 Aquí están tus próximos pagos:\n\n${paymentDetails}\n\nPuedes realizar el pago desde la sección de Pagos.`,
    };
  } catch (error) {
    logger.error('Error checking payment status:', error);
    return {
      success: false,
      action: 'check_payment',
      message: 'No pude obtener la información de pagos. Por favor, verifica la sección de Pagos.',
    };
  }
}

async function getContractInfo(
  intent: IntentDetectionResult,
  context: AssistantContext
): Promise<ActionExecutionResult> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        email: context.userEmail,
        companyId: context.companyId,
      },
      include: {
        contracts: {
          where: { estado: 'activo' },
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenant || !tenant.contracts[0]) {
      return {
        success: false,
        action: 'view_contract',
        message: 'No se encontró un contrato activo asociado a tu cuenta.',
      };
    }

    const contract = tenant.contracts[0];
    const inicioDate = new Date(contract.fechaInicio);
    const finDate = new Date(contract.fechaFin);

    const message = `📄 Información de tu contrato:

🏠 Propiedad: ${contract.unit.building.nombre} - Unidad ${contract.unit.numero}
💵 Renta mensual: $${contract.rentaMensual.toLocaleString()}
📅 Inicio: ${inicioDate.toLocaleDateString('es-ES')}
📅 Fin: ${finDate.toLocaleDateString('es-ES')}
📊 Estado: ${contract.estado.toUpperCase()}

Puedes ver el documento completo en la sección de Contratos.`;

    return {
      success: true,
      action: 'view_contract',
      result: contract,
      message,
    };
  } catch (error) {
    logger.error('Error getting contract info:', error);
    return {
      success: false,
      action: 'view_contract',
      message:
        'No pude obtener la información del contrato. Por favor, verifica la sección de Contratos.',
    };
  }
}

async function scheduleVisit(
  intent: IntentDetectionResult,
  context: AssistantContext
): Promise<ActionExecutionResult> {
  // Por ahora, solo devolvemos un mensaje indicando cómo proceder
  return {
    success: true,
    action: 'schedule_visit',
    message:
      '📅 Para agendar una visita, puedes:\n\n1. Ir a la sección de "Visitas" en el menú\n2. Seleccionar fecha y hora disponible\n3. Indicar el motivo de la visita\n\n¿Te gustaría que te dirija allí?',
  };
}

async function handleDocumentRequest(
  intent: IntentDetectionResult,
  context: AssistantContext
): Promise<ActionExecutionResult> {
  return {
    success: true,
    action: 'document_request',
    message:
      '📂 Puedes encontrar tus documentos en:\n\n📄 Sección "Documentos" - Todos los documentos relacionados con tu propiedad\n📝 Sección "Contratos" - Tu contrato de arrendamiento\n🧾e Sección "Pagos" - Recibos y comprobantes de pago\n\n¿Qué documento específico necesitas?',
  };
}

// ============================================================================
// GENERACIÓN DE RESPUESTAS CONTEXTUALES
// ============================================================================
export async function generateContextualResponse(
  userMessage: string,
  context: AssistantContext,
  additionalContext?: string
): Promise<string> {
  try {
    const systemPrompt = `Eres INMOVA Assistant, un asistente IA experto en gestión inmobiliaria.

Información del usuario:
- Nombre: ${context.userName}
- Tipo: ${context.userType}
- Email: ${context.userEmail}

Instrucciones:
- Sé amigable, profesional y útil
- Responde en español de forma clara y concisa
- Si no sabes algo, ofrece escalarlo a un agente humano
- Usa emojis con moderación para hacer la conversación más amena

${additionalContext ? `\nContexto adicional:\n${additionalContext}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.conversationHistory || []),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    logger.error('Error generating contextual response:', error);
    return 'Lo siento, tengo problemas para responder en este momento. Por favor, inténtalo de nuevo o contacta con soporte.';
  }
}
