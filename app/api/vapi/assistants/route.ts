/**
 * API para gestión de asistentes Vapi
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { VapiService, ALL_AGENTS, getAgentByType } from '@/lib/vapi/vapi-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Listar todos los asistentes de Inmova en Vapi
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    // Verificar credenciales
    const credentials = await VapiService.verifyCredentials();
    if (!credentials.valid) {
      return NextResponse.json({
        error: 'Credenciales de Vapi no válidas',
        details: credentials.error,
      }, { status: 500 });
    }
    
    // Obtener asistentes de Vapi
    const vapiAssistants = await VapiService.listAssistants();
    
    // Combinar con configuración local
    const assistants = ALL_AGENTS.map(agent => {
      const vapiAssistant = vapiAssistants.find(
        v => v.metadata?.agentId === agent.id
      );
      
      return {
        ...agent,
        vapiId: vapiAssistant?.id || null,
        synced: !!vapiAssistant,
        vapiCreatedAt: vapiAssistant?.createdAt || null,
      };
    });
    
    return NextResponse.json({
      success: true,
      assistants,
      stats: {
        total: ALL_AGENTS.length,
        synced: assistants.filter(a => a.synced).length,
        pending: assistants.filter(a => !a.synced).length,
      },
    });
    
  } catch (error: any) {
    logger.error('[Vapi Assistants GET Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear un asistente en Vapi
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    // Solo admins pueden crear asistentes
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    const body = await request.json();
    const { agentType, createAll } = body;
    
    // Crear todos los agentes
    if (createAll) {
      const result = await VapiService.setupAllAgents();
      return NextResponse.json({
        success: true,
        message: 'Proceso de creación completado',
        created: result.created,
        errors: result.errors,
      });
    }
    
    // Crear un agente específico
    if (!agentType) {
      return NextResponse.json(
        { error: 'Se requiere agentType o createAll=true' },
        { status: 400 }
      );
    }
    
    const agentConfig = getAgentByType(agentType);
    if (!agentConfig) {
      return NextResponse.json(
        { error: `Tipo de agente no válido: ${agentType}` },
        { status: 400 }
      );
    }
    
    const assistant = await VapiService.createAssistant(agentConfig);
    
    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        agentType: agentConfig.type,
      },
    }, { status: 201 });
    
  } catch (error: any) {
    logger.error('[Vapi Assistants POST Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
