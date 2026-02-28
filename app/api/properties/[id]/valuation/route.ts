import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AIValuationService } from '@/lib/ai-valuation-service';
import { ValuationCacheService } from '@/lib/valuation-cache-service';
import { CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/properties/[id]/valuation
 * Obtiene valoración con IA de una propiedad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const propertyId = params.id;

    // Obtener propiedad con datos completos
    const property = await prisma.unit.findUnique({
      where: { id: propertyId },
      include: {
        building: {
          select: {
            nombre: true,
            direccion: true,
            companyId: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar acceso (ownership) - soporta multi-empresa
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role,
      primaryCompanyId: (session.user as any).companyId,
      request,
    });
    
    if (!scope.scopeCompanyIds.includes(property.building?.companyId || '')) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const address = property.building.direccion || '';
    const cityGuess = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .pop();
    const city = cityGuess || 'Madrid';

    // Preparar datos para valoración
    const propertyData = {
      address,
      city,
      neighborhood: undefined,
      postalCode: undefined,
      squareMeters: property.superficie,
      rooms: property.habitaciones || undefined,
      bathrooms: property.banos || undefined,
      floor: property.planta || undefined,
      aireAcondicionado: property.aireAcondicionado,
      calefaccion: property.calefaccion,
      terraza: property.terraza,
      balcon: property.balcon,
      orientacion: property.orientacion || undefined,
    };

    // Obtener datos del mercado
    const marketData = await AIValuationService.getMarketData(
      city,
      undefined,
      undefined
    );

    // Buscar propiedades similares en la BD
    const buildingCompanyId = property.building?.companyId || session.user.companyId;
    const similarProperties = await prisma.unit.findMany({
      where: {
        building: { companyId: buildingCompanyId },
        id: { not: propertyId },
        buildingId: property.buildingId,
        superficie: {
          gte: property.superficie * 0.8,
          lte: property.superficie * 1.2,
        },
        habitaciones: property.habitaciones,
      },
      select: {
        id: true,
        numero: true,
        superficie: true,
        rentaMensual: true,
        building: {
          select: {
            direccion: true,
          },
        },
      },
      take: 5,
    });

    // Agregar comparables al marketData
    marketData.similarProperties = similarProperties.map((prop) => ({
        address: `${prop.building?.direccion || address}, Unidad ${prop.numero}`,
      price: prop.rentaMensual * 12 * 15, // Estimación valor = renta anual * 15
      squareMeters: prop.superficie,
    }));

    // Realizar valoración con IA (con fallback si la API falla)
    let valuation;
    try {
      valuation = await AIValuationService.valuateProperty(
        propertyData,
        marketData
      );
    } catch (aiError: any) {
      logger.warn('[Valuation] AI failed, using fallback:', aiError?.message?.slice(0, 200));
      // Fallback: valoración basada en datos de mercado sin IA
      const preciosBase: Record<string, number> = {
        'Madrid': 4200, 'Barcelona': 4500, 'Valencia': 2300, 'Sevilla': 2100,
        'Málaga': 2800, 'Palencia': 1400, 'Valladolid': 1800, 'Benidorm': 2200, 'Marbella': 3500,
      };
      const precioM2 = marketData.avgPricePerM2 || preciosBase[city] || 2500;
      const estimatedValue = Math.round(precioM2 * property.superficie);
      valuation = {
        estimatedValue,
        minValue: Math.round(estimatedValue * 0.9),
        maxValue: Math.round(estimatedValue * 1.1),
        confidenceScore: 60,
        pricePerM2: precioM2,
        reasoning: `Valoración estimada basada en precio medio de ${city} (${precioM2}€/m²). Para mayor precisión, se recomienda tasación profesional.`,
        keyFactors: [`Ubicación en ${city}`, `${property.superficie}m²`, `${property.habitaciones || 0} habitaciones`],
        marketComparison: `Precio medio en ${city}: ${precioM2}€/m²`,
        investmentPotential: 'MEDIUM' as const,
        recommendations: ['Solicitar tasación profesional', 'Comparar con ventas recientes en la zona'],
      };
    }

    // 4. Guardar en caché (no bloqueante)
    ValuationCacheService.set(propertyId, {
      propertyId,
      ...valuation,
    }).catch((err) => logger.error('Cache save error:', err));

    // 5. Guardar valoración en BD (histórico)
    try {
      const rooms = property.habitaciones ?? 0;
      const bathrooms = property.banos ?? 0;
      const postalCode = propertyData.postalCode || '00000';

      await prisma.propertyValuation.create({
        data: {
          unitId: propertyId,
          companyId: buildingCompanyId,
          address: propertyData.address,
          postalCode,
          city,
          squareMeters: propertyData.squareMeters,
          rooms,
          bathrooms,
          condition: 'GOOD',
          estimatedValue: valuation.estimatedValue,
          minValue: valuation.minValue,
          maxValue: valuation.maxValue,
          confidenceScore: valuation.confidenceScore,
          pricePerM2: valuation.pricePerM2,
          reasoning: valuation.reasoning,
          keyFactors: valuation.keyFactors,
          comparables: marketData.similarProperties || [],
          recommendations: valuation.recommendations,
          model: CLAUDE_MODEL_PRIMARY,
          requestedBy: session.user.id,
        },
      });
    } catch (dbError) {
      logger.error('Error saving valuation:', dbError);
      // No fallar si no se puede guardar
    }

    return NextResponse.json({
      success: true,
      data: valuation,
      metadata: {
        propertyId,
        address: `${property.building.direccion}, ${city}`,
        squareMeters: property.superficie,
        marketData: {
          avgPricePerM2: marketData.avgPricePerM2,
          trend: marketData.marketTrend,
          comparablesCount: marketData.similarProperties?.length || 0,
        },
      },
    });
  } catch (error: any) {
    const errMsg = error?.message || JSON.stringify(error).slice(0, 300);
    logger.error('[Valuation API Error]:', { message: errMsg, status: error?.status });

    if (error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Servicio de valoración no configurado',
          details: 'Contacta al administrador',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error al generar valoración',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
