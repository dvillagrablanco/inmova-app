/**
 * API Route: Location Autocomplete
 * 
 * GET /api/v1/search/autocomplete?q=Madrid
 * 
 * Autocomplete de ciudades y barrios.
 */

import { NextRequest, NextResponse } from 'next/server';
import { autocompleteLocation } from '@/lib/advanced-search-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        cities: [],
        neighborhoods: [],
      });
    }

    const results = await autocompleteLocation(query, limit);

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache 1h
      },
    });

  } catch (error: any) {
    console.error('Error in autocomplete:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
