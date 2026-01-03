/**
 * API Route: Advanced Property Search
 * 
 * POST /api/v1/search/properties
 * 
 * Búsqueda avanzada con filtros complejos y facets.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchProperties, getSearchFacets } from '@/lib/advanced-search-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  postalCodes: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minSquareMeters: z.number().optional(),
  maxSquareMeters: z.number().optional(),
  minRooms: z.number().optional(),
  maxRooms: z.number().optional(),
  rooms: z.array(z.number()).optional(),
  hasParking: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  furnished: z.boolean().optional(),
  status: z.array(z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE'])).optional(),
  sortBy: z.enum(['price', 'squareMeters', 'rooms', 'createdAt', 'relevance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  includeFacets: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Search puede ser público o privado según tu modelo de negocio
    // Para este caso, requiere autenticación

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const filters = searchSchema.parse(body);

    // Ejecutar búsqueda
    const results = await searchProperties(filters, session.user.id);

    // Obtener facets si se solicitó
    let facets = null;
    if (filters.includeFacets) {
      facets = await getSearchFacets(filters);
    }

    return NextResponse.json({
      ...results,
      facets,
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Filtros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in property search:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
