export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: /api/onboarding/chatbot
 * Endpoint para el chatbot de onboarding con IA
 * 
 * POST: Envía un mensaje y recibe una respuesta del asistente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  sendChatMessage,
  getWelcomeMessage,
  getQuickQuestions,
  ChatMessage,
} from '@/lib/onboarding-chatbot-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
/**
 * POST /api/onboarding/chatbot
 * Procesa un mensaje del usuario y devuelve la respuesta del chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Sin empresa asociada' },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const schema = z.object({
      message: z.string().min(1),
      conversationHistory: z
        .array(
          z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
          })
        )
        .optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { message, conversationHistory } = parsed.data;

    // Validaciones
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Obtener datos del usuario para contexto
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        experienceLevel: true,
        onboardingCompleted: true,
        company: {
          select: {
            businessVertical: true,
            verticals: true,
          },
        },
      },
    });

    // Obtener progreso de onboarding
    const onboardingTasks = await prisma.onboardingTask.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        status: true,
        taskId: true,
      },
    });

    const completedTasks = onboardingTasks
      .filter((t) => t.status === 'completed')
      .map((t) => t.taskId);

    const onboardingProgress =
      onboardingTasks.length > 0
        ? Math.round(
            (completedTasks.length / onboardingTasks.length) * 100
          )
        : 0;

    // Contexto del usuario
    const userContext = {
      userName: user?.name || undefined,
      vertical: user?.company?.businessVertical || user?.company?.verticals?.[0],
      onboardingProgress,
      completedTasks,
    };

    // Enviar mensaje al chatbot
    const response = await sendChatMessage(
      message,
      conversationHistory || [],
      userContext
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Error al procesar mensaje' },
        { status: 500 }
      );
    }

    // Guardar interacción en base de datos (opcional, para analytics)
    try {
      await prisma.chatbotInteraction.create({
        data: {
          userId: session.user.id,
          companyId,
          userMessage: message,
          botResponse: response.message || '',
          context: JSON.stringify(userContext),
        },
      });
    } catch (dbError) {
      // No fallar si no se puede guardar en DB
      logger.warn('[Chatbot] Could not save interaction to DB:', dbError);
    }

    return NextResponse.json({
      message: response.message,
      suggestedActions: response.suggestedActions,
    });
  } catch (error: unknown) {
    logger.error('[API] Error in POST /api/onboarding/chatbot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onboarding/chatbot
 * Obtiene el mensaje de bienvenida y preguntas rápidas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        company: {
          select: {
            businessVertical: true,
            verticals: true,
          },
        },
      },
    });

    const vertical = user?.company?.businessVertical || user?.company?.verticals?.[0];
    const welcomeMessage = getWelcomeMessage({
      userName: user?.name || undefined,
      vertical,
    });

    const quickQuestions = getQuickQuestions(vertical);

    return NextResponse.json({
      welcomeMessage,
      quickQuestions,
    });
  } catch (error: unknown) {
    logger.error('[API] Error in GET /api/onboarding/chatbot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
