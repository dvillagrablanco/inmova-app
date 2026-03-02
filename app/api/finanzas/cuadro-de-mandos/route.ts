export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCuadroMandosData } from '@/lib/finanzas/cuadro-mandos-service';

/**
 * GET /api/finanzas/cuadro-de-mandos
 *
 * Devuelve los datos completos del Cuadro de Mandos Financiero:
 * - KPIs de cartera (valor inversión, mercado, plusvalía, tasas)
 * - PyG Analítica completa por centro de coste
 * - Comparativo multi-ejercicio
 *
 * Query params:
 * - ejercicio: año (default: año actual)
 * - buildingIds: IDs de edificios separados por coma (filtro opcional)
 * - costCenterIds: IDs de centros de coste separados por coma (filtro opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ejercicio = parseInt(searchParams.get('ejercicio') || String(new Date().getFullYear()));
    const buildingIdsParam = searchParams.get('buildingIds');
    const costCenterIdsParam = searchParams.get('costCenterIds');

    const buildingIds = buildingIdsParam ? buildingIdsParam.split(',').filter(Boolean) : undefined;
    const costCenterIds = costCenterIdsParam
      ? costCenterIdsParam.split(',').filter(Boolean)
      : undefined;

    if (isNaN(ejercicio) || ejercicio < 2000 || ejercicio > 2100) {
      return NextResponse.json({ error: 'Ejercicio inválido' }, { status: 400 });
    }

    const data = await getCuadroMandosData(companyId, {
      ejercicio,
      buildingIds,
      costCenterIds,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('[API /finanzas/cuadro-de-mandos] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del cuadro de mandos' },
      { status: 500 }
    );
  }
}
