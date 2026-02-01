/**
 * Configuración de Vapi para Inmova
 * Agentes de Voz IA para el sector inmobiliario
 */

// ============================================================================
// CONFIGURACIÓN DE VOZ - ELEVENLABS
// ============================================================================

export const ELEVENLABS_VOICE_CONFIG = {
  // Modelo más natural de ElevenLabs
  model: 'eleven_multilingual_v2',
  
  // Voz Sarah - madura, reconfortante, profesional
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - ElevenLabs
  
  // Configuración para voz más humana y natural
  stability: 0.4,           // Más variación = más humana
  similarityBoost: 0.75,    // Balance entre consistencia y naturalidad
  style: 0.3,               // Expresividad emocional
  useSpeakerBoost: true,    // Mejora la claridad
  
  // Configuración de idioma
  language: 'es',
  
  // Optimización para conversación telefónica
  optimizeStreamingLatency: 3, // Balance latencia/calidad
};

// ============================================================================
// CONFIGURACIÓN GENERAL DE VAPI
// ============================================================================

export const VAPI_CONFIG = {
  // Configuración del modelo de lenguaje
  model: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 500,
  },
  
  // Configuración de transcripción
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'es',
  },
  
  // Configuración de voz
  voice: {
    provider: 'elevenlabs',
    ...ELEVENLABS_VOICE_CONFIG,
  },
  
  // Configuración de la llamada
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 1800, // 30 minutos máximo
  backgroundSound: 'office',
  
  // Mensajes del sistema
  firstMessage: '¡Hola! Soy tu asistente de Inmova. ¿En qué puedo ayudarte hoy?',
  endCallMessage: 'Gracias por contactar con Inmova. ¡Que tengas un excelente día!',
  
  // Funciones disponibles para los agentes
  serverUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/vapi/webhook',
};

// ============================================================================
// TIPOS
// ============================================================================

export type AgentType = 
  | 'sales'           // Agente de Ventas
  | 'customer_service' // Atención al Cliente
  | 'incidents'       // Gestión de Incidencias
  | 'valuations'      // Valoraciones Inmobiliarias
  | 'acquisition'     // Captación de Propiedades
  | 'coliving'        // Especialista en Coliving
  | 'communities';    // Gestión de Comunidades

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  systemPrompt: string;
  firstMessage: string;
  functions: AgentFunction[];
  metadata: Record<string, any>;
}

export interface AgentFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface VapiCall {
  id: string;
  agentId: string;
  phoneNumber: string;
  duration: number;
  status: 'queued' | 'ringing' | 'in-progress' | 'ended' | 'failed';
  transcript?: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
}
