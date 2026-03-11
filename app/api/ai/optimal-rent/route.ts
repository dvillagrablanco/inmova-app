import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const bodySchema = {
  unitId: (v: unknown) => (typeof v === 'string' ? v : null) as string | null,
  superficie: (v: unknown) => (typeof v === 'number' && v > 0 ? v : null) as number | null,
  ciudad: (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : null) as string | null,
  tipo: (v: unknown) => (typeof v === 'string' ? v : null) as string | null,
  habitaciones: (v: unknown) => (typeof v === 'number' && v >= 0 ? v : null) as number | null,
};

/**
 * POST /api/ai/optimal-rent
 * Suggests optimal rent based on market data and optionally AI.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    const unitId = bodySchema.unitId(body.unitId);
    const superficie = bodySchema.superficie(body.superficie);
    const ciudad = bodySchema.ciudad(body.ciudad);
    const tipo = bodySchema.tipo(body.tipo);
    const habitaciones = bodySchema.habitaciones(body.habitaciones);

    let targetSuperficie: number;
    let targetCiudad: string;
    let targetTipo: string | null = null;
    let targetHabitaciones: number | null = null;

    if (unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: unitId,
          building: { companyId: session.user.companyId ?? undefined },
        },
        include: {
          building: true,
        },
      });
      if (!unit) {
        return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
      }
      targetSuperficie = unit.superficie;
      targetCiudad =
        ciudad ||
        unit.building.direccion
          .split(',')
          .map((segment) => segment.trim())
          .filter(Boolean)
          .pop() ||
        '';
      targetTipo = unit.tipo;
      targetHabitaciones = unit.habitaciones;
    } else if (superficie && ciudad) {
      targetSuperficie = superficie;
      targetCiudad = ciudad;
      targetTipo = tipo;
      targetHabitaciones = habitaciones;
    } else {
      return NextResponse.json(
        { error: 'Se requiere unitId o (superficie + ciudad)' },
        { status: 400 }
      );
    }

    const similarWhere: Record<string, unknown> = {
      building: {
        direccion: { contains: targetCiudad, mode: 'insensitive' },
        companyId: session.user.companyId ?? undefined,
      },
      superficie: {
        gte: targetSuperficie * 0.8,
        lte: targetSuperficie * 1.2,
      },
      isDemo: false,
    };
    if (targetTipo) {
      (similarWhere as any).tipo = targetTipo;
    }
    if (targetHabitaciones != null && targetHabitaciones > 0) {
      (similarWhere as any).habitaciones = targetHabitaciones;
    }

    const contractWhere: Record<string, unknown> = {
      estado: 'activo',
      unit: similarWhere as any,
      isDemo: false,
    };
    if (unitId) {
      contractWhere.unitId = { not: unitId };
    }

    const similarUnits = await prisma.contract.findMany({
      where: contractWhere as any,
      select: {
        rentaMensual: true,
        unit: {
          select: {
            superficie: true,
            superficieUtil: true,
          },
        },
      },
    });

    const rentsPerM2 = similarUnits
      .map((c) => {
        const sup = c.unit.superficieUtil ?? c.unit.superficie;
        return sup > 0 ? c.rentaMensual / sup : 0;
      })
      .filter((r) => r > 0);

    const unitsAnalyzed = rentsPerM2.length;

    let medianPerM2 = 0;
    let p25 = 0;
    let p75 = 0;

    if (rentsPerM2.length > 0) {
      const sorted = [...rentsPerM2].sort((a, b) => a - b);
      medianPerM2 = sorted[Math.floor(sorted.length / 2)] ?? 0;
      p25 = sorted[Math.floor(sorted.length * 0.25)] ?? medianPerM2;
      p75 = sorted[Math.floor(sorted.length * 0.75)] ?? medianPerM2;
    }

    const minRent = Math.round(p25 * targetSuperficie * 100) / 100;
    const optimalRent = Math.round(medianPerM2 * targetSuperficie * 100) / 100;
    const maxRent = Math.round(p75 * targetSuperficie * 100) / 100;

    let aiRecommendation: string | undefined;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && unitsAnalyzed > 0) {
      try {
        const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
        const anthropic = new Anthropic({ apiKey });

        const prompt = `Eres un experto en valoración inmobiliaria. Analiza estos datos de mercado:

- Ciudad: ${targetCiudad}
- Superficie objetivo: ${targetSuperficie} m²
- Tipo: ${targetTipo ?? 'no especificado'}
- Habitaciones: ${targetHabitaciones ?? 'no especificado'}
- Unidades similares analizadas: ${unitsAnalyzed}
- Precio medio por m²: ${medianPerM2.toFixed(2)}€
- Percentil 25: ${p25.toFixed(2)}€
- Percentil 75: ${p75.toFixed(2)}€
- Renta sugerida (min/óptima/max): ${minRent}€ / ${optimalRent}€ / ${maxRent}€

Proporciona una recomendación breve (2-4 frases) con razonamiento y posibles factores a considerar. Responde en español.`;

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL_PRIMARY,
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
        aiRecommendation = textContent.trim() || undefined;
      } catch (aiError) {
        logger.warn('[Optimal Rent] AI recommendation failed:', aiError);
      }
    }

    return NextResponse.json({
      suggestedRent: { min: minRent, optimal: optimalRent, max: maxRent },
      marketData: {
        medianPerM2,
        p25,
        p75,
        unitsAnalyzed,
      },
      aiRecommendation,
    });
  } catch (error: unknown) {
    logger.error('[Optimal Rent]:', error);
    return NextResponse.json({ error: 'Error calculando renta óptima' }, { status: 500 });
  }
}
