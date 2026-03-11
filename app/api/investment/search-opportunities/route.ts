/**
 * POST /api/investment/search-opportunities
 *
 * Búsqueda de oportunidades de inversión con filtros avanzados.
 * Conecta con Idealista (scraping listings reales) y BOE (subastas activas).
 * Cada resultado incluye comparación con precio de mercado (Idealista Data).
 *
 * Body: { cities, propertyTypes, maxPrice, minPrice, minSurface, minDiscount, minYield, includeBOE, includeIdealista }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const filters = {
      cities: Array.isArray(body.cities) ? body.cities : body.city ? [body.city] : ['Madrid'],
      propertyTypes: Array.isArray(body.propertyTypes) ? body.propertyTypes : body.propertyType ? [body.propertyType] : ['vivienda'],
      operation: body.operation || 'sale',
      maxPrice: body.maxPrice ? Number(body.maxPrice) : undefined,
      minPrice: body.minPrice ? Number(body.minPrice) : undefined,
      minSurface: body.minSurface ? Number(body.minSurface) : undefined,
      maxSurface: body.maxSurface ? Number(body.maxSurface) : undefined,
      minDiscount: body.minDiscount ? Number(body.minDiscount) : undefined,
      minYield: body.minYield ? Number(body.minYield) : undefined,
      includeBOE: body.includeBOE !== false,
      includeIdealista: body.includeIdealista !== false,
    };

    const { searchInvestmentOpportunities } = await import('@/lib/opportunity-search-service');
    const result = await searchInvestmentOpportunities(filters);

    return NextResponse.json({
      success: true,
      ...result,
      filters,
    });
  } catch (error: any) {
    logger.error('[SearchOpportunities] Error:', error);
    return NextResponse.json(
      { error: 'Error buscando oportunidades', message: error.message },
      { status: 500 },
    );
  }
}
