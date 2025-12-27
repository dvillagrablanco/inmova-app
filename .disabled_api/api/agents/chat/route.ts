/**
 * API: POST /api/agents/chat
 * Endpoint principal para interactuar con el sistema de agentes IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { processAgentMessage } from '@/lib/ai-agents';
import { AgentType, UserContext } from '@/lib/ai-agents/types';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      message,
      conversationId,
      preferredAgent
    } = body;

    // Validar mensaje
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Construir contexto del usuario
    const context: UserContext = {
      userId: session.user.id || '',
      userType: mapUserType(session.user.role),
      userName: session.user.name || 'Usuario',
      userEmail: session.user.email || '',
      companyId: (session.user as any).companyId || '',
      role: session.user.role,
      metadata: {
        sessionId: session.user.id,
        requestTime: new Date().toISOString()
      }
    };

    logger.info(`🤖 [Agents API] New message from ${context.userName} (${context.userType})`);

    // Procesar mensaje con el coordinador de agentes
    const response = await processAgentMessage(
      message,
      context,
      conversationId,
      preferredAgent as AgentType | undefined
    );

    // Retornar respuesta
    return NextResponse.json({
      success: true,
      response: response.message,
      agentType: response.agentType,
      status: response.status,
      actions: response.actions,
      suggestions: response.suggestions,
      toolsUsed: response.toolsUsed,
      executionTime: response.executionTime,
      confidence: response.confidence,
      needsEscalation: response.needsEscalation,
      escalationReason: response.escalationReason,
      metadata: response.metadata,
      conversationId: conversationId || `conv_${Date.now()}`
    });

  } catch (error: any) {
    logger.error('[Agents API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error procesando mensaje',
        message: 'Lo siento, hubo un error. Por favor, inténtalo de nuevo.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper para mapear roles de usuario a tipos de agente
function mapUserType(role: string | undefined): 'tenant' | 'landlord' | 'admin' | 'provider' | 'operador' | 'gestor' {
  switch (role) {
    case 'super_admin':
    case 'administrador':
    case 'admin':
      return 'admin';
    case 'gestor':
      return 'gestor';
    case 'operador':
      return 'operador';
    case 'tenant':
    case 'inquilino':
      return 'tenant';
    case 'landlord':
    case 'propietario':
      return 'landlord';
    case 'soporte':
    case 'provider':
      return 'provider';
    default:
      return 'admin';
  }
}
