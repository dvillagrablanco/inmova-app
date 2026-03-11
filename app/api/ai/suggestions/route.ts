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
  return `${SUGGESTIONS_CACHE_PREFIX}${userId}`;
}

async function getCachedSuggestions(userId: string) {
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

async function isSuggestionsAIConfigured() {
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

  const companyId = user.companyId;

  // Recopilar datos reales de la empresa para contexto enriquecido
  const today = new Date();
  const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in90days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const cid = companyId || undefined;
  const companyWhere = { companyId: cid };
  const buildingScope = { building: { companyId: cid } };
  const contractScope = { unit: { building: { companyId: cid } } };

  const [
    buildingsCount,
    tenantsCount,
    activeContractsCount,
    expiringContracts30d,
    expiringContracts90d,
    pendingPayments,
    overduePayments,
    vacantUnits,
    pendingMaintenance,
  ] = await Promise.all([
    prisma.building.count({ where: companyWhere }),
    prisma.tenant.count({ where: companyWhere }),
    prisma.contract.count({
      where: { ...contractScope, estado: 'activo' },
    }),
    prisma.contract.count({
      where: { ...contractScope, estado: 'activo', fechaFin: { gte: today, lte: in30days } },
    }),
    prisma.contract.count({
      where: { ...contractScope, estado: 'activo', fechaFin: { gte: today, lte: in90days } },
    }),
    prisma.payment.count({
      where: { contract: contractScope, estado: 'pendiente' },
    }),
    prisma.payment.count({
      where: { contract: contractScope, estado: 'atrasado' },
    }),
    prisma.unit.count({
      where: { ...buildingScope, estado: 'disponible' },
    }),
    prisma.maintenanceRequest.count({
      where: { ...contractScope, estado: 'pendiente' },
    }),
  ]);

  // Obtener edificios con contratos por vencer para sugerencias específicas
  let expiringByBuilding: Array<{ nombre: string; count: number }> = [];
  try {
    const expiring = await prisma.contract.findMany({
      where: { ...contractScope, estado: 'activo', fechaFin: { gte: today, lte: in90days } },
      select: { unit: { select: { building: { select: { nombre: true } } } } },
    });
    const byBuilding: Record<string, number> = {};
    expiring.forEach((c: any) => {
      const name = c.unit?.building?.nombre || 'Sin edificio';
      byBuilding[name] = (byBuilding[name] || 0) + 1;
    });
    expiringByBuilding = Object.entries(byBuilding)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch { /* skip */ }

  const userContext = {
    buildingsCount,
    tenantsCount,
    contractsCount: activeContractsCount,
    expiringContracts30d,
    expiringContracts90d,
    pendingPayments,
    overduePayments,
    vacantUnits,
    pendingMaintenance,
    expiringByBuilding,
    hasCompletedSetup: !!(user.name && user.email),
    ...context,
  };

  const systemPrompt = `Eres un asistente experto en gestión inmobiliaria patrimonial para sociedades como Rovida (garajes, locales) y Viroda (viviendas residenciales). Generas sugerencias proactivas BASADAS EN DATOS REALES.

REGLAS:
- Solo sugiere acciones que correspondan a datos reales (no inventes números)
- Prioriza: impagos > contratos por vencer > unidades vacías > mantenimiento
- Sé específico: menciona edificios, números, importes si los tienes
- Máximo 4 sugerencias, ordenadas por prioridad

Cada sugerencia DEBE tener:
- type: "warning" (urgente), "action" (acción directa), "tip" (mejora), "wizard" (proceso guiado)
- title: Título corto y directo (máx 60 chars)
- description: Descripción con datos concretos (máx 120 chars)
- priority: "high", "medium", "low"
- action: {label: "Texto botón", route: "/ruta-de-la-app"}
- dismissable: true

Rutas disponibles:
- /renovaciones-contratos (renovar contratos en lote)
- /pagos (gestión de pagos)
- /mantenimiento (incidencias)
- /edificios (gestión de edificios)
- /seguros (seguros)
- /inquilinos (gestión de inquilinos)
- /finanzas/conciliacion (conciliación bancaria)

Responde SOLO con JSON válido (sin markdown):
{"suggestions": [...]}`;

  const userMessage = `Datos reales de la empresa:
- ${buildingsCount} edificios, ${tenantsCount} inquilinos, ${activeContractsCount} contratos activos
- ${expiringContracts30d} contratos vencen en 30 días, ${expiringContracts90d} en 90 días
- ${pendingPayments} pagos pendientes, ${overduePayments} pagos atrasados
- ${vacantUnits} unidades vacías sin contrato
- ${pendingMaintenance} solicitudes de mantenimiento pendientes
${expiringByBuilding.length > 0 ? `- Contratos por vencer por edificio: ${expiringByBuilding.map(e => `${e.nombre} (${e.count})`).join(', ')}` : ''}

Genera sugerencias accionables basadas en estos datos.`;

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
