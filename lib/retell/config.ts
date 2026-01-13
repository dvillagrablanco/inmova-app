/**
 * Configuración de Retell AI para Inmova
 */

import type { RetellAgentConfig } from './types';

// Configuración del agente Carmen
export const CARMEN_CONFIG: RetellAgentConfig = {
  name: 'Carmen',
  voice: 'es-ES-ElviraNeural', // Voz española de Azure
  systemPrompt: `Eres Carmen, asistente de ventas de Inmova. Tu objetivo es cualificar al lead y agendar visita. Sé breve y natural.

CONTEXTO:
- Inmova es una plataforma de gestión inmobiliaria para propietarios, gestores y agencias
- Ofrecemos gestión de propiedades, inquilinos, contratos, cobros y mantenimiento
- Tenemos planes desde €19/mes para propietarios hasta €499/mes para empresas

OBJETIVO DE LA LLAMADA:
1. Saludar cordialmente y presentarte
2. Cualificar al lead: ¿cuántas propiedades gestiona? ¿qué problemas tiene actualmente?
3. Explicar brevemente cómo Inmova puede ayudarle
4. Proponer agendar una visita/demo para mostrar la plataforma
5. Confirmar datos de contacto

ESTILO:
- Sé amable, profesional pero cercana
- Respuestas cortas y directas (máximo 2-3 frases)
- Usa un tono natural, como si hablaras por teléfono
- Si el lead pregunta precios, da rangos generales y ofrece la demo para detalles

HERRAMIENTAS DISPONIBLES:
- Puedes consultar disponibilidad de horas para agendar citas
- Puedes crear citas directamente en el sistema`,
  tools: ['checkAvailability', 'bookAppointment'],
  temperature: 0.7,
  maxTokens: 300,
};

// Horarios de atención
export const BUSINESS_HOURS = {
  start: 9, // 9:00 AM
  end: 18,  // 6:00 PM
  timezone: 'Europe/Madrid',
  workDays: [1, 2, 3, 4, 5], // Lunes a Viernes (0 = Domingo)
};

// Duración por defecto de citas
export const DEFAULT_APPOINTMENT_DURATION = 30; // minutos

// Tipos de cita disponibles
export const APPOINTMENT_TYPES = {
  visita: {
    label: 'Visita presencial',
    duration: 60,
    description: 'Visita a las oficinas de Inmova',
  },
  llamada: {
    label: 'Llamada telefónica',
    duration: 15,
    description: 'Llamada de seguimiento',
  },
  demo: {
    label: 'Demo online',
    duration: 30,
    description: 'Demostración de la plataforma por videoconferencia',
  },
  reunion_online: {
    label: 'Reunión online',
    duration: 45,
    description: 'Reunión por videoconferencia',
  },
};

// Mensajes predefinidos
export const MESSAGES = {
  greeting: 'Hola, soy Carmen de Inmova. ¿En qué puedo ayudarte hoy?',
  farewell: 'Gracias por tu tiempo. ¡Que tengas un buen día!',
  appointmentConfirmed: '¡Perfecto! Te he agendado la cita. Te enviaremos un recordatorio.',
  appointmentError: 'Ha habido un problema al agendar la cita. ¿Podrías repetirme los datos?',
  noAvailability: 'No tengo huecos disponibles para ese día. ¿Te parece si miramos otro día?',
  fallback: 'Disculpa, no te he entendido bien. ¿Podrías repetirlo?',
  transferToHuman: 'Te paso con un compañero que podrá ayudarte mejor. Un momento, por favor.',
};

// Configuración de OpenAI
export const OPENAI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 300,
};

// Webhook config
export const WEBHOOK_CONFIG = {
  timeout: 10000, // 10 segundos
  retries: 0, // No reintentar
};
