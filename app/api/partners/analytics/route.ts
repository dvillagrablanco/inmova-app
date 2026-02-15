/**
 * API de Analytics para Partners
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const metrics = [
      { label: 'Leads Generados', value: '234', change: 12, icon: 'Users' },
      { label: 'Conversiones', value: '89', change: 8, icon: 'TrendingUp' },
      { label: 'Comisiones', value: '€4,450', change: 15, icon: 'Euro' },
      { label: 'Tasa de Conversión', value: '38%', change: -2, icon: 'Target' },
    ];

    const funnelData = [
      { stage: 'Visitas', count: 12543, percentage: 100 },
      { stage: 'Clicks', count: 4892, percentage: 39 },
      { stage: 'Leads', count: 234, percentage: 4.8 },
      { stage: 'Conversiones', count: 89, percentage: 38 },
    ];

    const channelData = [
      { channel: 'Link Directo', leads: 98, conversiones: 42, revenue: 2100 },
      { channel: 'Landing Page', leads: 76, conversiones: 28, revenue: 1400 },
      { channel: 'Email Marketing', leads: 45, conversiones: 15, revenue: 750 },
      { channel: 'Redes Sociales', leads: 15, conversiones: 4, revenue: 200 },
    ];

    const monthlyData = [
      { mes: 'Jul', leads: 145, conversiones: 52, revenue: 2600 },
      { mes: 'Ago', leads: 167, conversiones: 61, revenue: 3050 },
      { mes: 'Sep', leads: 189, conversiones: 72, revenue: 3600 },
      { mes: 'Oct', leads: 212, conversiones: 79, revenue: 3950 },
      { mes: 'Nov', leads: 198, conversiones: 74, revenue: 3700 },
      { mes: 'Dic', leads: 234, conversiones: 89, revenue: 4450 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        funnelData,
        channelData,
        monthlyData,
      },
    });
  } catch (error) {
    logger.error('[API Error] Partners Analytics:', error);
    return NextResponse.json({ error: 'Error obteniendo analytics' }, { status: 500 });
  }
}
