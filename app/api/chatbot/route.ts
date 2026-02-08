export const dynamic = 'force-dynamic';

/**
 * API: POST /api/chatbot
 * Chatbot IA para asistencia durante el onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateChatbotResponse,
  saveChatbotInteraction,
  getChatbotHistory,
  generateProactiveSuggestions,
} from '@/lib/onboarding-chatbot-service';
import { getOnboardingProgress } from '@/lib/onboarding-service';

import logger from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as {
      id: string;
      companyId?: string | null;
      name?: string | null;
      vertical?: string | null;
      experienceLevel?: string | null;
    };

    // 2. Obtener mensaje del usuario
    const body = await request.json();
    const { message, includeHistory = false } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 3. Obtener contexto del usuario
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Usuario sin empresa asociada' },
        { status: 400 }
      );
    }

    const onboardingData = await getOnboardingProgress(user.id, user.companyId);
    const conversationHistory = includeHistory
      ? (await getChatbotHistory(user.id, user.companyId)).slice(-5) // Últimos 5 mensajes
      : [];

    type OnboardingTask = {
      status: 'pending' | 'completed' | 'in_progress' | 'skipped';
    };

    const context = {
      userId: user.id,
      userName: user.name || 'Usuario',
      vertical: user.vertical,
      experienceLevel: user.experienceLevel,
      onboardingProgress:
        onboardingData?.percentage ??
        onboardingData?.percentageComplete ??
        0,
      pendingTasks:
        onboardingData?.tasks?.filter(
          (t: OnboardingTask) => t.status === 'pending' || t.status === 'in_progress'
        ) || [],
      completedTasks:
        onboardingData?.tasks?.filter((t: OnboardingTask) => t.status === 'completed') || [],
      conversationHistory,
    };

    // 4. Generar respuesta del chatbot
    const botResponse = await generateChatbotResponse(message, context);

    // 5. Guardar la interacción en BD
    await saveChatbotInteraction(user.id, user.companyId, {
      message,
      response: botResponse,
      vertical: user.vertical,
      onboardingProgress: context.onboardingProgress,
    });

    // 6. Generar sugerencias proactivas
    const suggestions = await generateProactiveSuggestions(user.id, user.companyId);

    return NextResponse.json({
      response: botResponse,
      suggestions,
      context: {
        progress: context.onboardingProgress,
        pendingTasks: context.pendingTasks.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API /chatbot] Error:', { message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
