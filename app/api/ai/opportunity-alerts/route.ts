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

type OpportunityType = 'rent_increase' | 'renewal' | 'insurance' | 'vacancy';

interface Opportunity {
  type: OpportunityType;
  title: string;
  description: string;
  estimatedImpact: number;
  entityId: string;
  entityType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * GET /api/ai/opportunity-alerts
 * Detects opportunities: rent below market, renewals, insurance expiry, vacancy.
 * Uses Claude if ANTHROPIC_API_KEY set, else rule-based.
 */
export async function GET(request: NextRequest) {
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
    const now = new Date();
    const in60Days = new Date(now);
    in60Days.setDate(in60Days.getDate() + 60);
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    // 1. Units with rent below estimated market (renta < superficie * 10)
    const unitsWithRent = await prisma.unit.findMany({
      where: {
        building: { companyId: { in: companyIds } },
        superficie: { gt: 0 },
        OR: [
          { estado: 'ocupada' },
          { estado: 'disponible' },
        ],
      },
      include: {
        building: { select: { nombre: true, direccion: true } },
        contracts: {
          where: { estado: 'activo' },
          select: { rentaMensual: true },
          take: 1,
        },
      },
    });

    const rentOpportunities: Opportunity[] = [];
    for (const u of unitsWithRent) {
      const rent = u.contracts?.[0]?.rentaMensual ?? u.rentaMensual ?? 0;
      const marketRent = (u.superficie || 0) * 10;
      if (rent > 0 && marketRent > 0 && rent < marketRent * 0.85) {
        const gap = marketRent - rent;
        rentOpportunities.push({
          type: 'rent_increase',
          title: `Renta por debajo de mercado: ${u.building?.nombre || u.numero}`,
          description: `Unidad ${u.numero} (${u.superficie}m²) renta ${rent.toFixed(0)}€/mes vs mercado ~${marketRent.toFixed(0)}€/mes. Gap: ${gap.toFixed(0)}€/mes.`,
          estimatedImpact: gap * 12,
          entityId: u.id,
          entityType: 'unit',
          priority: gap > 200 ? 'high' : 'medium',
        });
      }
    }

    // 2. Contracts expiring in 60 days with high-score tenants
    const expiringContracts = await prisma.contract.findMany({
      where: {
        unit: { building: { companyId: { in: companyIds } } },
        estado: 'activo',
        fechaFin: { gte: now, lte: in60Days },
      },
      include: {
        tenant: { select: { id: true, nombreCompleto: true } },
        unit: { select: { numero: true, building: { select: { nombre: true } } } },
      },
    });

    const tenantIds = [...new Set(expiringContracts.map((c) => c.tenantId))];
    const behaviors =
      tenantIds.length > 0
        ? await prisma.tenantBehavior.findMany({
            where: { tenantId: { in: tenantIds } },
            orderBy: { fecha: 'desc' },
            select: { tenantId: true, scoreComportamiento: true },
          })
        : [];
    const scoreMap = new Map<string, number>();
    behaviors.forEach((b) => {
      if (!scoreMap.has(b.tenantId)) scoreMap.set(b.tenantId, b.scoreComportamiento ?? 50);
    });

    const renewalOpportunities: Opportunity[] = [];
    for (const c of expiringContracts) {
      const score = scoreMap.get(c.tenantId) ?? 50;
      if (score >= 70) {
        const monthlyRent = c.rentaMensual || 0;
        renewalOpportunities.push({
          type: 'renewal',
          title: `Renovación prioritaria: ${c.tenant?.nombreCompleto}`,
          description: `Contrato vence ${c.fechaFin.toLocaleDateString('es-ES')}. Inquilino score ${score}. ${c.unit?.building?.nombre} - ${c.unit?.numero}.`,
          estimatedImpact: monthlyRent * 12,
          entityId: c.id,
          entityType: 'contract',
          priority: score >= 85 ? 'high' : 'medium',
        });
      }
    }

    // 3. Insurance policies expiring soon
    const expiringInsurance = await prisma.insurancePolicy.findMany({
      where: {
        companyId: { in: companyIds },
        fechaVencimiento: { gte: now, lte: in30Days },
        estado: 'activa',
      },
      include: { building: { select: { nombre: true } } },
    });

    const insuranceOpportunities: Opportunity[] = expiringInsurance.map((p) => ({
      type: 'insurance',
      title: `Seguro próximo a vencer: ${p.tipoSeguro}`,
      description: `Póliza ${p.numeroPoliza} (${p.aseguradora}) vence ${p.fechaVencimiento.toLocaleDateString('es-ES')}. ${p.building?.nombre || 'General'}.`,
      estimatedImpact: p.primaAnual || 0,
      entityId: p.id,
      entityType: 'insurance',
      priority: 'high',
    }));

    // 4. Vacancy opportunities (vacant units)
    const vacantUnits = await prisma.unit.findMany({
      where: {
        building: { companyId: { in: companyIds } },
        estado: 'disponible',
        superficie: { gt: 0 },
      },
      include: { building: { select: { nombre: true } } },
    });

    const vacancyOpportunities: Opportunity[] = vacantUnits.slice(0, 5).map((u) => {
      const potentialRent = (u.superficie || 0) * 10;
      return {
        type: 'vacancy',
        title: `Unidad vacante: ${u.building?.nombre || ''} - ${u.numero}`,
        description: `Unidad ${u.numero} (${u.superficie}m²) disponible. Renta potencial ~${potentialRent.toFixed(0)}€/mes.`,
        estimatedImpact: potentialRent * 12,
        entityId: u.id,
        entityType: 'unit',
        priority: 'medium',
      };
    });

    const allRuleBased: Opportunity[] = [
      ...rentOpportunities.slice(0, 3),
      ...renewalOpportunities.slice(0, 3),
      ...insuranceOpportunities,
      ...vacancyOpportunities,
    ].slice(0, 15);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        opportunities: allRuleBased.sort((a, b) => {
          const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
        }).slice(0, 5),
        source: 'rule-based',
      });
    }

    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un analista inmobiliario. Analiza estas oportunidades detectadas y selecciona las TOP 5 más relevantes con mayor impacto financiero estimado.

OPORTUNIDADES DETECTADAS:
${JSON.stringify(allRuleBased, null, 2)}

Responde ÚNICAMENTE con un JSON válido:
{
  "opportunities": [
    {
      "type": "rent_increase" | "renewal" | "insurance" | "vacancy",
      "title": "string",
      "description": "string",
      "estimatedImpact": number,
      "entityId": "string",
      "entityType": "string",
      "priority": "low" | "medium" | "high" | "critical"
    }
  ]
}

Ordena por impacto financiero y prioridad. Máximo 5 oportunidades.`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content[0].type === 'text' ? response.content[0].text : '{"opportunities":[]}';
    let parsed: { opportunities: Opportunity[] };
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { opportunities: allRuleBased.slice(0, 5) };
    } catch {
      parsed = { opportunities: allRuleBased.slice(0, 5) };
    }

    const opportunities = Array.isArray(parsed.opportunities) ? parsed.opportunities : allRuleBased.slice(0, 5);

    return NextResponse.json({
      opportunities: opportunities.slice(0, 5),
      source: 'ai',
    });
  } catch (error: unknown) {
    logger.error('[Opportunity Alerts]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo oportunidades', opportunities: [] },
      { status: 500 }
    );
  }
}
