/**
 * API: POST /api/agents/handoff
 * Transfiere una conversación de un agente a otro
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { agentCoordinator } from '@/lib/ai-agents';
import { AgentType, UserContext } from '@/lib/ai-agents/types';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
      conversationId,
      fromAgent,
      toAgent,
      reason
    } = body;

    // Validar parámetros
    if (!conversationId || !fromAgent || !toAgent) {
      return NextResponse.json(
        { error: 'Parámetros faltantes: conversationId, fromAgent, toAgent requeridos' },
        { status: 400 }
      );
    }

    // Construir contexto
    const context: UserContext = {
      userId: session.user.id || '',
      userType: mapUserType(session.user.role),
      userName: session.user.name || 'Usuario',
      userEmail: session.user.email || '',
      companyId: (session.user as any).companyId || '',
      role: session.user.role
    };

    logger.info(`🔄 [Agents API] Handoff request: ${fromAgent} -> ${toAgent}`);

    // Realizar handoff
    const response = await agentCoordinator.handoffToAgent(
      conversationId,
      fromAgent as AgentType,
      toAgent as AgentType,
      reason || 'Transferencia solicitada por usuario',
      context
    );

    return NextResponse.json({
      success: true,
      response: response.message,
      newAgent: toAgent,
      conversationId
    });

  } catch (error: any) {
    logger.error('[Agents API] Handoff error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error realizando transferencia',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

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
