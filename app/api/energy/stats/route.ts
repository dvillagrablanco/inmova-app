import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getEnergyStats,
  getConsumptionTrends,
  calculateEnergyEfficiency,
  calculateTenantBilling,
} from '@/lib/energy-service';
import { format } from 'date-fns';
import logger, { logError } from '@/lib/logger';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/energy/stats - Obtener estadísticas de energía
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';
    const buildingId = searchParams.get('buildingId');

    if (type === 'trends') {
      const tipo = searchParams.get('tipo') || 'electricidad';
      const months = parseInt(searchParams.get('months') || '6');
      const unitId = searchParams.get('unitId');

      const trends = await getConsumptionTrends(
        session?.user?.companyId,
        tipo as any,
        months,
        buildingId || undefined,
        unitId || undefined
      );

      return NextResponse.json(trends);
    }

    if (type === 'efficiency') {
      const efficiency = await calculateEnergyEfficiency(
        session?.user?.companyId,
        buildingId || undefined
      );

      return NextResponse.json(efficiency);
    }

    if (type === 'billing') {
      const periodo = searchParams.get('periodo') || format(new Date(), 'yyyy-MM');
      const billing = await calculateTenantBilling(session?.user?.companyId, periodo);

      return NextResponse.json(billing);
    }

    // Overview por defecto
    const stats = await getEnergyStats(session?.user?.companyId);

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching energy stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
