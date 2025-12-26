import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { processAIQuery, executeTool, AVAILABLE_TOOLS } from '@/lib/ai-workflow-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/chat - Procesa consultas del asistente IA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory, toolCall } = body;

    // Si es una llamada directa a herramienta (tool call)
    if (toolCall) {
      const result = await executeTool(toolCall.name, toolCall.input, {
        companyId: session.user.companyId,
        userId: session.user.id,
      });

      return NextResponse.json({
        success: true,
        toolResult: result,
      });
    }

    // Si es una consulta normal de chat
    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const result = await processAIQuery(
      message,
      {
        companyId: session.user.companyId,
        userId: session.user.id,
      },
      conversationHistory || []
    );

    logger.info('Consulta de IA procesada', {
      userId: session.user.id,
      toolsUsed: result.toolsUsed,
    });

    return NextResponse.json({
      success: result.success,
      response: result.response,
      toolsUsed: result.toolsUsed,
    });
  } catch (error) {
    logError(error as Error, { context: 'Error en endpoint de IA' });
    return NextResponse.json({ error: 'Error procesando la solicitud' }, { status: 500 });
  }
}

/**
 * GET /api/ai/chat - Obtiene las herramientas disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json({
      tools: AVAILABLE_TOOLS,
      message: 'Herramientas disponibles para el asistente IA',
    });
  } catch (error) {
    logError(error as Error, { context: 'Error obteniendo herramientas de IA' });
    return NextResponse.json({ error: 'Error al obtener herramientas' }, { status: 500 });
  }
}
