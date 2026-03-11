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
 * GET /api/investment/portfolio
 * Resumen del portfolio de la empresa activa.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
    const requestedCompanyId = searchParams.get('companyId');
    if (requestedCompanyId && !scope.accessibleCompanyIds.includes(requestedCompanyId)) {
      return NextResponse.json({ error: 'Sin acceso a la sociedad solicitada' }, { status: 403 });
    }

    const companyId = requestedCompanyId || scope.activeCompanyId;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    const { getCompanyPortfolio } = await import('@/lib/investment-service');
    const portfolio = await getCompanyPortfolio(companyId);

    return NextResponse.json({ success: true, data: portfolio });
  } catch (error: any) {
    logger.error('[Investment Portfolio API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo portfolio' }, { status: 500 });
  }
}
