/**
 * API de KPIs Avanzados para Gestión de Alquiler
 * 
 * Métricas profesionales basadas en estándares PropTech:
 * - NOI, Yield, Cap Rate
 * - Morosidad y DSO
 * - Rotación y renovación de inquilinos
 * - Ocupación y vacancia
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { calculateRentalKPIs } from '@/lib/rental-kpis-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'No se encontró la empresa del usuario' },
        { status: 400 }
      );
    }

    const kpis = await calculateRentalKPIs(companyId);

    return NextResponse.json({
      success: true,
      data: kpis,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    logger.error('Error fetching rental KPIs:', error);
    return NextResponse.json(
      { error: 'Error al obtener KPIs de alquiler' },
      { status: 500 }
    );
  }
}
