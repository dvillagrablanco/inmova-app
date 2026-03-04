import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

/**
 * POST /api/ai/financial-anomalies
 * Analiza datos financieros de la empresa para detectar anomalías con Claude.
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
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Query: payments, expenses, contracts (last 3 months)
    const [payments, expenses, contracts, overduePayments, paymentAmounts] = await Promise.all([
      prisma.payment.findMany({
        where: {
          contract: { unit: { building: { companyId: { in: companyIds } } } },
          createdAt: { gte: threeMonthsAgo },
          isDemo: false,
        },
        select: {
          id: true,
          monto: true,
          estado: true,
          fechaVencimiento: true,
          fechaPago: true,
          periodo: true,
          contract: {
            select: {
              tenant: { select: { nombreCompleto: true } },
              unit: { select: { numero: true, building: { select: { nombre: true } } } },
            },
          },
        },
        orderBy: { fechaVencimiento: 'desc' },
      }),
      prisma.expense.findMany({
        where: {
          building: { companyId: { in: companyIds } },
          fecha: { gte: threeMonthsAgo },
          isDemo: false,
        },
        select: {
          id: true,
          concepto: true,
          categoria: true,
          monto: true,
          fecha: true,
        },
        orderBy: { fecha: 'desc' },
      }),
      prisma.contract.findMany({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          estado: 'activo',
        },
        select: {
          id: true,
          rentaMensual: true,
          fechaInicio: true,
          fechaFin: true,
          tenant: { select: { nombreCompleto: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
      }),
      prisma.payment.aggregate({
        where: {
          contract: { unit: { building: { companyId: { in: companyIds } } } },
          estado: 'atrasado',
          isDemo: false,
        },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.payment.findMany({
        where: {
          contract: { unit: { building: { companyId: { in: companyIds } } } },
          createdAt: { gte: threeMonthsAgo },
          isDemo: false,
        },
        select: { monto: true },
      }),
    ]);

    const totalPayments = payments.reduce((s, p) => s + p.monto, 0);
    const overdueTotal = overduePayments._sum?.monto ?? 0;
    const overdueCount = overduePayments._count ?? 0;

    // Expense trends by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expensesByCategory[e.categoria] = (expensesByCategory[e.categoria] || 0) + e.monto;
    });

    // Unusual amounts: payments that deviate from median
    const amounts = paymentAmounts.map((p) => p.monto).filter((a) => a > 0);
    const median =
      amounts.length > 0
        ? amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)]
        : 0;
    const unusualAmounts = payments.filter(
      (p) => median > 0 && (p.monto > median * 2 || p.monto < median * 0.5)
    );

    // Build tenant delays summary
    const tenantDelays = payments
      .filter((p) => p.estado === 'atrasado')
      .reduce((acc: Record<string, number>, p) => {
        const name = p.contract?.tenant?.nombreCompleto || 'Desconocido';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
    const tenantDelaysText =
      Object.keys(tenantDelays).length > 0
        ? Object.entries(tenantDelays).map(([n, c]) => `- ${n}: ${c} pagos atrasados`).join('\n')
        : '- Ninguno';

    const fullSummary = `
RESUMEN FINANCIERO (últimos 3 meses):

PAGOS:
- Total pagos registrados: ${payments.length}
- Importe total pagos: ${totalPayments.toFixed(2)}€
- Pagos atrasados: ${overdueCount} (importe: ${overdueTotal.toFixed(2)}€)
- Pagos pendientes: ${payments.filter((p) => p.estado === 'pendiente').length}
- Pagos con importes inusuales (fuera de rango): ${unusualAmounts.length}
${unusualAmounts.length > 0 ? `  Detalle: ${unusualAmounts.slice(0, 5).map((p) => `${p.periodo} ${p.monto}€ (${p.contract?.tenant?.nombreCompleto})`).join('; ')}` : ''}

GASTOS:
- Total gastos: ${expenses.length}
- Importe total: ${expenses.reduce((s, e) => s + e.monto, 0).toFixed(2)}€
- Por categoría: ${Object.entries(expensesByCategory).map(([k, v]) => `${k}: ${v.toFixed(0)}€`).join(', ')}

CONTRATOS ACTIVOS:
- Total: ${contracts.length}
- Renta mensual total: ${contracts.reduce((s, c) => s + c.rentaMensual, 0).toFixed(2)}€

INQUILINOS CON RETRASOS:
${tenantDelaysText}
`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        anomalies: [],
        analyzedAt: new Date().toISOString(),
        message: 'IA no configurada',
      });
    }

    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un analista financiero experto en gestión inmobiliaria. Analiza los siguientes datos y detecta anomalías.

${fullSummary}

Identifica:
1. Anomalías: pagos duplicados, importes sospechosos, patrones inusuales
2. Pagos duplicados: posibles cobros repetidos por el mismo periodo
3. Patrones de gastos inusuales: gastos que se desvían de la media por categoría
4. Inquilinos con retrasos crecientes: inquilinos que acumulan más pagos atrasados

Responde ÚNICAMENTE con un JSON válido, sin texto adicional antes o después, con esta estructura exacta:
{
  "anomalies": [
    {
      "type": "duplicate_payment" | "unusual_amount" | "expense_pattern" | "tenant_delays" | "other",
      "severity": "low" | "medium" | "high" | "critical",
      "title": "string corto",
      "description": "string detallado",
      "recommendation": "string con acción recomendada"
    }
  ]
}

Si no encuentras anomalías, devuelve {"anomalies": []}.`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent =
      response.content[0].type === 'text' ? response.content[0].text : '{"anomalies":[]}';

    let parsed: { anomalies: Anomaly[] };
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { anomalies: [] };
    } catch {
      parsed = { anomalies: [] };
    }

    return NextResponse.json({
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error('[Financial Anomalies]:', error);
    return NextResponse.json(
      {
        error: 'Error analizando datos financieros',
        anomalies: [],
        analyzedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
