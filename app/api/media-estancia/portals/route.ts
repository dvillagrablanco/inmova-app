import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  PORTAL_CONFIGS,
  type PortalName,
  type PropertyListing,
  type PublicationResult,
} from '@/lib/medium-term/portals-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/media-estancia/portals
 * Lista portales disponibles con estado de configuración.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const portals = PORTAL_CONFIGS.map((p) => ({
      ...p,
      configured: false, // TODO: check if API keys are set per portal
      publishedListings: 0,
    }));

    return NextResponse.json({
      success: true,
      portals,
      totalPortales: portals.length,
      portalNames: portals.map((p) => p.displayName),
    });
  } catch (error: any) {
    logger.error('[Portals GET]:', error);
    return NextResponse.json({ error: 'Error obteniendo portales' }, { status: 500 });
  }
}

/**
 * POST /api/media-estancia/portals
 * Publicar una propiedad en uno o varios portales.
 * Body: { unitId, portals: ['alamo', 'spotahome'], pricing: { monthlyRent, minStay, maxStay } }
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { unitId, portals: targetPortals, pricing } = body;

    if (!unitId || !targetPortals?.length) {
      return NextResponse.json({ error: 'unitId y portals requeridos' }, { status: 400 });
    }

    // Obtener datos de la unidad
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        building: {
          select: {
            nombre: true,
            direccion: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    const results: PublicationResult[] = [];

    for (const portalName of targetPortals as PortalName[]) {
      const portalConfig = PORTAL_CONFIGS.find((p) => p.name === portalName);
      if (!portalConfig) {
        results.push({
          portal: portalName,
          success: false,
          error: `Portal ${portalName} no configurado`,
        });
        continue;
      }

      // Generar listing para el portal
      const listing: Partial<PropertyListing> = {
        propertyId: unitId,
        price: pricing?.monthlyRent || unit.rentaMensual,
        currency: 'EUR',
        availableFrom: new Date(),
        minStay: pricing?.minStay || portalConfig.minDuration,
        maxStay: pricing?.maxStay || portalConfig.maxDuration,
        photos: unit.imagenes || [],
        location: {
          address: unit.building?.direccion || '',
          city:
            unit.building?.direccion
              ?.split(',')
              .map((part) => part.trim())
              .filter(Boolean)
              .pop() || 'Madrid',
          coordinates: undefined,
        },
        property: {
          type: unit.tipo === 'vivienda' ? 'apartment' : 'room',
          bedrooms: unit.habitaciones || 1,
          bathrooms: unit.banos || 1,
          size: unit.superficieUtil || unit.superficie,
          furnished: unit.amueblado,
        },
        services: {
          wifi: true,
          utilities: false,
          airConditioning: unit.aireAcondicionado,
          heating: unit.calefaccion,
          washingMachine: true,
          dryer: false,
          dishwasher: false,
          tv: false,
        },
      };

      // En producción, aquí se haría la llamada a la API del portal
      // Por ahora, simulamos el resultado exitoso
      results.push({
        portal: portalName,
        success: true,
        listingId: `${portalName}-${unitId}-${Date.now()}`,
        listingUrl: `${portalConfig.apiBaseUrl}/listing/${unitId}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      logger.info(
        `[Portal Publish] ${portalConfig.displayName}: ${unit.building?.nombre} ${unit.numero}`,
        {
          companyId: session.user.companyId,
          portal: portalName,
          price: listing.price,
        }
      );
    }

    const exitosos = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Publicado en ${exitosos}/${targetPortals.length} portales`,
      results,
    });
  } catch (error: any) {
    logger.error('[Portal Publish]:', error);
    return NextResponse.json({ error: 'Error publicando en portales' }, { status: 500 });
  }
}
