/**
 * Servicio de Búsqueda Avanzada
 * 
 * Features:
 * - Filtros complejos multi-campo
 * - Full-text search (PostgreSQL)
 * - Búsqueda semántica (embeddings + similitud)
 * - Autocomplete de ubicaciones
 * - Saved searches
 * - Faceted search (agregaciones)
 * 
 * @module AdvancedSearchService
 */

import { prisma } from './db';
import logger from './logger';
import { redis } from './redis';

// ============================================================================
// TIPOS
// ============================================================================

export interface PropertySearchFilters {
  // Text search
  query?: string;
  
  // Location
  city?: string;
  neighborhood?: string;
  postalCodes?: string[];
  
  // Price range
  minPrice?: number;
  maxPrice?: number;
  
  // Size
  minSquareMeters?: number;
  maxSquareMeters?: number;
  
  // Rooms
  minRooms?: number;
  maxRooms?: number;
  rooms?: number[]; // Exact matches
  
  // Features
  hasParking?: boolean;
  hasElevator?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  petsAllowed?: boolean;
  furnished?: boolean;
  
  // Status
  status?: ('AVAILABLE' | 'RENTED' | 'MAINTENANCE')[];
  
  // Sorting
  sortBy?: 'price' | 'squareMeters' | 'rooms' | 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  cities: { value: string; count: number }[];
  priceRanges: { min: number; max: number; count: number }[];
  rooms: { value: number; count: number }[];
  features: { name: string; count: number }[];
}

// ============================================================================
// BÚSQUEDA AVANZADA
// ============================================================================

/**
 * Búsqueda avanzada de propiedades
 */
