/**
 * Claude AI Service - Anthropic
 * 
 * Funcionalidades de IA para Inmova:
 * - Valoración automática de propiedades
 * - Chatbot inteligente para inquilinos/propietarios
 * - Generación de descripciones de propiedades
 * - Análisis de documentos (contratos, extractos)
 * - Clasificación automática de incidencias
 * 
 * @module lib/claude-ai-service
 */

import Anthropic from '@anthropic-ai/sdk';

// Configuración global de Claude (Inmova paga)
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

import { CLAUDE_MODEL_FAST, CLAUDE_DEFAULT_MAX_TOKENS } from './ai-model-config';

const DEFAULT_MODEL = CLAUDE_MODEL_FAST;
const DEFAULT_MAX_TOKENS = CLAUDE_DEFAULT_MAX_TOKENS;

/**
 * Datos de una propiedad para valoración
 */
export interface PropertyData {
  address: string;
  city: string;
  postalCode?: string;
  squareMeters: number;
  rooms: number;
  bathrooms: number;
  floor?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  condition?: 'NEW' | 'GOOD' | 'NEEDS_RENOVATION';
  yearBuilt?: number;
  neighborhood?: string;
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
}

/**
 * Opciones de chat
 */
export interface ChatOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Valora una propiedad usando IA
 * 
 * @param property - Datos de la propiedad
 * @returns Valoración estimada
 */
export async function valuateProperty(property: PropertyData): Promise<PropertyValuation> {
  if (!isClaudeConfigured()) {
    throw new Error('Claude AI no está configurado. Configure ANTHROPIC_API_KEY en .env');
  }

  const prompt = `Eres un tasador inmobiliario certificado con 20 años de experiencia en España.

Tu tarea: Valorar esta propiedad con precisión.

PROPIEDAD:
- Ubicación: ${property.address}, ${property.city}${property.postalCode ? ` (${property.postalCode})` : ''}
- Superficie: ${property.squareMeters}m²
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
${property.floor !== undefined ? `- Planta: ${property.floor}` : ''}
${property.hasElevator ? '- Tiene ascensor' : ''}
${property.hasParking ? '- Plaza de parking' : ''}
${property.hasGarden ? '- Jardín' : ''}
${property.hasPool ? '- Piscina' : ''}
${property.condition ? `- Estado: ${property.condition}` : ''}
${property.yearBuilt ? `- Año construcción: ${property.yearBuilt}` : ''}
${property.neighborhood ? `- Barrio: ${property.neighborhood}` : ''}

Proporciona una valoración en formato JSON:
{
  "estimatedValue": number,
  "minValue": number,
  "maxValue": number,
  "confidenceScore": number (0-100),
  "reasoning": "string explicando la valoración",
  "keyFactors": ["factor1", "factor2", "factor3"]
}

Sé preciso y justifica tu valoración basándote en:
1. Ubicación y barrio
2. Características de la propiedad
3. Estado y antigüedad
4. Comparables en la zona (si conoces)`;

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    // Extraer JSON del texto
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }

  throw new Error('No se pudo parsear la respuesta de Claude');
}

/**
 * Chat simple con Claude
 * 
 * @param message - Mensaje del usuario
 * @param options - Opciones de chat
 * @returns Respuesta de Claude
 */
export async function chat(
  message: string,
  options: ChatOptions = {}
): Promise<string> {
  if (!isClaudeConfigured()) {
    throw new Error('Claude AI no está configurado. Configure ANTHROPIC_API_KEY en .env');
  }

  const systemPrompt =
    options.systemPrompt ||
    'Eres un asistente experto en gestión inmobiliaria. Ayudas a propietarios e inquilinos con sus dudas.';

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
    temperature: options.temperature || 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('No se pudo obtener respuesta de Claude');
}

/**
 * Genera una descripción atractiva para una propiedad
 * 
 * @param property - Datos de la propiedad
 * @returns Descripción generada
 */
export async function generatePropertyDescription(property: PropertyData): Promise<string> {
  if (!isClaudeConfigured()) {
    throw new Error('Claude AI no está configurado. Configure ANTHROPIC_API_KEY en .env');
  }

  const prompt = `Genera una descripción atractiva y profesional para esta propiedad inmobiliaria:

PROPIEDAD:
- Ubicación: ${property.address}, ${property.city}
- Superficie: ${property.squareMeters}m²
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
${property.floor !== undefined ? `- Planta: ${property.floor}` : ''}
${property.hasElevator ? '- Ascensor' : ''}
${property.hasParking ? '- Parking' : ''}
${property.hasGarden ? '- Jardín' : ''}
${property.hasPool ? '- Piscina' : ''}
${property.condition ? `- Estado: ${property.condition}` : ''}

La descripción debe:
- Ser atractiva y profesional
- Resaltar los puntos fuertes
- Máximo 200 palabras
- Incluir características destacadas
- Ser persuasiva pero realista

Responde solo con la descripción, sin formato adicional.`;

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 500,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text.trim();
  }

  throw new Error('No se pudo generar la descripción');
}

/**
 * Chat con streaming (para respuestas en tiempo real)
 * 
 * @param messages - Array de mensajes del chat
 * @returns Stream de Anthropic
 */
export async function chatStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  if (!isClaudeConfigured()) {
    throw new Error('Claude AI no está configurado. Configure ANTHROPIC_API_KEY en .env');
  }

  return anthropic.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: DEFAULT_MAX_TOKENS,
    messages,
  });
}

/**
 * Verifica si Claude está configurado
 */
export function isClaudeConfigured(): boolean {
  return !!CLAUDE_API_KEY;
}
