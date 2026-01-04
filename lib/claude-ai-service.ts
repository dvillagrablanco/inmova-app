/**
 * Claude AI Service - Inteligencia Artificial con Anthropic Claude
 * 
 * Claude 3.5 Sonnet es un modelo de IA de última generación que ofrece:
 * - Razonamiento avanzado
 * - Análisis de datos complejos
 * - Generación de texto natural
 * - Context window de 200K tokens
 * 
 * Features implementadas:
 * 1. Valoración automática de propiedades
 * 2. Chatbot inteligente 24/7
 * 3. Generación de descripciones atractivas
 * 4. Matching inquilino-propiedad
 * 5. Análisis de mercado
 * 
 * @module lib/claude-ai-service
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * MODELO DE INTEGRACIÓN POR CLIENTE
 * 
 * Cada empresa (Company) puede tener su propia API key de Anthropic Claude.
 * Inmova puede ofrecer:
 * 1. API key compartida (de Inmova) - Para clientes pequeños, se les cobra el costo
 * 2. BYOK (Bring Your Own Key) - Para clientes enterprise que quieren su propia cuenta
 * 
 * Las credenciales se almacenan en la tabla Company:
 * - anthropicApiKey: API key del cliente (encriptada) o null (usa el de Inmova)
 */

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'; // Último modelo

/**
 * Configuración de Claude por empresa
 */
export interface ClaudeConfig {
  apiKey: string;
}

/**
 * Obtiene el cliente Claude con la configuración proporcionada
 */
function getClaudeClient(config: ClaudeConfig): Anthropic {
  return new Anthropic({
    apiKey: config.apiKey,
  });
}

// Configuración por defecto de Inmova (para clientes sin su propia API key)
const DEFAULT_CLAUDE_CONFIG: ClaudeConfig | null = process.env.ANTHROPIC_API_KEY
  ? {
      apiKey: process.env.ANTHROPIC_API_KEY,
    }
  : null;

/**
 * Datos de propiedad para valoración
 */
export interface PropertyData {
  address: string;
  postalCode: string;
  city: string;
  province?: string;
  neighborhood?: string;
  squareMeters: number;
  rooms: number;
  bathrooms: number;
  floor?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  condition?: 'NEW' | 'GOOD' | 'NEEDS_RENOVATION';
  yearBuilt?: number;
  // Datos del mercado (opcionales)
  avgPricePerM2?: number;
  marketTrend?: 'UP' | 'DOWN' | 'STABLE';
  comparables?: Array<{
    address: string;
    price: number;
    squareMeters: number;
  }>;
}

/**
 * Resultado de valoración
 */
export interface PropertyValuation {
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  confidenceScore: number; // 0-100
  reasoning: string;
  keyFactors: string[];
  recommendations: string[];
}

/**
 * Opciones de chat
 */
export interface ChatOptions {
  /** Historial de conversación */
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** Contexto adicional (ej: datos del usuario) */
  context?: string;
  /** Temperatura (0-1, default 0.7) */
  temperature?: number;
}

/**
 * Mensaje de chat
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 1. VALORACIÓN AUTOMÁTICA DE PROPIEDADES
 * 
 * Usa IA para estimar el valor de una propiedad basándose en:
 * - Características físicas
 * - Ubicación
 * - Datos del mercado
 * - Propiedades comparables
 * 
 * @param config - Configuración de Claude (de la empresa o default de Inmova)
 * @param property - Datos de la propiedad
 * @returns Valoración estimada
 * 
 * @example
 * const valuation = await valuateProperty(claudeConfig, {
 *   address: 'Calle Mayor 123',
 *   city: 'Madrid',
 *   squareMeters: 80,
 *   rooms: 3,
 *   bathrooms: 2,
 *   avgPricePerM2: 3500,
 * });
 * 
 * console.log(`Valor estimado: ${valuation.estimatedValue}€`);
 */
