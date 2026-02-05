import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: /api/votaciones
 * Respuesta vacía para evitar 404 en módulo de votaciones.
 */
export async function GET() {
  return NextResponse.json([]);
}
