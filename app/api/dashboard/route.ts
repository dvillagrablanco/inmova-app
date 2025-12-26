import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { cachedDashboardStats } from '@/lib/api-cache-helpers';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Usar datos cacheados para los KPIs principales y monthly income
    const cachedData = await cachedDashboardStats(companyId);

    // El resto de los datos se mantienen sin caché por ahora (son menos críticos)
    // En el futuro se pueden optimizar también

    return NextResponse.json(cachedData);
  } catch (error: any) {
    logger.error('Error fetching dashboard data:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
