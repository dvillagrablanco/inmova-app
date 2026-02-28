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
 * GET /api/family-office/fiscal-optimization
 * Sugerencias de optimización fiscal IA + Comparativa de gestoras.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const accounts = await prisma.financialAccount.findMany({
      where: { companyId, activa: true },
      include: { positions: true },
    });

    // ── COMPARATIVA DE GESTORAS ──
    const byGestora = accounts.map((a) => {
      const posiciones = a.positions;
      const valorTotal = posiciones.reduce((s, p) => s + p.valorActual, 0);
      const costeTotal = posiciones.reduce((s, p) => s + p.costeTotal, 0);
      const pnlTotal = posiciones.reduce((s, p) => s + p.pnlNoRealizado + p.pnlRealizado, 0);
      const comisionesEstimadas = valorTotal * 0.01; // 1% TER estimado

      return {
        gestora: a.entidad,
        posiciones: posiciones.length,
        valorTotal: Math.round(valorTotal),
        costeTotal: Math.round(costeTotal),
        pnlTotal: Math.round(pnlTotal),
        rentabilidad: costeTotal > 0 ? Math.round((pnlTotal / costeTotal) * 1000) / 10 : 0,
        comisionesEstimadas: Math.round(comisionesEstimadas),
        rendimientoNetoEstimado: Math.round(pnlTotal - comisionesEstimadas),
      };
    });
    byGestora.sort((a, b) => b.rentabilidad - a.rentabilidad);

    // ── POSICIONES CON PÉRDIDAS (tax-loss harvesting) ──
    const posicionesConPerdida = accounts.flatMap((a) =>
      a.positions.filter((p) => p.pnlNoRealizado < 0).map((p) => ({
        nombre: p.nombre,
        isin: p.isin,
        gestora: a.entidad,
        perdida: Math.round(p.pnlNoRealizado),
        valorActual: Math.round(p.valorActual),
        coste: Math.round(p.costeTotal),
      }))
    ).sort((a, b) => a.perdida - b.perdida);

    const totalPerdidasCompensables = posicionesConPerdida.reduce((s, p) => s + Math.abs(p.perdida), 0);
    const ahorroFiscalPotencial = Math.round(totalPerdidasCompensables * 0.25); // 25% IS

    // ── SUGERENCIAS FISCALES ──
    const sugerencias: string[] = [];

    if (totalPerdidasCompensables > 5000) {
      sugerencias.push(`💰 Tax-loss harvesting: Puedes compensar ${totalPerdidasCompensables.toLocaleString('es-ES')}€ en pérdidas vendiendo posiciones con minusvalías. Ahorro IS estimado: ${ahorroFiscalPotencial.toLocaleString('es-ES')}€.`);
    }

    if (byGestora.length > 1) {
      const mejor = byGestora[0];
      const peor = byGestora[byGestora.length - 1];
      if (mejor.rentabilidad - peor.rentabilidad > 3) {
        sugerencias.push(`📊 ${mejor.gestora} rinde ${mejor.rentabilidad}% vs ${peor.gestora} con ${peor.rentabilidad}%. Considerar traspasar posiciones de ${peor.gestora} a ${mejor.gestora}.`);
      }
    }

    const totalComisiones = byGestora.reduce((s, g) => s + g.comisionesEstimadas, 0);
    if (totalComisiones > 10000) {
      sugerencias.push(`⚠️ Comisiones estimadas totales: ${totalComisiones.toLocaleString('es-ES')}€/año. Negociar condiciones con gestoras o considerar ETFs/fondos indexados más baratos.`);
    }

    // IA para sugerencias avanzadas
    let sugerenciasIA = '';
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && byGestora.length > 0) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
        const anthropic = new Anthropic({ apiKey });

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL_PRIMARY,
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Como asesor fiscal de un family office patrimonial español (sociedad holding), da 3 sugerencias de optimización fiscal para:
- Pérdidas compensables: ${totalPerdidasCompensables.toLocaleString('es-ES')}€
- Gestoras: ${byGestora.map((g) => `${g.gestora}: ${g.rentabilidad}% (${g.valorTotal.toLocaleString('es-ES')}€)`).join(', ')}
- IS al 25%. Sé específico y directo.`,
          }],
        });
        sugerenciasIA = response.content[0].type === 'text' ? response.content[0].text : '';
      } catch { /* continue */ }
    }

    return NextResponse.json({
      success: true,
      comparativaGestoras: byGestora,
      taxLossHarvesting: {
        posicionesConPerdida: posicionesConPerdida.slice(0, 10),
        totalPerdidasCompensables,
        ahorroFiscalPotencial,
      },
      sugerencias,
      sugerenciasIA,
    });
  } catch (error: any) {
    logger.error('[Fiscal Optimization]:', error);
    return NextResponse.json({ error: 'Error en optimización fiscal' }, { status: 500 });
  }
}
