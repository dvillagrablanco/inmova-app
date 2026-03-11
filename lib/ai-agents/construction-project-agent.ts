// @ts-nocheck
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
    id: 'estimate_cost',
    name: 'Estimación de Costes',
    description: 'Estimar costes de obra y reformas',
    category: 'Costes',
  },
  {
    id: 'detect_deviations',
    name: 'Detectar Desviaciones',
    description: 'Detectar desviaciones de presupuesto y plazos',
    category: 'Control',
  },
  {
    id: 'suggest_providers',
    name: 'Sugerir Proveedores',
    description: 'Sugerir proveedores por especialidad y ubicación',
    category: 'Proveedores',
  },
  {
    id: 'progress_report',
    name: 'Informe de Progreso',
    description: 'Generar informes de avance del proyecto',
    category: 'Informes',
  },
  {
    id: 'quality_check',
    name: 'Control de Calidad',
    description: 'Checklist de calidad por fase del proyecto',
    category: 'Calidad',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'estimate_cost',
    description: 'Estimar coste de obra o reforma según tipo, superficie y calidad',
    inputSchema: {
      type: 'object',
      properties: {
        workType: {
          type: 'string',
          description: 'Tipo de obra (reforma integral, baño, cocina, etc.)',
        },
        squareMeters: {
          type: 'number',
          description: 'Superficie en m²',
        },
        quality: {
          type: 'string',
          enum: ['basic', 'standard', 'premium'],
          description: 'Nivel de calidad',
        },
      },
      required: ['workType', 'squareMeters', 'quality'],
    },
    handler: async (input: any) => {
      const baseCost =
        input.squareMeters *
        (input.quality === 'premium' ? 450 : input.quality === 'standard' ? 300 : 180);
      return {
        estimatedCost: Math.round(baseCost),
        breakdown: [
          { item: 'Mano de obra', amount: Math.round(baseCost * 0.5) },
          { item: 'Materiales', amount: Math.round(baseCost * 0.35) },
          { item: 'Otros', amount: Math.round(baseCost * 0.15) },
        ],
        timeEstimate: `${Math.ceil(input.squareMeters / 15)} semanas aprox.`,
      };
    },
  },
  {
    name: 'detect_deviations',
    description: 'Detectar desviaciones de presupuesto y plazos del proyecto',
    inputSchema: {
      type: 'object',
      properties: {
        plannedBudget: { type: 'number' },
        actualSpent: { type: 'number' },
        plannedDays: { type: 'number' },
        elapsedDays: { type: 'number' },
        completionPercent: { type: 'number' },
      },
      required: ['plannedBudget', 'actualSpent', 'plannedDays', 'elapsedDays', 'completionPercent'],
    },
    handler: async (input: any) => {
      const budgetDeviation =
        ((input.actualSpent - input.plannedBudget) / input.plannedBudget) * 100;
      const timelineDeviation =
        input.completionPercent > 0
          ? input.elapsedDays / (input.plannedDays * (input.completionPercent / 100)) - 1
          : 0;
      const alerts: string[] = [];
      if (budgetDeviation > 10) alerts.push('Desviación presupuestaria significativa');
      if (timelineDeviation > 0.2) alerts.push('Riesgo de retraso en plazos');
      return {
        budgetDeviation: Math.round(budgetDeviation * 100) / 100,
        timelineDeviation: Math.round(timelineDeviation * 100) / 100,
        alerts,
        recommendations: [
          'Revisar partidas con mayor desviación',
          'Evaluar variaciones pendientes de aprobación',
        ],
      };
    },
  },
  {
    name: 'suggest_providers',
    description: 'Sugerir proveedores por especialidad y ubicación',
    inputSchema: {
      type: 'object',
      properties: {
        specialty: {
          type: 'string',
          description: 'Especialidad (fontanería, electricidad, albañilería, etc.)',
        },
        location: {
          type: 'string',
          description: 'Ubicación o ciudad',
        },
      },
      required: ['specialty', 'location'],
    },
    handler: async (input: any, context: UserContext) => {
      const providers = await prisma.provider.findMany({
        where: {
          companyId: context.companyId,
          activo: true,
          OR: [
            { especialidad: { contains: input.specialty, mode: 'insensitive' } },
            { nombre: { contains: input.specialty, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { rating: 'desc' },
        select: {
          id: true,
          nombre: true,
          especialidad: true,
          telefono: true,
          rating: true,
        },
      });
      return {
        providers: providers.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          especialidad: p.especialidad,
          telefono: p.telefono,
          rating: p.rating,
        })),
        criteria: [
          'Experiencia en el tipo de obra',
          'Disponibilidad en la zona',
          'Referencias y valoraciones',
        ],
      };
    },
  },
  {
    name: 'progress_report',
    description: 'Generar informe de progreso del proyecto',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'Nombre del proyecto',
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              progress: { type: 'number' },
            },
          },
          description: 'Fases con su porcentaje de avance',
        },
      },
      required: ['projectName', 'phases'],
    },
    handler: async (input: any) => {
      const phases = input.phases || [];
      const overallProgress =
        phases.length > 0
          ? phases.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / phases.length
          : 0;
      const riskAreas = phases
        .filter((p: any) => p.progress < 50 && p.progress > 0)
        .map((p: any) => p.name);
      return {
        report: `Proyecto ${input.projectName}: avance global ${Math.round(overallProgress)}%. ${phases.length} fases registradas.`,
        overallProgress: Math.round(overallProgress * 100) / 100,
        riskAreas: riskAreas.length > 0 ? riskAreas : ['Ninguna detectada'],
      };
    },
  },
  {
    name: 'quality_check',
    description: 'Checklist de control de calidad por tipo y fase del proyecto',
    inputSchema: {
      type: 'object',
      properties: {
        projectType: {
          type: 'string',
          description: 'Tipo de proyecto (reforma, obra nueva, rehabilitación)',
        },
        phase: {
          type: 'string',
          description: 'Fase actual (demolición, estructura, instalaciones, acabados)',
        },
      },
      required: ['projectType', 'phase'],
    },
    handler: async (input: any) => ({
      checklist: [
        'Cumplimiento CTE en la fase actual',
        'Documentación de certificados',
        'Recepción de materiales según especificación',
        'Control de ejecución según proyecto',
      ],
      criticalItems: ['Verificar licencia de obra vigente', 'Certificado de dirección de obra'],
      complianceNotes: [
        'CTE aplicable según tipo de intervención',
        'Documentación necesaria para certificado de habitabilidad',
      ],
    }),
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const systemPrompt = `Eres un experto en gestión de obras y reformas inmobiliarias para el mercado español.
Tus responsabilidades: estimación de costes, detección de desviaciones de presupuesto y plazos,
sugerencia de proveedores, informes de progreso y control de calidad.
Conoces el CTE (Código Técnico de la Edificación), normativa de licencias de obra y buenas prácticas.
Priorizas el cumplimiento normativo y la calidad de la ejecución.`;

const constructionProjectConfig: AgentConfig = {
  type: 'construction_project',
  name: 'Agente de Gestión de Obras y Reformas',
  description: 'Experto en obras y reformas: estimación de costes, plazos, calidad, normativa CTE',
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

export class ConstructionProjectAgent extends BaseAgent {
  constructor() {
    super(constructionProjectConfig);
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
      'obra',
      'reforma',
      'construcción',
      'construccion',
      'presupuesto obra',
      'plazo',
      'calidad',
      'CTE',
      'licencia obra',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
