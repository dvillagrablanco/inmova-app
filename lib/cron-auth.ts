import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAdmin, isSuperAdmin } from '@/lib/admin-roles';

type CronAuthResult = {
  authorized: boolean;
  status: number;
  error?: string;
};

type CronAuthOptions = {
  allowSession?: boolean;
  requireSuperAdmin?: boolean;
};

function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  return authorization.replace(/^Bearer\s+/i, '').trim();
}

/**
 * Autoriza ejecución de cron jobs mediante:
 * 1) CRON_SECRET (Bearer token), o
 * 2) sesión admin/super_admin (opcional)
 */
export async function authorizeCronRequest(
  request: NextRequest,
  options: CronAuthOptions = { allowSession: false, requireSuperAdmin: true }
): Promise<CronAuthResult> {
  const cronSecret = process.env.CRON_SECRET;
  const bearerToken = extractBearerToken(request.headers.get('authorization'));

  if (cronSecret && bearerToken === cronSecret) {
    return { authorized: true, status: 200 };
  }

  if (process.env.NODE_ENV === 'production' && !cronSecret && !options.allowSession) {
    return {
      authorized: false,
      status: 503,
      error: 'CRON_SECRET no configurado',
    };
  }

  if (!options.allowSession) {
    return { authorized: false, status: 401, error: 'No autorizado' };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { authorized: false, status: 401, error: 'No autenticado' };
  }

  const role = session.user.role;
  const hasAccess = options.requireSuperAdmin ? isSuperAdmin(role) : isAdmin(role);

  if (!hasAccess) {
    return {
      authorized: false,
      status: 403,
      error: 'Acceso denegado',
    };
  }

  return { authorized: true, status: 200 };
}
