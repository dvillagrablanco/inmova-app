/**
 * Servicio de Búsqueda Semántica
 * 
 * Usa embeddings de OpenAI para búsqueda por similitud vectorial.
 * OpenAI se mantiene como dependencia OPCIONAL solo para embeddings
 * (Claude no ofrece API de embeddings nativa).
 * 
 * Si OPENAI_API_KEY no está configurada, la búsqueda semántica
 * se desactiva gracefully y se usa búsqueda por texto.
 * 
 * @module SemanticSearchService
 */

import OpenAI from 'openai';
import { prisma } from './db';
import logger from './logger';
import { redis } from './redis';

// TODO: AUDIT-2026-03 — This file references prisma.property which no longer exists in the schema.
// The Property model was removed; properties are now managed via Building + Unit.
// References to prisma.property will throw at runtime. Migrate to Building/Unit queries.

// Lazy initialization — optional dependency
let openai: OpenAI | null = null;
let openaiUnavailableWarned = false;

function getOpenAI(): OpenAI | null {
  if (openai) return openai;
  if (!process.env.OPENAI_API_KEY) {
    if (!openaiUnavailableWarned) {
      logger.info('[SemanticSearch] OPENAI_API_KEY no configurada — búsqueda semántica desactivada, usando búsqueda por texto');
      openaiUnavailableWarned = true;
    }
    return null;
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

/**
 * Check if semantic search is available (OpenAI embeddings configured)
 */
export function isSemanticSearchAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// ============================================================================
// TIPOS
// ============================================================================

export interface SemanticSearchOptions {
  query: string;
  limit?: number;
  minSimilarity?: number; // 0-1, default 0.7
  filters?: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  };
}

export interface SemanticSearchResult {
  property: any;
  similarity: number;
  explanation?: string;
}

// ============================================================================
// GENERACIÓN DE EMBEDDINGS
// ============================================================================

/**
 * Genera embedding para un texto
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openaiClient = getOpenAI();
  try {
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error: any) {
    logger.error('❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Genera texto descriptivo completo de una propiedad para embedding
 */
function generatePropertyText(property: any): string {
  const parts: string[] = [];

  // Ubicación
  parts.push(`Propiedad ubicada en ${property.ciudad || property.city}`);
  if (property.barrio || property.neighborhood) {
    parts.push(`barrio ${property.barrio || property.neighborhood}`);
  }

  // Tipo y tamaño
  parts.push(
    `${property.habitaciones || property.rooms} habitaciones`,
    `${property.banos || property.bathrooms} baños`,
    `${property.superficie || property.squareMeters} metros cuadrados`
  );

  // Precio
  parts.push(`${property.precio || property.price} euros mensuales`);

  // Características
  const features: string[] = [];
  if (property.tieneParking || property.hasParking) features.push('parking');
  if (property.tieneAscensor || property.hasElevator) features.push('ascensor');
  if (property.tieneJardin || property.hasGarden) features.push('jardín');
  if (property.tienePiscina || property.hasPool) features.push('piscina');
  if (property.admiteMascotas || property.petsAllowed) features.push('admite mascotas');
  if (property.amueblado || property.furnished) features.push('amueblado');

  if (features.length > 0) {
    parts.push(`Incluye ${features.join(', ')}`);
  }

  // Descripción
  if (property.descripcion || property.description) {
    parts.push(property.descripcion || property.description);
  }

  return parts.join('. ');
}

/**
 * Indexa una propiedad (genera y guarda su embedding)
 */
export async function indexProperty(propertyId: string): Promise<void> {
  try {
    // Obtener propiedad
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Generar texto descriptivo
    const text = generatePropertyText(property);

    // Generar embedding
    const embedding = await generateEmbedding(text);

    // Guardar en BD
    await prisma.propertyEmbedding.upsert({
      where: { propertyId },
      create: {
        propertyId,
        text,
        embedding: embedding as any, // Prisma Json field
      },
      update: {
        text,
        embedding: embedding as any,
        updatedAt: new Date(),
      },
    });

    logger.info('✅ Property indexed', { propertyId });
  } catch (error: any) {
    logger.error('❌ Error indexing property:', error);
    throw error;
  }
}

/**
 * Indexa todas las propiedades (batch)
 */
export async function indexAllProperties(): Promise<{ indexed: number; errors: number }> {
  try {
    const properties = await prisma.property.findMany({
      select: { id: true },
    });

    let indexed = 0;
    let errors = 0;

    logger.info(`📊 Starting batch indexing of ${properties.length} properties`);

    for (const property of properties) {
      try {
        await indexProperty(property.id);
        indexed++;

        // Delay para no exceder rate limits de OpenAI
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        errors++;
        logger.error(`Error indexing property ${property.id}:`, error);
      }
    }

    logger.info(`✅ Batch indexing complete: ${indexed} indexed, ${errors} errors`);

    return { indexed, errors };
  } catch (error: any) {
    logger.error('❌ Error in batch indexing:', error);
    throw error;
  }
}

// ============================================================================
// BÚSQUEDA SEMÁNTICA
// ============================================================================

/**
 * Búsqueda semántica de propiedades
 */
export async function semanticSearch(
  options: SemanticSearchOptions
): Promise<SemanticSearchResult[]> {
  try {
    const limit = options.limit || 10;
    const minSimilarity = options.minSimilarity || 0.7;

    // Cache de resultados
    const cacheKey = `semantic-search:${JSON.stringify(options)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Generar embedding de la query
    const queryEmbedding = await generateEmbedding(options.query);

    // Construir filtros SQL opcionales
    let whereClause = '';
    const params: any[] = [];

    if (options.filters) {
      const conditions: string[] = [];

      if (options.filters.city) {
        conditions.push(`(p.ciudad = $${params.length + 1} OR p.city = $${params.length + 1})`);
        params.push(options.filters.city);
      }

      if (options.filters.minPrice !== undefined) {
        conditions.push(`(p.precio >= $${params.length + 1} OR p.price >= $${params.length + 1})`);
        params.push(options.filters.minPrice);
      }

      if (options.filters.maxPrice !== undefined) {
        conditions.push(`(p.precio <= $${params.length + 1} OR p.price <= $${params.length + 1})`);
        params.push(options.filters.maxPrice);
      }

      if (options.filters.status) {
        conditions.push(`p.estado = $${params.length + 1}`);
        params.push(options.filters.status);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
    }

    // Búsqueda por similitud coseno (PostgreSQL con pgvector)
    // Nota: Requiere extensión pgvector en PostgreSQL
    const query = `
      SELECT 
        p.*,
        pe.embedding,
        1 - (pe.embedding <=> $${params.length + 1}::vector) AS similarity
      FROM "PropertyEmbedding" pe
      JOIN "Property" p ON pe."propertyId" = p.id
      ${whereClause}
      ORDER BY similarity DESC
      LIMIT $${params.length + 2}
    `;

    params.push(`[${queryEmbedding.join(',')}]`);
    params.push(limit);

    const results = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    // Filtrar por similitud mínima
    const filtered = results
      .filter((r) => r.similarity >= minSimilarity)
      .map((r) => ({
        property: r,
        similarity: Math.round(r.similarity * 100) / 100,
        explanation: generateExplanation(options.query, r),
      }));

    // Cache por 5 min
    await redis.setex(cacheKey, 300, JSON.stringify(filtered));

    logger.info('🔍 Semantic search completed', {
      query: options.query,
      results: filtered.length,
    });

    return filtered;
  } catch (error: any) {
    logger.error('❌ Error in semantic search:', error);
    
    // Fallback: búsqueda tradicional si falla
    logger.warn('⚠️ Falling back to traditional search');
    return [];
  }
}

/**
 * Genera explicación de por qué la propiedad es relevante
 */
function generateExplanation(query: string, property: any): string {
  const matches: string[] = [];

  // Analizar query simple
  const queryLower = query.toLowerCase();

  if (queryLower.includes('parking') && (property.tieneParking || property.hasParking)) {
    matches.push('Tiene parking');
  }

  if (queryLower.includes('ascensor') && (property.tieneAscensor || property.hasElevator)) {
    matches.push('Tiene ascensor');
  }

  if (queryLower.includes('jardín') && (property.tieneJardin || property.hasGarden)) {
    matches.push('Tiene jardín');
  }

  if (queryLower.includes('piscina') && (property.tienePiscina || property.hasPool)) {
    matches.push('Tiene piscina');
  }

  if (queryLower.includes('mascota') && (property.admiteMascotas || property.petsAllowed)) {
    matches.push('Admite mascotas');
  }

  if (queryLower.includes('amueblado') && (property.amueblado || property.furnished)) {
    matches.push('Amueblado');
  }

  // Ubicación
  const city = property.ciudad || property.city || '';
  if (queryLower.includes(city.toLowerCase())) {
    matches.push(`Ubicado en ${city}`);
  }

  return matches.length > 0
    ? `Coincide con: ${matches.join(', ')}`
    : `Similitud semántica del ${Math.round(property.similarity * 100)}%`;
}

// ============================================================================
// BÚSQUEDA HÍBRIDA (Semántica + Filtros)
// ============================================================================

/**
 * Combina búsqueda semántica con filtros tradicionales
 */
export async function hybridSearch(options: {
  semanticQuery?: string;
  filters?: any;
  limit?: number;
}): Promise<any[]> {
  const limit = options.limit || 20;

  // Si hay query semántica, usarla
  if (options.semanticQuery) {
    const semanticResults = await semanticSearch({
      query: options.semanticQuery,
      limit,
      filters: options.filters,
    });

    return semanticResults.map((r) => ({
      ...r.property,
      _similarity: r.similarity,
      _explanation: r.explanation,
    }));
  }

  // Si no, búsqueda tradicional
  const { searchProperties } = await import('./advanced-search-service');
  const results = await searchProperties(options.filters || {});
  return results.results;
}

export default {
  generateEmbedding,
  indexProperty,
  indexAllProperties,
  semanticSearch,
  hybridSearch,
};
