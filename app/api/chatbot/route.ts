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

    const user = session.user as any;

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
    const onboardingData = user.companyId
      ? await getOnboardingProgress(user.id, user.companyId)
      : null;
    const companyId = user.companyId || '';
    const conversationHistory =
      includeHistory && companyId ? await getChatbotHistory(user.id, companyId) : [];

    const context = {
      userId: user.id,
      userName: user.name || 'Usuario',
      vertical: user.vertical,
      experienceLevel: user.experienceLevel,
      onboardingProgress: onboardingData?.percentage ?? 0,
      pendingTasks: onboardingData?.tasks?.filter((t: any) => t.status === 'pending') || [],
      completedTasks: onboardingData?.tasks?.filter((t: any) => t.status === 'completed') || [],
    };

    // 4. Generar respuesta del chatbot
    const botResponse = await generateChatbotResponse(
      {
        ...context,
        conversationHistory,
      },
      message,
      conversationHistory
    );

    // 5. Guardar la interacción en BD
    await saveChatbotInteraction(user.id, message, botResponse, {
      companyId,
      context: {
        ...context,
        historyCount: conversationHistory.length,
      },
    });

    // 6. Generar sugerencias proactivas
    const suggestions = await generateProactiveSuggestions({
      companyId,
      ...context,
    });

    return NextResponse.json({
      response: botResponse,
      suggestions,
      context: {
        progress: context.onboardingProgress,
        pendingTasks: context.pendingTasks.length,
      },
    });
  } catch (error) {
    logger.error('[API /chatbot] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
