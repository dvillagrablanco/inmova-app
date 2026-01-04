/**
 * API Route: Chatbot Inteligente con IA
 * POST /api/ai/chat
 * 
 * Chatbot 24/7 especializado en PropTech
 * Responde preguntas sobre la plataforma, gestión inmobiliaria, etc.
 * 
 * Auth: Requiere sesión activa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as ClaudeAIService from '@/lib/claude-ai-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  context: z.string().optional(),
});

/**
 * POST /api/ai/chat
 * 
 * Body:
 * {
 *   message: string,
 *   conversationHistory?: ChatMessage[],
 *   context?: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   response: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión para usar el chatbot.' },
        { status: 401 }
      );
    }

    // 2. Verificar que Claude esté configurado
    if (!ClaudeAIService.isClaudeConfigured()) {
      return NextResponse.json(
        {
          error: 'IA no configurada',
          message: 'El chatbot no está disponible. Contacta al administrador para configurar Claude AI.',
        },
        { status: 503 }
      );
    }

    // 3. Parsear y validar body
    const body = await request.json();
    const validated = chatSchema.parse(body);

    // 4. Enriquecer contexto con info del usuario
    const userContext = `Usuario: ${session.user.name} (${session.user.email})
Role: ${session.user.role}
Company: ${session.user.companyId}`;

    const fullContext = validated.context
      ? `${userContext}\n\n${validated.context}`
      : userContext;

    // 5. Llamar a Claude AI
    const response = await ClaudeAIService.chat(validated.message, {
      conversationHistory: validated.conversationHistory,
      context: fullContext,
    });

    // 6. Respuesta exitosa
    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('[API AI Chat] Error:', error);

    // Error de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Error de IA
    if (error.message?.includes('IA') || error.message?.includes('chatbot')) {
      return NextResponse.json(
        {
          error: 'Error en chatbot',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        error: 'Error procesando mensaje',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
