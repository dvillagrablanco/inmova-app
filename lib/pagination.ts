import { NextRequest } from 'next/server';

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Metadata de paginación para respuestas
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Parámetros de paginación por defecto
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/**
 * Extrae los parámetros de paginación de la URL
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = DEFAULT_PAGE_SIZE
): PaginationParams {
  // Extraer page y limit de query params
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit') || searchParams.get('perPage');

  // Parsear y validar page
  let page = pageParam ? parseInt(pageParam, 10) : 1;
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parsear y validar limit
  let limit = limitParam ? parseInt(limitParam, 10) : defaultLimit;
  if (isNaN(limit) || limit < MIN_PAGE_SIZE) {
    limit = defaultLimit;
  }
  if (limit > MAX_PAGE_SIZE) {
    limit = MAX_PAGE_SIZE;
  }

  // Calcular skip
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Calcula los metadatos de paginación
 */
export function calculatePaginationMeta(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Crea una respuesta paginada
 */
export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const pagination = calculatePaginationMeta(totalItems, params.page, params.limit);

  return {
    data,
    pagination,
  };
}

/**
 * Helper para paginación con Prisma
 *
 * Ejemplo de uso:
 * ```typescript
 * const { data, pagination } = await paginateWithPrisma(
 *   prisma.user,
 *   { where: { companyId }, orderBy: { createdAt: 'desc' } },
 *   params
 * );
 * ```
 */
export async function paginateWithPrisma<T>(
  model: any,
  query: any,
  params: PaginationParams
): Promise<PaginatedResponse<T>> {
  // Ejecutar count y findMany en paralelo
  const [totalItems, data] = await Promise.all([
    model.count({ where: query.where }),
    model.findMany({
      ...query,
      skip: params.skip,
      take: params.limit,
    }),
  ]);

  return createPaginatedResponse(data, totalItems, params);
}

/**
 * Helper para paginación con arrays (datos ya cargados en memoria)
 * Úsalo solo cuando necesites filtrar/ordenar en memoria
 */
export function paginateArray<T>(items: T[], params: PaginationParams): PaginatedResponse<T> {
  const totalItems = items.length;
  const data = items.slice(params.skip, params.skip + params.limit);

  return createPaginatedResponse(data, totalItems, params);
}

/**
 * Parámetros de ordenamiento
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Extrae los parámetros de ordenamiento de la URL
 */
export function getSortParams(
  searchParams: URLSearchParams,
  defaultField: string = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc',
  allowedFields: string[] = []
): SortParams {
  const sortField = searchParams.get('sortBy') || searchParams.get('orderBy');
  const sortOrder = searchParams.get('order') || searchParams.get('sort');

  // Validar campo
  let field = sortField || defaultField;
  if (allowedFields.length > 0 && !allowedFields.includes(field)) {
    field = defaultField;
  }

  // Validar orden
  let order: 'asc' | 'desc' = defaultOrder;
  if (sortOrder?.toLowerCase() === 'asc' || sortOrder?.toLowerCase() === 'desc') {
    order = sortOrder.toLowerCase() as 'asc' | 'desc';
  }

  return { field, order };
}

/**
 * Wrapper completo para paginación + ordenamiento con Prisma
 *
 * Ejemplo de uso:
 * ```typescript
 * const result = await paginateAndSort(
 *   prisma.user,
 *   request,
 *   { where: { companyId } },
 *   { defaultSortField: 'name', allowedSortFields: ['name', 'email', 'createdAt'] }
 * );
 * ```
 */
export async function paginateAndSort<T>(
  model: any,
  request: NextRequest,
  query: any = {},
  options: {
    defaultPageSize?: number;
    defaultSortField?: string;
    defaultSortOrder?: 'asc' | 'desc';
    allowedSortFields?: string[];
  } = {}
): Promise<PaginatedResponse<T>> {
  const { searchParams } = new URL(request.url);

  // Extraer parámetros de paginación
  const paginationParams = getPaginationParams(
    searchParams,
    options.defaultPageSize || DEFAULT_PAGE_SIZE
  );

  // Extraer parámetros de ordenamiento
  const sortParams = getSortParams(
    searchParams,
    options.defaultSortField || 'createdAt',
    options.defaultSortOrder || 'desc',
    options.allowedSortFields || []
  );

  // Construir query con ordenamiento
  const queryWithSort = {
    ...query,
    orderBy: { [sortParams.field]: sortParams.order },
  };

  return paginateWithPrisma(model, queryWithSort, paginationParams);
}