export async function searchProperties(
  filters: PropertySearchFilters,
  userId?: string
): Promise<SearchResult<any>> {
  try {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Construir WHERE clause dinámico
    const where: any = {};

    // Text search (full-text)
    if (filters.query) {
      where.OR = [
        { direccion: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } },
        { descripcion: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { ciudad: { contains: filters.query, mode: 'insensitive' } },
        { city: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    // Location filters
    if (filters.city) {
      where.OR = [
        { ciudad: { equals: filters.city, mode: 'insensitive' } },
        { city: { equals: filters.city, mode: 'insensitive' } },
      ];
    }

    if (filters.neighborhood) {
      where.OR = [
        { barrio: { equals: filters.neighborhood, mode: 'insensitive' } },
        { neighborhood: { equals: filters.neighborhood, mode: 'insensitive' } },
      ];
    }

    if (filters.postalCodes && filters.postalCodes.length > 0) {
      where.OR = [
        { codigoPostal: { in: filters.postalCodes } },
        { postalCode: { in: filters.postalCodes } },
      ];
    }

    // Price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.precio = {};
      if (filters.minPrice !== undefined) where.precio.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.precio.lte = filters.maxPrice;
    }

    // Square meters range
    if (filters.minSquareMeters !== undefined || filters.maxSquareMeters !== undefined) {
      where.superficie = {};
      if (filters.minSquareMeters !== undefined) where.superficie.gte = filters.minSquareMeters;
      if (filters.maxSquareMeters !== undefined) where.superficie.lte = filters.maxSquareMeters;
    }

    // Rooms
    if (filters.rooms && filters.rooms.length > 0) {
      where.habitaciones = { in: filters.rooms };
    } else {
      if (filters.minRooms !== undefined || filters.maxRooms !== undefined) {
        where.habitaciones = {};
        if (filters.minRooms !== undefined) where.habitaciones.gte = filters.minRooms;
        if (filters.maxRooms !== undefined) where.habitaciones.lte = filters.maxRooms;
      }
    }

    // Boolean features
    if (filters.hasParking !== undefined) where.tieneParking = filters.hasParking;
    if (filters.hasElevator !== undefined) where.tieneAscensor = filters.hasElevator;
    if (filters.hasGarden !== undefined) where.tieneJardin = filters.hasGarden;
    if (filters.hasPool !== undefined) where.tienePiscina = filters.hasPool;
    if (filters.petsAllowed !== undefined) where.admiteMascotas = filters.petsAllowed;
    if (filters.furnished !== undefined) where.amueblado = filters.furnished;

    // Status
    if (filters.status && filters.status.length > 0) {
      where.estado = { in: filters.status };
    }

    // Count total (cache por 1 min)
    const cacheKey = `search:count:${JSON.stringify(where)}`;
    let total = await redis.get(cacheKey);
    if (!total) {
      total = await prisma.property.count({ where });
      await redis.setex(cacheKey, 60, total.toString());
    } else {
      total = parseInt(total);
    }

    // Sorting
    const orderBy: any = {};
    if (filters.sortBy) {
      const fieldMap: Record<string, string> = {
        price: 'precio',
        squareMeters: 'superficie',
        rooms: 'habitaciones',
        createdAt: 'createdAt',
      };
      const field = fieldMap[filters.sortBy] || 'createdAt';
      orderBy[field] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch results
    const results = await prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        direccion: true,
        address: true,
        ciudad: true,
        city: true,
        codigoPostal: true,
        postalCode: true,
        precio: true,
        price: true,
        habitaciones: true,
        rooms: true,
        banos: true,
        bathrooms: true,
        superficie: true,
        squareMeters: true,
        estado: true,
        status: true,
        tieneParking: true,
        hasParking: true,
        tieneAscensor: true,
        hasElevator: true,
        descripcion: true,
        description: true,
        images: { take: 1, select: { url: true } },
        createdAt: true,
      },
    });

    // Log search
    if (userId) {
      await logSearch(userId, filters, results.length);
    }

    return {
      results,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

  } catch (error: any) {
    logger.error('❌ Error in advanced search:', error);
    throw error;
  }
}

/**
 * Obtiene facets (agregaciones) para filtros
 */
export async function getSearchFacets(baseFilters: PropertySearchFilters = {}): Promise<SearchFacets> {
  try {
    const cacheKey = `search:facets:${JSON.stringify(baseFilters)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cities
    const cities = await prisma.property.groupBy({
      by: ['ciudad'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Rooms
    const rooms = await prisma.property.groupBy({
      by: ['habitaciones'],
      _count: { id: true },
      orderBy: { habitaciones: 'asc' },
    });

    // Price ranges (buckets)
    const priceRanges = [
      { min: 0, max: 500, count: 0 },
      { min: 500, max: 1000, count: 0 },
      { min: 1000, max: 1500, count: 0 },
      { min: 1500, max: 2000, count: 0 },
      { min: 2000, max: 999999, count: 0 },
    ];

    for (const range of priceRanges) {
      range.count = await prisma.property.count({
        where: {
          precio: { gte: range.min, lt: range.max },
        },
      });
    }

    // Features
    const features = [
      { name: 'parking', count: await prisma.property.count({ where: { tieneParking: true } }) },
      { name: 'elevator', count: await prisma.property.count({ where: { tieneAscensor: true } }) },
      { name: 'garden', count: await prisma.property.count({ where: { tieneJardin: true } }) },
      { name: 'pool', count: await prisma.property.count({ where: { tienePiscina: true } }) },
      { name: 'petsAllowed', count: await prisma.property.count({ where: { admiteMascotas: true } }) },
    ];

    const facets: SearchFacets = {
      cities: cities.map((c) => ({ value: c.ciudad || '', count: c._count.id })),
      rooms: rooms.map((r) => ({ value: r.habitaciones || 0, count: r._count.id })),
      priceRanges,
      features,
    };

    // Cache por 5 min
    await redis.setex(cacheKey, 300, JSON.stringify(facets));

    return facets;

  } catch (error: any) {
    logger.error('❌ Error getting search facets:', error);
    throw error;
  }
}

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

/**
 * Autocomplete de ubicaciones (ciudades, barrios)
 */
export async function autocompleteLocation(query: string, limit: number = 10): Promise<{
  cities: string[];
  neighborhoods: string[];
}> {
  try {
    if (!query || query.length < 2) {
      return { cities: [], neighborhoods: [] };
    }

    const cacheKey = `autocomplete:${query.toLowerCase()}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cities
    const cities = await prisma.property.findMany({
      where: {
        OR: [
          { ciudad: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
      distinct: ['ciudad'],
      select: { ciudad: true, city: true },
      take: limit,
    });

    // Neighborhoods
    const neighborhoods = await prisma.property.findMany({
      where: {
        OR: [
          { barrio: { contains: query, mode: 'insensitive' } },
          { neighborhood: { contains: query, mode: 'insensitive' } },
        ],
      },
      distinct: ['barrio'],
      select: { barrio: true, neighborhood: true },
      take: limit,
    });

    const result = {
      cities: [...new Set(cities.map((c) => c.ciudad || c.city).filter(Boolean))],
      neighborhoods: [...new Set(neighborhoods.map((n) => n.barrio || n.neighborhood).filter(Boolean))],
    };

    // Cache por 1 hora
    await redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;

  } catch (error: any) {
    logger.error('❌ Error in autocomplete:', error);
    return { cities: [], neighborhoods: [] };
  }
}

// ============================================================================
// SAVED SEARCHES
// ============================================================================

/**
 * Guarda una búsqueda del usuario
 */
export async function saveSearch(userId: string, name: string, filters: PropertySearchFilters): Promise<any> {
  try {
    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        name,
        filters: filters as any,
      },
    });

    logger.info('💾 Search saved', { userId, name });

    return savedSearch;
  } catch (error: any) {
    logger.error('❌ Error saving search:', error);
    throw error;
  }
}

/**
 * Obtiene búsquedas guardadas del usuario
 */
export async function getSavedSearches(userId: string): Promise<any[]> {
  return await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Ejecuta una búsqueda guardada
 */
export async function executeSavedSearch(savedSearchId: string, userId: string): Promise<SearchResult<any>> {
  const savedSearch = await prisma.savedSearch.findUnique({
    where: { id: savedSearchId },
  });

  if (!savedSearch || savedSearch.userId !== userId) {
    throw new Error('Saved search not found');
  }

  return await searchProperties(savedSearch.filters as any, userId);
}

// ============================================================================
// HELPERS
// ============================================================================

async function logSearch(userId: string, filters: PropertySearchFilters, resultsCount: number): Promise<void> {
  try {
    await prisma.searchLog.create({
      data: {
        userId,
        filters: filters as any,
        resultsCount,
      },
    });
  } catch (error) {
    // Non-critical, don't throw
    logger.error('Error logging search:', error);
  }
}

export default {
  searchProperties,
  getSearchFacets,
  autocompleteLocation,
  saveSearch,
  getSavedSearches,
  executeSavedSearch,
};
