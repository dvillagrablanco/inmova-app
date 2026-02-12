import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blog/posts
 * Devuelve posts del blog. Actualmente no hay modelo de blog en BD.
 * Cuando se implemente el CMS, este endpoint leerá de la tabla BlogPost.
 */
export async function GET() {
  // TODO: Cuando exista el modelo BlogPost en Prisma, leer de la BD
  return NextResponse.json({ data: [] });
}
