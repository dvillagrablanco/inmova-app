import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  detectIntent,
  executeAction,
  generateContextualResponse,
  AssistantContext
} from '@/lib/ai-enhanced-assistant-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/ai/assistant
 * Asistente IA avanzado con detección de intenciones y ejecución automática
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Construir contexto del usuario
    const context: AssistantContext = {
      userId: session.user.id,
      userType: session.user.companyId ? 'admin' : 'tenant',
      userName: session.user.name || 'Usuario',
      userEmail: session.user.email || '',
      companyId: session.user.companyId || '',
      conversationHistory
    };

    logger.info(`🧠 AI Assistant - New message from ${context.userName} (${context.userType})`);

    // 1. Detectar intención
    const intentResult = await detectIntent(message, context);

    // 2. Si la intención requiere acción, ejecutarla
    let actionResult: any = null;
    if (
      intentResult.confidence > 0.7 &&
      ['create_maintenance_request', 'check_payment', 'view_contract', 'schedule_visit', 'document_request'].includes(intentResult.intent)
    ) {
      actionResult = await executeAction(intentResult, context);
      
      return NextResponse.json({
        type: 'action_executed',
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        action: actionResult,
        response: actionResult?.message || 'Acción ejecutada',
        entities: intentResult.entities
      });
    }

    // 3. Si no es una acción, generar respuesta contextual
    const response = await generateContextualResponse(
      message,
      context,
      intentResult.response
    );

    return NextResponse.json({
      type: 'conversational',
      response,
      intent: intentResult.intent,
      confidence: intentResult.confidence
    });
  } catch (error) {
    logger.error('Error en asistente IA:', error);
    return NextResponse.json(
      {
        error: 'Error procesando mensaje',
        response: 'Lo siento, hubo un error. Por favor, inténtalo de nuevo.'
      },
      { status: 500 }
    );
  }
}
