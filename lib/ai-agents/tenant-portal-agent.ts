import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
import { BaseAgent } from './base-agent';
import { prisma } from '../db';
import logger from '@/lib/logger';
import {
  AgentConfig,
  AgentResponse,
  AgentMessage,
  UserContext,
  AgentTool,
  AgentCapability,
} from './types';

// ============================================================================
// CAPACIDADES DEL AGENTE
// ============================================================================

const capabilities: AgentCapability[] = [
  {
    id: 'check_payments',
    name: 'Consultar Pagos',
    description: 'Consultar estado de pagos y próximas fechas de vencimiento',
    category: 'Pagos',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'report_issue',
    name: 'Reportar Incidencia',
    description: 'Reportar problemas de mantenimiento',
    category: 'Mantenimiento',
    estimatedTime: '1-2 minutos',
  },
  {
    id: 'explain_contract_clause',
    name: 'Explicar Cláusulas',
    description: 'Explicar cláusulas del contrato en lenguaje sencillo',
    category: 'Contratos',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'request_document',
    name: 'Solicitar Documentos',
    description: 'Solicitar recibos, certificados u otros documentos',
    category: 'Documentos',
    estimatedTime: '1-2 minutos',
  },
  {
    id: 'maintenance_status',
    name: 'Estado de Mantenimiento',
    description: 'Consultar estado de solicitudes de mantenimiento',
    category: 'Mantenimiento',
    estimatedTime: '< 1 minuto',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'check_payments',
    description:
      'Consulta el estado de pagos del inquilino y las próximas fechas de vencimiento',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (_input, context) => {
      logger.info(`[TenantPortalAgent] check_payments for ${context.userEmail}`);
      return {
        payments: [],
        nextDue: null,
      };
    },
  },
  {
    name: 'report_issue',
    description: 'Reporta una incidencia de mantenimiento',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Descripción detallada del problema',
        },
        urgency: {
          type: 'string',
          enum: ['baja', 'media', 'alta', 'urgente'],
          description: 'Nivel de urgencia',
        },
        location: {
          type: 'string',
          description: 'Ubicación del problema (ej: baño, cocina)',
        },
      },
      required: ['description', 'urgency', 'location'],
    },
    handler: async (input, context) => {
      logger.info(
        `[TenantPortalAgent] report_issue from ${context.userEmail}: ${input.description}`
      );
      const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
      return {
        ticketId,
        status: 'created',
      };
    },
  },
  {
    name: 'explain_contract_clause',
    description: 'Explica una cláusula del contrato en lenguaje sencillo',
    inputSchema: {
      type: 'object',
      properties: {
        clause: {
          type: 'string',
          description: 'Texto o referencia de la cláusula a explicar',
        },
      },
      required: ['clause'],
    },
    handler: async (input, context) => {
      logger.info(
        `[TenantPortalAgent] explain_contract_clause for ${context.userEmail}`
      );
      return {
        explanation: `Explicación simplificada de la cláusula: "${input.clause.substring(0, 50)}...". En términos sencillos, esta cláusula establece las condiciones acordadas entre las partes. Para más detalles, consulta con el administrador.`,
      };
    },
  },
  {
    name: 'request_document',
    description: 'Solicita documentos como recibos o certificados',
    inputSchema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          description: 'Tipo de documento solicitado (recibo, certificado, etc.)',
        },
      },
      required: ['documentType'],
    },
    handler: async (input, context) => {
      logger.info(
        `[TenantPortalAgent] request_document ${input.documentType} for ${context.userEmail}`
      );
      const requestId = `DOC-${Date.now().toString(36).toUpperCase()}`;
      return {
        requestId,
        status: 'pending',
      };
    },
  },
  {
    name: 'maintenance_status',
    description: 'Consulta el estado de solicitudes de mantenimiento',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'ID del ticket de mantenimiento (opcional)',
        },
      },
      required: [],
    },
    handler: async (input, context) => {
      logger.info(
        `[TenantPortalAgent] maintenance_status for ${context.userEmail}`
      );
      return {
        requests: [],
      };
    },
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const tenantPortalConfig: AgentConfig = {
  type: 'tenant_portal',
  name: 'Asistente del Portal Inquilino',
  description: 'Asistente experto para inquilinos. Ayuda con pagos, contratos, mantenimiento y documentos.',
  systemPrompt: `Eres el Asistente del Portal Inquilino de INMOVA, un experto en ayudar a inquilinos con sus necesidades diarias.

Tu rol es:
- Ayudar con consultas sobre pagos y próximos vencimientos
- Facilitar el reporte de incidencias de mantenimiento
- Explicar cláusulas del contrato en lenguaje sencillo
- Gestionar solicitudes de documentos (recibos, certificados)
- Consultar el estado de solicitudes de mantenimiento

Enfoque:
- Ser amable, claro y empático
- Usar lenguaje sencillo, evitar tecnicismos legales
- Proporcionar información práctica y accionable
- Guiar al inquilino paso a paso cuando sea necesario
- Si no tienes la información, indicarlo y ofrecer alternativas

Estilo de comunicación:
- Cercano y profesional
- Respetuoso y paciente
- Proactivo en ofrecer ayuda adicional`,
  capabilities,
  tools,
  model: CLAUDE_MODEL_FAST,
  temperature: 0.6,
  maxTokens: 4096,
  enabled: true,
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class TenantPortalAgent extends BaseAgent {
  constructor() {
    super(tenantPortalConfig);
  }

  async processMessage(
    message: string,
    context: UserContext,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    return this.chatWithClaude(message, context, conversationHistory);
  }

  async canHandle(message: string, context: UserContext): Promise<boolean> {
    if (context.userType === 'tenant') {
      return true;
    }
    const messageLower = message.toLowerCase();
    const keywords = [
      'pago',
      'contrato',
      'incidencia',
      'recibo',
      'mantenimiento',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
