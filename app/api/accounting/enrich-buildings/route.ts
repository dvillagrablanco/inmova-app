/**
 * POST /api/accounting/enrich-buildings
 *
 * Enriquece TRANSACCIONES CONTABLES EXISTENTES (sin buildingId) intentando
 * detectar el edificio físico al que pertenecen analizando concepto + título
 * de la subcuenta.
 *
 * Es relevante tras el cambio a Unit.ownerCompanyId: nos permite cruzar la
 * contabilidad oficial Zucchetti con el módulo operativo (Unit/Building) en
 * grupos donde un edificio físico contiene units de varias sociedades.
 *
 * Body opcional: { dryRun: boolean, limit: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const ALLOWED_ROLES = new Set(['administrador', 'super_admin']);

const STOPWORDS = new Set([
  'calle', 'avda', 'avenida', 'plaza', 'paseo', 'carretera', 'autovia', 'autopista',
  'inmueble', 'edificio', 'local', 'garaje', 'garajes', 'oficina', 'oficinas',
  'palencia', 'madrid', 'valladolid', 'spain', 'españa',
  'naves', 'nave', 'apartamentos', 'apartamento',
]);

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;
    const limit = Math.min(Math.max(Number(body?.limit) || 5000, 1), 50000);

    const prisma = await getPrisma();
    const companyIds = scope.companyIds;

    // Cargar todos los buildings del scope (gestor o con units propias)
    const buildings = await prisma.building.findMany({
      where: {
        OR: [
          { companyId: { in: companyIds } },
          { units: { some: { ownerCompanyId: { in: companyIds } } } },
        ],
      },
      select: { id: true, nombre: true, direccion: true, companyId: true },
    });

    interface Matcher {
      id: string;
      tokens: string[];
      numeros: string[];
    }
    const matchers: Matcher[] = buildings.map((b) => {
      const text = normalize(`${b.nombre || ''} ${b.direccion || ''}`);
      const allTokens = text.split(/[\s,.\-/]+/).filter(Boolean);
      const tokens = allTokens.filter(
        (t) => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t)
      );
      const numeros = allTokens.filter((t) => /^\d+$/.test(t) && t.length >= 1);
      return { id: b.id, tokens, numeros };
    });

    function findBuildingByText(text: string): string | null {
      const norm = normalize(text);
      if (!norm) return null;
      let bestId: string | null = null;
      let bestScore = 0;
      for (const m of matchers) {
        let score = 0;
        for (const tok of m.tokens) {
          if (norm.includes(tok)) {
            score += tok.length; // tokens más largos = más distintivos
          }
        }
        for (const num of m.numeros) {
          // Número como palabra aislada (no parte de otro)
          const re = new RegExp(`(^|[^0-9])${num}([^0-9]|$)`);
          if (re.test(norm)) score += 5;
        }
        if (score > bestScore) {
          bestScore = score;
          bestId = m.id;
        }
      }
      return bestScore >= 8 ? bestId : null;
    }

    const txs = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: companyIds },
        buildingId: null,
      },
      select: { id: true, concepto: true, notas: true },
      take: limit,
      orderBy: { fecha: 'desc' },
    });

    let updated = 0;
    let unmatched = 0;
    const sample: Array<{ id: string; concepto: string; matchedBuildingId: string }> = [];

    for (const tx of txs) {
      const text = `${tx.concepto || ''} ${tx.notas || ''}`;
      const matched = findBuildingByText(text);
      if (matched) {
        if (!dryRun) {
          await prisma.accountingTransaction.update({
            where: { id: tx.id },
            data: { buildingId: matched },
          });
        }
        updated++;
        if (sample.length < 20) sample.push({ id: tx.id, concepto: text.substring(0, 120), matchedBuildingId: matched });
      } else {
        unmatched++;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      processed: txs.length,
      updated,
      unmatched,
      sample,
    });
  } catch (error: any) {
    logger.error('[Enrich buildings] Error:', error);
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }
}
