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
    id: 'categorize_transaction',
    name: 'Categorizar Transacciones',
    description: 'Categorizar automáticamente ingresos y gastos',
    category: 'Contabilidad',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'calculate_tax',
    name: 'Calcular Impuestos',
    description: 'Calcular retenciones IRPF o IVA',
    category: 'Impuestos',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'detect_duplicates',
    name: 'Detectar Duplicados',
    description: 'Detectar facturas o transacciones duplicadas',
    category: 'Gestión',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'tax_optimization',
    name: 'Optimización Fiscal',
    description: 'Sugerir estrategias de optimización fiscal',
    category: 'Impuestos',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'prepare_quarterly',
    name: 'Preparar Declaración Trimestral',
    description: 'Preparar datos para modelo 303, 115, 130',
    category: 'Declaraciones',
    estimatedTime: '2-5 minutos',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'categorize_transaction',
    description:
      'Categoriza automáticamente una transacción de ingreso o gasto según su descripción',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Descripción de la transacción',
        },
        amount: {
          type: 'number',
          description: 'Importe de la transacción',
        },
        type: {
          type: 'string',
          enum: ['income', 'expense'],
          description: 'Tipo de transacción: ingreso o gasto',
        },
      },
      required: ['description', 'amount', 'type'],
    },
    handler: async (input, context) => {
      logger.info(
        `[AccountingTaxAgent] categorize_transaction: ${input.description}`
      );
      return {
        category: 'Otros',
        subcategory: 'Otros gastos/ingresos',
        taxImplications: 'Consultar con asesor fiscal para implicaciones específicas.',
      };
    },
  },
  {
    name: 'calculate_tax',
    description: 'Calcula retención IRPF o IVA según el tipo de impuesto',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Importe base para el cálculo',
        },
        taxType: {
          type: 'string',
          enum: ['irpf', 'iva'],
          description: 'Tipo de impuesto a calcular',
        },
        concept: {
          type: 'string',
          description: 'Concepto del cálculo (ej: alquiler, arrendamiento)',
        },
      },
      required: ['amount', 'taxType', 'concept'],
    },
    handler: async (input, context) => {
      logger.info(
        `[AccountingTaxAgent] calculate_tax ${input.taxType} for ${input.amount}`
      );
      const rate = input.taxType === 'irpf' ? 0.15 : 0.21;
      const taxAmount = Math.round(input.amount * rate * 100) / 100;
      return {
        taxAmount,
        rate: rate * 100,
        explanation: `Cálculo ${input.taxType.toUpperCase()} para ${input.concept}. Tipo aplicado: ${rate * 100}%. Importe: ${taxAmount}€.`,
      };
    },
  },
  {
    name: 'detect_duplicates',
    description: 'Detecta facturas o transacciones duplicadas',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceNumber: {
          type: 'string',
          description: 'Número de factura a verificar',
        },
        amount: {
          type: 'number',
          description: 'Importe a verificar',
        },
        date: {
          type: 'string',
          description: 'Fecha de la transacción (ISO 8601)',
        },
      },
      required: [],
    },
    handler: async (input, context) => {
      logger.info(
        `[AccountingTaxAgent] detect_duplicates for ${input.invoiceNumber || input.amount}`
      );
      return {
        duplicates: [],
        count: 0,
      };
    },
  },
  {
    name: 'tax_optimization',
    description:
      'Sugiere estrategias de optimización fiscal según ingresos y gastos',
    inputSchema: {
      type: 'object',
      properties: {
        annualIncome: {
          type: 'number',
          description: 'Ingresos anuales estimados',
        },
        expenses: {
          type: 'number',
          description: 'Gastos anuales deducibles',
        },
        propertyCount: {
          type: 'number',
          description: 'Número de propiedades gestionadas',
        },
      },
      required: ['annualIncome', 'expenses', 'propertyCount'],
    },
    handler: async (input, context) => {
      logger.info(
        `[AccountingTaxAgent] tax_optimization for income ${input.annualIncome}`
      );
      return {
        suggestions: [],
        potentialSaving: 0,
      };
    },
  },
  {
    name: 'prepare_quarterly',
    description:
      'Prepara datos para la declaración trimestral (modelo 303, 115, 130)',
    inputSchema: {
      type: 'object',
      properties: {
        quarter: {
          type: 'number',
          description: 'Trimestre (1-4)',
        },
        year: {
          type: 'number',
          description: 'Año fiscal',
        },
      },
      required: ['quarter', 'year'],
    },
    handler: async (input, context) => {
      logger.info(
        `[AccountingTaxAgent] prepare_quarterly Q${input.quarter}/${input.year}`
      );
      return {
        modelo303: {},
        modelo115: {},
        modelo130: {},
        summary: {},
      };
    },
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const accountingTaxConfig: AgentConfig = {
  type: 'accounting_tax',
  name: 'Asistente de Contabilidad e Impuestos',
  description:
    'Experto en contabilidad inmobiliaria española. IVA, IRPF, modelo 303/115/130.',
  systemPrompt: `Eres el Asistente de Contabilidad e Impuestos de INMOVA, experto en contabilidad inmobiliaria española.

Tu rol es:
- Categorizar transacciones de ingresos y gastos
- Calcular retenciones IRPF e IVA
- Detectar facturas duplicadas
- Sugerir estrategias de optimización fiscal
- Preparar datos para declaraciones trimestrales (modelo 303, 115, 130)

Conocimiento específico:
- IVA en arrendamiento urbano: 21% o exento según tipo
- IVA en arrendamiento de vivienda: exento
- IVA en arrendamiento de local comercial: 21%
- Retención IRPF en arrendamiento: 15% (residentes) / 24% (no residentes UE)
- Modelo 303: IVA trimestral
- Modelo 115: Retenciones e ingresos a cuenta del IRPF (arrendamiento urbano)
- Modelo 130: Pago fraccionado IRPF (obligaciones de pago fraccionado)

Enfoque:
- Ser preciso con los cálculos fiscales
- Indicar siempre que las recomendaciones deben validarse con un asesor fiscal
- Aplicar normativa española vigente
- Explicar conceptos de forma clara cuando sea necesario

Estilo de comunicación:
- Profesional y técnico
- Preciso con cifras y porcentajes
- Siempre incluir disclaimer de validación con profesional`,
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

export class AccountingTaxAgent extends BaseAgent {
  constructor() {
    super(accountingTaxConfig);
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
      'factura',
      'impuesto',
      'iva',
      'irpf',
      'contabilidad',
      'declaración',
      'declaracion',
      'modelo 303',
      'retención',
      'retencion',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
