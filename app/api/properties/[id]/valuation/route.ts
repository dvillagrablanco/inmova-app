import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
import {
  getAggregatedMarketData,
  formatPlatformDataForPrompt,
} from '@/lib/external-platform-data-service';
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
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const propertyId = params.id;

    // Obtener propiedad con datos completos para una valoración rigurosa
    // (RICS Red Book 2024: TODOS los factores ESG / ubicación / riesgo
    // deben considerarse en cada paso).
    const property = await prisma.unit.findUnique({
      where: { id: propertyId },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            companyId: true,
            anoConstructor: true,
            certificadoEnergetico: true,
            ascensor: true,
            garaje: true,
            trastero: true,
            piscina: true,
            jardin: true,
            estadoConservacion: true,
            tipo: true,
            latitud: true,
            longitud: true,
            ibiAnual: true,
            gastosComunidad: true,
          },
        },
        contracts: {
          where: { estado: 'activo' },
          select: { rentaMensual: true },
          take: 1,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar acceso (ownership) - soporta multi-empresa
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role,
      primaryCompanyId: (session.user as any).companyId,
      request,
    });

    if (!(scope.scopeCompanyIds as string[]).includes(property.building?.companyId || '')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const address = property.building?.direccion || '';
    // Extraer ciudad del último segmento (limpiar CP si presente)
    const segments = address.split(',').map((s: string) => s.trim()).filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';
    const city = lastSegment.replace(/^\d{5}\s*/, '').trim() || 'Madrid';
    const cpMatch = address.match(/\b(\d{5})\b/);
    const postalCode = cpMatch?.[1] || '';
    const buildingCompanyId = property.building?.companyId || session.user.companyId;

    // Mapear estado de conservación a formato condition esperado
    const mapCondition = (estado: string | null | undefined): 'NEW' | 'GOOD' | 'NEEDS_RENOVATION' => {
      const e = (estado || '').toLowerCase();
      if (e.includes('nuev') || e.includes('estren') || e.includes('excelente')) return 'NEW';
      if (e.includes('reform') || e.includes('mal') || e.includes('regular')) return 'NEEDS_RENOVATION';
      return 'GOOD';
    };

    // Normalizar CEE a letra individual (A-G)
    const normalizeCee = (cee: string | null | undefined): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null => {
      if (!cee) return null;
      const letter = cee.trim().toUpperCase().charAt(0);
      return ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(letter)
        ? (letter as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G')
        : null;
    };
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
    const propertyType = unitTypeToPropertyType[property.tipo || 'vivienda'] || 'vivienda';

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
        propertyType,
      });
      platformDataText = formatPlatformDataForPrompt(aggregatedMarketData);
    } catch (e) {
      logger.warn('[Valuation] Error obteniendo datos de plataformas:', e);
    }

    // 2. Buscar comparables internos del MISMO TIPO de la propiedad
    // Usando cap rate dinámico por tipo en vez de multiplicador fijo 15
    const capRatesByType: Record<string, number> = {
      vivienda: 0.05, // Por defecto residencial 5%
      local: 0.07,
      oficina: 0.06,
      garaje: 0.05,
      trastero: 0.08,
      nave_industrial: 0.075,
    };
    const tipoUnit = (property.tipo as string) || 'vivienda';
    const capRateInternal = capRatesByType[tipoUnit] || 0.05;

    const similarProperties = await prisma.unit.findMany({
      where: {
        building: { companyId: buildingCompanyId },
        id: { not: propertyId },
        buildingId: property.buildingId,
        tipo: tipoUnit as any,
        superficie: { gte: property.superficie * 0.8, lte: property.superficie * 1.2 },
      },
      select: {
        numero: true,
        superficie: true,
        rentaMensual: true,
        precioCompra: true,
        valorMercado: true,
        building: { select: { direccion: true } },
      },
      take: 5,
    });
    const internalComparables = similarProperties
      .map((p: any) => {
        // Preferir valorMercado / precioCompra si existen; si no, capitalizar renta
        const directValue = Number(p.valorMercado || p.precioCompra || 0);
        const capValue = p.rentaMensual ? Math.round((p.rentaMensual * 12) / capRateInternal) : 0;
        const value = directValue > 0 ? directValue : capValue;
        if (value <= 0) return null;
        return `- ${p.building?.direccion || address}, Unidad ${p.numero}: ${value.toLocaleString()}€ (${p.superficie}m², ${value > 0 && p.superficie ? Math.round(value / p.superficie) : 0}€/m²)`;
      })
      .filter(Boolean)
      .join('\n');

    // 3. Valoración IA multi-paso con TODOS los inputs reales (RICS Red Book 2024)
    // Antes los flags hasElevator/hasGarden/etc. iban hardcoded en false → resultado inflado/deflactado.
    const propertyForAI = {
      propertyType: propertyType as any,
      address,
      city,
      postalCode,
      squareMeters: property.superficie,
      squareMetersUtil: property.superficieUtil ?? undefined,
      rooms: property.habitaciones || 0,
      bathrooms: property.banos || 0,
      floor: property.planta ?? undefined,
      condition: mapCondition(property.building?.estadoConservacion),
      yearBuilt: property.building?.anoConstructor ?? undefined,
      hasElevator: !!property.building?.ascensor,
      hasParking: !!property.building?.garaje,
      hasGarden: !!property.building?.jardin,
      hasPool: !!property.building?.piscina,
      hasTerrace: !!property.terraza,
      hasGarage: !!property.building?.garaje,
      orientacion: property.orientacion || undefined,
      finalidad: 'venta',
      // === ESG (RICS Red Book 2024) ===
      certificadoEnergetico: normalizeCee(property.building?.certificadoEnergetico),
      // === Económicos del activo ===
      ibiAnual: property.building?.ibiAnual ?? undefined,
      comunidadMensual: property.building?.gastosComunidad ?? undefined,
      rentaActualMensual: property.rentaMensual ?? undefined,
    };

    const valuation = await analyzeAndValuateProperty(
      propertyForAI,
      aggregatedMarketData,
      platformDataText,
      internalComparables
    );

    // 4. Guardar en BD con condition y postalCode reales
    try {
      await prisma.propertyValuation.create({
        data: {
          unitId: propertyId,
          companyId: buildingCompanyId,
          address,
          postalCode,
          city,
          squareMeters: property.superficie,
          rooms: property.habitaciones ?? 0,
          bathrooms: property.banos ?? 0,
          condition: propertyForAI.condition,
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
        investmentPotential:
          valuation.rentabilidadAlquiler >= 5
            ? 'HIGH'
            : valuation.rentabilidadAlquiler >= 3.5
              ? 'MEDIUM'
              : 'LOW',
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
        // Desglose de ajustes RICS Red Book 2024
        ajustesPorFactores: valuation.ajustesPorFactores,
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