export async function valuateProperty(
  config: ClaudeConfig,
  property: PropertyData
): Promise<PropertyValuation> {
  try {
    const client = getClaudeClient(config);

    // Construir prompt detallado
    const prompt = `Actúa como un tasador inmobiliario certificado con 20 años de experiencia en España.

Tu tarea es valorar esta propiedad con precisión y proporcionar un análisis detallado.

DATOS DE LA PROPIEDAD:
- Ubicación: ${property.address}, ${property.city} ${property.postalCode ? `(CP: ${property.postalCode})` : ''}
${property.neighborhood ? `- Barrio: ${property.neighborhood}` : ''}
${property.province ? `- Provincia: ${property.province}` : ''}
- Superficie: ${property.squareMeters} m²
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
${property.floor !== undefined ? `- Planta: ${property.floor}` : ''}
${property.hasElevator ? '- Con ascensor' : ''}
${property.hasParking ? '- Con plaza de garaje' : ''}
${property.hasGarden ? '- Con jardín' : ''}
${property.hasPool ? '- Con piscina' : ''}
${property.hasTerrace ? '- Con terraza' : ''}
${property.condition ? `- Estado: ${property.condition}` : ''}
${property.yearBuilt ? `- Año construcción: ${property.yearBuilt}` : ''}

${
  property.avgPricePerM2
    ? `DATOS DEL MERCADO:
- Precio medio por m² en la zona: ${property.avgPricePerM2}€
${property.marketTrend ? `- Tendencia del mercado: ${property.marketTrend}` : ''}`
    : ''
}

${
  property.comparables && property.comparables.length > 0
    ? `PROPIEDADES COMPARABLES:
${property.comparables
  .map(
    (c) =>
      `- ${c.address}: ${c.price}€ (${c.squareMeters} m², ${(c.price / c.squareMeters).toFixed(0)}€/m²)`
  )
  .join('\n')}`
    : ''
}

INSTRUCCIONES:
1. Analiza todos los datos proporcionados
2. Considera factores como ubicación, características, estado, mercado
3. Proporciona una valoración realista y justificada
4. Calcula un rango (mín-máx) considerando variabilidad del mercado
5. Incluye nivel de confianza (0-100%) basado en datos disponibles
6. Identifica 3-5 factores clave que afectan el precio
7. Proporciona 2-3 recomendaciones para mejorar el valor

Responde SOLO con un objeto JSON válido con esta estructura:
{
  "estimatedValue": number,
  "minValue": number,
  "maxValue": number,
  "confidenceScore": number,
  "reasoning": "string explicando la valoración en 2-3 frases",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "recommendations": ["recomendación1", "recomendación2"]
}`;

    // Request a Claude
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      temperature: 0.3, // Baja temperatura para respuestas más consistentes
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parsear respuesta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extraer JSON de la respuesta
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const valuation: PropertyValuation = JSON.parse(jsonMatch[0]);

    return valuation;
  } catch (error: any) {
    console.error('[Claude AI] Valuation error:', error);
    throw new Error(`Error en valoración: ${error.message}`);
  }
}

/**
 * 2. CHATBOT INTELIGENTE 24/7
 * 
 * Chatbot especializado en PropTech que responde preguntas sobre:
 * - Plataforma Inmova
 * - Gestión de propiedades
 * - Alquileres
 * - Procesos legales
 * - Preguntas técnicas
 * 
 * @param config - Configuración de Claude
 * @param userMessage - Mensaje del usuario
 * @param options - Opciones adicionales
 * @returns Respuesta del chatbot
 * 
 * @example
 * const response = await chat(claudeConfig, '¿Cómo creo un contrato de alquiler?');
 * console.log(response);
 */
