import logger, { logError } from '@/lib/logger';
/**
 * Servicio de IA Mejorado
 * Integra capacidades avanzadas de LLM para asistencia contextual
 */


const ABACUS_AI_API_URL = 'https://api.abacus.ai/v1/chat/complete';
const API_KEY = process.env.ABACUSAI_API_KEY;

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Genera una respuesta de IA usando Abacus.AI
 */
export async function generateAICompletion(
  messages: AIMessage[],
  options: AICompletionOptions = {}
): Promise<string> {
  const {
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 1000,
    systemPrompt,
  } = options;

  try {
    // Agregar system prompt si se proporciona
    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch(ABACUS_AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`API respondió con status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    logError(error as Error, { message: 'Error generando completación de IA' });
    throw error;
  }
}

/**
 * Genera sugerencias proactivas basadas en contexto
 */
export async function generateProactiveSuggestions(
  context: {
    userRole: string;
    companyType: string;
    recentActivities: string[];
    currentPage: string;
  }
): Promise<string[]> {
  try {
    const systemPrompt = `Eres un asistente experto en gestión inmobiliaria. 
Analiza el contexto del usuario y genera 3-5 sugerencias proactivas y accionables 
para mejorar su productividad. Responde SOLO con un array JSON de strings, sin explicaciones adicionales.`;

    const userPrompt = `Contexto:
- Rol: ${context.userRole}
- Tipo de empresa: ${context.companyType}
- Página actual: ${context.currentPage}
- Actividades recientes: ${context.recentActivities.join(', ')}

Genera sugerencias relevantes.`;

    const response = await generateAICompletion(
      [{ role: 'user', content: userPrompt }],
      { systemPrompt, temperature: 0.8, maxTokens: 500 }
    );

    // Parsear el JSON de la respuesta
    const suggestions = JSON.parse(response);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    logError(error as Error, { message: 'Error generando sugerencias proactivas' });
    return [];
  }
}

/**
 * Analiza un documento y extrae información clave
 */
export async function analyzeDocument(
  documentText: string,
  documentType: string
): Promise<Record<string, any>> {
  try {
    const systemPrompt = `Eres un experto en análisis de documentos inmobiliarios.
Analiza el documento y extrae información estructurada en formato JSON.`;

    const userPrompt = `Tipo de documento: ${documentType}

Texto del documento:
${documentText}

Extrae:
- Fechas importantes
- Montos y valores
- Partes involucradas
- Condiciones clave
- Cualquier otra información relevante

Responde SOLO con JSON válido.`;

    const response = await generateAICompletion(
      [{ role: 'user', content: userPrompt }],
      { systemPrompt, temperature: 0.3, maxTokens: 1500 }
    );

    return JSON.parse(response);
  } catch (error) {
    logError(error as Error, { message: 'Error analizando documento' });
    return {};
  }
}

/**
 * Genera respuestas contextuales para el chatbot de soporte
 */
export async function generateChatbotResponse(
  conversationHistory: AIMessage[],
  userQuery: string,
  context: {
    userRole: string;
    companyName: string;
    currentModule?: string;
  }
): Promise<string> {
  try {
    const systemPrompt = `Eres un asistente virtual experto en INMOVA, una plataforma de gestión inmobiliaria.

Información del usuario:
- Rol: ${context.userRole}
- Empresa: ${context.companyName}
${context.currentModule ? `- Módulo actual: ${context.currentModule}` : ''}

Tu objetivo es:
1. Proporcionar respuestas claras y precisas
2. Ofrecer ejemplos prácticos cuando sea útil
3. Sugerir mejores prácticas
4. Ser amigable y profesional
5. Si no estás seguro, sé honesto al respecto

Responde en español de manera concisa pero completa.`;

    const messages: AIMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userQuery },
    ];

    return await generateAICompletion(messages, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 800,
    });
  } catch (error) {
    logError(error as Error, { message: 'Error generando respuesta del chatbot' });
    return 'Disculpa, estoy teniendo problemas para procesar tu consulta. Por favor, inténtalo de nuevo.';
  }
}

/**
 * Genera descripciones optimizadas para listings de STR
 */
export async function generateSTRDescription(
  propertyDetails: {
    tipo: string;
    ubicacion: string;
    habitaciones: number;
    baños: number;
    superficie: number;
    amenidades: string[];
    cercaDe: string[];
  }
): Promise<{
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  highlights: string[];
}> {
  try {
    const systemPrompt = `Eres un experto en marketing inmobiliario y copywriting para plataformas de alquiler vacacional (Airbnb, Booking, etc.).
Genera descripciones atractivas y optimizadas para SEO.`;

    const userPrompt = `Crea descripciones para esta propiedad:

Detalles:
- Tipo: ${propertyDetails.tipo}
- Ubicación: ${propertyDetails.ubicacion}
- Habitaciones: ${propertyDetails.habitaciones}
- Baños: ${propertyDetails.baños}
- Superficie: ${propertyDetails.superficie}m²
- Amenidades: ${propertyDetails.amenidades.join(', ')}
- Cerca de: ${propertyDetails.cercaDe.join(', ')}

Genera un JSON con:
- titulo (máx 50 caracteres, atractivo)
- descripcionCorta (máx 150 caracteres, para vista previa)
- descripcionLarga (3-4 párrafos, detallada y persuasiva)
- highlights (array de 5-7 puntos clave)`;

    const response = await generateAICompletion(
      [{ role: 'user', content: userPrompt }],
      { systemPrompt, temperature: 0.8, maxTokens: 1200 }
    );

    return JSON.parse(response);
  } catch (error) {
    logError(error as Error, { message: 'Error generando descripción STR' });
    return {
      titulo: 'Propiedad excepcional',
      descripcionCorta: 'Hermosa propiedad con excelentes comodidades',
      descripcionLarga: 'Descripción no disponible.',
      highlights: [],
    };
  }
}

/**
 * Predice tendencias de ocupación para STR
 */
export async function predictOccupancyTrends(
  historicalData: {
    mes: string;
    ocupacion: number;
    ingresos: number;
  }[]
): Promise<{
  predicciones: { mes: string; ocupacionEstimada: number; confianza: number }[];
  recomendaciones: string[];
}> {
  try {
    const systemPrompt = `Eres un analista de datos especializado en alquileres vacacionales.
Analiza datos históricos y genera predicciones con recomendaciones accionables.`;

    const userPrompt = `Datos históricos de ocupación:
${JSON.stringify(historicalData, null, 2)}

Genera:
1. Predicciones para los próximos 3 meses
2. Recomendaciones estratégicas basadas en los patrones observados

Responde en formato JSON con:
- predicciones: array con {mes, ocupacionEstimada, confianza}
- recomendaciones: array de strings con sugerencias accionables`;

    const response = await generateAICompletion(
      [{ role: 'user', content: userPrompt }],
      { systemPrompt, temperature: 0.5, maxTokens: 1000 }
    );

    return JSON.parse(response);
  } catch (error) {
    logError(error as Error, { message: 'Error prediciendo tendencias de ocupación' });
    return {
      predicciones: [],
      recomendaciones: [],
    };
  }
}

/**
 * Genera contenido para redes sociales
 */
export async function generateSocialMediaContent(
  propertyInfo: {
    nombre: string;
    tipo: string;
    destacados: string[];
    imagenUrl?: string;
  },
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
): Promise<{
  texto: string;
  hashtags: string[];
  callToAction: string;
}> {
  try {
    const platformGuidelines = {
      instagram: 'Enfoque visual, emojis, 10-15 hashtags relevantes, máx 2200 caracteres',
      facebook: 'Conversacional, 3-5 hashtags, enlaces permitidos, máx 500 caracteres',
      twitter: 'Conciso, impactante, 1-3 hashtags, máx 280 caracteres',
      linkedin: 'Profesional, educativo, 3-5 hashtags, máx 700 caracteres',
    };

    const systemPrompt = `Eres un experto en marketing digital y redes sociales para el sector inmobiliario.
Crea contenido atractivo y optimizado para cada plataforma.`;

    const userPrompt = `Propiedad:
- Nombre: ${propertyInfo.nombre}
- Tipo: ${propertyInfo.tipo}
- Destacados: ${propertyInfo.destacados.join(', ')}

Plataforma: ${platform}
Guías: ${platformGuidelines[platform]}

Genera un JSON con:
- texto: contenido optimizado para la plataforma
- hashtags: array de hashtags relevantes
- callToAction: llamada a la acción persuasiva`;

    const response = await generateAICompletion(
      [{ role: 'user', content: userPrompt }],
      { systemPrompt, temperature: 0.8, maxTokens: 600 }
    );

    return JSON.parse(response);
  } catch (error) {
    logError(error as Error, { message: 'Error generando contenido para redes sociales' });
    return {
      texto: 'Descubre esta increíble propiedad',
      hashtags: ['#inmobiliaria', '#propiedades'],
      callToAction: '¡Contáctanos hoy!',
    };
  }
}
