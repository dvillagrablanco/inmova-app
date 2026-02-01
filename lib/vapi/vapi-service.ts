/**
 * Servicio de Vapi para Inmova
 * Gestión de agentes de voz IA
 */

import { VAPI_CONFIG, ELEVENLABS_VOICE_CONFIG, AgentConfig, VapiCall } from './vapi-config';
import { ALL_AGENTS, getAgentByType, getAgentById } from './agents';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const VAPI_API_URL = 'https://api.vapi.ai';

interface VapiHeaders {
  'Authorization': string;
  'Content-Type': string;
}

function getHeaders(): VapiHeaders {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error('VAPI_API_KEY no está configurada');
  }
  
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

// ============================================================================
// TIPOS DE RESPUESTA VAPI
// ============================================================================

interface VapiAssistant {
  id: string;
  name: string;
  model: any;
  voice: any;
  firstMessage: string;
  transcriber: any;
  functions: any[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface VapiCallResponse {
  id: string;
  assistantId: string;
  phoneNumberId?: string;
  customerId?: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  cost?: number;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class VapiService {
  
  // --------------------------------------------------------------------------
  // GESTIÓN DE ASISTENTES
  // --------------------------------------------------------------------------
  
  /**
   * Crear un asistente en Vapi basado en la configuración del agente
   */
  static async createAssistant(agentConfig: AgentConfig): Promise<VapiAssistant> {
    const payload = {
      name: agentConfig.name,
      
      // Modelo de lenguaje (Claude)
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 500,
        systemPrompt: agentConfig.systemPrompt,
      },
      
      // Voz (ElevenLabs - Sarah en español)
      voice: {
        provider: 'elevenlabs',
        voiceId: ELEVENLABS_VOICE_CONFIG.voiceId,
        model: ELEVENLABS_VOICE_CONFIG.model,
        stability: ELEVENLABS_VOICE_CONFIG.stability,
        similarityBoost: ELEVENLABS_VOICE_CONFIG.similarityBoost,
        style: ELEVENLABS_VOICE_CONFIG.style,
        useSpeakerBoost: ELEVENLABS_VOICE_CONFIG.useSpeakerBoost,
      },
      
      // Transcripción (Deepgram en español)
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'es',
      },
      
      // Mensaje inicial
      firstMessage: agentConfig.firstMessage,
      
      // Configuración de la llamada
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 1800,
      backgroundSound: 'office',
      
      // Funciones disponibles
      functions: agentConfig.functions.map(fn => ({
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
        // Todas las funciones llaman a nuestro webhook
        serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/functions/${fn.name}`,
      })),
      
      // URL del servidor para webhooks
      serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
      serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
      
      // Metadata del agente
      metadata: {
        ...agentConfig.metadata,
        agentId: agentConfig.id,
        agentType: agentConfig.type,
        inmova: true,
      },
    };
    
    const response = await fetch(`${VAPI_API_URL}/assistant`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error creando asistente: ${error}`);
    }
    
    return response.json();
  }
  
  /**
   * Obtener todos los asistentes de Inmova
   */
  static async listAssistants(): Promise<VapiAssistant[]> {
    const response = await fetch(`${VAPI_API_URL}/assistant`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo asistentes');
    }
    
    const assistants = await response.json();
    
    // Filtrar solo los de Inmova
    return assistants.filter((a: VapiAssistant) => a.metadata?.inmova === true);
  }
  
  /**
   * Obtener un asistente por ID
   */
  static async getAssistant(assistantId: string): Promise<VapiAssistant> {
    const response = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo asistente');
    }
    
    return response.json();
  }
  
  /**
   * Actualizar un asistente
   */
  static async updateAssistant(assistantId: string, updates: Partial<VapiAssistant>): Promise<VapiAssistant> {
    const response = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Error actualizando asistente');
    }
    
    return response.json();
  }
  
  /**
   * Eliminar un asistente
   */
  static async deleteAssistant(assistantId: string): Promise<void> {
    const response = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error eliminando asistente');
    }
  }
  
  // --------------------------------------------------------------------------
  // GESTIÓN DE LLAMADAS
  // --------------------------------------------------------------------------
  
