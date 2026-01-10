/**
 * Tipos para la integración con Retell AI
 */

// Estructura de mensaje de Retell
export interface RetellMessage {
  role: 'agent' | 'user';
  content: string;
  timestamp?: string;
}

// Estructura del webhook de Retell
export interface RetellWebhookPayload {
  call_id: string;
  transcript: string;
  response_id: string;
  interaction_type: 'response_required' | 'reminder' | 'update' | 'end_call';
  messages?: RetellMessage[];
  call_status?: 'in_progress' | 'ended' | 'error';
  metadata?: Record<string, unknown>;
}

// Respuesta al webhook de Retell
export interface RetellWebhookResponse {
  response_id?: string;
  content: string;
  content_complete: boolean;
  end_call?: boolean;
  transfer_call?: {
    phone_number: string;
    reason?: string;
  };
  metadata?: Record<string, unknown>;
}

// Configuración del agente
export interface RetellAgentConfig {
  name: string;
  voice: string;
  systemPrompt: string;
  tools: string[];
  temperature: number;
  maxTokens: number;
}

// Estado de la conversación
export interface ConversationState {
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  appointmentScheduled: boolean;
  qualificationScore: number;
  currentTopic: string;
  extractedInfo: {
    numProperties?: number;
    currentProblems?: string[];
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

// Resultado de las herramientas
export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// Slot de disponibilidad
export interface AvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
}

// Datos para crear cita
export interface BookAppointmentData {
  leadId?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  fecha: string;
  hora: string;
  tipo?: 'visita' | 'llamada' | 'demo' | 'reunion_online';
  notas?: string;
  retellCallId?: string;
}

// Datos para actualizar estado del lead
export interface UpdateLeadStatusData {
  telefono?: string;
  email?: string;
  status: 'nuevo' | 'contactado' | 'calificado' | 'propuesta' | 'negociacion' | 'ganado' | 'perdido';
  temperatura?: 'frio' | 'tibio' | 'caliente';
  motivoPerdida?: string;
  retellCallId?: string;
}

// Datos para crear nota
export interface CreateNoteData {
  telefono?: string;
  email?: string;
  titulo?: string;
  contenido: string;
  tipo?: 'llamada' | 'nota' | 'objecion' | 'necesidad' | 'dato_contacto';
  retellCallId?: string;
}

// Estados del lead en el CRM
export type LeadStatus = 
  | 'nuevo'
  | 'contactado'
  | 'calificado'
  | 'propuesta'
  | 'negociacion'
  | 'ganado'
  | 'perdido';

// Temperatura del lead
export type LeadTemperature = 'frio' | 'tibio' | 'caliente';

// Tipos de actividad/nota
export type NoteType = 
  | 'llamada'
  | 'nota'
  | 'objecion'
  | 'necesidad'
  | 'dato_contacto'
  | 'email'
  | 'reunion'
  | 'whatsapp'
  | 'demo';
