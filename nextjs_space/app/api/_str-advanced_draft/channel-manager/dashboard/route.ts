/**
 * API para obtener dashboard de disponibilidad multi-canal
 * GET /api/str-advanced/channel-manager/dashboard?month=2024-01
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAvailabilityDashboard } from '@/lib/str-advanced-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');

    let month = new Date();
    if (monthParam) {
      const [year, monthNum] = monthParam.split('-');
      month = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    }

    const dashboard = await getAvailabilityDashboard(session.user.companyId, month);

    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('Error obteniendo dashboard:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo dashboard' },
      { status: 500 }
    );
  }
}
