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
    id: 'analyze_coverage',
    name: 'Análisis de Cobertura',
    description: 'Analizar cobertura actual vs riesgos',
    category: 'Análisis',
  },
  {
    id: 'compare_quotes',
    name: 'Comparar Cotizaciones',
    description: 'Comparar cotizaciones de seguro',
    category: 'Comparación',
  },
  {
    id: 'detect_underinsurance',
    name: 'Detectar Infraseguro',
    description: 'Detectar infra o sobreseguro',
    category: 'Riesgo',
  },
  {
    id: 'recommend_policy',
    name: 'Recomendar Póliza',
    description: 'Recomendar póliza óptima',
    category: 'Recomendación',
  },
  {
    id: 'renewal_alert',
    name: 'Alertas de Renovación',
    description: 'Alertar sobre vencimientos de pólizas',
    category: 'Alertas',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'analyze_coverage',
    description: 'Analizar cobertura del seguro vs riesgos de la propiedad',
    inputSchema: {
      type: 'object',
      properties: {
        propertyType: {
          type: 'string',
          description: 'Tipo de propiedad',
        },
        squareMeters: { type: 'number' },
        location: { type: 'string' },
        currentCoverage: { type: 'number' },
      },
      required: ['propertyType', 'squareMeters', 'location'],
    },
    handler: async (input: any) => ({
      adequacy: 'adecuado',
      risks: ['incendio', 'inundación', 'responsabilidad civil'],
      recommendations: [
        'Añadir cobertura de daños por agua',
        'Revisar límite de responsabilidad civil',
      ],
    }),
  },
  {
    name: 'compare_quotes',
    description: 'Comparar cotizaciones de seguros',
    inputSchema: {
      type: 'object',
      properties: {
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              premium: { type: 'number' },
              coverage: { type: 'number' },
            },
          },
        },
      },
      required: ['quotes'],
    },
    handler: async (input: any) => ({
      bestValue: input.quotes?.[0]?.provider || 'N/A',
      comparison: [],
      recommendation:
        'Seleccionar la cotización con mejor relación cobertura/precio',
    }),
  },
  {
    name: 'detect_underinsurance',
    description: 'Detectar infraseguro o sobreseguro',
    inputSchema: {
      type: 'object',
      properties: {
        propertyValue: { type: 'number' },
        insuredAmount: { type: 'number' },
        contents: { type: 'number' },
      },
      required: ['propertyValue', 'insuredAmount'],
    },
    handler: async (input: any) => {
      const gap = input.propertyValue - input.insuredAmount;
      return {
        status: gap > 0 ? 'under' : gap < 0 ? 'over' : 'adequate',
        gap: Math.abs(gap),
        recommendation:
          gap > 0
            ? `Infraseguro de ${gap}€. Actualizar cobertura.`
            : 'Cobertura adecuada',
      };
    },
  },
  {
    name: 'recommend_policy',
    description: 'Recomendar póliza óptima por tipo de propiedad',
    inputSchema: {
      type: 'object',
      properties: {
        propertyType: { type: 'string' },
        usage: {
          type: 'string',
          enum: ['residential', 'commercial', 'vacation'],
        },
        tenantCount: { type: 'number' },
      },
      required: ['propertyType', 'usage'],
    },
    handler: async (input: any) => ({
      recommendedCoverage: [
        'Incendio',
        'Responsabilidad Civil',
        'Daños por agua',
        'Robo',
      ],
      estimatedPremium: 350,
      priority: ['Responsabilidad Civil es obligatoria para arrendadores'],
    }),
  },
  {
    name: 'renewal_alert',
    description: 'Verificar fechas de renovación de pólizas',
    inputSchema: {
      type: 'object',
      properties: {
        policyId: { type: 'string' },
      },
      required: [],
    },
    handler: async (input: any) => ({
      expiringPolicies: [],
      recommendations: ['No hay pólizas próximas a vencer'],
    }),
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const systemPrompt = `Eres un asesor experto en seguros inmobiliarios para el mercado español.
Tus responsabilidades: análisis de coberturas, detección de infraseguro, comparación de cotizaciones,
recomendación de pólizas óptimas y alertas de renovación.
Conoces la normativa española de seguros (Ley de Contrato de Seguro, obligaciones del arrendador).
Siempre priorizas la protección del patrimonio del propietario.`;

const insuranceAdvisorConfig: AgentConfig = {
  type: 'insurance_advisor',
  name: 'Asesor de Seguros Inmobiliarios',
  description:
    'Experto en seguros inmobiliarios: análisis de cobertura, infraseguro, comparativa de cotizaciones',
  systemPrompt,
  capabilities,
  tools,
  model: CLAUDE_MODEL_FAST,
  temperature: 0.3,
  maxTokens: 4096,
  enabled: true,
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class InsuranceAdvisorAgent extends BaseAgent {
  constructor() {
    super(insuranceAdvisorConfig);
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
      'seguro',
      'póliza',
      'poliza',
      'cobertura',
      'siniestro',
      'prima',
      'asegurar',
      'infraseguro',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
