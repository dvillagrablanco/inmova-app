/**
 * SERVICIO DE ANÁLISIS DE SENTIMIENTO
 *
 * Utiliza la API de LLM de Abacus.AI para analizar el sentimiento
 * de los mensajes de los usuarios en el chatbot de soporte.
 *
 * Características:
 * - Análisis de sentimiento (positivo, neutral, negativo)
 * - Detección de urgencia
 * - Identificación de emociones específicas
 * - Score de confianza
 * - Sugerencias de respuesta
 */

import logger, { logError } from './logger';

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 (muy negativo) a 1 (muy positivo)
  confidence: number; // 0-1
  urgency: 'low' | 'medium' | 'high' | 'critical';
  emotions: string[]; // ['frustration', 'confusion', 'satisfaction', etc.]
  keywords: string[]; // palabras clave detectadas
  suggestedTone: string; // tono sugerido para la respuesta
  reasoning: string; // explicación del análisis
}

export interface ConversationContext {
  previousMessages?: Array<{
    sender: 'user' | 'bot';
    text: string;
  }>;
  userProfile?: {
    isRecurringUser?: boolean;
    previousIssues?: string[];
  };
}

/**
 * Analiza el sentimiento de un mensaje usando LLM
 */
export async function analyzeSentiment(
  message: string,
  context?: ConversationContext
): Promise<SentimentAnalysis> {
  try {
    logger.info('Analizando sentimiento del mensaje', {
      messageLength: message.length,
      hasContext: !!context,
    });

    // Construir el prompt para el LLM
    const systemPrompt = `Eres un experto en análisis de sentimiento y emociones en conversaciones de soporte al cliente.
Tu tarea es analizar el mensaje del usuario y proporcionar un análisis detallado del sentimiento.

Responde SOLO con un objeto JSON con la siguiente estructura exacta:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": number entre -1 y 1,
  "confidence": number entre 0 y 1,
  "urgency": "low" | "medium" | "high" | "critical",
  "emotions": [array de emociones detectadas],
  "keywords": [array de palabras clave importantes],
  "suggestedTone": "descripción del tono sugerido para la respuesta",
  "reasoning": "breve explicación del análisis"
}

Emociones posibles: frustration, anger, confusion, satisfaction, happiness, anxiety, urgency, disappointment, curiosity, gratitude, etc.

Responde con JSON puro, sin bloques de código ni formateo adicional.`;

    let userPrompt = `Analiza el siguiente mensaje del usuario:

"${message}"`;

    // Añadir contexto si está disponible
    if (context?.previousMessages && context.previousMessages.length > 0) {
      userPrompt += `\n\nContexto de la conversación anterior:\n`;
      context.previousMessages.slice(-3).forEach((msg) => {
        userPrompt += `${msg.sender === 'user' ? 'Usuario' : 'Bot'}: ${msg.text}\n`;
      });
    }

    if (context?.userProfile?.previousIssues && context.userProfile.previousIssues.length > 0) {
      userPrompt += `\n\nProblemas previos del usuario: ${context.userProfile.previousIssues.join(', ')}`;
    }

    // Llamar a la API de LLM
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // baja temperatura para más consistencia
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API LLM error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta del LLM');
    }

    // Parsear la respuesta JSON
    const analysis: SentimentAnalysis = JSON.parse(content);

    // Validar y normalizar los datos
    validateAndNormalizeAnalysis(analysis);

    logger.info('Análisis de sentimiento completado', {
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      confidence: analysis.confidence,
    });

    return analysis;
  } catch (error) {
    logError(error as Error, { context: 'analyzeSentiment' });

    // Retornar análisis por defecto en caso de error
    logger.warn('Usando análisis de sentimiento por defecto debido a error');
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0.5,
      urgency: 'medium',
      emotions: [],
      keywords: extractSimpleKeywords(message),
      suggestedTone: 'profesional y empático',
      reasoning: 'Análisis automático no disponible. Usando valores por defecto.',
    };
  }
}

/**
 * Valida y normaliza el análisis de sentimiento
 */
