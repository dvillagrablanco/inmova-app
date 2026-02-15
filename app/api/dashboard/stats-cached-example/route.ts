/**
 * EJEMPLO: Dashboard con Caché Redis y Rate Limiting
 *
 * Este archivo es un EJEMPLO DESHABILITADO (para prevenir errores de build)
 * En producción, debería implementarse con:
 * 1. Rate limiting funcional
 * 2. Caché Redis
 * 3. Logging estructurado
 * 4. Manejo de errores
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;

  return NextResponse.json({ error: 'Endpoint de ejemplo deshabilitado' }, { status: 501 });
}
