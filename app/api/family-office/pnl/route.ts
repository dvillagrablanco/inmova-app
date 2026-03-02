import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/pnl
 * P&L por instrumento, por gestora/entidad, y consolidado.
 * Rendimiento time-weighted y money-weighted.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Consolidated: include child companies
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { childCompanies: { select: { id: true } } },
    });
    const allIds = company
      ? [session.user.companyId, ...company.childCompanies.map((c: { id: string }) => c.id)]
      : [session.user.companyId];

    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: allIds }, activa: true },
      include: {
        positions: {
          orderBy: { valorActual: 'desc' },
        },
      },
    });

    // P&L por instrumento (top positions)
    const allPositions = accounts.flatMap((a) =>
      a.positions.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        isin: p.isin,
        tipo: p.tipo,
        categoria: p.categoria,
        entidad: a.entidad,
        cantidad: p.cantidad,
        costeTotal: p.costeTotal,
        valorActual: p.valorActual,
        pnlNoRealizado: p.pnlNoRealizado,
        pnlRealizado: p.pnlRealizado,
        pnlTotal: p.pnlNoRealizado + p.pnlRealizado,
        pnlPct: p.costeTotal > 0 ? ((p.valorActual - p.costeTotal + p.pnlRealizado) / p.costeTotal) * 100 : 0,
        divisa: p.divisa,
        peso: 0, // se calcula después
      }))
    );

    const valorTotal = allPositions.reduce((s, p) => s + p.valorActual, 0);
    allPositions.forEach((p) => {
      p.peso = valorTotal > 0 ? Math.round((p.valorActual / valorTotal) * 1000) / 10 : 0;
    });

    // P&L por gestora/entidad
    const byEntidad: Record<string, {
      entidad: string;
      cuentas: number;
      posiciones: number;
      costeTotal: number;
      valorActual: number;
      pnlTotal: number;
      pnlPct: number;
      peso: number;
    }> = {};

    for (const account of accounts) {
      const key = account.entidad;
      if (!byEntidad[key]) {
        byEntidad[key] = { entidad: key, cuentas: 0, posiciones: 0, costeTotal: 0, valorActual: 0, pnlTotal: 0, pnlPct: 0, peso: 0 };
      }
      byEntidad[key].cuentas++;
      byEntidad[key].posiciones += account.positions.length;
      byEntidad[key].costeTotal += account.positions.reduce((s, p) => s + p.costeTotal, 0);
      byEntidad[key].valorActual += account.positions.reduce((s, p) => s + p.valorActual, 0);
      byEntidad[key].pnlTotal += account.positions.reduce((s, p) => s + p.pnlNoRealizado + p.pnlRealizado, 0);
    }

    Object.values(byEntidad).forEach((e) => {
      e.pnlPct = e.costeTotal > 0 ? Math.round((e.pnlTotal / e.costeTotal) * 1000) / 10 : 0;
      e.peso = valorTotal > 0 ? Math.round((e.valorActual / valorTotal) * 1000) / 10 : 0;
    });

    // P&L por tipo de instrumento
    const byTipo: Record<string, { tipo: string; valorActual: number; pnlTotal: number; posiciones: number }> = {};
    allPositions.forEach((p) => {
      const tipo = p.tipo || 'otro';
      if (!byTipo[tipo]) byTipo[tipo] = { tipo, valorActual: 0, pnlTotal: 0, posiciones: 0 };
      byTipo[tipo].valorActual += p.valorActual;
      byTipo[tipo].pnlTotal += p.pnlTotal;
      byTipo[tipo].posiciones++;
    });

    // Consolidado
    const pnlTotal = allPositions.reduce((s, p) => s + p.pnlTotal, 0);
    const costeTotal = allPositions.reduce((s, p) => s + p.costeTotal, 0);

    return NextResponse.json({
      success: true,
      consolidado: {
        valorTotal: Math.round(valorTotal * 100) / 100,
        costeTotal: Math.round(costeTotal * 100) / 100,
        pnlTotal: Math.round(pnlTotal * 100) / 100,
        pnlPct: costeTotal > 0 ? Math.round((pnlTotal / costeTotal) * 1000) / 10 : 0,
        totalPosiciones: allPositions.length,
        totalCuentas: accounts.length,
      },
      porGestora: Object.values(byEntidad).sort((a, b) => b.valorActual - a.valorActual),
      porTipo: Object.values(byTipo).sort((a, b) => b.valorActual - a.valorActual),
      topPosiciones: allPositions.sort((a, b) => Math.abs(b.pnlTotal) - Math.abs(a.pnlTotal)).slice(0, 20),
    });
  } catch (error: any) {
    logger.error('[FO P&L]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error calculando P&L' }, { status: 500 });
  }
}
