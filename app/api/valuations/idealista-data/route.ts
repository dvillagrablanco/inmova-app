/**
 * API Route: Datos de Idealista Data
 *
 * GET /api/valuations/idealista-data?city=Madrid&postalCode=28001
 *   → Informe completo de mercado (precios, rentabilidad, evolución, subzonas)
 *
 * GET /api/valuations/idealista-data?city=Madrid&type=prices&operation=sale
 *   → Solo índice de precios por zona
 *
 * GET /api/valuations/idealista-data?city=Madrid&type=yield
 *   → Rentabilidad bruta del alquiler
 *
 * GET /api/valuations/idealista-data?city=Madrid&type=evolution&operation=sale
 *   → Evolución histórica de precios
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const postalCode = searchParams.get('postalCode') || undefined;
    const type = searchParams.get('type') || 'full';
    const operation = (searchParams.get('operation') || 'sale') as 'sale' | 'rent';

    if (!city) {
      return NextResponse.json({ error: 'Parámetro city requerido' }, { status: 400 });
    }

    const {
      getIdealistaDataReport,
      getZonePriceIndex,
      getRentalYield,
      getPriceEvolution,
      isIdealistaDataConfigured,
      isAuthenticatedAccessConfigured,
    } = await import('@/lib/idealista-data-service');

    if (!isIdealistaDataConfigured()) {
      return NextResponse.json({
        error: 'Idealista Data no disponible',
        configured: false,
      }, { status: 503 });
    }

    switch (type) {
      case 'prices': {
        const prices = await getZonePriceIndex(city, operation);
        return NextResponse.json({
          success: true,
          type: 'zone_price_index',
          data: prices,
          count: prices.length,
          operation,
          source: 'idealista_public',
        });
      }

      case 'yield': {
        const yieldData = getRentalYield(city);
        return NextResponse.json({
          success: !!yieldData,
          type: 'rental_yield',
          data: yieldData,
          source: 'idealista_public',
        });
      }

      case 'evolution': {
        const evolution = await getPriceEvolution(city, operation);
        return NextResponse.json({
          success: !!evolution,
          type: 'price_evolution',
          data: evolution,
          operation,
          source: 'idealista_public',
        });
      }

      case 'full':
      default: {
        const report = await getIdealistaDataReport(city, postalCode);
        if (!report) {
          return NextResponse.json({
            success: false,
            message: `Sin datos de Idealista para ${city}`,
            data: null,
          });
        }

        return NextResponse.json({
          success: true,
          type: 'full_report',
          data: report,
          authenticated: isAuthenticatedAccessConfigured(),
          source: report.dataSource,
          message: `Informe completo de ${city}`,
        });
      }
    }
  } catch (error: any) {
    logger.error('[API IdealistaData] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos', message: error.message },
      { status: 500 },
    );
  }
}
