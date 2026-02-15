import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webinars
 * Devuelve webinars disponibles. Actualmente no hay modelo Webinar en BD.
 * Cuando se implemente el módulo de webinars, este endpoint leerá de la tabla Webinar.
 */
export async function GET() {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;

  // TODO: Cuando exista el modelo Webinar en Prisma, leer de la BD
  return NextResponse.json({ data: [] });
}
