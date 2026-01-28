/**
 * Coordinador de Agentes IA
 *
 * Sistema central que:
 * - Detecta intención y selecciona agente apropiado
 * - Coordina transferencias entre agentes
 * - Gestiona conversaciones multi-agente
 * - Registra interacciones y métricas
 * - Escala a humanos cuando es necesario
 */

import { prisma } from '../db';
import logger from '@/lib/logger';
import {
  AgentType,
  AgentResponse,
  AgentMessage,
  UserContext,
  IntentDetection,
  AgentHandoff,
  AgentMetrics,
} from './types';

// Importar agentes
import { TechnicalSupportAgent } from './technical-support-agent';
import { CustomerServiceAgent } from './customer-service-agent';
import { CommercialManagementAgent } from './commercial-management-agent';
import { FinancialAnalysisAgent } from './financial-analysis-agent';
import { LegalComplianceAgent } from './legal-compliance-agent';
import { DocumentAssistantAgent } from './document-assistant-agent';

// ============================================================================
// REGISTRO DE AGENTES
// ============================================================================

const agentRegistry: Map<AgentType, any> = new Map();

// Inicializar agentes
agentRegistry.set('technical_support', new TechnicalSupportAgent());
agentRegistry.set('customer_service', new CustomerServiceAgent());
agentRegistry.set('commercial_management', new CommercialManagementAgent());
agentRegistry.set('financial_analysis', new FinancialAnalysisAgent());
agentRegistry.set('legal_compliance', new LegalComplianceAgent());
agentRegistry.set('document_assistant', new DocumentAssistantAgent());

// ============================================================================
// COORDINADOR PRINCIPAL
// ============================================================================

export class AgentCoordinator {
  private static instance: AgentCoordinator;
  private conversationCache: Map<string, AgentMessage[]> = new Map();

  private constructor() {}

