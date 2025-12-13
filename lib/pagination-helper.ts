/**
 * Pagination Helper for Optimized Database Queries
 * Provides utilities for cursor-based and offset-based pagination
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Calculate pagination parameters from query
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;
  const take = limit;

  return { skip, take, page, limit };
}

/**
 * Build pagination response
 */
export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

/**
 * Build cursor-based pagination response
 */
export function buildCursorPaginationResponse<T extends { id: string }>(
  data: T[],
  limit: number
): CursorPaginationResult<T> {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}

/**
 * Get Prisma cursor pagination options
 */
export function getCursorPaginationOptions(cursor?: string, limit: number = 20) {
  return {
    take: limit + 1, // Fetch one extra to check if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    }),
  };
}

/**
 * Default pagination limits
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;
