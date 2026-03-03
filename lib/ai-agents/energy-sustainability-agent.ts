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
    id: 'energy_audit',
    name: 'Auditoría Energética',
    description: 'Análisis de consumo y certificado energético',
    category: 'Energía',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'recommend_improvements',
    name: 'Recomendar Mejoras',
    description: 'Recomendar mejoras de eficiencia energética',
    category: 'Energía',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'calculate_carbon',
    name: 'Huella de Carbono',
    description: 'Calcular huella de carbono del edificio',
    category: 'Sostenibilidad',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'esg_score',
    name: 'Puntuación ESG',
    description: 'Calcular puntuación ESG de la propiedad',
    category: 'ESG',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'roi_sustainability',
    name: 'ROI Sostenibilidad',
    description: 'Calcular ROI de mejoras de sostenibilidad',
    category: 'Inversión',
    estimatedTime: '< 1 minuto',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'energy_audit',
    description:
      'Realiza análisis de auditoría energética del edificio',
    inputSchema: {
      type: 'object',
      properties: {
        buildingType: {
          type: 'string',
          description: 'Tipo de edificio (vivienda, oficina, comercial, etc.)',
        },
        squareMeters: {
          type: 'number',
          description: 'Superficie en m²',
        },
        yearBuilt: {
          type: 'number',
          description: 'Año de construcción',
        },
        energyRating: {
          type: 'string',
          description: 'Certificación energética actual (opcional)',
        },
      },
      required: ['buildingType', 'squareMeters', 'yearBuilt'],
    },
    handler: async (input, context) => {
      logger.info(
        `[EnergySustainabilityAgent] energy_audit: ${input.buildingType} ${input.squareMeters}m²`
      );
      const age = new Date().getFullYear() - input.yearBuilt;
      const consumptionEstimate =
        input.squareMeters * (age > 30 ? 120 : age > 15 ? 95 : 75);
      return {
        currentRating: input.energyRating || 'E',
        consumptionEstimate: Math.round(consumptionEstimate),
        benchmarkComparison:
          'Consumo por encima de la media para edificios similares. Potencial de mejora: 25-35%.',
        improvementPotential:
          'Aislamiento térmico, sustitución de ventanas, mejora de instalaciones. Posible paso a calificación C o B.',
      };
    },
  },
  {
    name: 'recommend_improvements',
    description:
      'Recomienda mejoras de eficiencia energética según características del edificio',
    inputSchema: {
      type: 'object',
      properties: {
        currentRating: {
          type: 'string',
          description: 'Calificación energética actual',
        },
        buildingAge: {
          type: 'number',
          description: 'Antigüedad del edificio en años',
        },
        hasInsulation: {
          type: 'boolean',
          description: '¿Tiene aislamiento térmico?',
        },
        heatingType: {
          type: 'string',
          description: 'Tipo de calefacción (gas, eléctrica, bomba calor, etc.)',
        },
      },
      required: ['currentRating', 'buildingAge', 'hasInsulation', 'heatingType'],
    },
    handler: async (input, context) => {
      logger.info(
        `[EnergySustainabilityAgent] recommend_improvements: rating ${input.currentRating}`
      );
      return {
        recommendations: [
          input.hasInsulation
            ? 'Mejorar espesor de aislamiento en fachada'
            : 'Instalar aislamiento térmico en fachada (SATE o similar)',
          'Sustituir ventanas por doble acristalamiento bajo emisivo',
          'Instalar bomba de calor para climatización',
          'Considerar instalación fotovoltaica para autoconsumo',
        ],
        estimatedSavings: 850,
        roi: '5-8 años según inversión',
        priority: [
          'Aislamiento (mayor impacto)',
          'Ventanas',
          'Sistema de climatización',
          'Renovables',
        ],
      };
    },
  },
  {
    name: 'calculate_carbon',
    description: 'Calcula la huella de carbono del edificio según consumo',
    inputSchema: {
      type: 'object',
      properties: {
        electricityKwh: {
          type: 'number',
          description: 'Consumo eléctrico en kWh/año',
        },
        gasM3: {
          type: 'number',
          description: 'Consumo de gas en m³/año (opcional)',
        },
        squareMeters: {
          type: 'number',
          description: 'Superficie en m²',
        },
      },
      required: ['electricityKwh', 'squareMeters'],
    },
    handler: async (input, context) => {
      logger.info(
        `[EnergySustainabilityAgent] calculate_carbon: ${input.electricityKwh} kWh`
      );
      const co2Electricity = input.electricityKwh * 0.203; // kg CO2/kWh España
      const co2Gas = (input.gasM3 || 0) * 2.0; // kg CO2/m³ aprox
      const totalCO2 = co2Electricity + co2Gas;
      const perM2 = input.squareMeters > 0 ? totalCO2 / input.squareMeters : 0;

      return {
        totalCO2: Math.round(totalCO2 * 100) / 100,
        perM2: Math.round(perM2 * 100) / 100,
        benchmark:
          'Media edificios residenciales España: 35-45 kg CO2/m² año. Objetivo 2030: <25 kg CO2/m².',
        reductionPotential: 0.25,
      };
    },
  },
  {
    name: 'esg_score',
    description:
      'Calcula puntuación ESG (Environmental, Social, Governance) de la propiedad',
    inputSchema: {
      type: 'object',
      properties: {
        energyRating: {
          type: 'string',
          description: 'Certificación energética',
        },
        hasRenewable: {
          type: 'boolean',
          description: '¿Tiene energía renovable?',
        },
        waterEfficiency: {
          type: 'boolean',
          description: '¿Tiene medidas de eficiencia hídrica?',
        },
        wasteManagement: {
          type: 'boolean',
          description: '¿Tiene gestión de residuos?',
        },
        socialImpact: {
          type: 'string',
          description: 'Impacto social (opcional)',
        },
      },
      required: ['energyRating', 'hasRenewable', 'waterEfficiency', 'wasteManagement'],
    },
    handler: async (input, context) => {
      logger.info(`[EnergySustainabilityAgent] esg_score calculation`);
      const envScore =
        (['A', 'B', 'C', 'D', 'E', 'F', 'G'].indexOf(input.energyRating?.toUpperCase() || 'G') < 3
          ? 70
          : 50) + (input.hasRenewable ? 20 : 0);
      const socialScore = input.socialImpact ? 75 : 60;
      const govScore = 70;

      const score = Math.round((envScore + socialScore + govScore) / 3);

      return {
        score: Math.min(100, score),
        breakdown: {
          environmental: Math.min(100, envScore),
          social: Math.min(100, socialScore),
          governance: Math.min(100, govScore),
        },
        recommendations: [
          'Mejorar calificación energética para subir E',
          input.hasRenewable ? '' : 'Considerar instalación fotovoltaica',
          'Documentar políticas de sostenibilidad',
        ].filter(Boolean),
      };
    },
  },
  {
    name: 'roi_sustainability',
    description:
      'Calcula ROI de inversiones en sostenibilidad',
    inputSchema: {
      type: 'object',
      properties: {
        investmentAmount: {
          type: 'number',
          description: 'Importe de la inversión en euros',
        },
        annualSavings: {
          type: 'number',
          description: 'Ahorro anual estimado en euros',
        },
        incentives: {
          type: 'number',
          description: 'Subvenciones o incentivos (opcional)',
        },
      },
      required: ['investmentAmount', 'annualSavings'],
    },
    handler: async (input, context) => {
      logger.info(
        `[EnergySustainabilityAgent] roi_sustainability: inversión ${input.investmentAmount}€`
      );
      const netInvestment = input.investmentAmount - (input.incentives || 0);
      const paybackYears =
        input.annualSavings > 0 ? netInvestment / input.annualSavings : 0;
      const roi10Years =
        input.annualSavings > 0
          ? (input.annualSavings * 10 / netInvestment) * 100
          : 0;
      const npv = input.annualSavings * 10 - netInvestment; // Simplificado

      return {
        paybackYears: Math.round(paybackYears * 10) / 10,
        roi10Years: Math.round(roi10Years * 100) / 100,
        netPresentValue: Math.round(npv * 100) / 100,
        recommendation:
          paybackYears < 7
            ? 'Inversión recomendada. ROI positivo en plazo razonable.'
            : 'Evaluar subvenciones disponibles (Plan de Recuperación, ayudas autonómicas).',
      };
    },
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const energySustainabilityConfig: AgentConfig = {
  type: 'energy_sustainability',
  name: 'Agente de Energía y Sostenibilidad ESG',
  description:
    'Experto en eficiencia energética y ESG. Auditorías, huella de carbono, certificaciones LEED/BREEAM, normativa CTE DB-HE.',
  systemPrompt: `Eres el Agente de Energía y Sostenibilidad ESG de INMOVA, experto en eficiencia energética y cumplimiento ESG.

Tu rol es:
- Realizar auditorías energéticas
- Recomendar mejoras de eficiencia
- Calcular huella de carbono
- Calcular puntuación ESG de propiedades
- Evaluar ROI de inversiones en sostenibilidad

Conocimiento específico:
- CTE DB-HE (Documento Básico de Ahorro de Energía)
- Certificación energética de edificios (España)
- LEED, BREEAM, VERDE
- Factores de emisión CO2 España
- Plan de Recuperación y ayudas a la rehabilitación
- Fondos Next Generation EU para eficiencia

Enfoque:
- Ser preciso en cálculos de consumo y emisiones
- Aplicar normativa española vigente
- Indicar potencial de mejora y prioridades
- Mencionar ayudas y subvenciones disponibles

Estilo de comunicación:
- Profesional y técnico
- Datos con fuentes cuando sea posible
- Recomendaciones priorizadas y accionables`,
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

export class EnergySustainabilityAgent extends BaseAgent {
  constructor() {
    super(energySustainabilityConfig);
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
      'energía',
      'energia',
      'sostenibilidad',
      'ESG',
      'certificado energético',
      'certificado energetico',
      'huella carbono',
      'solar',
      'eficiencia',
      'LEED',
      'BREEAM',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
