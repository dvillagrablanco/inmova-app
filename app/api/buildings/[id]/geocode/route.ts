/**
 * Re-geocodifica un edificio usando Nominatim y actualiza
 * sus coordenadas (latitud/longitud) en BD.
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const building = await prisma.building.findFirst({
      where: { id: params.id, companyId: { in: scope.scopeCompanyIds } },
      select: { id: true, direccion: true, latitud: true, longitud: true },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    // Permitir forzar a través de query string ?force=true
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    const needsGeocode =
      force ||
      !building.latitud ||
      !building.longitud ||
      looksLowPrecisionCoord(building.latitud) ||
      looksLowPrecisionCoord(building.longitud);

    if (!needsGeocode) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Coordenadas ya tienen buena precisión',
        latitud: building.latitud,
        longitud: building.longitud,
      });
    }

    // Inferir ciudad y código postal de la dirección
    const segments = (building.direccion || '').split(',').map((s) => s.trim()).filter(Boolean);
    const ciudad = segments.length >= 2 ? segments[segments.length - 1].replace(/^\d{5}\s*/, '').trim() : undefined;
    const cpMatch = (building.direccion || '').match(/\b(\d{5})\b/);
    const codigoPostal = cpMatch?.[1];

    const geo = await geocodeAddress({
      direccion: building.direccion,
      ciudad,
      codigoPostal,
    });

    if (!geo) {
      return NextResponse.json(
        { error: 'No se pudo geocodificar la dirección' },
        { status: 422 }
      );
    }

    await prisma.building.update({
      where: { id: building.id },
      data: { latitud: geo.lat, longitud: geo.lon },
    });

    logger.info(`[geocode] Building ${building.id} actualizado: ${geo.displayName}`);

    return NextResponse.json({
      success: true,
      latitud: geo.lat,
      longitud: geo.lon,
      displayName: geo.displayName,
      previousLatitud: building.latitud,
      previousLongitud: building.longitud,
    });
  } catch (error) {
    logger.error('[geocode] Error:', error as any);
    return NextResponse.json(
      { error: 'Error en geocodificación' },
      { status: 500 }
    );
  }
}
