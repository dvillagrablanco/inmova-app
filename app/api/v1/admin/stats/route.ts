/**
 * API Route: Admin - System Stats
 * 
 * GET /api/v1/admin/stats
 * 
 * Estadísticas generales del sistema + billing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSystemStats, getBillingStats } from '@/lib/admin-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month') as 'month' | 'year';

    const [systemStats, billingStats] = await Promise.all([
      getSystemStats(),
      getBillingStats(period),
    ]);

    return NextResponse.json({
      system: systemStats,
      billing: billingStats,
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
