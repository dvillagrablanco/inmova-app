/**
 * API Documentation Endpoint
 * Swagger UI público para la API de Inmova
 */

import { NextResponse } from 'next/server';
import swaggerDefinition from '@/lib/swagger-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/docs
 * Retorna la especificación OpenAPI en formato JSON
 */
export async function GET() {
  return NextResponse.json(swaggerDefinition, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS para Swagger UI externo
    },
  });
}
