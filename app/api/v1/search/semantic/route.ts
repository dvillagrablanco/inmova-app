/**
 * API Route: Semantic Search
 * 
 * POST /api/v1/search/semantic
 * 
 * Búsqueda semántica usando embeddings de OpenAI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { semanticSearch, hybridSearch } from '@/lib/semantic-search-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s para generar embeddings

const searchSchema = z.object({
  query: z.string().min(3).max(500),
  limit: z.number().int().min(1).max(50).optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
  filters: z
    .object({
      city: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = searchSchema.parse(body);

    const results = await semanticSearch(validated);

    return NextResponse.json({
      results,
      total: results.length,
      query: validated.query,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Query inválida', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error in semantic search:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
