/**
 * Utilidades para APIs
 * 
 * Funciones helper para respuestas HTTP estandarizadas
 * y manejo consistente de errores.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import logger from './logger';

/**
 * Interfaz para respuestas de error
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

/**
 * Interfaz para respuestas paginadas
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  };
}

/**
 * Crea una respuesta de éxito con datos
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Crea una respuesta de error estandarizada
 */
export function errorResponse(
  error: string,
  message: string,
  status: number,
  details?: any
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error,
    message,
  };

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Respuesta de error 400 - Bad Request
 */
export function badRequestResponse(
  message: string = 'Solicitud inválida',
  details?: any
): NextResponse<ErrorResponse> {
  return errorResponse('Bad Request', message, 400, details);
}

/**
 * Respuesta de error 401 - Unauthorized
 */
export function unauthorizedResponse(
  message: string = 'No autenticado. Debe iniciar sesión'
): NextResponse<ErrorResponse> {
  return errorResponse('No autenticado', message, 401);
}

/**
 * Respuesta de error 403 - Forbidden
 */
export function forbiddenResponse(
  message: string = 'No tiene permisos para realizar esta acción'
): NextResponse<ErrorResponse> {
  return errorResponse('Prohibido', message, 403);
}

/**
 * Respuesta de error 404 - Not Found
 */
export function notFoundResponse(
  resource: string = 'Recurso'
): NextResponse<ErrorResponse> {
  return errorResponse('No encontrado', `${resource} no encontrado`, 404);
}

/**
 * Respuesta de error 409 - Conflict
 */
export function conflictResponse(
  message: string = 'El recurso ya existe o hay un conflicto'
): NextResponse<ErrorResponse> {
  return errorResponse('Conflicto', message, 409);
}

/**
 * Respuesta de error 500 - Internal Server Error
 */
export function internalServerErrorResponse(
  message: string = 'Error interno del servidor'
): NextResponse<ErrorResponse> {
  return errorResponse('Error interno del servidor', message, 500);
}

/**
 * Maneja errores de validación Zod
 */
export function handleZodError(
  error: z.ZodError
): NextResponse<ErrorResponse> {
  return errorResponse(
    'Validación fallida',
    'Los datos proporcionados no son válidos',
    400,
    error.errors
  );
}

/**
 * Maneja errores genéricos con logging
 */
export function handleError(
  error: any,
  context: string
): NextResponse<ErrorResponse> {
  logger.error(`Error in ${context}:`, error);

  // Errores de validación Zod
  if (error instanceof z.ZodError) {
    return handleZodError(error);
  }

  // Errores de autenticación
  if (error.message === 'No autenticado') {
    return unauthorizedResponse();
  }

  // Errores de permisos
  if (error.message?.includes('permiso')) {
    return forbiddenResponse(error.message);
  }

  // Errores de Prisma - Not Found
  if (error.code === 'P2025') {
    return notFoundResponse();
  }

  // Errores de Prisma - Unique Constraint
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'campo';
    return conflictResponse(`Ya existe un registro con ese ${field}`);
  }

  // Error genérico
  return internalServerErrorResponse();
}

/**
 * Crea una respuesta paginada
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit?: number,
  offset?: number
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    data,
    meta: {
      total,
      limit,
      offset,
    },
  });
}

/**
 * Parsea parámetros de paginación de query string
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  limit?: number;
  offset?: number;
} {
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  return {
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  };
}

/**
 * Valida que un UUID sea válido
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida que una fecha sea válida
 */
export function isValidDate(date: string): boolean {
  const parsedDate = new Date(date);
  return parsedDate.toString() !== 'Invalid Date';
}

/**
 * Sanitiza un objeto eliminando campos undefined/null
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Convierte fechas ISO string a Date objects
 */
export function convertDatesToObjects(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(convertDatesToObjects);
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && isValidDate(value)) {
      converted[key] = new Date(value);
    } else if (typeof value === 'object') {
      converted[key] = convertDatesToObjects(value);
    } else {
      converted[key] = value;
    }
  }

  return converted;
}
