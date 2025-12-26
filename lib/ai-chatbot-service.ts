/**
 * AI Chatbot Service
 * Servicio de chatbot inteligente con GPT-4
 */

import { logger } from './logger';

// Configuración de OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4-turbo-preview';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Sistema prompt para el chatbot de INMOVA
const SYSTEM_PROMPT = `Eres un asistente virtual experto en gestión inmobiliaria de INMOVA, una plataforma completa para la gestión de propiedades.

CONTEXTO DE INMOVA:
- Plataforma multi-vertical: Alquiler tradicional, STR/Airbnb, Coliving, Flipping, Construcción
- 88 módulos profesionales
- Gestión de edificios, unidades, inquilinos, contratos, pagos, mantenimiento
- Portales para propietarios, inquilinos y proveedores
- Integraciones: Stripe, AWS S3, contabilidad (A3, Contasimple, Sage), Open Banking

TU ROL:
1. Ayudar a los usuarios con preguntas sobre cómo usar INMOVA
2. Resolver dudas sobre funcionalidades
3. Guiar en la creación de edificios, unidades, contratos y pagos
4. Explicar conceptos de gestión inmobiliaria
5. Dar consejos sobre mejores prácticas

DIRECTRICES:
- Sé conciso y claro
- Usa ejemplos prácticos
- Si no sabes algo, admítelo y sugiere contactar con soporte
- Mantén un tono profesional pero amigable
- Responde en español
- No inventes funcionalidades que no existen

INFORMACIÓN CLAVE:
- Edificio: Contenedor de unidades (ej: edificio de apartamentos)
- Unidad: Espacio individual (ej: apartamento 1A, local comercial)
- Contrato: Vincula inquilino + unidad + condiciones
- Pago: Registro de pago de renta por parte del inquilino

¿En qué puedo ayudarte hoy?`;

/**
 * Genera una respuesta del chatbot usando GPT-4
 */
export async function generateChatbotResponse(
  messages: ChatMessage[],
  context?: {
    userId?: string;
    companyId?: string;
    userName?: string;
  }
): Promise<{
  response: string;
  tokensUsed: number;
  conversationId: string;
}> {
  try {
    if (!OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured');
      return {
        response:
          'Lo siento, el chatbot de IA no está configurado actualmente. Por favor, contacta con soporte técnico.',
        tokensUsed: 0,
        conversationId: 'fallback',
      };
    }

    // Agregar contexto del usuario si está disponible
    let systemPrompt = SYSTEM_PROMPT;
    if (context?.userName) {
      systemPrompt += `\n\nEl usuario se llama ${context.userName}.`;
    }

    // Construir mensajes para GPT-4
    const chatMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...messages];

    // Llamar a OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data: ChatCompletionResponse = await response.json();

    const assistantMessage =
      data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
    const tokensUsed = data.usage?.total_tokens || 0;

    logger.info('Chatbot response generated', {
      conversationId: data.id,
      tokensUsed,
      userId: context?.userId,
      companyId: context?.companyId,
    });

    return {
      response: assistantMessage,
      tokensUsed,
      conversationId: data.id,
    };
  } catch (error) {
    logger.error('Error generating chatbot response', {
      error: error instanceof Error ? error.message : String(error),
      context,
    });

    // Fallback a respuestas predefinidas
    return {
      response:
        'Lo siento, ha ocurrido un error al procesar tu pregunta. Por favor, intenta de nuevo o contacta con soporte.',
      tokensUsed: 0,
      conversationId: 'error',
    };
  }
}

/**
 * Respuestas predefinidas para preguntas comunes (fallback)
 */
const FAQ_RESPONSES: Record<string, string> = {
  'crear edificio':
    'Para crear un edificio: 1) Ve a "Edificios" en el menú, 2) Haz clic en "Nuevo edificio", 3) Completa los datos básicos (nombre, dirección, ciudad). ¡Listo!',
  'agregar unidad':
    'Para agregar una unidad: 1) Selecciona un edificio, 2) Ve a la pestaña "Unidades", 3) Haz clic en "Nueva unidad", 4) Define el tipo, superficie y características.',
  'crear contrato':
    'Para crear un contrato: 1) Asegúrate de tener un inquilino y unidad registrados, 2) Ve a "Contratos", 3) Haz clic en "Nuevo contrato", 4) Selecciona inquilino, unidad y define las condiciones (renta, fechas, depósito).',
  'registrar pago':
    'Para registrar un pago: 1) Ve a "Pagos", 2) Haz clic en "Nuevo pago", 3) Selecciona el contrato, monto, fecha y método de pago. Opcionalmente, adjunta un comprobante.',
  'reset password':
    'Para resetear tu contraseña: 1) Haz clic en "¿Olvidaste tu contraseña?" en el login, 2) Ingresa tu email, 3) Recibirás un link para crear una nueva contraseña.',
};

/**
 * Busca respuesta en FAQ (más rápido que GPT-4)
 */
export function searchFAQ(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim();

  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (normalizedQuery.includes(keyword)) {
      return response;
    }
  }

  return null;
}

/**
 * Genera sugerencias de preguntas
 */
export function getSuggestedQuestions(context?: {
  hasBuildings?: boolean;
  hasContracts?: boolean;
  hasPayments?: boolean;
}): string[] {
  const suggestions = [
    '¿Cómo creo mi primer edificio?',
    '¿Qué es una unidad?',
    '¿Cómo registro un pago?',
    '¿Puedo exportar datos a Excel?',
  ];

  if (!context?.hasBuildings) {
    suggestions.unshift('¿Cómo empiezo a usar INMOVA?');
  }

  if (context?.hasContracts) {
    suggestions.push('¿Cómo renuevo un contrato?');
  }

  return suggestions.slice(0, 4);
}

/**
 * Analiza el sentimiento del mensaje del usuario
 */
export function analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
  const lowerMessage = message.toLowerCase();

  const positiveKeywords = ['gracias', 'excelente', 'perfecto', 'genial', 'bien', 'bueno'];
  const negativeKeywords = ['error', 'problema', 'no funciona', 'mal', 'ayuda urgente', 'fallo'];

  const hasPositive = positiveKeywords.some((keyword) => lowerMessage.includes(keyword));
  const hasNegative = negativeKeywords.some((keyword) => lowerMessage.includes(keyword));

  if (hasNegative) return 'negative';
  if (hasPositive) return 'positive';
  return 'neutral';
}

/**
 * Determina si debe escalar a soporte humano
 */
export function shouldEscalateToSupport(
  message: string,
  sentiment: 'positive' | 'neutral' | 'negative',
  attemptsCount: number
): boolean {
  // Escalar si:
  // 1. Sentimiento negativo y más de 2 intentos
  // 2. Usuario pide explícitamente hablar con humano
  // 3. Más de 5 mensajes sin resolución

  const lowerMessage = message.toLowerCase();
  const requestsHuman = ['hablar con persona', 'soporte humano', 'agente real'].some((keyword) =>
    lowerMessage.includes(keyword)
  );

  return requestsHuman || (sentiment === 'negative' && attemptsCount > 2) || attemptsCount > 5;
}

/**
 * Formatea la respuesta del chatbot con markdown
 */
export function formatChatbotResponse(response: string): string {
  // Agregar formato markdown si no lo tiene
  let formatted = response;

  // Convertir listas numeradas
  formatted = formatted.replace(/(\d+\))/g, '\n$1');

  // Agregar énfasis
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '**$1**');

  return formatted.trim();
}
