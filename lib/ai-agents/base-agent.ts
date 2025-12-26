/**
 * Sistema de Agentes IA - Agente Base
 * 
 * Clase base para todos los agentes especializados
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import {
  AgentType,
  AgentConfig,
  AgentResponse,
  AgentMessage,
  UserContext,
  AgentTool,
  AgentStatus,
} from './types';

// ============================================================================
// CONFIGURACIÓN ANTHROPIC
// ============================================================================
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;
const MAX_ITERATIONS = 5; // Prevenir loops infinitos en tool calling

// ============================================================================
// CLASE BASE DE AGENTE
// ============================================================================

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected status: AgentStatus = 'idle';

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // ========================================================================
  // MÉTODOS ABSTRACTOS (DEBEN SER IMPLEMENTADOS POR CADA AGENTE)
  // ========================================================================

  /**
   * Procesar mensaje del usuario
   */
  abstract processMessage(
    message: string,
    context: UserContext,
    conversationHistory?: AgentMessage[]
  ): Promise<AgentResponse>;

  /**
   * Validar si este agente puede manejar la consulta
   */
  abstract canHandle(message: string, context: UserContext): Promise<boolean>;

  // ========================================================================
  // MÉTODOS COMPARTIDOS
  // ========================================================================

  /**
   * Chat con Claude usando tool calling
   */
  protected async chatWithClaude(
    userMessage: string,
    context: UserContext,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      this.status = 'thinking';

      // Preparar mensajes
      const messages: Anthropic.Messages.MessageParam[] = [
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      logger.info(`🤖 [${this.config.type}] Processing message from ${context.userName}`);

      // Convertir tools a formato de Anthropic
      const anthropicTools: Anthropic.Messages.Tool[] = this.config.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
      }));

      // Primera llamada a Claude
      let response = await anthropic.messages.create({
        model: this.config.model || DEFAULT_MODEL,
        max_tokens: this.config.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: this.config.temperature || DEFAULT_TEMPERATURE,
        system: this.buildSystemPrompt(context),
        tools: anthropicTools,
        messages: messages
      });

      logger.info(`💬 [${this.config.type}] Claude response - Stop reason: ${response.stop_reason}`);

      // Iterar si Claude quiere usar herramientas
      const toolsUsed: string[] = [];
      const actions: any[] = [];
      let iterations = 0;

      while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
        iterations++;
        this.status = 'executing';
        
        const toolResults: Anthropic.Messages.MessageParam[] = [];
        
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            toolsUsed.push(block.name);
            
            // Ejecutar tool
            const tool = this.config.tools.find(t => t.name === block.name);
            if (!tool) {
              logger.error(`Tool ${block.name} not found`);
              continue;
            }

            logger.info(`🔧 [${this.config.type}] Executing tool: ${block.name}`);
            
            const toolResult = await this.executeTool(
              tool,
              block.input,
              context
            );

            actions.push({
              id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: block.name,
              description: tool.description,
              status: toolResult.success ? 'completed' : 'failed',
              result: toolResult,
              timestamp: new Date()
            });

            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(toolResult)
                }
              ]
            });
          }
        }

        // Continuar la conversación con los resultados
        messages.push(
          {
            role: 'assistant',
            content: response.content
          },
          ...toolResults
        );

        // Llamar a Claude de nuevo
        response = await anthropic.messages.create({
          model: this.config.model || DEFAULT_MODEL,
          max_tokens: this.config.maxTokens || DEFAULT_MAX_TOKENS,
          temperature: this.config.temperature || DEFAULT_TEMPERATURE,
          system: this.buildSystemPrompt(context),
          tools: anthropicTools,
          messages: messages
        });

        logger.info(`🔄 [${this.config.type}] Iteration ${iterations} - Stop reason: ${response.stop_reason}`);
      }

      // Extraer respuesta final de texto
      let finalText = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          finalText += block.text;
        }
      }

      const executionTime = Date.now() - startTime;
      this.status = 'completed';

      const agentResponse: AgentResponse = {
        agentType: this.config.type,
        status: 'success',
        message: finalText,
        actions: actions.length > 0 ? actions : undefined,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        executionTime,
        confidence: 0.85 // Placeholder - podría calcularse basado en varios factores
      };

      logger.info(`✅ [${this.config.type}] Completed - Tools used: ${toolsUsed.join(', ') || 'none'} - Time: ${executionTime}ms`);

      return agentResponse;

    } catch (error: any) {
      this.status = 'error';
      logger.error(`❌ [${this.config.type}] Error:`, error);
      
      return {
        agentType: this.config.type,
        status: 'error',
        message: 'Lo siento, hubo un error procesando tu solicitud. Por favor, inténtalo de nuevo.',
        executionTime: Date.now() - startTime,
        metadata: {
          error: error.message
        }
      };
    }
  }

  /**
   * Ejecutar herramienta
   */
  protected async executeTool(
    tool: AgentTool,
    input: any,
    context: UserContext
  ): Promise<any> {
    try {
      // Verificar permisos si es necesario
      if (tool.permissions && tool.permissions.length > 0) {
        const hasPermission = await this.checkPermissions(tool.permissions, context);
        if (!hasPermission) {
          return {
            success: false,
            error: 'No tienes permisos suficientes para ejecutar esta acción'
          };
        }
      }

      // Ejecutar handler de la herramienta
      const result = await tool.handler(input, context);
      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      logger.error(`Error executing tool ${tool.name}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Construir system prompt personalizado
   */
  protected buildSystemPrompt(context: UserContext): string {
    return `${this.config.systemPrompt}

Información del usuario:
- Nombre: ${context.userName}
- Tipo: ${context.userType}
- Email: ${context.userEmail}
- Empresa: ${context.companyId}
${context.role ? `- Rol: ${context.role}` : ''}

Tus capacidades incluyen:
${this.config.capabilities.map(cap => `- ${cap.name}: ${cap.description}`).join('\n')}

Normas importantes:
1. Siempre ser profesional, amable y eficiente
2. Usar las herramientas disponibles para obtener datos precisos
3. Proporcionar respuestas claras, estructuradas y accionables
4. Si no tienes información suficiente, preguntar específicamente qué necesitas
5. Responder SIEMPRE en español
6. Si una solicitud está fuera de tu alcance, indicarlo claramente y ofrecer alternativas
7. Confirmar acciones críticas antes de ejecutarlas
8. Incluir contexto relevante e IDs cuando sea útil`;
  }

  /**
   * Verificar permisos del usuario
   */
  protected async checkPermissions(
    requiredPermissions: string[],
    context: UserContext
  ): Promise<boolean> {
    // Implementación básica - puede ser extendida
    const adminRoles = ['super_admin', 'admin', 'administrador', 'gestor'];
    
    if (adminRoles.includes(context.userType) || adminRoles.includes(context.role || '')) {
      return true;
    }

    // Aquí se podría implementar una verificación más granular contra la base de datos
    return false;
  }

  /**
   * Obtener estado del agente
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Obtener configuración del agente
   */
  public getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Obtener tipo de agente
   */
  public getType(): AgentType {
    return this.config.type;
  }

  /**
   * Verificar si el agente está habilitado
   */
  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }
}