export async function chat(
  config: ClaudeConfig,
  userMessage: string,
  options: ChatOptions = {}
): Promise<string> {
  try {
    const client = getClaudeClient(config);

    const systemPrompt = `Eres un asistente virtual experto de Inmova, una plataforma PropTech para gestión inmobiliaria.

TU ROL:
- Ayudar a usuarios con preguntas sobre la plataforma
- Proporcionar información sobre gestión de propiedades, contratos, inquilinos
- Resolver dudas técnicas de forma clara y concisa
- Ser amable, profesional y eficiente

CONOCIMIENTOS:
- Gestión de propiedades (alquiler tradicional, coliving, vacacional)
- Contratos de arrendamiento en España
- Firma digital eIDAS
- Pagos online y gestión financiera
- Matching inquilino-propiedad
- Valoración de propiedades
- Tours virtuales
- Legislación básica de alquileres en España

ESTILO:
- Respuestas concisas (2-4 frases)
- Usa emojis ocasionalmente para ser más amigable
- Si no sabes algo, admítelo y sugiere contactar soporte
- Proporciona ejemplos prácticos cuando sea útil
- Si la pregunta es compleja, ofrece crear un ticket de soporte

${options.context ? `\nCONTEXTO ADICIONAL:\n${options.context}` : ''}`;

    // Construir mensajes con historial
    const messages: ChatMessage[] = [
      ...(options.conversationHistory || []),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Request a Claude
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: options.temperature || 0.7,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Extraer respuesta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
  } catch (error: any) {
    console.error('[Claude AI] Chat error:', error);
    throw new Error(`Error en chatbot: ${error.message}`);
  }
}

/**
 * 3. GENERACIÓN DE DESCRIPCIONES ATRACTIVAS
 * 
 * Genera descripciones profesionales y atractivas para propiedades
 * que maximizan el engagement y conversión
 * 
 * @param config - Configuración de Claude
 * @param property - Datos de la propiedad
 * @param style - Estilo de descripción ('professional', 'casual', 'luxury')
 * @returns Descripción generada
 * 
 * @example
 * const description = await generatePropertyDescription(claudeConfig, {
 *   address: 'Calle Mayor 123',
 *   city: 'Madrid',
 *   squareMeters: 80,
 *   rooms: 3,
 *   bathrooms: 2,
 * }, 'professional');
 */
export async function generatePropertyDescription(
  config: ClaudeConfig,
  property: Partial<PropertyData>,
  style: 'professional' | 'casual' | 'luxury' = 'professional'
): Promise<string> {
  try {
    const client = getClaudeClient(config);

    const styleGuides = {
      professional:
        'Profesional y objetivo, destacando características y beneficios',
      casual: 'Amigable y cercano, como si hablaras con un amigo',
      luxury: 'Elegante y sofisticado, enfatizando exclusividad y calidad',
    };

    const prompt = `Genera una descripción atractiva para una propiedad inmobiliaria.

DATOS DE LA PROPIEDAD:
${property.address ? `- Ubicación: ${property.address}, ${property.city}` : `- Ciudad: ${property.city}`}
${property.neighborhood ? `- Barrio: ${property.neighborhood}` : ''}
- Superficie: ${property.squareMeters} m²
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
${property.floor !== undefined ? `- Planta: ${property.floor}` : ''}
${property.hasElevator ? '- Con ascensor' : ''}
${property.hasParking ? '- Con plaza de garaje' : ''}
${property.hasGarden ? '- Con jardín' : ''}
${property.hasPool ? '- Con piscina' : ''}
${property.hasTerrace ? '- Con terraza' : ''}
${property.condition ? `- Estado: ${property.condition}` : ''}

ESTILO: ${style} - ${styleGuides[style]}

INSTRUCCIONES:
- Máximo 150 palabras
- Enfócate en beneficios, no solo características
- Crea una narrativa que genere emoción
- Usa lenguaje descriptivo y evocador
- Incluye llamada a la acción sutil al final
- NO uses emojis
- NO inventes datos que no están proporcionados

Genera SOLO la descripción, sin títulos ni metadata.`;

    // Request a Claude
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      temperature: 0.8, // Mayor creatividad para descripciones
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extraer respuesta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text.trim();
  } catch (error: any) {
    console.error('[Claude AI] Description generation error:', error);
    throw new Error(`Error generando descripción: ${error.message}`);
  }
}

/**
 * 4. STREAMING CHAT
 * 
 * Chat con respuestas en streaming (en tiempo real)
 * Para mejor UX en interfaces de chat
 * 
 * @param config - Configuración de Claude
 * @param userMessage - Mensaje del usuario
 * @param onChunk - Callback para cada chunk de respuesta
 * @param options - Opciones adicionales
 */
export async function chatStream(
  config: ClaudeConfig,
  userMessage: string,
  onChunk: (text: string) => void,
  options: ChatOptions = {}
): Promise<void> {
  try {
    const client = getClaudeClient(config);

    const systemPrompt = `Eres un asistente virtual experto de Inmova, una plataforma PropTech para gestión inmobiliaria.

Ayuda a usuarios con preguntas sobre la plataforma, gestión de propiedades, contratos, etc.
Sé conciso, amigable y profesional.`;

    const messages: ChatMessage[] = [
      ...(options.conversationHistory || []),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Request con streaming
    const stream = await client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: options.temperature || 0.7,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Procesar chunks
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text);
      }
    }
  } catch (error: any) {
    console.error('[Claude AI] Streaming chat error:', error);
    throw new Error(`Error en chat streaming: ${error.message}`);
  }
}

/**
 * Verifica si una empresa tiene Claude AI configurado
 */
export function isClaudeConfigured(config?: ClaudeConfig | null): boolean {
  if (config) {
    return !!config.apiKey;
  }
  return !!DEFAULT_CLAUDE_CONFIG;
}

/**
 * Obtiene la configuración de Claude (de la empresa o default de Inmova)
 */
export function getClaudeConfig(companyConfig?: {
  anthropicApiKey?: string | null;
}): ClaudeConfig | null {
  // Si la empresa tiene su propia configuración, usarla
  if (companyConfig?.anthropicApiKey) {
    return {
      apiKey: companyConfig.anthropicApiKey,
    };
  }

  // Sino, usar la configuración default de Inmova
  return DEFAULT_CLAUDE_CONFIG;
}

/**
 * Servicio de Claude AI exportado
 */
export const ClaudeAIService = {
  valuateProperty,
  chat,
  chatStream,
  generatePropertyDescription,
  isConfigured: isClaudeConfigured,
  getConfig: getClaudeConfig,
};
