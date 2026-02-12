import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiting';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const SUGGESTIONS_RATE_LIMIT = {
  interval: 60 * 1000,
  uniqueTokenPerInterval: 30,
};
const SUGGESTIONS_CACHE_TTL_SECONDS = 60;
const SUGGESTIONS_CACHE_PREFIX = 'ai:suggestions:';
const SUGGESTIONS_TIMEOUT_MS = 12000;

function getCacheKey(userId: string) {
  const prisma = await getPrisma();
  return `${SUGGESTIONS_CACHE_PREFIX}${userId}`;
}

async function getCachedSuggestions(userId: string) {
  const prisma = await getPrisma();
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    const cached = await redis.get(getCacheKey(userId));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCachedSuggestions(userId: string, payload: unknown) {
  const prisma = await getPrisma();
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.setex(
      getCacheKey(userId),
      SUGGESTIONS_CACHE_TTL_SECONDS,
      JSON.stringify(payload)
    );
  } catch (error) {
    logger.warn('[AI Suggestions] Error setting cache:', error);
  }
}

function isSuggestionsAIConfigured() {
  const prisma = await getPrisma();
  return !!process.env.ABACUSAI_API_KEY;
}

async function generateSuggestions({
  userId,
  context,
}: {
  userId: string;
  context?: Record<string, unknown>;
}) {
  const prisma = await getPrisma();
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUGGESTIONS_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Timeout al llamar al proveedor de IA');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Error calling LLM API (${response.status}): ${errorBody}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('Respuesta inválida del proveedor de IA');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Respuesta incompleta del proveedor de IA');
  }

  let result: any;
  try {
    result = JSON.parse(content);
  } catch {
    throw new Error('Respuesta JSON inválida del proveedor de IA');
  }
  return { result };
}

/**
 * API para generar sugerencias proactivas usando IA
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
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

        const { searchParams } = new URL(request.url);
        const skipCache = searchParams.get('fresh') === 'true';

        if (!skipCache) {
          const cached = await getCachedSuggestions(session.user.id);
          if (cached) {
            return NextResponse.json(cached);
          }
        }

        const { result, error, status } = await generateSuggestions({
          userId: session.user.id,
        });

        if (error) {
          return NextResponse.json({ error }, { status });
        }

        await setCachedSuggestions(session.user.id, result);
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
  const prisma = await getPrisma();
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
