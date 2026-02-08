/**
 * ONBOARDING CHATBOT SERVICE
 * Servicio de chatbot IA inteligente para asistir en el onboarding
 * Utiliza las APIs de LLM de Abacus.AI (GPT-4)
 * 
 * Funcionalidades:
 * - Responde preguntas sobre INMOVA
 * - Guía al usuario en el proceso de onboarding
 * - Sugiere próximos pasos según el progreso
 * - Contextualmente consciente del perfil del usuario
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatbotResponse {
  success: boolean;
  message?: string;
  error?: string;
  suggestedActions?: Array<{
    label: string;
    route: string;
    icon?: string;
  }>;
}

/**
 * Sistema de prompts para el chatbot de onboarding
 */
const SYSTEM_PROMPTS = {
  base: `Eres un asistente virtual de INMOVA, una plataforma PropTech all-in-one.

Tu misión es ayudar a nuevos usuarios durante su proceso de onboarding de forma amigable, profesional y eficiente.

INMOVA tiene:
- 88+ módulos integrados
- 7 verticales de negocio (Alquiler Tradicional, STR, House Flipping, Construcción, Coliving, Hoteles, Servicios Profesionales)
- Tecnologías avanzadas: IA, Blockchain, IoT, ESG
- Precio competitivo: €149/mes (vs. competidores que cobran €300-800/mes)

Reglas:
1. Sé conciso - respuestas de 2-3 frases máximo
2. Usa emojis para hacer la conversación más amena 🚀
3. Si el usuario pide ayuda con una funcionalidad específica, guíalo paso a paso
4. Siempre sugiere el siguiente paso lógico en el onboarding
5. Si no sabes algo, admite que necesitas verificar y ofrece contactar con soporte humano`,

  traditional: `El usuario gestiona ALQUILER TRADICIONAL. Enfoca tu ayuda en:
- Crear edificios y unidades
- Gestionar contratos de alquiler
- Cobros recurrentes y pagos
- Mantenimiento y órdenes de trabajo
- Portal de inquilinos`,

  str: `El usuario gestiona ALQUILER VACACIONAL (STR). Enfoca tu ayuda en:
- Channel Manager (Airbnb, Booking.com)
- Pricing dinámico
- Calendario de reservas
- Housekeeping y limpieza
- Guest communication`,

  room_rental: `El usuario gestiona ALQUILER POR HABITACIONES / COLIVING. Enfoca tu ayuda en:
- Gestión de habitaciones individuales
- Prorrateo automático de gastos
- Calendario de limpieza
- Reglas de convivencia
- Espacios comunes`,

  flipping: `El usuario hace HOUSE FLIPPING. Enfoca tu ayuda en:
- Proyectos de renovación
- Control de presupuesto y costos
- Análisis de ROI
- Tracking de tareas
- Documentación de propiedad`,

  construction: `El usuario gestiona CONSTRUCCIÓN Y PROMOCIÓN. Enfoca tu ayuda en:
- Gestión de proyectos de obra nueva
- Control de avance y hitos
- Proveedores y contratistas
- Pre-venta de unidades
- Documentación legal`,

  professional: `El usuario ofrece SERVICIOS PROFESIONALES inmobiliarios. Enfoca tu ayuda en:
- Portfolio de propiedades gestionadas
- CRM de clientes
- Generación de leads
- Propuestas y presupuestos
- Reportes para clientes`,

  generic: `El usuario aún no ha definido su vertical. Ayuédale a:
- Descubrir qué tipo de negocio inmobiliario gestiona
- Entender los beneficios de cada vertical en INMOVA
- Elegir el perfil que mejor se adapte a sus necesidades`,
};

/**
 * Construye el contexto del usuario para el chatbot
 */
function buildUserContext(params: {
  userName?: string;
  vertical?: string;
  onboardingProgress?: number;
  completedTasks?: string[];
  currentPage?: string;
}) {
  const { userName, vertical, onboardingProgress, completedTasks, currentPage } = params;

  let context = `Información del usuario:\n`;

  if (userName) {
    context += `- Nombre: ${userName}\n`;
  }

  if (vertical) {
    context += `- Vertical de negocio: ${vertical}\n`;
  }

  if (onboardingProgress !== undefined) {
    context += `- Progreso de onboarding: ${onboardingProgress}%\n`;
  }

  if (completedTasks && completedTasks.length > 0) {
    context += `- Tareas completadas: ${completedTasks.join(', ')}\n`;
  }

  if (currentPage) {
    context += `- Página actual: ${currentPage}\n`;
  }

  return context;
}

