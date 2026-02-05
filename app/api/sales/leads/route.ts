import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: /api/sales/leads
 * Respuesta vacía para evitar 404 en portal comercial.
 */
export async function GET() {
  return NextResponse.json([]);
}