  static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }

  /**
   * Procesar mensaje del usuario
   * Detecta intención, selecciona agente y procesa
   */
  async processMessage(
    message: string,
    context: UserContext,
    conversationId?: string,
    preferredAgent?: AgentType
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      logger.info(`📨 [Coordinator] New message from ${context.userName}`);

      // Obtener historial de conversación si existe
      const conversationHistory = conversationId
        ? this.conversationCache.get(conversationId) || []
        : [];

      // Determinar agente apropiado
      let selectedAgentType: AgentType;

      if (preferredAgent && agentRegistry.has(preferredAgent)) {
        // Usar agente preferido si se especifica
        selectedAgentType = preferredAgent;
        logger.info(`🎯 [Coordinator] Using preferred agent: ${preferredAgent}`);
      } else {
        // Detectar intención y seleccionar agente
        selectedAgentType = await this.detectIntentAndSelectAgent(
          message,
          context,
          conversationHistory
        );
        logger.info(`🎯 [Coordinator] Selected agent: ${selectedAgentType}`);
      }

      // Obtener agente
      const agent = agentRegistry.get(selectedAgentType);
      if (!agent) {
        throw new Error(`Agent ${selectedAgentType} not found`);
      }

      // Verificar si el agente está habilitado
      if (!agent.isEnabled()) {
        logger.warn(`⚠️ [Coordinator] Agent ${selectedAgentType} is disabled`);
        return {
          agentType: selectedAgentType,
          status: 'error',
          message:
            'Este agente no está disponible en este momento. Por favor, intenta con otra consulta o contacta con soporte.',
          needsEscalation: true,
          escalationReason: 'Agente deshabilitado',
        };
      }

      // Procesar mensaje con el agente seleccionado
      const response = await agent.processMessage(message, context, conversationHistory);

      // Actualizar historial de conversación
      const userMessage: AgentMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: { agentType: selectedAgentType },
      };

      const assistantMessage: AgentMessage = {
        id: `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          agentType: selectedAgentType,
          toolsUsed: response.toolsUsed,
          executionTime: response.executionTime,
          confidence: response.confidence,
        },
      };

      conversationHistory.push(userMessage, assistantMessage);

      // Guardar en cache
      if (conversationId) {
        this.conversationCache.set(conversationId, conversationHistory);
      }

      // Registrar interacción
      await this.logInteraction(
        context,
        selectedAgentType,
        message,
        response,
        Date.now() - startTime
      );

      // Evaluar si necesita transferencia a otro agente
      const needsHandoff = await this.evaluateHandoffNeed(response, message, selectedAgentType);

      if (needsHandoff) {
        response.suggestions = response.suggestions || [];
        response.suggestions.push({
          id: 'handoff_suggestion',
          type: 'action',
          title: 'Transferir a otro agente',
          description: `Este tema podría ser mejor manejado por el agente de ${needsHandoff.suggestedAgent}`,
          priority: 'media',
          actionable: true,
          actionLabel: 'Transferir',
          actionPayload: { transferTo: needsHandoff.suggestedAgent },
        });
      }

      logger.info(
        `✅ [Coordinator] Message processed successfully - Agent: ${selectedAgentType} - Time: ${Date.now() - startTime}ms`
      );

      return response;
    } catch (error: any) {
      logger.error('[Coordinator] Error processing message:', error);

      return {
        agentType: 'customer_service',
        status: 'error',
        message:
          'Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo o contacta con soporte.',
        needsEscalation: true,
        escalationReason: 'Error en procesamiento',
        metadata: {
          error: error.message,
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Detectar intención y seleccionar agente apropiado
   */
  private async detectIntentAndSelectAgent(
    message: string,
    context: UserContext,
    conversationHistory: AgentMessage[]
  ): Promise<AgentType> {
    const messageLower = message.toLowerCase();

    // Analizar contexto de conversación previa
    const recentAgents = conversationHistory
      .slice(-3)
      .map((m) => m.metadata?.agentType)
      .filter(Boolean);

    // Si hay un agente reciente y el mensaje parece continuar el tema, mantener
    if (recentAgents.length > 0) {
      const lastAgent = recentAgents[recentAgents.length - 1] as AgentType;
      const agent = agentRegistry.get(lastAgent);

      if (agent && (await agent.canHandle(message, context))) {
        return lastAgent;
      }
    }

    // Verificar cada agente en orden de prioridad
    const agentsToCheck: AgentType[] = [
      'technical_support', // Prioridad alta para emergencias
      'legal_compliance', // Alta por urgencia legal
      'financial_analysis', // Media-alta por impacto
      'commercial_management', // Media
      'customer_service', // Default - maneja consultas generales
    ];

    for (const agentType of agentsToCheck) {
      const agent = agentRegistry.get(agentType);
      if (agent && agent.isEnabled() && (await agent.canHandle(message, context))) {
        return agentType;
      }
    }

    // Default: customer service
    return 'customer_service';
  }

  /**
   * Evaluar si se necesita transferencia a otro agente
   */
  private async evaluateHandoffNeed(
    response: AgentResponse,
    originalMessage: string,
    currentAgent: AgentType
  ): Promise<{ needed: boolean; suggestedAgent?: AgentType; reason?: string } | null> {
    // Si el agente ya indicó necesidad de escalación
    if (response.needsEscalation) {
      return null; // Se maneja directamente como escalación a humano
    }

    // Detectar menciones cruzadas
    const messageLower = originalMessage.toLowerCase();
    const agentKeywords: Record<string, string[]> = {
      technical_support: ['reparar', 'arreglar', 'mantenimiento', 'técnico', 'emergencia'],
      legal_compliance: ['legal', 'contrato', 'abogado', 'demanda', 'cláusula'],
      financial_analysis: ['financiero', 'rentabilidad', 'roi', 'ingresos', 'gastos'],
      commercial_management: ['venta', 'lead', 'cliente', 'propuesta', 'comercial'],
      document_assistant: [
        'documento',
        'pdf',
        'archivo',
        'analizar',
        'extraer',
        'resumen',
        'ocr',
        'imagen',
      ],
    };

    for (const [agentType, keywords] of Object.entries(agentKeywords)) {
      if (agentType !== currentAgent) {
        if (keywords.some((kw) => messageLower.includes(kw))) {
          return {
            needed: true,
            suggestedAgent: agentType as AgentType,
            reason: 'Tema relacionado con especialidad de otro agente',
          };
        }
      }
    }

    return null;
  }

  /**
   * Transferir conversación a otro agente
   */
  async handoffToAgent(
    conversationId: string,
    fromAgent: AgentType,
    toAgent: AgentType,
    reason: string,
    context: UserContext
  ): Promise<AgentResponse> {
    logger.info(`🔄 [Coordinator] Handoff: ${fromAgent} -> ${toAgent}`);

    const conversationHistory = this.conversationCache.get(conversationId) || [];

    // Registrar handoff
    const handoff: AgentHandoff = {
      fromAgent,
      toAgent,
      reason,
      context: {},
      conversationHistory,
      timestamp: new Date(),
    };

    await this.logHandoff(handoff, context);

    // Generar mensaje de transición
    const transitionMessage = `He transferido tu consulta al agente especializado en ${this.getAgentName(toAgent)}. Ellos podrán ayudarte mejor con este tema.`;

    const agent = agentRegistry.get(toAgent);
    if (!agent) {
      throw new Error(`Target agent ${toAgent} not found`);
    }

    // Añadir mensaje de sistema sobre la transferencia
    const systemMessage: AgentMessage = {
      id: `msg_${Date.now()}_system`,
      role: 'system',
      content: `Conversación transferida desde ${fromAgent} a ${toAgent}. Razón: ${reason}`,
      timestamp: new Date(),
      metadata: { handoff: true },
    };

    conversationHistory.push(systemMessage);
    this.conversationCache.set(conversationId, conversationHistory);

    return {
      agentType: toAgent,
      status: 'success',
      message: transitionMessage,
      metadata: {
        handoff: true,
        fromAgent,
        toAgent,
        reason,
      },
    };
  }

  /**
   * Obtener métricas de agentes
   */
  async getAgentMetrics(agentType?: AgentType, periodDays: number = 30): Promise<AgentMetrics[]> {
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const agentTypes = agentType ? [agentType] : Array.from(agentRegistry.keys());

    const metrics: AgentMetrics[] = [];

    for (const type of agentTypes) {
      const interactions = await prisma.agentInteraction.findMany({
        where: {
          agentType: type,
          timestamp: { gte: periodStart },
        },
      });

      const successful = interactions.filter((i) => i.successful);
      const escalations = interactions.filter((i) => i.escalated);

      const avgResponseTime =
        interactions.length > 0
          ? interactions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / interactions.length
          : 0;

      const avgConfidence =
        interactions.length > 0
          ? interactions.reduce((sum, i) => sum + (i.confidence || 0), 0) / interactions.length
          : 0;

      // Contar uso de tools
      const toolsUsage: Record<string, number> = {};
      interactions.forEach((i) => {
        if (i.toolsUsed) {
          (i.toolsUsed as string[]).forEach((tool) => {
            toolsUsage[tool] = (toolsUsage[tool] || 0) + 1;
          });
        }
      });

      metrics.push({
        agentType: type,
        totalInteractions: interactions.length,
        successfulInteractions: successful.length,
        averageResponseTime: avgResponseTime,
        averageConfidence: avgConfidence,
        toolsUsageCount: toolsUsage,
        escalationRate:
          interactions.length > 0 ? (escalations.length / interactions.length) * 100 : 0,
        userSatisfactionAvg: 0, // Placeholder - requeriría sistema de feedback
        period: {
          from: periodStart,
          to: new Date(),
        },
      });
    }

    return metrics;
  }

  /**
   * Obtener conversación
   */
  getConversation(conversationId: string): AgentMessage[] {
    return this.conversationCache.get(conversationId) || [];
  }

  /**
   * Limpiar conversación
   */
  clearConversation(conversationId: string): void {
    this.conversationCache.delete(conversationId);
  }

  /**
   * Listar agentes disponibles
   */
  listAvailableAgents(): Array<{
    type: AgentType;
    name: string;
    description: string;
    enabled: boolean;
  }> {
    const agents: Array<any> = [];

    for (const [type, agent] of agentRegistry.entries()) {
      const config = agent.getConfig();
      agents.push({
        type,
        name: config.name,
        description: config.description,
        enabled: agent.isEnabled(),
        capabilities: config.capabilities,
      });
    }

    return agents;
  }

  /**
   * Registrar interacción
   */
  private async logInteraction(
    context: UserContext,
    agentType: AgentType,
    message: string,
    response: AgentResponse,
    duration: number
  ): Promise<void> {
    try {
      await prisma.agentInteraction.create({
        data: {
          agentType,
          userId: context.userId,
          companyId: context.companyId,
          messageInput: message,
          messageOutput: response.message,
          successful: response.status === 'success',
          escalated: response.needsEscalation || false,
          toolsUsed: response.toolsUsed || [],
          responseTime: duration,
          confidence: response.confidence || 0,
          timestamp: new Date(),
          metadata: response.metadata || {},
        },
      });
    } catch (error) {
      logger.error('[Coordinator] Error logging interaction:', error);
      // No throw - logging no debe bloquear operación principal
    }
  }

  /**
   * Registrar transferencia
   */
  private async logHandoff(handoff: AgentHandoff, context: UserContext): Promise<void> {
    try {
      await prisma.agentHandoff.create({
        data: {
          fromAgent: handoff.fromAgent,
          toAgent: handoff.toAgent,
          reason: handoff.reason,
          userId: context.userId,
          companyId: context.companyId,
          timestamp: handoff.timestamp,
          conversationContext: handoff.context,
        },
      });
    } catch (error) {
      logger.error('[Coordinator] Error logging handoff:', error);
    }
  }

  /**
   * Obtener nombre amigable del agente
   */
  private getAgentName(agentType: AgentType): string {
    const names: Record<AgentType, string> = {
      technical_support: 'Soporte Técnico',
      customer_service: 'Atención al Cliente',
      commercial_management: 'Gestión Comercial',
      financial_analysis: 'Análisis Financiero',
      legal_compliance: 'Legal y Cumplimiento',
      maintenance_preventive: 'Mantenimiento Preventivo',
      document_assistant: 'Asistente Documental',
      general: 'Asistente General',
    };

    return names[agentType] || agentType;
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const agentCoordinator = AgentCoordinator.getInstance();

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Procesar mensaje (wrapper conveniente)
 */
export async function processAgentMessage(
  message: string,
  context: UserContext,
  conversationId?: string,
  preferredAgent?: AgentType
): Promise<AgentResponse> {
  return agentCoordinator.processMessage(message, context, conversationId, preferredAgent);
}

/**
 * Obtener métricas de agentes
 */
export async function getAgentsMetrics(
  agentType?: AgentType,
  periodDays?: number
): Promise<AgentMetrics[]> {
  return agentCoordinator.getAgentMetrics(agentType, periodDays);
}

/**
 * Listar agentes
 */
export function listAgents() {
  return agentCoordinator.listAvailableAgents();
}
