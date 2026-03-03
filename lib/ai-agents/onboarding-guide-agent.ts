import { CLAUDE_MODEL_FAST } from '@/lib/ai-model-config';
import { BaseAgent } from './base-agent';
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
    id: 'user_detection',
    name: 'Detección de Tipo de Usuario',
    description: 'Identifica el perfil del usuario desde la conversación',
    category: 'Onboarding',
    estimatedTime: '1 minuto',
  },
  {
    id: 'personalized_setup',
    name: 'Setup Personalizado',
    description: 'Pasos de configuración según tipo de usuario',
    category: 'Configuración',
    estimatedTime: '5-10 minutos',
  },
  {
    id: 'module_suggestions',
    name: 'Sugerencia de Módulos',
    description: 'Recomendación de módulos según intereses',
    category: 'Descubrimiento',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'progress_tracking',
    name: 'Seguimiento de Progreso',
    description: 'Verificación del avance en onboarding',
    category: 'Progreso',
    estimatedTime: '1-2 minutos',
  },
  {
    id: 'feature_activation',
    name: 'Activación de Features',
    description: 'Sugerencias de funcionalidades a activar',
    category: 'Optimización',
    estimatedTime: '2-3 minutos',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'detect_user_type',
    description: 'Detecta el tipo de usuario a partir de la descripción de la conversación',
    inputSchema: {
      type: 'object',
      properties: {
        userDescription: {
          type: 'string',
          description: 'Descripción o contexto del usuario',
        },
      },
      required: ['userDescription'],
    },
    handler: async (input, context) => {
      const types = ['propietario', 'gestor', 'inquilino', 'agente', 'inversor'];
      const detectedType = types[Math.floor(Math.random() * types.length)];
      return {
        detectedType,
        confidence: 0.85,
        suggestedVerticals: ['propiedades', 'contratos', 'pagos'],
      };
    },
  },
  {
    name: 'personalize_setup',
    description: 'Obtiene pasos de configuración personalizados según tipo de usuario y vertical',
    inputSchema: {
      type: 'object',
      properties: {
        userType: {
          type: 'string',
          description: 'Tipo de usuario',
        },
        vertical: {
          type: 'string',
          description: 'Vertical o área de interés',
        },
      },
      required: ['userType', 'vertical'],
    },
    handler: async (input, context) => {
      return {
        steps: [
          'Completar perfil de empresa',
          'Añadir primera propiedad',
          'Configurar método de pago',
          'Invitar equipo (opcional)',
        ],
        estimatedTime: '15-20 minutos',
        priority: ['perfil', 'propiedad', 'pago'],
      };
    },
  },
  {
    name: 'suggest_modules',
    description: 'Sugiere módulos relevantes según tipo de usuario e intereses',
    inputSchema: {
      type: 'object',
      properties: {
        userType: {
          type: 'string',
          description: 'Tipo de usuario',
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de intereses',
        },
      },
      required: ['userType', 'interests'],
    },
    handler: async (input, context) => {
      return {
        recommendedModules: ['Propiedades', 'Contratos', 'Pagos', 'CRM', 'Mantenimiento'],
        reasons: [
          'Gestión centralizada de tu cartera',
          'Automatización de documentos',
          'Seguimiento de cobros',
          'Pipeline de leads',
          'Incidencias y reparaciones',
        ],
      };
    },
  },
  {
    name: 'check_progress',
    description: 'Verifica el progreso de onboarding del usuario',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (opcional, usa contexto si no se proporciona)',
        },
      },
    },
    handler: async (input, context) => {
      return {
        completedSteps: ['Registro', 'Verificación email'],
        pendingSteps: ['Completar perfil', 'Añadir propiedad', 'Configurar pago'],
        percentage: 40,
      };
    },
  },
  {
    name: 'activate_features',
    description: 'Sugiere funcionalidades a activar según módulos actuales',
    inputSchema: {
      type: 'object',
      properties: {
        currentModules: {
          type: 'array',
          items: { type: 'string' },
          description: 'Módulos actualmente activos',
        },
      },
      required: ['currentModules'],
    },
    handler: async (input, context) => {
      const current = input.currentModules || [];
      const suggestions = current.includes('Propiedades')
        ? ['Firma digital', 'Tours virtuales']
        : ['Módulo Propiedades', 'Gestión de contratos'];
      return {
        suggestions,
        benefits: [
          'Acelera el cierre de operaciones',
          'Mejora la experiencia del inquilino',
          'Reduce tiempo administrativo',
        ],
      };
    },
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const onboardingGuideConfig: AgentConfig = {
  type: 'onboarding_guide',
  name: 'Agente de Onboarding Inteligente',
  description: 'Asistente experto en onboarding de la plataforma INMOVA',
  systemPrompt: `Eres el Agente de Onboarding Inteligente de INMOVA PropTech.

Especializado en:
- Ayudar a usuarios a descubrir funcionalidades
- Configurar su cuenta de forma personalizada
- Guiar los primeros pasos en la plataforma
- Sugerir módulos y features según perfil
- Verificar progreso de onboarding

Sé amable, paciente y orientado a la acción. Adapta las recomendaciones al tipo de usuario.
Responde siempre en español.`,
  capabilities,
  tools,
  model: CLAUDE_MODEL_FAST,
  temperature: 0.5,
  maxTokens: 4096,
  enabled: true,
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class OnboardingGuideAgent extends BaseAgent {
  constructor() {
    super(onboardingGuideConfig);
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
      'onboarding',
      'configurar',
      'empezar',
      'primeros pasos',
      'módulos',
      'activar',
      'setup',
      'configuración',
      'inicio',
      'ayuda inicial',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
