/**
 * Servicio de Chatbot IA para Zero-Touch Onboarding
 * Asistente inteligente que guía a los usuarios durante el onboarding
 */

import { prisma } from './db';
import logger from './logger';

interface ChatbotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatbotContext {
  userId: string;
  companyId: string;
  userName: string;
  vertical?: string;
  experienceLevel?: string;
  onboardingProgress?: number;
  currentPage?: string;
}

/**
 * Genera contexto del sistema para el chatbot basado en el usuario
 */
export async function generateSystemContext(context: ChatbotContext): Promise<string> {
  const { userId, companyId, userName, vertical, experienceLevel, onboardingProgress, currentPage } = context;

  // Obtener progreso de onboarding
  const progress = await prisma.onboardingTask.findMany({
    where: { userId, companyId },
  });

  const completedTasks = progress.filter(t => t.status === 'completed').length;
  const totalTasks = progress.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const systemContext = `
Eres el Asistente IA de INMOVA, una plataforma profesional de gestión inmobiliaria.

**CONTEXTO DEL USUARIO:**
- Nombre: ${userName}
- Vertical de negocio: ${vertical || 'No especificado'}
- Nivel de experiencia: ${experienceLevel || 'Intermedio'}
- Progreso de onboarding: ${progressPercent}% (${completedTasks}/${totalTasks} tareas completadas)
- Página actual: ${currentPage || 'Desconocida'}

**TU ROL:**
1. Guía proactiva durante el onboarding
2. Responde preguntas sobre funcionalidades de INMOVA
3. Detecta frustraciones y ofrece ayuda específica
4. Sugiere siguientes pasos basados en el contexto
5. Usa lenguaje claro, amigable y profesional

**FUNCIONALIDADES DE INMOVA:**
- 88+ módulos profesionales (gestión de propiedades, contratos, pagos, mantenimiento)
- 7 verticales de negocio: Alquiler Tradicional, Room Rental, STR, House Flipping, Construcción, Coliving, Servicios Profesionales
- Integraciones: Stripe, Airbnb, Booking.com, Zucchetti, ContaSimple
- IA, Blockchain, IoT, Analytics avanzados
- Móvil first, PWA, multiidioma

**GUÍAS DE RESPUESTA:**
1. Si el usuario pregunta "cómo hacer X": explica paso a paso y ofrece iniciar el asistente guiado
2. Si detectas frustración: reconoce su problema, ofrece ayuda específica y sugiere contacto con soporte si es necesario
3. Si pregunta sobre precios: menciona los 4 planes (Basic €79/mes, Professional €149/mes, Business €299/mes, Custom)
4. Si pregunta sobre integraciones: lista las integraciones disponibles y cómo activarlas
5. Mantente conciso: respuestas de 2-4 frases, expandiendo solo si preguntan más

**TONO:**
- Amigable pero profesional
- Empoderador ("tú puedes hacerlo")
- Proactivo (sugiere siguientes pasos)
- Empatía (reconoce dificultades)

Siempre responde en español.
  `.trim();

  return systemContext;
}

/**
 * Procesa un mensaje del chatbot usando GPT-4
 */
export async function processChatbotMessage(
  context: ChatbotContext,
  userMessage: string,
  conversationHistory: ChatbotMessage[] = []
): Promise<{
  response: string;
  interactionId: string;
  actions?: Array<{ type: string; data: any }>;
}> {
  try {
    const { userId, companyId } = context;

    // Generar contexto del sistema
    const systemContext = await generateSystemContext(context);

    // Preparar mensajes para GPT-4
    const messages: ChatbotMessage[] = [
      {
        role: 'system',
        content: systemContext,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Llamar a GPT-4 (Abacus.AI)
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT-4 API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Detectar acciones en la respuesta
    const actions = detectActions(assistantMessage);

    // Guardar interacción en base de datos
    const interaction = await prisma.chatbotInteraction.create({
      data: {
        userId,
        companyId,
        userMessage,
        botResponse: assistantMessage,
        context: context as any,
        sentiment: detectSentiment(userMessage),
        resolved: true,
      },
    });

    logger.info(`Chatbot interaction creada: ${interaction.id}`, {
      userId,
      companyId,
    });

    return {
      response: assistantMessage,
      interactionId: interaction.id,
      actions,
    };
  } catch (error: any) {
    logger.error('Error en processChatbotMessage:', error);
    throw error;
  }
}

/**
 * Detecta acciones que el bot puede sugerir (ej: iniciar wizard)
 */
function detectActions(message: string): Array<{ type: string; data: any }> {
  const actions = [];

  // Detectar si menciona iniciar un asistente/wizard
  if (message.includes('iniciar asistente') || message.includes('comenzar asistente')) {
    // Intentar extraer qué asistente
    if (message.includes('propiedad')) {
      actions.push({
        type: 'start_wizard',
        data: { wizard: 'create_building', url: '/propiedades/crear' },
      });
    } else if (message.includes('contrato')) {
      actions.push({
        type: 'start_wizard',
        data: { wizard: 'create_contract', url: '/contratos/crear' },
      });
    }
  }

  // Detectar si sugiere ir a una página
  if (message.includes('ve a') || message.includes('visita')) {
    if (message.includes('dashboard')) {
      actions.push({
        type: 'navigate',
        data: { url: '/dashboard' },
      });
    } else if (message.includes('onboarding')) {
      actions.push({
        type: 'navigate',
        data: { url: '/onboarding' },
      });
    }
  }

  return actions;
}

/**
 * Detecta el sentimiento del mensaje del usuario
 */
function detectSentiment(message: string): 'positive' | 'neutral' | 'negative' {
  const lowerMessage = message.toLowerCase();

  // Palabras negativas (frustración)
  const negativeWords = [
    'no funciona',
    'no entiendo',
    'difícil',
    'complicado',
    'ayuda',
    'problema',
    'error',
    'mal',
    'frustrante',
  ];

  // Palabras positivas
  const positiveWords = ['gracias', 'genial', 'excelente', 'perfecto', 'útil', 'bien', 'claro'];

  const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
  const hasPositive = positiveWords.some(word => lowerMessage.includes(word));

  if (hasNegative) return 'negative';
  if (hasPositive) return 'positive';
  return 'neutral';
}

/**
 * Obtiene el historial de conversación del usuario
 */
export async function getChatHistory(
  userId: string,
  companyId: string,
  limit: number = 5
): Promise<ChatbotMessage[]> {
  const interactions = await prisma.chatbotInteraction.findMany({
    where: { userId, companyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Convertir a formato de mensajes
  const messages: ChatbotMessage[] = [];
  for (const interaction of interactions.reverse()) {
    messages.push({
      role: 'user',
      content: interaction.userMessage,
    });
    messages.push({
      role: 'assistant',
      content: interaction.botResponse,
    });
  }

  return messages;
}
