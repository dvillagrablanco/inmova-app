/**
 * API Route: Test de IA (Claude)
 * 
 * POST /api/settings/integrations/ai/test
 * Prueba la conexión con Claude IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import * as ClaudeAIService from '@/lib/claude-ai-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { companyId } = await request.json();

    // Verificar permisos
    if (companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Obtener configuración
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        anthropicApiKey: true,
      },
    });

    // Obtener config (cliente o default de Inmova)
    const claudeConfig = ClaudeAIService.getConfig(company);

    if (!claudeConfig) {
      return NextResponse.json(
        { error: 'No hay configuración de IA disponible' },
        { status: 400 }
      );
    }

    // 3. Test de conexión (simple chat)
    const response = await ClaudeAIService.chat(
      claudeConfig,
      'Di "OK" si puedes leer este mensaje.',
      {
        systemPrompt: 'Eres un asistente de test. Responde brevemente.',
        maxTokens: 50,
      }
    );

    return NextResponse.json({
      success: true,
      model: 'claude-3-5-sonnet-20241022',
      mode: company?.anthropicApiKey ? 'own' : 'shared',
      testResponse: response,
    });
  } catch (error: any) {
    console.error('[AI Test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la prueba de conexión' },
      { status: 500 }
    );
  }
}
