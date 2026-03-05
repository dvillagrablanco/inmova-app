import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchListings } from '@/lib/real-estate-feeds';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/investment/search-listings?city=Madrid&operation=sale&propertyType=vivienda&maxPrice=500000
 * Search property listings across all connected feeds (InmolinkCRM, Idealista)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      city: searchParams.get('city') || 'Madrid',
      operation: (searchParams.get('operation') || 'sale') as 'sale' | 'rent',
      propertyType: searchParams.get('propertyType') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minSurface: searchParams.get('minSurface') ? Number(searchParams.get('minSurface')) : undefined,
      maxSurface: searchParams.get('maxSurface') ? Number(searchParams.get('maxSurface')) : undefined,
      minRooms: searchParams.get('minRooms') ? Number(searchParams.get('minRooms')) : undefined,
      maxItems: searchParams.get('maxItems') ? Number(searchParams.get('maxItems')) : 20,
    };

    const results = await searchListings(filters);

    return NextResponse.json({
      ...results,
      filters,
      idealistaConfigured: !!(process.env.IDEALISTA_API_KEY && process.env.IDEALISTA_API_SECRET),
      inmolinkConfigured: !!process.env.INMOLINK_API_KEY,
    });
  } catch (error: any) {
    logger.error('[Search Listings Error]:', error);
    return NextResponse.json({ error: 'Error buscando listados' }, { status: 500 });
  }
}
