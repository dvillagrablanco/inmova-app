import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
import { getAggregatedMarketData, formatPlatformDataForPrompt } from '@/lib/external-platform-data-service';
import { analyzeAndValuateProperty } from '@/lib/ai-property-analysis';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const address = property.building?.direccion || '';
    const cityGuess = address
      .split(',')
      .map((part: string) => part.trim())
      .filter(Boolean)
      .pop();
    const city = cityGuess || 'Madrid';
    const buildingCompanyId = property.building?.companyId || session.user.companyId;

    // 1. Obtener datos de mercado de múltiples plataformas (scraping + Notariado + INE)
    let aggregatedMarketData = null;
    let platformDataText = '';
    try {
      aggregatedMarketData = await getAggregatedMarketData({
        city,
        address,
        companyId: buildingCompanyId,
        squareMeters: property.superficie,
        rooms: property.habitaciones || undefined,
        propertyType: propertyType as any,
      });
      platformDataText = formatPlatformDataForPrompt(aggregatedMarketData);
    } catch (e) {
      logger.warn('[Valuation] Error obteniendo datos de plataformas:', e);
    }

    // 2. Buscar comparables internos
    const similarProperties = await prisma.unit.findMany({
      where: {
        building: { companyId: buildingCompanyId },
        id: { not: propertyId },
        buildingId: property.buildingId,
        superficie: { gte: property.superficie * 0.8, lte: property.superficie * 1.2 },
      },
      select: {
        numero: true, superficie: true, rentaMensual: true,
        building: { select: { direccion: true } },
      },
      take: 5,
    });
    const internalComparables = similarProperties
      .filter((p: any) => p.rentaMensual)
      .map((p: any) => `- ${p.building?.direccion || address}, Unidad ${p.numero}: ${(p.rentaMensual * 12 * 15).toLocaleString()}€ (${p.superficie}m²)`)
      .join('\n');

    // Map UnitType → PropertyType for AI analysis
    const unitTypeToPropertyType: Record<string, string> = {
      vivienda: 'vivienda',
      local: 'local_comercial',
      garaje: 'garaje',
      trastero: 'trastero',
      oficina: 'oficina',
      nave_industrial: 'nave_industrial',
      coworking_space: 'coworking',
      terreno: 'terreno',
    };
    const propertyType = unitTypeToPropertyType[(property as any).tipo || 'vivienda'] || 'vivienda';

    // 3. Valoración IA multi-paso (Fase 1: análisis comparables + Fase 2: valoración experta)
    const propertyForAI = {
      propertyType: propertyType as any,
      address,
      city,
      postalCode: '',
      squareMeters: property.superficie,
      rooms: property.habitaciones || 0,
      bathrooms: property.banos || 0,
      floor: property.planta || undefined,
      condition: 'GOOD',
      hasElevator: property.ascensor || false,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasTerrace: property.terraza || false,
      hasGarage: false,
      orientacion: property.orientacion || undefined,
      finalidad: 'venta',
    };

    const valuation = await analyzeAndValuateProperty(
      propertyForAI,
      aggregatedMarketData,
      platformDataText,
      internalComparables,
    );

    // 4. Guardar en BD
    try {
      await prisma.propertyValuation.create({
        data: {
          unitId: propertyId,
          companyId: buildingCompanyId,
          address,
          postalCode: '',
          city,
          squareMeters: property.superficie,
          rooms: property.habitaciones ?? 0,
          bathrooms: property.banos ?? 0,
          condition: 'GOOD',
          estimatedValue: valuation.estimatedValue,
          minValue: valuation.minValue,
          maxValue: valuation.maxValue,
          confidenceScore: valuation.confidenceScore,
          pricePerM2: valuation.precioM2,
          reasoning: valuation.reasoning,
          keyFactors: valuation.factoresPositivos,
          recommendations: valuation.recomendaciones,
          estimatedRent: valuation.alquilerEstimado,
          estimatedROI: valuation.rentabilidadAlquiler,
          capRate: valuation.capRate,
          model: CLAUDE_MODEL_PRIMARY,
          requestedBy: session.user.id,
        },
      });
    } catch (dbError) {
      logger.error('Error saving valuation:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        estimatedValue: valuation.estimatedValue,
        minValue: valuation.minValue,
        maxValue: valuation.maxValue,
        confidenceScore: valuation.confidenceScore,
        pricePerM2: valuation.precioM2,
        reasoning: valuation.reasoning,
        keyFactors: [...valuation.factoresPositivos, ...valuation.factoresNegativos],
        marketComparison: valuation.analisisMercado,
        investmentPotential: valuation.rentabilidadAlquiler >= 5 ? 'HIGH' : valuation.rentabilidadAlquiler >= 3.5 ? 'MEDIUM' : 'LOW',
        recommendations: valuation.recomendaciones,
        // Alquiler larga estancia
        alquilerEstimado: valuation.alquilerEstimado,
        rentabilidadAlquiler: valuation.rentabilidadAlquiler,
        capRate: valuation.capRate,
        // Alquiler media estancia
        alquilerMediaEstancia: valuation.alquilerMediaEstancia,
        alquilerMediaEstanciaMin: valuation.alquilerMediaEstanciaMin,
        alquilerMediaEstanciaMax: valuation.alquilerMediaEstanciaMax,
        rentabilidadMediaEstancia: valuation.rentabilidadMediaEstancia,
        ocupacionEstimadaMediaEstancia: valuation.ocupacionEstimadaMediaEstancia,
        perfilInquilinoMediaEstancia: valuation.perfilInquilinoMediaEstancia,
        // Metadata
        metodologiaUsada: valuation.metodologiaUsada,
        tendenciaMercado: valuation.tendenciaMercado,
        sourcesUsed: valuation.sourcesUsed,
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