/**
 * Envía un mensaje al chatbot y obtiene una respuesta
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  userContext?: {
    userName?: string;
    vertical?: string;
    onboardingProgress?: number;
    completedTasks?: string[];
    currentPage?: string;
  }
): Promise<ChatbotResponse> {
  try {
    // Construir el prompt del sistema
    let systemPrompt = SYSTEM_PROMPTS.base;

    // Añadir contexto específico del vertical
    if (userContext?.vertical) {
      const verticalKey = userContext.vertical.toLowerCase().replace(/\s+/g, '_');
      const verticalPrompt =
        SYSTEM_PROMPTS[verticalKey as keyof typeof SYSTEM_PROMPTS] ||
        SYSTEM_PROMPTS.generic;
      systemPrompt += `\n\n${verticalPrompt}`;
    }

    // Añadir contexto del usuario
    if (userContext) {
      systemPrompt += `\n\n${buildUserContext(userContext)}`;
    }

    // Construir el array de mensajes
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // Llamar a la API de LLM (Abacus.AI)
    const response = await fetch('https://routellm.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo rápido y económico para chatbot
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 300, // Respuestas concisas
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from LLM');
    }

    // Analizar la respuesta para sugerir acciones
    const suggestedActions = extractSuggestedActions(
      assistantMessage,
      userContext?.onboardingProgress
    );

    return {
      success: true,
      message: assistantMessage,
      suggestedActions,
    };
  } catch (error) {
    logger.error('[OnboardingChatbot] Error:', error);
    return {
      success: false,
      error: 'Lo siento, he tenido un problema. ¿Podrías intentarlo de nuevo? 😔',
    };
  }
}

/**
 * Extrae acciones sugeridas del mensaje del asistente
 * Basado en palabras clave y contexto
 */
function extractSuggestedActions(
  message: string,
  onboardingProgress?: number
): Array<{ label: string; route: string; icon?: string }> {
  const actions: Array<{ label: string; route: string; icon?: string }> = [];

  const messageLower = message.toLowerCase();

  // Sugerencias basadas en palabras clave
  if (messageLower.includes('edificio') || messageLower.includes('propiedad')) {
    actions.push({
      label: 'Crear Edificio',
      route: '/buildings/create',
      icon: 'Building2',
    });
  }

  if (messageLower.includes('unidad') || messageLower.includes('apartamento')) {
    actions.push({
      label: 'Crear Unidad',
      route: '/units/create',
      icon: 'Home',
    });
  }

  if (messageLower.includes('contrato') || messageLower.includes('inquilino')) {
    actions.push({
      label: 'Crear Contrato',
      route: '/contracts/create',
      icon: 'FileText',
    });
  }

  if (messageLower.includes('habitación') || messageLower.includes('coliving')) {
    actions.push({
      label: 'Gestión de Habitaciones',
      route: '/room-rental',
      icon: 'Bed',
    });
  }

  if (messageLower.includes('dashboard') || messageLower.includes('inicio')) {
    actions.push({
      label: 'Ir al Dashboard',
      route: '/home',
      icon: 'LayoutDashboard',
    });
  }

  // Si el onboarding no está completo, sugerir continuar
  if (onboardingProgress !== undefined && onboardingProgress < 100) {
    actions.push({
      label: 'Continuar Onboarding',
      route: '/onboarding',
      icon: 'Rocket',
    });
  }

  // Limitar a 3 acciones máximo
  return actions.slice(0, 3);
}

/**
 * Obtiene un mensaje de bienvenida personalizado
 */
export function getWelcomeMessage(params: {
  userName?: string;
  vertical?: string;
}): string {
  const { userName, vertical } = params;

  let message = '¡Hola';
  if (userName) {
    message += `, ${userName}`;
  }
  message += '! 👋\n\n';

  message += 'Soy el asistente virtual de INMOVA. Estoy aquí para ayudarte durante tu onboarding y responder cualquier duda que tengas. 🚀\n\n';

  if (vertical) {
    message += `Veo que gestionas **${vertical}**. Puedo ayudarte con configuraciones específicas para tu negocio.\n\n`;
  }

  message += '¿En qué puedo ayudarte hoy?';

  return message;
}

/**
 * Obtiene sugerencias de preguntas frecuentes
 */
export function getQuickQuestions(vertical?: string): string[] {
  const baseQuestions = [
    '¿Cómo creo mi primer edificio?',
    '¿Cómo añado un inquilino?',
    '¿Qué módulos tiene INMOVA?',
    '¿Cómo configuro los pagos?',
  ];

  // Preguntas específicas por vertical
  const verticalQuestions: Record<string, string[]> = {
    'Alquiler Tradicional': [
      '¿Cómo gestiono los contratos de alquiler?',
      '¿Cómo envío recibos a inquilinos?',
      '¿Cómo gestiono el mantenimiento?',
    ],
    'Short-Term Rental (STR)': [
      '¿Cómo conecto Airbnb?',
      '¿Cómo funciona el pricing dinámico?',
      '¿Cómo gestiono las reservas?',
    ],
    'Alquiler por Habitaciones': [
      '¿Cómo creo habitaciones individuales?',
      '¿Cómo funciona el prorrateo de gastos?',
      '¿Cómo gestiono espacios comunes?',
    ],
    'House Flipping': [
      '¿Cómo creo un proyecto de renovación?',
      '¿Cómo calculo el ROI?',
      '¿Cómo hago seguimiento de costos?',
    ],
  };

  if (vertical && verticalQuestions[vertical]) {
    return [...verticalQuestions[vertical], ...baseQuestions.slice(0, 2)];
  }

  return baseQuestions;
}

// Stub functions for missing exports (to be implemented)
export async function getChatbotHistory(userId: string, companyId: string) {
  // TODO: Implement chatbot history retrieval
  return [];
}

export async function generateChatbotResponse(
  context: any,
  message: string,
  history: any[] = []
) {
  // TODO: Implement chatbot response generation
  return 'Hello! How can I help you?';
}

export async function saveChatbotInteraction(
  userId: string,
  message: string,
  response: string,
  metadata: any = {}
) {
  // TODO: Implement chatbot interaction saving
  return { success: true };
}

export async function generateProactiveSuggestions(context: any) {
  // TODO: Implement proactive suggestions
  return [];
}
