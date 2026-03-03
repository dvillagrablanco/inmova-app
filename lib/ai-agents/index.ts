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
export { STRRevenueAgent } from './str-revenue-agent';
export { MarketingContentAgent } from './marketing-content-agent';
export { OnboardingGuideAgent } from './onboarding-guide-agent';
export { TenantPortalAgent } from './tenant-portal-agent';
export { AccountingTaxAgent } from './accounting-tax-agent';
export { CommunityManagementAgent } from './community-management-agent';
export { InsuranceAdvisorAgent } from './insurance-advisor-agent';
export { ConstructionProjectAgent } from './construction-project-agent';
export { EnergySustainabilityAgent } from './energy-sustainability-agent';

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
    {
      type: 'tenant_portal',
      name: 'Asistente del Portal Inquilino',
      description: 'Pagos, contratos, mantenimiento y documentos para inquilinos',
    },
    {
      type: 'accounting_tax',
      name: 'Asistente de Contabilidad e Impuestos',
      description: 'IVA, IRPF, modelo 303/115/130',
    },
    {
      type: 'community_management',
      name: 'Asistente de Comunidades de Propietarios',
      description: 'Actas, votaciones, derramas, LPH',
    },
    {
      type: 'insurance_advisor',
      name: 'Asesor de Seguros Inmobiliarios',
      description: 'Cobertura, infraseguro, comparativa de presupuestos',
    },
    {
      type: 'construction_project',
      name: 'Agente de Gestión de Obras y Reformas',
      description: 'Costes, plazos, calidad, normativa CTE',
    },
    {
      type: 'energy_sustainability',
      name: 'Agente de Energía y Sostenibilidad ESG',
      description: 'Auditorías, huella carbono, certificaciones LEED/BREEAM',
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
