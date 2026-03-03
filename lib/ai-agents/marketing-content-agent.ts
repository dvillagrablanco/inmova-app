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
    id: 'listing_copy',
    name: 'Copy para Portales',
    description: 'Generación de textos para anuncios inmobiliarios',
    category: 'Contenido',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'social_media',
    name: 'Redes Sociales',
    description: 'Creación de posts para Instagram, Facebook, LinkedIn, Twitter',
    category: 'Marketing',
    estimatedTime: '2-4 minutos',
  },
  {
    id: 'seo_optimization',
    name: 'Optimización SEO',
    description: 'Optimización de títulos y descripciones para buscadores',
    category: 'SEO',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'translation',
    name: 'Traducción',
    description: 'Traducción de listados a otros idiomas',
    category: 'Internacionalización',
    estimatedTime: '1-2 minutos',
  },
  {
    id: 'ab_testing',
    name: 'A/B Testing',
    description: 'Variantes para tests A/B de descripciones',
    category: 'Optimización',
    estimatedTime: '2-3 minutos',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'generate_listing_copy',
    description: 'Genera copy optimizado para anuncios en portales inmobiliarios',
    inputSchema: {
      type: 'object',
      properties: {
        propertyType: {
          type: 'string',
          description: 'Tipo de propiedad',
        },
        location: {
          type: 'string',
          description: 'Ubicación',
        },
        rooms: {
          type: 'number',
          description: 'Número de habitaciones',
        },
        price: {
          type: 'number',
          description: 'Precio en euros',
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Características o features',
        },
      },
      required: ['propertyType', 'location', 'rooms', 'price', 'features'],
    },
    handler: async (input, context) => {
      return {
        title: `${input.propertyType} en ${input.location} - ${input.rooms} hab. ${input.price}€`,
        description: `Oportunidad única: ${input.propertyType} en ${input.location}. ${input.rooms} habitaciones. Características: ${(input.features || []).join(', ')}. Precio: ${input.price}€.`,
        highlights: [
          `Ubicación privilegiada en ${input.location}`,
          `${input.rooms} habitaciones`,
          ...(input.features || []).slice(0, 3),
        ],
      };
    },
  },
  {
    name: 'create_social_post',
    description: 'Crea un post para redes sociales según la plataforma',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['instagram', 'facebook', 'linkedin', 'twitter'],
          description: 'Plataforma destino',
        },
        propertyInfo: {
          type: 'string',
          description: 'Información de la propiedad',
        },
      },
      required: ['platform', 'propertyInfo'],
    },
    handler: async (input, context) => {
      const hashtags =
        input.platform === 'instagram'
          ? ['#inmobiliaria', '#propiedades', '#vivienda', '#alquiler']
          : input.platform === 'linkedin'
            ? ['#PropTech', '#RealEstate', '#InversiónInmobiliaria']
            : ['#inmobiliaria', '#propiedades'];
      return {
        text: `🏠 Nueva oportunidad: ${input.propertyInfo}\n\nDescubre más en nuestra plataforma.`,
        hashtags,
        callToAction:
          input.platform === 'instagram'
            ? 'Swipe up para más info'
            : input.platform === 'linkedin'
              ? 'Contacta para más detalles'
              : 'Consulta disponibilidad',
      };
    },
  },
  {
    name: 'optimize_seo',
    description: 'Optimiza título y descripción para SEO',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título actual',
        },
        description: {
          type: 'string',
          description: 'Descripción actual',
        },
        targetCity: {
          type: 'string',
          description: 'Ciudad objetivo para SEO',
        },
      },
      required: ['title', 'description', 'targetCity'],
    },
    handler: async (input, context) => {
      return {
        optimizedTitle: `${input.title} | ${input.targetCity} - Alquiler y venta`,
        optimizedDescription: `${input.description} Encuentra tu hogar ideal en ${input.targetCity}.`,
        keywords: [
          `alquiler ${input.targetCity}`,
          `pisos ${input.targetCity}`,
          `vivienda ${input.targetCity}`,
          'inmobiliaria',
        ],
      };
    },
  },
  {
    name: 'translate_listing',
    description: 'Traduce texto de listado a otro idioma',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Texto a traducir',
        },
        targetLanguage: {
          type: 'string',
          enum: ['en', 'fr', 'de', 'pt'],
          description: 'Idioma destino',
        },
      },
      required: ['text', 'targetLanguage'],
    },
    handler: async (input, context) => {
      const langNames = { en: 'English', fr: 'French', de: 'German', pt: 'Portuguese' };
      return {
        translatedText: `[${langNames[input.targetLanguage as keyof typeof langNames]}] ${input.text}`,
        language: input.targetLanguage,
      };
    },
  },
  {
    name: 'ab_test_description',
    description: 'Genera variantes A/B para test de descripciones',
    inputSchema: {
      type: 'object',
      properties: {
        originalDescription: {
          type: 'string',
          description: 'Descripción original',
        },
      },
      required: ['originalDescription'],
    },
    handler: async (input, context) => {
      return {
        variantA: `Descripción emocional: ${input.originalDescription.substring(0, 100)}... [Enfoque en beneficios y sensaciones]`,
        variantB: `Descripción factual: ${input.originalDescription.substring(0, 100)}... [Enfoque en datos y especificaciones]`,
        hypothesis:
          'VariantA puede mejorar engagement emocional; VariantB puede atraer búsquedas más específicas.',
      };
    },
  },
];

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const marketingContentConfig: AgentConfig = {
  type: 'marketing_content',
  name: 'Agente de Marketing y Contenido',
  description: 'Experto en copywriting inmobiliario, SEO y redes sociales',
  systemPrompt: `Eres el Agente de Marketing y Contenido de INMOVA. Experto en copywriting inmobiliario.

Especializado en:
- Copy para portales (Idealista, Fotocasa, etc.)
- Redes sociales (Instagram, Facebook, LinkedIn, Twitter)
- Optimización SEO para listados
- Traducción multilingüe
- A/B testing de descripciones

Genera contenido atractivo, profesional y optimizado para conversión. Adapta el tono a cada plataforma.
Responde siempre en español.`,
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

export class MarketingContentAgent extends BaseAgent {
  constructor() {
    super(marketingContentConfig);
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
      'marketing',
      'anuncio',
      'descripción',
      'redes sociales',
      'seo',
      'publicar',
      'traducir',
      'copy',
      'post',
      'instagram',
      'facebook',
      'linkedin',
    ];
    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
