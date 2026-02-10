import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sincronizarEventosAutomaticos } from '@/lib/calendar-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/calendar/sync
 * Sincroniza eventos automáticos del calendario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    // Solo administradores y gestores pueden sincronizar
    if (!['administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tiene permisos para sincronizar eventos' },
        { status: 403 }
      );
    }

    const result = await sincronizarEventosAutomaticos(session.user.companyId);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error sincronizando eventos:', error);
    return NextResponse.json(
      { error: 'Error sincronizando eventos' },
      { status: 500 }
    );
  }
}
