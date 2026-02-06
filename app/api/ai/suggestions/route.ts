import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SUGGESTIONS_RATE_LIMIT = {
  interval: 60 * 1000,
  uniqueTokenPerInterval: 30,
};

function isSuggestionsAIConfigured() {
  return !!process.env.ABACUSAI_API_KEY;
}

async function generateSuggestions({
  userId,
  context,
}: {
  userId: string;
  context?: Record<string, unknown>;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: 'User not found', status: 404 as const };
  }

  const userContext = {
    buildingsCount: 0,
    tenantsCount: 0,
    contractsCount: 0,
    hasCompletedSetup: !!(user.name && user.email),
    ...context,
  };

  const systemPrompt = `Eres un asistente experto en gestión inmobiliaria que genera sugerencias proactivas para mejorar la productividad del usuario.

Basándote en el contexto del usuario, genera hasta 3 sugerencias relevantes y accionables.

Cada sugerencia debe tener:
- type: "wizard" (abre un asistente paso a paso), "action" (acción directa), "tip" (consejo), o "warning" (advertencia)
- title: Título corto y claro
- description: Descripción de 1-2 líneas
- priority: "high", "medium", o "low"
- action: {label: "Texto del botón", route: "/ruta" o callback: "functionName"}
- dismissable: true/false

Ejemplos de sugerencias:
- Si no tiene edificios: Sugerir crear el primero
- Si no tiene inquilinos: Sugerir registrar uno
- Si tiene edificios pero no contratos: Sugerir crear contrato
- Si no ha completado el setup: Sugerir completarlo
- Si tiene muchos pagos pendientes: Avisar de morosidad
- Si no ha configurado integraciones: Sugerir configurar contabilidad

Responde en JSON con la siguiente estructura:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "wizard",
      "title": "...",
      "description": "...",
      "priority": "high",
      "action": {"label": "...", "route": "..."},
      "dismissable": true
    }
  ]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

  const userMessage = `Contexto del usuario:
- Edificios registrados: ${userContext.buildingsCount}
- Inquilinos registrados: ${userContext.tenantsCount}
- Contratos activos: ${userContext.contractsCount}
- Setup completado: ${userContext.hasCompletedSetup ? 'Sí' : 'No'}

Genera sugerencias relevantes para ayudar al usuario.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    throw new Error('Error calling LLM API');
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  return { result };
}

/**
 * API para generar sugerencias proactivas usando IA
 */
export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isSuggestionsAIConfigured()) {
          logger.warn('[AI Suggestions] ABACUSAI_API_KEY no configurada');
          return NextResponse.json({ suggestions: [] }, { status: 200 });
        }

        const { result, error, status } = await generateSuggestions({
          userId: session.user.id,
        });

        if (error) {
          return NextResponse.json({ error }, { status });
        }

        return NextResponse.json(result);
      } catch (error) {
        logger.error('Error generating suggestions (GET):', error);
        return NextResponse.json({ suggestions: [] }, { status: 200 });
      }
    },
    SUGGESTIONS_RATE_LIMIT
  );
}

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isSuggestionsAIConfigured()) {
          logger.warn('[AI Suggestions] ABACUSAI_API_KEY no configurada');
          return NextResponse.json({ suggestions: [] }, { status: 200 });
        }

        const { userId, context } = await request.json();

        const { result, error, status } = await generateSuggestions({
          userId: userId || session.user.id,
          context,
        });

        if (error) {
          return NextResponse.json({ error }, { status });
        }

        return NextResponse.json(result);
      } catch (error) {
        logger.error('Error generating suggestions:', error);
        return NextResponse.json({ suggestions: [] }, { status: 200 });
      }
    },
    SUGGESTIONS_RATE_LIMIT
  );
}
