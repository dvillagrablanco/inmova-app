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

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // 2. Obtener mensaje del usuario
    const body = await request.json();
    const { message, includeHistory = false } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 3. Obtener contexto del usuario
    const onboardingData = await getOnboardingProgress(user.id, session.user.companyId);
    const conversationHistory = includeHistory
      ? await getChatbotHistory(user.id, session.user.companyId)
      : [];

    const context = {
      userId: user.id,
      userName: user.name || 'Usuario',
      vertical: user.vertical,
      experienceLevel: user.experienceLevel,
      onboardingProgress: onboardingData?.percentage || 0,
      pendingTasks: onboardingData?.tasks?.filter((t: any) => t.status === 'pending') || [],
      completedTasks: onboardingData?.tasks?.filter((t: any) => t.status === 'completed') || [],
    };

    // 4. Generar respuesta del chatbot
    const botResponse = await generateChatbotResponse(context, message, conversationHistory);

    // 5. Guardar la interacción en BD
    await saveChatbotInteraction(user.id, message, botResponse, {
      vertical: user.vertical,
      onboardingProgress: context.onboardingProgress,
    });

    // 6. Generar sugerencias proactivas
    const suggestions = generateProactiveSuggestions(context);

    return NextResponse.json({
      response: botResponse,
      suggestions,
      context: {
        progress: context.onboardingProgress,
        pendingTasks: context.pendingTasks.length,
      },
    });
  } catch (error) {
    console.error('[API /chatbot] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
