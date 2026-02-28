import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/ai/financial-copilot
 * Copiloto financiero IA para el grupo Vidaro.
 * Chat ejecutivo con acceso a datos consolidados de las 3 sociedades.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { message, history = [] } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const companyId = session.user.companyId;

    // Obtener datos consolidados del grupo
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, nombre: true, parentCompanyId: true },
    });

    // IDs del grupo
    const groupIds: string[] = [companyId];
    if (company?.parentCompanyId) {
      groupIds.push(company.parentCompanyId);
      const siblings = await prisma.company.findMany({
        where: { parentCompanyId: company.parentCompanyId },
        select: { id: true },
      });
      siblings.forEach((s: any) => groupIds.push(s.id));
    }
    const children = await prisma.company.findMany({
      where: { parentCompanyId: companyId },
      select: { id: true },
    });
    children.forEach((c: any) => groupIds.push(c.id));
    const uniqueIds = [...new Set(groupIds)];

    // Datos financieros del grupo
    const [
      companiesData,
      totalBuildings,
      totalUnits,
      totalTenants,
      activeContracts,
      pendingPayments,
      overduePayments,
      totalExpenses,
    ] = await Promise.all([
      prisma.company.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, nombre: true },
      }),
      prisma.building.count({ where: { companyId: { in: uniqueIds }, isDemo: false } }),
      prisma.unit.count({ where: { building: { companyId: { in: uniqueIds }, isDemo: false } } }),
      prisma.tenant.count({ where: { companyId: { in: uniqueIds } } }),
      prisma.contract.findMany({
        where: { unit: { building: { companyId: { in: uniqueIds } } }, estado: 'activo' },
        select: { rentaMensual: true, unit: { select: { building: { select: { companyId: true } } } } },
      }),
      prisma.payment.count({
        where: { contract: { unit: { building: { companyId: { in: uniqueIds } } } }, estado: 'pendiente' },
      }),
      prisma.payment.aggregate({
        where: { contract: { unit: { building: { companyId: { in: uniqueIds } } } }, estado: 'atrasado' },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { building: { companyId: { in: uniqueIds } }, isDemo: false },
        _sum: { monto: true },
      }),
    ]);

    // Renta por sociedad
    const rentaPorSociedad: Record<string, number> = {};
    for (const c of activeContracts) {
      const cid = c.unit?.building?.companyId || 'unknown';
      rentaPorSociedad[cid] = (rentaPorSociedad[cid] || 0) + c.rentaMensual;
    }

    const rentaTotal = Object.values(rentaPorSociedad).reduce((s, v) => s + v, 0);
    const sociedadesInfo = companiesData.map((c: any) => ({
      nombre: c.nombre,
      rentaMensual: Math.round((rentaPorSociedad[c.id] || 0) * 100) / 100,
    }));

    const financialContext = `
DATOS FINANCIEROS DEL GRUPO (datos reales en tiempo real):

Sociedades: ${sociedadesInfo.map((s: any) => `${s.nombre} (${s.rentaMensual}€/mes)`).join(', ')}

Métricas consolidadas:
- Edificios: ${totalBuildings}
- Unidades: ${totalUnits}
- Inquilinos: ${totalTenants}
- Contratos activos: ${activeContracts.length}
- Renta mensual total: ${rentaTotal.toFixed(0)}€
- Renta anual estimada: ${(rentaTotal * 12).toFixed(0)}€
- Pagos pendientes: ${pendingPayments}
- Pagos atrasados: ${overduePayments._count} (${(overduePayments._sum?.monto || 0).toFixed(0)}€)
- Gastos registrados totales: ${(totalExpenses._sum?.monto || 0).toFixed(0)}€

Renta por sociedad:
${sociedadesInfo.map((s: any) => `- ${s.nombre}: ${s.rentaMensual}€/mes (${(s.rentaMensual * 12).toFixed(0)}€/año)`).join('\n')}
`;

    // Llamar a Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ response: 'Copiloto IA no configurado.' });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const messages = [
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 1500,
      system: `Eres el copiloto financiero del grupo Vidaro, un holding de sociedades patrimoniales inmobiliarias.

Tu rol: Responder preguntas financieras y estratégicas usando datos REALES del grupo. Sé directo, preciso y usa números concretos.

${financialContext}

Reglas:
- Siempre usa los datos reales proporcionados
- Si te piden simular escenarios, hazlo con cálculos detallados
- Responde en español, de forma ejecutiva (para consejo de administración)
- Si no tienes un dato, dilo claramente`,
      messages,
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    logger.error('[Financial Copilot]:', error);
    return NextResponse.json({ response: 'Error en el copiloto financiero.' }, { status: 500 });
  }
}
