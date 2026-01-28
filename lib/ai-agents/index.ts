/**
 * Sistema de Agentes IA - Punto de Entrada Principal
 *
 * Exporta todos los agentes, tipos y funciones de coordinación
 */

// ============================================================================
// TIPOS
// ============================================================================
export * from './types';

// ============================================================================
// AGENTE BASE
// ============================================================================
export { BaseAgent } from './base-agent';

// ============================================================================
// AGENTES ESPECIALIZADOS
// ============================================================================
export { TechnicalSupportAgent } from './technical-support-agent';
export { CustomerServiceAgent } from './customer-service-agent';
export { CommercialManagementAgent } from './commercial-management-agent';
export { FinancialAnalysisAgent } from './financial-analysis-agent';
export { LegalComplianceAgent } from './legal-compliance-agent';
export { DocumentAssistantAgent } from './document-assistant-agent';

// ============================================================================
// COORDINADOR
// ============================================================================
export {
  AgentCoordinator,
  agentCoordinator,
  processAgentMessage,
  getAgentsMetrics,
  listAgents,
} from './agent-coordinator';

// ============================================================================
// VERSIÓN
// ============================================================================
export const AI_AGENTS_VERSION = '1.0.0';

// ============================================================================
// INFORMACIÓN DEL SISTEMA
// ============================================================================
export const SYSTEM_INFO = {
  version: AI_AGENTS_VERSION,
  name: 'INMOVA AI Agents System',
  description: 'Sistema avanzado de agentes IA especializados para gestión inmobiliaria',
  agents: [
    {
      type: 'general',
      name: 'Asistente General',
      description: 'Coordinador inteligente que dirige al agente especializado más adecuado',
    },
    {
      type: 'document_assistant',
      name: 'Asistente Documental',
      description: 'Análisis, resumen y extracción de información de documentos',
    },
    {
      type: 'technical_support',
      name: 'Agente de Servicio Técnico',
      description: 'Gestión de mantenimiento y soporte técnico',
    },
    {
      type: 'customer_service',
      name: 'Agente de Atención al Cliente',
      description: 'Consultas, quejas y atención al cliente',
    },
    {
      type: 'commercial_management',
      name: 'Agente de Gestión Comercial',
      description: 'Ventas, leads y desarrollo comercial',
    },
    {
      type: 'financial_analysis',
      name: 'Agente de Análisis Financiero',
      description: 'Análisis financiero y optimización de rentabilidad',
    },
    {
      type: 'legal_compliance',
      name: 'Agente de Legal y Cumplimiento',
      description: 'Aspectos legales y cumplimiento normativo',
    },
  ],
  capabilities: {
    multiAgentCoordination: true,
    contextualHandoff: true,
    toolCalling: true,
    conversationMemory: true,
    metricsTracking: true,
    escalationToHuman: true,
  },
  powered_by: 'Anthropic Claude 3.5 Sonnet',
};