function validateAndNormalizeAnalysis(analysis: SentimentAnalysis): void {
  // Validar sentiment
  if (!['positive', 'neutral', 'negative'].includes(analysis.sentiment)) {
    analysis.sentiment = 'neutral';
  }

  // Validar score
  if (typeof analysis.score !== 'number' || analysis.score < -1 || analysis.score > 1) {
    analysis.score = 0;
  }

  // Validar confidence
  if (
    typeof analysis.confidence !== 'number' ||
    analysis.confidence < 0 ||
    analysis.confidence > 1
  ) {
    analysis.confidence = 0.7;
  }

  // Validar urgency
  if (!['low', 'medium', 'high', 'critical'].includes(analysis.urgency)) {
    analysis.urgency = 'medium';
  }

  // Validar arrays
  if (!Array.isArray(analysis.emotions)) {
    analysis.emotions = [];
  }
  if (!Array.isArray(analysis.keywords)) {
    analysis.keywords = [];
  }

  // Asegurar que hay reasoning y suggestedTone
  if (!analysis.reasoning) {
    analysis.reasoning = 'Análisis completado';
  }
  if (!analysis.suggestedTone) {
    analysis.suggestedTone = 'profesional y empático';
  }
}

/**
 * Extrae palabras clave simples como fallback
 */
function extractSimpleKeywords(message: string): string[] {
  // Palabras comunes a ignorar
  const stopWords = new Set([
    'el',
    'la',
    'de',
    'que',
    'y',
    'a',
    'en',
    'un',
    'ser',
    'se',
    'no',
    'hay',
    'por',
    'con',
    'su',
    'para',
    'como',
    'está',
    'es',
    'me',
    'mi',
    'pero',
    'lo',
    'los',
    'las',
  ]);

  const words = message
    .toLowerCase()
    .replace(/[^\wáéíóúñ\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Contar frecuencia
  const frequency: { [key: string]: number } = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Obtener las 5 palabras más frecuentes
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0]);
}

/**
 * Analiza el sentimiento de múltiples mensajes en lote
 */
export async function analyzeBatchSentiment(
  messages: string[],
  context?: ConversationContext
): Promise<SentimentAnalysis[]> {
  try {
    // Analizar cada mensaje de forma concurrente (máx 5 a la vez)
    const batchSize = 5;
    const results: SentimentAnalysis[] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((message) => analyzeSentiment(message, context))
      );
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    logError(error as Error, { context: 'analyzeBatchSentiment' });
    throw error;
  }
}

/**
 * Obtiene un resumen del sentimiento de una conversación
 */
export interface ConversationSentimentSummary {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  averageScore: number;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  highestUrgency: 'low' | 'medium' | 'high' | 'critical';
  dominantEmotions: string[];
  keyTopics: string[];
}

export async function analyzeConversationSentiment(
  messages: Array<{ sender: 'user' | 'bot'; text: string }>
): Promise<ConversationSentimentSummary> {
  try {
    // Analizar solo mensajes del usuario
    const userMessages = messages.filter((m) => m.sender === 'user').map((m) => m.text);

    if (userMessages.length === 0) {
      return {
        overallSentiment: 'neutral',
        averageScore: 0,
        sentimentTrend: 'stable',
        highestUrgency: 'low',
        dominantEmotions: [],
        keyTopics: [],
      };
    }

    // Analizar sentimiento de cada mensaje
    const analyses = await analyzeBatchSentiment(userMessages);

    // Calcular métricas agregadas
    const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;

    // Determinar sentimiento general
    const overallSentiment: 'positive' | 'neutral' | 'negative' =
      averageScore > 0.3 ? 'positive' : averageScore < -0.3 ? 'negative' : 'neutral';

    // Determinar tendencia
    let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (analyses.length >= 3) {
      const firstHalf = analyses.slice(0, Math.floor(analyses.length / 2));
      const secondHalf = analyses.slice(Math.floor(analyses.length / 2));

      const firstAvg = firstHalf.reduce((sum, a) => sum + a.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, a) => sum + a.score, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 0.2) sentimentTrend = 'improving';
      else if (secondAvg < firstAvg - 0.2) sentimentTrend = 'declining';
    }

    // Urgencia más alta
    const urgencyLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    const highestUrgency = analyses.reduce(
      (max, a) => (urgencyLevels[a.urgency] > urgencyLevels[max] ? a.urgency : max),
      'low' as 'low' | 'medium' | 'high' | 'critical'
    );

    // Emociones dominantes
    const emotionCounts: { [key: string]: number } = {};
    analyses.forEach((a) => {
      a.emotions.forEach((emotion) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });
    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);

    // Tópicos clave
    const keywordCounts: { [key: string]: number } = {};
    analyses.forEach((a) => {
      a.keywords.forEach((keyword) => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });
    const keyTopics = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);

    return {
      overallSentiment,
      averageScore,
      sentimentTrend,
      highestUrgency,
      dominantEmotions,
      keyTopics,
    };
  } catch (error) {
    logError(error as Error, { context: 'analyzeConversationSentiment' });
    throw error;
  }
}
