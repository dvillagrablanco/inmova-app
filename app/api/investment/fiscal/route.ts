import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import type { UserRole } from '@/types/prisma-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROLE_ALLOWLIST: UserRole[] = [
  'super_admin',
  'administrador',
  'gestor',
  'operador',
  'soporte',
  'community_manager',
  'socio_ewoorker',
  'contratista_ewoorker',
  'subcontratista_ewoorker',
];

function resolveUserRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') {
    return null;
  }

  return ROLE_ALLOWLIST.includes(role as UserRole) ? (role as UserRole) : null;
}

/**
 * GET /api/investment/fiscal?year=2025&companyId=xxx
 * Simulador fiscal para sociedades patrimoniales (IS al 25%).
 * Calcula base imponible, amortizaciones, intereses deducibles, cuota IS.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = resolveUserRole(session.user.role);
    if (!role) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 403 });
    }

    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id,
      role,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const requestedCompanyId = searchParams.get('companyId');

    if (requestedCompanyId && !scope.accessibleCompanyIds.includes(requestedCompanyId)) {
      return NextResponse.json({ error: 'Sin acceso a la sociedad solicitada' }, { status: 403 });
    }

    const companyId = requestedCompanyId || scope.activeCompanyId;

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Ano invalido' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    const { calculateFiscalSummary } = await import('@/lib/investment-service');
    const fiscal = await calculateFiscalSummary(companyId, year);

    return NextResponse.json({ success: true, data: fiscal });
  } catch (error: any) {
    logger.error('[Fiscal API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error calculando fiscal' }, { status: 500 });
  }
}
