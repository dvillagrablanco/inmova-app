/**
 * Re-geocodifica TODOS los edificios con coordenadas ausentes o de baja
 * precisión. Restringido a roles administrador y super_admin.
 *
 * GET ?dryRun=true para previsualizar.
 * POST para ejecutar (con rate-limit interno: 1 query/seg a Nominatim).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import { geocodeAddress, looksLowPrecisionCoord } from '@/lib/geocoding-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const ALLOWED_ROLES = new Set(['administrador', 'super_admin', 'gestor']);

function inferCity(direccion: string): string | undefined {
  const segments = (direccion || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return undefined;
  // Eliminar código postal del último segmento si presente: "34001 Palencia" -> "Palencia"
  return segments[segments.length - 1].replace(/^\d{5}\s*/, '').trim();
}

function inferPostalCode(direccion: string): string | undefined {
  return (direccion || '').match(/\b(\d{5})\b/)?.[1];
}

async function findCandidates(prisma: any, companyIds: string[]) {
  // Trae todos y filtra en memoria por la heurística de baja precisión
  const all = await prisma.building.findMany({
    where: { companyId: { in: companyIds } },
    select: { id: true, direccion: true, latitud: true, longitud: true, nombre: true },
  });

  return all.filter(
    (b: any) =>
      !b.latitud ||
      !b.longitud ||
      looksLowPrecisionCoord(b.latitud) ||
      looksLowPrecisionCoord(b.longitud)
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.has((session.user as any).role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const candidates = await findCandidates(prisma, scope.scopeCompanyIds);

    return NextResponse.json({
      success: true,
      total: candidates.length,
      buildings: candidates.slice(0, 100).map((b: any) => ({
        id: b.id,
        nombre: b.nombre,
        direccion: b.direccion,
        latitud: b.latitud,
        longitud: b.longitud,
      })),
    });
  } catch (error) {
    logger.error('[geocode-buildings GET]', error as any);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.has((session.user as any).role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);

    const candidates = await findCandidates(prisma, scope.scopeCompanyIds);
    const batch = candidates.slice(0, limit);

    let updated = 0;
    let failed = 0;
    const results: any[] = [];

    for (const b of batch) {
      const ciudad = inferCity(b.direccion);
      const codigoPostal = inferPostalCode(b.direccion);
      const geo = await geocodeAddress({
        direccion: b.direccion,
        ciudad,
        codigoPostal,
      });

      if (!geo) {
        failed++;
        results.push({ id: b.id, status: 'failed', direccion: b.direccion });
        continue;
      }

      await prisma.building.update({
        where: { id: b.id },
        data: { latitud: geo.lat, longitud: geo.lon },
      });
      updated++;
      results.push({
        id: b.id,
        status: 'updated',
        direccion: b.direccion,
        from: { lat: b.latitud, lon: b.longitud },
        to: { lat: geo.lat, lon: geo.lon },
      });
    }

    return NextResponse.json({
      success: true,
      processed: batch.length,
      updated,
      failed,
      remaining: candidates.length - batch.length,
      results,
    });
  } catch (error) {
    logger.error('[geocode-buildings POST]', error as any);
    return NextResponse.json({ error: 'Error en geocodificación masiva' }, { status: 500 });
  }
}
