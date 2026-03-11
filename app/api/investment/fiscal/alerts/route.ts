import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { resolveCompanyScope } from '@/lib/company-scope';
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
 * GET /api/investment/fiscal/alerts
 * Obtiene alertas fiscales pendientes para la empresa del usuario y sus filiales.
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

    const scope = await resolveCompanyScope({
      userId: session.user.id,
      role,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');
    const alerts = await getFiscalAlerts(scope.activeCompanyId || session.user.companyId);

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    logger.error('[Fiscal Alerts API]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