  /**
   * Iniciar una llamada saliente con un asistente específico
   */
  static async startOutboundCall(params: {
    assistantId: string;
    phoneNumber: string;
    customerName?: string;
    customerId?: string;
    metadata?: Record<string, any>;
  }): Promise<VapiCallResponse> {
    const payload = {
      assistantId: params.assistantId,
      customer: {
        number: params.phoneNumber,
        name: params.customerName,
      },
      metadata: {
        ...params.metadata,
        customerId: params.customerId,
        source: 'inmova',
      },
    };
    
    const response = await fetch(`${VAPI_API_URL}/call/phone`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error iniciando llamada: ${error}`);
    }
    
    return response.json();
  }
  
  /**
   * Iniciar una llamada web (browser)
   */
  static async startWebCall(params: {
    assistantId: string;
    customerId?: string;
    metadata?: Record<string, any>;
  }): Promise<{ callId: string; webSocketUrl: string }> {
    const payload = {
      assistantId: params.assistantId,
      metadata: {
        ...params.metadata,
        customerId: params.customerId,
        source: 'inmova-web',
      },
    };
    
    const response = await fetch(`${VAPI_API_URL}/call/web`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error iniciando llamada web: ${error}`);
    }
    
    return response.json();
  }
  
  /**
   * Obtener información de una llamada
   */
  static async getCall(callId: string): Promise<VapiCallResponse> {
    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo llamada');
    }
    
    return response.json();
  }
  
  /**
   * Listar llamadas
   */
  static async listCalls(params?: {
    assistantId?: string;
    limit?: number;
    createdAtGt?: string;
    createdAtLt?: string;
  }): Promise<VapiCallResponse[]> {
    const queryParams = new URLSearchParams();
    if (params?.assistantId) queryParams.set('assistantId', params.assistantId);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.createdAtGt) queryParams.set('createdAtGt', params.createdAtGt);
    if (params?.createdAtLt) queryParams.set('createdAtLt', params.createdAtLt);
    
    const response = await fetch(`${VAPI_API_URL}/call?${queryParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error listando llamadas');
    }
    
    return response.json();
  }
  
  /**
   * Finalizar una llamada en curso
   */
  static async endCall(callId: string): Promise<void> {
    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error finalizando llamada');
    }
  }
  
  // --------------------------------------------------------------------------
  // UTILIDADES
  // --------------------------------------------------------------------------
  
  /**
   * Verificar que las credenciales están configuradas
   */
  static async verifyCredentials(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`${VAPI_API_URL}/assistant`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (response.ok) {
        return { valid: true };
      }
      
      return { valid: false, error: `HTTP ${response.status}` };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Crear todos los agentes de Inmova en Vapi
   */
  static async setupAllAgents(): Promise<{ created: string[]; errors: string[] }> {
    const created: string[] = [];
    const errors: string[] = [];
    
    for (const agent of ALL_AGENTS) {
      try {
        const assistant = await this.createAssistant(agent);
        created.push(`${agent.name} (${assistant.id})`);
      } catch (error: any) {
        errors.push(`${agent.name}: ${error.message}`);
      }
    }
    
    return { created, errors };
  }
  
  /**
   * Obtener estadísticas de llamadas
   */
  static async getCallStats(params?: {
    assistantId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalCalls: number;
    completedCalls: number;
    averageDuration: number;
    totalCost: number;
  }> {
    const calls = await this.listCalls({
      assistantId: params?.assistantId,
      createdAtGt: params?.startDate,
      createdAtLt: params?.endDate,
      limit: 1000,
    });
    
    const completedCalls = calls.filter(c => c.status === 'ended');
    const totalDuration = calls.reduce((sum, c) => {
      if (c.startedAt && c.endedAt) {
        return sum + (new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000;
      }
      return sum;
    }, 0);
    const totalCost = calls.reduce((sum, c) => sum + (c.cost || 0), 0);
    
    return {
      totalCalls: calls.length,
      completedCalls: completedCalls.length,
      averageDuration: completedCalls.length > 0 ? totalDuration / completedCalls.length : 0,
      totalCost,
    };
  }
}

// ============================================================================
// EXPORTAR CONFIGURACIONES DE AGENTES
// ============================================================================

export { ALL_AGENTS, getAgentByType, getAgentById };
export type { AgentConfig, VapiCall } from './vapi-config';
