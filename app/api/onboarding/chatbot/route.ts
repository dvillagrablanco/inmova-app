export const dynamic = 'force-dynamic';

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

    const body = await request.json();
    const { message, conversationHistory } = body;

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
            vertical: true,
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
      vertical: user?.company?.vertical || undefined,
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
          companyId: session.user.companyId || '',
          userMessage: message,
          botResponse: response.message || '',
          context: JSON.stringify(userContext),
        },
      });
    } catch (dbError) {
      // No fallar si no se puede guardar en DB
      console.warn('[Chatbot] Could not save interaction to DB:', dbError);
    }

    return NextResponse.json({
      message: response.message,
      suggestedActions: response.suggestedActions,
    });
  } catch (error) {
    console.error('[API] Error in POST /api/onboarding/chatbot:', error);
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
            vertical: true,
          },
        },
      },
    });

    const welcomeMessage = getWelcomeMessage({
      userName: user?.name || undefined,
      vertical: user?.company?.vertical || undefined,
    });

    const quickQuestions = getQuickQuestions(
      user?.company?.vertical || undefined
    );

    return NextResponse.json({
      welcomeMessage,
      quickQuestions,
    });
  } catch (error) {
    console.error('[API] Error in GET /api/onboarding/chatbot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
