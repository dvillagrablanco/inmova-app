/**
 * API: /api/crm/stats
 *
 * GET: Obtener estadísticas del CRM
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CRMService } from '@/lib/crm-service';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Opcional: filtrar por usuario

    const stats = await CRMService.getStats(session.user.companyId, userId || undefined);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error getting CRM stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas', details: error.message },
      { status: 500 }
    );
  }
}
