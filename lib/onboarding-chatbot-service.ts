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

import logger from '@/lib/logger';

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
  base: `Eres el asistente virtual de INMOVA, la plataforma PropTech all-in-one más completa de España.

Tu misión es ayudar a nuevos usuarios durante su proceso de onboarding de forma profesional y eficiente.

INMOVA incluye:
- 100+ módulos integrados en 15+ verticales de negocio
- Verticales: Alquiler Tradicional, STR/Vacacional, Coliving/Habitaciones, House Flipping, Construcción, Servicios Profesionales, Comunidades/Admin Fincas, Media Estancia, Hospitality, Student Housing, eWoorker, Holding/Family Office, Alquiler Comercial, Vivienda Social, Real Estate Developer
- IA integrada: valoración de inmuebles, clasificación de incidencias, matching inquilino-propiedad, oportunidades de inversión (51 features), chat contextual
- Herramientas financieras: cuadro de mandos P&L, simuladores hipoteca/fiscal/sensibilidad, pipeline Kanban de inversiones
- Family Office 360°: posiciones financieras, Private Equity, modelo 720, estructura grupo
- Seguros: gestión de pólizas con documentos en S3
- CRM inmobiliario con pipeline de leads
- Portal de inquilinos y propietarios
- Firma digital, tours virtuales
- Integración Stripe, SMTP, AWS S3, Twilio

Reglas:
1. Sé conciso - respuestas de 2-4 frases máximo
2. Usa emojis con moderación (1-2 por mensaje) 
3. Si el usuario pide ayuda con una funcionalidad específica, guíalo paso a paso
4. Siempre sugiere el siguiente paso lógico en el onboarding
5. Si el usuario tiene módulos desactivados, NO menciones funcionalidades de esos módulos
6. Si no sabes algo, admite que necesitas verificar y ofrece contactar con soporte humano
7. Responde SIEMPRE en español`,

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

  comunidades: `El usuario gestiona COMUNIDADES DE PROPIETARIOS / ADMIN FINCAS. Enfoca tu ayuda en:
- Crear y gestionar comunidades de propietarios
- Juntas ordinarias y extraordinarias
- Sistema de votaciones electrónicas
- Derramas y cuotas (ordinarias/extraordinarias)
- Libro de caja y finanzas de la comunidad
- Portal del presidente
- Incidencias comunitarias
- Actas y documentación legal`,

  media_estancia: `El usuario gestiona MEDIA ESTANCIA (contratos flexibles). Enfoca tu ayuda en:
- Contratos de media estancia (1-11 meses)
- Scoring de candidatos
- Calendario de disponibilidad
- Analytics de ocupación y revenue
- Configuración de tarifas por temporada`,

  hospitality: `El usuario gestiona HOSPITALITY (apart-hotels, B&B, serviced apartments). Enfoca tu ayuda en:
- Check-in / Check-out digital
- Housekeeping y limpieza
- Servicios al huésped
- Gestión de reservas
- Revenue management`,

  student_housing: `El usuario gestiona STUDENT HOUSING (residencias estudiantiles). Enfoca tu ayuda en:
- Gestión de residentes y habitaciones
- Aplicaciones de admisión
- Actividades y eventos
- Pagos por semestre
- Mantenimiento de instalaciones`,

  holding: `El usuario gestiona un HOLDING / FAMILY OFFICE. Enfoca tu ayuda en:
- Dashboard patrimonial 360°
- Posiciones financieras y carteras P&L
- Private Equity
- Tesorería y conciliación bancaria
- Modelo 720 (bienes en el extranjero)
- Estructura del grupo societario
- Comparativa entre sociedades
- Oportunidades de inversión con IA (scoring, pipeline Kanban)
- Calculadoras de hipoteca, sensibilidad y fiscal`,

  ewoorker: `El usuario usa eWOORKER (marketplace de trabajadores). Enfoca tu ayuda en:
- Panel de socios y trabajadores
- Asignaciones a obras
- Contratos laborales
- Pagos y nóminas
- Analytics de productividad
- Compliance laboral`,

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

  // Active modules context is added by the API route if available

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

  // Alquiler Residencial
  if (messageLower.includes('edificio') || messageLower.includes('propiedad')) {
    actions.push({ label: 'Crear Edificio', route: '/edificios/nuevo', icon: 'Building2' });
  }
  if (messageLower.includes('unidad') || messageLower.includes('apartamento') || messageLower.includes('piso')) {
    actions.push({ label: 'Crear Unidad', route: '/unidades/nueva', icon: 'Home' });
  }
  if (messageLower.includes('contrato')) {
    actions.push({ label: 'Crear Contrato', route: '/contratos/nuevo', icon: 'FileText' });
  }
  if (messageLower.includes('inquilino')) {
    actions.push({ label: 'Gestionar Inquilinos', route: '/inquilinos', icon: 'Users' });
  }

  // STR
  if (messageLower.includes('airbnb') || messageLower.includes('booking') || messageLower.includes('vacacional') || messageLower.includes('str')) {
    actions.push({ label: 'Dashboard STR', route: '/str', icon: 'Hotel' });
  }

  // Coliving / Habitaciones
  if (messageLower.includes('habitación') || messageLower.includes('coliving') || messageLower.includes('room rental')) {
    actions.push({ label: 'Gestión de Habitaciones', route: '/room-rental', icon: 'Home' });
  }

  // Flipping
  if (messageLower.includes('flipping') || messageLower.includes('reforma') || messageLower.includes('roi')) {
    actions.push({ label: 'Proyectos Flipping', route: '/flipping/projects', icon: 'TrendingUp' });
  }

  // Construcción
  if (messageLower.includes('construcción') || messageLower.includes('obra')) {
    actions.push({ label: 'Proyectos Construcción', route: '/construccion/proyectos', icon: 'HardHat' });
  }

  // Comunidades
  if (messageLower.includes('comunidad') || messageLower.includes('junta') || messageLower.includes('finca')) {
    actions.push({ label: 'Comunidades', route: '/comunidades', icon: 'Building2' });
  }

  // Family Office
  if (messageLower.includes('inversión') || messageLower.includes('family office') || messageLower.includes('holding') || messageLower.includes('patrimonio')) {
    actions.push({ label: 'Family Office', route: '/family-office/dashboard', icon: 'Landmark' });
  }

  // Dashboard
  if (messageLower.includes('dashboard') || messageLower.includes('inicio') || messageLower.includes('panel')) {
    actions.push({ label: 'Ir al Dashboard', route: '/dashboard', icon: 'LayoutDashboard' });
  }

  // Pagos
  if (messageLower.includes('pago') || messageLower.includes('cobro') || messageLower.includes('stripe')) {
    actions.push({ label: 'Gestionar Pagos', route: '/pagos', icon: 'CreditCard' });
  }

  // Mantenimiento
  if (messageLower.includes('mantenimiento') || messageLower.includes('incidencia') || messageLower.includes('reparación')) {
    actions.push({ label: 'Mantenimiento', route: '/mantenimiento', icon: 'Wrench' });
  }

  // CRM
  if (messageLower.includes('crm') || messageLower.includes('lead') || messageLower.includes('cliente')) {
    actions.push({ label: 'CRM', route: '/crm', icon: 'Users' });
  }

  // Seguros
  if (messageLower.includes('seguro') || messageLower.includes('póliza')) {
    actions.push({ label: 'Seguros', route: '/seguros', icon: 'Shield' });
  }

  // Valoración IA
  if (messageLower.includes('valoración') || messageLower.includes('tasar') || messageLower.includes('valorar')) {
    actions.push({ label: 'Valoración IA', route: '/valoracion-ia', icon: 'Brain' });
  }

  // Si el onboarding no está completo, sugerir continuar
  if (onboardingProgress !== undefined && onboardingProgress < 100 && actions.length === 0) {
    actions.push({ label: 'Continuar Onboarding', route: '/dashboard', icon: 'Rocket' });
  }

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
    '¿Cómo creo mi primera propiedad?',
    '¿Cómo añado un inquilino?',
    '¿Cómo configuro los pagos?',
    '¿Qué módulos tiene INMOVA?',
  ];

  const verticalQuestions: Record<string, string[]> = {
    'alquiler_tradicional': [
      '¿Cómo gestiono los contratos de alquiler?',
      '¿Cómo envío recibos a inquilinos?',
      '¿Cómo gestiono el mantenimiento?',
      '¿Cómo funciona la valoración IA?',
    ],
    'str_vacacional': [
      '¿Cómo conecto Airbnb y Booking?',
      '¿Cómo funciona el pricing dinámico?',
      '¿Cómo gestiono las reservas?',
      '¿Cómo organizo la limpieza entre reservas?',
    ],
    'coliving': [
      '¿Cómo creo habitaciones individuales?',
      '¿Cómo funciona el prorrateo de gastos?',
      '¿Cómo gestiono espacios comunes?',
      '¿Cómo activo la comunidad social?',
    ],
    'room_rental': [
      '¿Cómo creo habitaciones individuales?',
      '¿Cómo funciona el prorrateo de gastos?',
      '¿Cómo defino normas de convivencia?',
    ],
    'flipping': [
      '¿Cómo creo un proyecto de renovación?',
      '¿Cómo calculo el ROI de mi inversión?',
      '¿Cómo hago seguimiento de costos?',
    ],
    'construccion': [
      '¿Cómo creo un proyecto de construcción?',
      '¿Cómo gestiono licencias y permisos?',
      '¿Cómo uso el diagrama Gantt?',
    ],
    'servicios_profesionales': [
      '¿Cómo defino mis servicios y tarifas?',
      '¿Cómo facturo a mis clientes?',
      '¿Cómo gestiono el CRM?',
    ],
    'comunidades': [
      '¿Cómo creo una comunidad de propietarios?',
      '¿Cómo convoco una junta?',
      '¿Cómo gestiono las cuotas?',
      '¿Cómo funciona el sistema de votaciones?',
    ],
    'mixto': [
      '¿Cómo configuro varias verticales a la vez?',
      '¿Cómo funciona el cuadro de mandos financiero?',
      '¿Cómo accedo al Family Office?',
    ],
  };

  if (vertical && verticalQuestions[vertical]) {
    return [...verticalQuestions[vertical], ...baseQuestions.slice(0, 1)];
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
  void context;
  void history;
  return 'Hello! How can I help you?';
}

export async function saveChatbotInteraction(
  userId: string,
  message: string,
  response: string,
  metadata: any = {}
) {
  // TODO: Implement chatbot interaction saving
  void userId;
  void message;
  void response;
  void metadata;
  return { success: true };
}

export async function generateProactiveSuggestions(context: any) {
  // TODO: Implement proactive suggestions
  void context;
  return [];
}
