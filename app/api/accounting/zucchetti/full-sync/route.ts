/**
 * POST /api/accounting/zucchetti/full-sync
 *
 * Sincronización COMPLETA Zucchetti SQL → Inmova.
 * Body opcional: { companyId?: string, fromDate?: ISO, toDate?: ISO,
 *                  allGroup?: boolean }
 *
 * - Si allGroup=true → sincroniza Rovida + Vidaro + Viroda
 * - Si companyId se especifica → solo esa sociedad
 * - Por defecto → la sociedad activa del scope
 *
 * Solo administradores.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import {
  syncZucchettiFull,
  syncZucchettiGroupVidaro,
} from '@/lib/zucchetti-full-sync-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Esta operación puede ser larga (varios minutos). Maximizar timeout.
export const maxDuration = 300;

const ALLOWED_ROLES = new Set(['administrador', 'super_admin']);

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

    const body = await request.json().catch(() => ({}));
    const allGroup = body?.allGroup === true;
    const fromDate = body?.fromDate ? new Date(body.fromDate) : undefined;
    const toDate = body?.toDate ? new Date(body.toDate) : undefined;
    const explicitCompanyId = body?.companyId;

    if (allGroup) {
      const results = await syncZucchettiGroupVidaro(fromDate, toDate);
      const ok = results.filter((r) => r.success).length;
      return NextResponse.json({
        success: ok > 0,
        mode: 'group',
        societies: results.length,
        successful: ok,
        results,
      });
    }

    let companyId = explicitCompanyId;
    if (!companyId) {
      const scope = await resolveAccountingScope(request, session.user as any);
      if (!scope?.activeCompanyId) {
        return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
      }
      companyId = scope.activeCompanyId;
    }

    const result = await syncZucchettiFull({ companyId, fromDate, toDate });
    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error: any) {
    logger.error('[Zucchetti full-sync] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error en sincronización' },
      { status: 500 }
    );
  }
}
