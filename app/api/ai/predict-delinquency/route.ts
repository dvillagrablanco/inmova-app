import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import { subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

interface Prediction {
  tenantId: string;
  nombre: string;
  riskScore: number;
  probability: number;
  trend: 'improving' | 'stable' | 'worsening';
  reasons: string[];
  recommendation: string;
}

/**
 * POST /api/ai/predict-delinquency
 * Predicts delinquency risk for tenants based on payment history.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as { role?: string }).role as any,
      primaryCompanyId: session.user?.companyId ?? undefined,
      request,
    });

    if (!scope.activeCompanyId || scope.scopeCompanyIds.length === 0) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const companyIds = scope.scopeCompanyIds;
    const twelveMonthsAgo = subMonths(new Date(), 12);

    const tenants = await prisma.tenant.findMany({
      where: {
        companyId: { in: companyIds },
        isDemo: false,
      },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        contracts: {
          select: {
            id: true,
            payments: {
              where: { fechaVencimiento: { gte: twelveMonthsAgo } },
              select: {
                id: true,
                monto: true,
                fechaVencimiento: true,
                fechaPago: true,
                estado: true,
                periodo: true,
              },
              orderBy: { fechaVencimiento: 'asc' },
            },
          },
        },
      },
    });

    const predictions: Prediction[] = [];

    for (const tenant of tenants) {
      const allPayments = tenant.contracts.flatMap((c) => c.payments);
      const paidPayments = allPayments.filter((p) => p.fechaPago != null);
      const totalPaid = paidPayments.length;

      let lateCount = 0;
      let totalDaysLate = 0;
      const overdueAmount = allPayments
        .filter((p) => !p.fechaPago && new Date(p.fechaVencimiento) < new Date())
        .reduce((s, p) => s + p.monto, 0);

      for (const p of paidPayments) {
        if (p.fechaPago && p.fechaVencimiento && p.fechaPago > p.fechaVencimiento) {
          lateCount++;
          const daysLate = Math.ceil(
            (new Date(p.fechaPago).getTime() - new Date(p.fechaVencimiento).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          totalDaysLate += daysLate;
        }
      }

      const avgDaysLate = lateCount > 0 ? totalDaysLate / lateCount : 0;
      const lateFrequency = totalPaid > 0 ? lateCount / totalPaid : 0;

      const monthsByMonth = paidPayments.reduce(
        (acc: Record<string, number>, p) => {
          if (!p.fechaPago || !p.fechaVencimiento) return acc;
          const key = p.periodo?.slice(0, 7) || p.fechaVencimiento.toISOString().slice(0, 7);
          const daysLate = p.fechaPago > p.fechaVencimiento
            ? Math.ceil(
                (new Date(p.fechaPago).getTime() - new Date(p.fechaVencimiento).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0;
          acc[key] = (acc[key] ?? 0) + daysLate;
          return acc;
        },
        {} as Record<string, number>
      );

      const sortedMonths = Object.keys(monthsByMonth).sort();
      let trend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (sortedMonths.length >= 3) {
        const first = monthsByMonth[sortedMonths[0]] ?? 0;
        const mid = monthsByMonth[sortedMonths[Math.floor(sortedMonths.length / 2)]] ?? 0;
        const last = monthsByMonth[sortedMonths[sortedMonths.length - 1]] ?? 0;
        if (last > mid && mid > first) trend = 'worsening';
        else if (last < mid && mid < first) trend = 'improving';
      }

      let riskScore = 0;
      const reasons: string[] = [];

      if (lateFrequency > 0.5) {
        riskScore += 40;
        reasons.push(`Alta frecuencia de pagos atrasados (${Math.round(lateFrequency * 100)}%)`);
      } else if (lateFrequency > 0.2) {
        riskScore += 25;
        reasons.push(`Frecuencia moderada de pagos atrasados (${Math.round(lateFrequency * 100)}%)`);
      }

      if (avgDaysLate > 15) {
        riskScore += 30;
        reasons.push(`Promedio de ${Math.round(avgDaysLate)} días de retraso`);
      } else if (avgDaysLate > 7) {
        riskScore += 15;
        reasons.push(`Promedio de ${Math.round(avgDaysLate)} días de retraso`);
      }

      if (trend === 'worsening') {
        riskScore += 20;
        reasons.push('Tendencia empeorando: retrasos aumentan mes a mes');
      }

      if (overdueAmount > 0) {
        riskScore += 25;
        reasons.push(`Importe pendiente actual: ${overdueAmount.toFixed(2)}€`);
      }

      if (reasons.length === 0) {
        reasons.push('Historial de pagos puntual');
      }

      riskScore = Math.min(100, riskScore);
      const probability = Math.min(riskScore / 100, 0.99);

      let recommendation = 'Monitoreo rutinario.';
      if (riskScore >= 70) {
        recommendation = 'Contacto urgente. Revisar plan de pago y considerar medidas legales.';
      } else if (riskScore >= 50) {
        recommendation = 'Contacto proactivo. Solicitar regularización y documentar comunicaciones.';
      } else if (riskScore >= 30) {
        recommendation = 'Recordatorios preventivos. Ofrecer facilidades si es necesario.';
      }

      predictions.push({
        tenantId: tenant.id,
        nombre: tenant.nombreCompleto,
        riskScore,
        probability,
        trend,
        reasons,
        recommendation,
      });
    }

    predictions.sort((a, b) => b.riskScore - a.riskScore);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && predictions.length > 0) {
      try {
        const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
        const anthropic = new Anthropic({ apiKey });

        const summary = predictions
          .slice(0, 15)
          .map(
            (p) =>
              `- ${p.nombre}: score=${p.riskScore}, tendencia=${p.trend}, motivos: ${p.reasons.join('; ')}`
          )
          .join('\n');

        const prompt = `Eres un experto en riesgo de morosidad inmobiliaria. Analiza estos inquilinos y sus predicciones:

${summary}

Para cada uno de los primeros 5 con mayor riesgo, proporciona:
1. Una breve validación o ajuste del score si aplica
2. Una recomendación más específica y accionable

Responde ÚNICAMENTE con un JSON válido:
{
  "adjustments": [
    { "tenantId": "string", "adjustedScore": number, "refinedRecommendation": "string" }
  ]
}

Si no hay ajustes necesarios, devuelve {"adjustments": []}.`;

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL_PRIMARY,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent =
          response.content[0].type === 'text' ? response.content[0].text : '{"adjustments":[]}';
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as { adjustments?: Array<{ tenantId: string; adjustedScore?: number; refinedRecommendation?: string }> };
          const adjustments = parsed.adjustments ?? [];
          for (const adj of adjustments) {
            const pred = predictions.find((p) => p.tenantId === adj.tenantId);
            if (pred) {
              if (adj.adjustedScore != null) pred.riskScore = adj.adjustedScore;
              if (adj.refinedRecommendation) pred.recommendation = adj.refinedRecommendation;
            }
          }
        }
      } catch (aiError) {
        logger.warn('[Predict Delinquency] AI enrichment failed, using rule-based only:', aiError);
      }
    }

    return NextResponse.json({
      predictions,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error('[Predict Delinquency]:', error);
    return NextResponse.json(
      {
        error: 'Error analizando riesgo de morosidad',
        predictions: [],
        analyzedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
