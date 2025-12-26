/**
 * Sistema de Agentes IA - Tipos y Definiciones
 *
 * Define los tipos base para el sistema de agentes especializados
 */

import type Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TIPOS BASE DE AGENTES
// ============================================================================

export type AgentType =
  | 'technical_support' // Servicio Técnico y Mantenimiento
  | 'customer_service' // Atención al Cliente
  | 'commercial_management' // Gestión Comercial
  | 'financial_analysis' // Análisis Financiero
  | 'legal_compliance' // Legal y Cumplimiento
  | 'maintenance_preventive' // Mantenimiento Preventivo
  | 'general'; // Asistente General

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'completed' | 'error';

export type Priority = 'baja' | 'media' | 'alta' | 'urgente';

// ============================================================================
// CONTEXTO DE USUARIO
// ============================================================================

export interface UserContext {
  userId: string;
  userType: 'tenant' | 'landlord' | 'admin' | 'provider' | 'operador' | 'gestor';
  userName: string;
  userEmail: string;
  companyId: string;
  role?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// MENSAJE Y CONVERSACIÓN
// ============================================================================

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: {
    agentType?: AgentType;
    toolsUsed?: string[];
    executionTime?: number;
    confidence?: number;
    [key: string]: any;
  };
}

export interface AgentConversation {
  id: string;
  agentType: AgentType;
  userId: string;
  messages: AgentMessage[];
  context: UserContext;
  status: AgentStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// CAPACIDADES Y HERRAMIENTAS
// ============================================================================

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredPermissions?: string[];
  estimatedTime?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Anthropic.Messages.Tool['input_schema'];
  handler: (input: any, context: UserContext) => Promise<any>;
  requiresConfirmation?: boolean;
  permissions?: string[];
}

// ============================================================================
// RESPUESTA DE AGENTE
// ============================================================================

export interface AgentResponse {
  agentType: AgentType;
  status: 'success' | 'partial' | 'error';
  message: string;
  data?: any;
  actions?: AgentAction[];
  suggestions?: AgentSuggestion[];
  toolsUsed?: string[];
  executionTime?: number;
  confidence?: number;
  needsEscalation?: boolean;
  escalationReason?: string;
  metadata?: Record<string, any>;
}

export interface AgentAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  timestamp: Date;
}

export interface AgentSuggestion {
  id: string;
  type: 'action' | 'information' | 'warning';
  title: string;
  description: string;
  priority: Priority;
  actionable?: boolean;
  actionLabel?: string;
  actionPayload?: any;
}

// ============================================================================
// DETECCIÓN DE INTENCIÓN
// ============================================================================

export interface IntentDetection {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  suggestedAgent: AgentType;
  requiresMultipleAgents?: boolean;
  agentsNeeded?: AgentType[];
}

// ============================================================================
// MÉTRICAS DE AGENTE
// ============================================================================

export interface AgentMetrics {
  agentType: AgentType;
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  averageConfidence: number;
  toolsUsageCount: Record<string, number>;
  escalationRate: number;
  userSatisfactionAvg: number;
  period: {
    from: Date;
    to: Date;
  };
}

// ============================================================================
// CONFIGURACIÓN DE AGENTE
// ============================================================================

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  capabilities: AgentCapability[];
  tools: AgentTool[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
  autoEscalateOn?: string[];
}

// ============================================================================
// TRANSFERENCIA ENTRE AGENTES
// ============================================================================

export interface AgentHandoff {
  fromAgent: AgentType;
  toAgent: AgentType;
  reason: string;
  context: Record<string, any>;
  conversationHistory: AgentMessage[];
  timestamp: Date;
}

// ============================================================================
// RESULTADO DE ANÁLISIS
// ============================================================================

export interface AnalysisResult {
  summary: string;
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral' | 'warning';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    recommendation?: string;
  }>;
  data: Record<string, any>;
  visualizations?: Array<{
    type: 'chart' | 'table' | 'metric';
    config: any;
  }>;
}
