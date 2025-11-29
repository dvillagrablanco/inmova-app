import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sincronizarEventosAutomaticos } from '@/lib/calendar-service';

/**
 * POST /api/calendar/sync
 * Sincroniza eventos automáticos del calendario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

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
    console.error('Error sincronizando eventos:', error);
    return NextResponse.json(
      { error: 'Error sincronizando eventos' },
      { status: 500 }
    );
  }
}
