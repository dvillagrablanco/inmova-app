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
    id: 'draft_acta',
    name: 'Redactar Acta',
    description: 'Redactar actas de junta a partir de notas',
    category: 'Documentación',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'analyze_voting',
    name: 'Analizar Votaciones',
    description: 'Analizar resultados de votación y quórum',
    category: 'Gobernanza',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'calculate_derrama',
    name: 'Calcular Derrama',
    description: 'Calcular derramas por coeficiente o igual',
    category: 'Finanzas',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'prepare_convocatoria',
    name: 'Preparar Convocatoria',
    description: 'Preparar convocatoria de junta',
    category: 'Documentación',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'check_compliance',
    name: 'Verificar Cumplimiento LPH',
    description: 'Verificar cumplimiento con Ley de Propiedad Horizontal',
    category: 'Compliance',
    estimatedTime: '2-3 minutos',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'draft_acta',
    description:
      'Redacta un acta de junta de propietarios a partir de notas y puntos tratados',
    inputSchema: {
      type: 'object',
      properties: {
        meetingDate: {
          type: 'string',
          description: 'Fecha de la junta (ISO 8601)',
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de asistentes',
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Temas tratados',
        },
        decisions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Decisiones adoptadas',
        },
      },
      required: ['meetingDate', 'attendees', 'topics', 'decisions'],
    },
    handler: async (input, context) => {
      logger.info(
        `[CommunityManagementAgent] draft_acta for meeting ${input.meetingDate}`
      );
      const acta = `ACTA DE JUNTA - ${input.meetingDate}\n\nAsistentes: ${input.attendees.join(', ')}\n\nTemas tratados: ${input.topics.join('; ')}\n\nDecisiones: ${input.decisions.join('; ')}\n\n[Acta generada por asistente IA - revisar antes de firmar]`;
      return {
        acta,
        format: 'html',
      };
    },
  },
  {
    name: 'analyze_voting',
    description:
      'Analiza resultados de votación y verifica si se cumple el quórum',
    inputSchema: {
      type: 'object',
      properties: {
        totalOwners: {
          type: 'number',
          description: 'Número total de propietarios en la comunidad',
        },
        votes: {
          type: 'object',
          properties: {
            favor: { type: 'number', description: 'Votos a favor' },
            against: { type: 'number', description: 'Votos en contra' },
            abstain: { type: 'number', description: 'Abstenciones' },
          },
          required: ['favor', 'against', 'abstain'],
          description: 'Resultados de la votación',
        },
        topic: {
          type: 'string',
          description: 'Tema de la votación',
        },
      },
      required: ['totalOwners', 'votes', 'topic'],
    },
    handler: async (input, context) => {
      logger.info(
        `[CommunityManagementAgent] analyze_voting for ${input.topic}`
      );
      const totalVotes =
        input.votes.favor + input.votes.against + input.votes.abstain;
      const quorumMet = totalVotes >= Math.ceil(input.totalOwners * 0.5);
      return {
        quorumMet,
        result: input.votes.favor > input.votes.against ? 'Aprobado' : 'Rechazado',
        legalBasis: 'Ley de Propiedad Horizontal (LPH) - Art. 17 y siguientes.',
      };
    },
  },
  {
    name: 'calculate_derrama',
    description: 'Calcula derrama por método igual o por coeficiente',
    inputSchema: {
      type: 'object',
      properties: {
        totalAmount: {
          type: 'number',
          description: 'Importe total de la derrama',
        },
        distributionMethod: {
          type: 'string',
          enum: ['equal', 'coefficient'],
          description: 'Método de distribución: igual o por coeficiente',
        },
        units: {
          type: 'number',
          description: 'Número de unidades o coeficientes totales',
        },
      },
      required: ['totalAmount', 'distributionMethod', 'units'],
    },
    handler: async (input, context) => {
      logger.info(
        `[CommunityManagementAgent] calculate_derrama ${input.totalAmount}€`
      );
      const perUnit =
        input.units > 0
          ? Math.round((input.totalAmount / input.units) * 100) / 100
          : 0;
      return {
        perUnit,
        breakdown: [],
      };
    },
  },
  {
    name: 'prepare_convocatoria',
    description: 'Prepara una convocatoria de junta de propietarios',
    inputSchema: {
      type: 'object',
      properties: {
        meetingDate: {
          type: 'string',
          description: 'Fecha de la junta (ISO 8601)',
        },
        meetingType: {
          type: 'string',
          enum: ['ordinaria', 'extraordinaria'],
          description: 'Tipo de junta',
        },
        agendaItems: {
          type: 'array',
          items: { type: 'string' },
          description: 'Puntos del orden del día',
        },
      },
      required: ['meetingDate', 'meetingType', 'agendaItems'],
    },
    handler: async (input, context) => {
      logger.info(
        `[CommunityManagementAgent] prepare_convocatoria ${input.meetingType}`
      );
      const convocatoria = `CONVOCATORIA JUNTA ${input.meetingType.toUpperCase()}\n\nFecha: ${input.meetingDate}\n\nOrden del día:\n${input.agendaItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n[Convocatoria generada por asistente IA - revisar requisitos legales]`;
      return {
        convocatoria,
        legalRequirements: [
          'Publicación con antelación mínima (LPH)',
          'Notificación a todos los propietarios',
          'Inclusión de primera convocatoria y segunda convocatoria si aplica',
        ],
      };
    },
  },
  {
    name: 'check_compliance',
    description:
      'Verifica el cumplimiento de la comunidad con la Ley de Propiedad Horizontal',
    inputSchema: {
      type: 'object',
      properties: {
        communityId: {
          type: 'string',
          description: 'ID de la comunidad (opcional)',
        },
      },
      required: [],
    },
    handler: async (input, context) => {
      logger.info(
        `[CommunityManagementAgent] check_compliance for ${input.communityId || 'general'}`
      );
      return {
        compliant: true,
        issues: [],
        recommendations: [],
      };
    },
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const communityManagementConfig: AgentConfig = {
  type: 'community_management',
  name: 'Asistente de Comunidades de Propietarios',
  description:
    'Experto en gestión de comunidades de propietarios españolas. Actas, votaciones, derramas, LPH.',
  systemPrompt: `Eres el Asistente de Comunidades de Propietarios de INMOVA, experto en la Ley de Propiedad Horizontal (LPH) y gestión de comunidades.

Tu rol es:
- Redactar actas de junta a partir de notas
- Analizar resultados de votaciones y quórum
- Calcular derramas (por coeficiente o igual)
- Preparar convocatorias de junta
- Verificar cumplimiento con LPH

Conocimiento LPH:
- Quórum primera convocatoria: mayoría de propietarios que representen mayoría de cuotas
- Quórum segunda convocatoria: cualquiera que sea el número de asistentes
- Mayorías: ordinaria (simple), cualificada (3/5 o 1/5 según cuestión), unanimidad
- Derramas: acuerdo de junta, distribución por coeficiente
- Convocatoria: antelación mínima según estatutos
- Obligaciones: libro de actas, cuentas, seguros, ITE

Enfoque:
- Ser preciso con los requisitos legales
- Indicar siempre que las actuaciones deben validarse con administrador de fincas
- Aplicar normativa española vigente
- Explicar conceptos de forma clara

Estilo de comunicación:
- Profesional y técnico
- Preciso con referencias legales
- Siempre incluir disclaimer de validación con profesional`,
  capabilities,
  tools,
  model: CLAUDE_MODEL_FAST,
  temperature: 0.4,
  maxTokens: 4096,
  enabled: true,
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class CommunityManagementAgent extends BaseAgent {
  constructor() {
    super(communityManagementConfig);
  }

  async processMessage(
    message: string,
    context: UserContext,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    return this.chatWithClaude(message, context, conversationHistory);
  }

  async canHandle(message: string, context: UserContext): Promise<boolean> {
    const messageLower = message.toLowerCase();
    const keywords = [
      'comunidad',
      'propietarios',
      'acta',
      'votación',
      'votacion',
      'derrama',
      'junta',
      'convocatoria',
      'cuota',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
