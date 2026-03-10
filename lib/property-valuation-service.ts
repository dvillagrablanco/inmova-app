/**
 * Servicio de Valoración Automática de Propiedades con IA
 *
 * Utiliza Anthropic Claude para valorar propiedades inmobiliarias
 * basándose en características de la propiedad y datos del mercado
 * obtenidos de múltiples plataformas:
 *
 * - Idealista (asking prices)
 * - Fotocasa (asking prices)
 * - Habitaclia (asking prices, fuerte en Cataluña)
 * - Notariado (precios reales escriturados)
 * - INE (índice de precios de vivienda)
 * - Base de datos interna (portfolio propio)
 *
 * @module PropertyValuationService
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db';
import logger from './logger';
import {
  getAggregatedMarketData,
  formatPlatformDataForPrompt,
  type AggregatedMarketData,
  type PlatformSource,
} from './external-platform-data-service';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

import { CLAUDE_MODEL_PRIMARY } from './ai-model-config';
const CLAUDE_MODEL = CLAUDE_MODEL_PRIMARY;

// ============================================================================
// TIPOS
// ============================================================================

export interface PropertyFeatures {
  address: string;
  postalCode: string;
  city: string;
  province?: string;
  neighborhood?: string;
  squareMeters: number;
  rooms: number;
  bathrooms: number;
  floor?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  hasGarage?: boolean;
  condition: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_RENOVATION' | 'POOR';
  yearBuilt?: number;
}

export interface MarketData {
  avgPricePerM2?: number;
  trend?: 'UP' | 'STABLE' | 'DOWN';
  comparables?: Array<{
    address: string;
    squareMeters: number;
    rooms: number;
    price: number;
    pricePerM2: number;
    distance?: number; // km
  }>;
}

export interface ValuationResult {
  estimatedValue: number;
  confidenceScore: number; // 0-100
  minValue: number;
  maxValue: number;
  pricePerM2: number;
  reasoning: string;
  keyFactors: string[];
  estimatedRent?: number;
  estimatedROI?: number;
  capRate?: number;
  recommendations: string[];
  platformSources?: PlatformSource[];
  platformDataSummary?: string;
}

export interface ValuationRequest {
  property: PropertyFeatures;
  marketData?: MarketData;
  aggregatedPlatformData?: AggregatedMarketData;
  userId: string;
  companyId: string;
  unitId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// FUNCIONES HELPER - DATOS DEL MERCADO
// ============================================================================

/**
 * Obtiene datos del mercado para una ubicación específica
 * En producción, esto se conectaría a APIs de Idealista, Fotocasa, etc.
 */
async function fetchMarketData(
  city: string,
  postalCode: string,
  companyId: string
): Promise<MarketData> {
  try {
    // Buscar propiedades similares en la base de datos
    const comparables = await prisma.unit.findMany({
      where: {
        building: {
          companyId,
          ciudad: city,
        },
        estado: 'ocupada',
        rentaMensual: { not: null },
      },
      select: {
        id: true,
        numero: true,
        superficie: true,
        habitaciones: true,
        rentaMensual: true,
        building: {
          select: {
            direccion: true,
          },
        },
      },
      take: 10,
    });

    // Calcular precio medio por m²
    const validComparables = comparables.filter((c) => c.superficie && c.rentaMensual);

    if (validComparables.length === 0) {
      logger.warn(`No market data found for ${city}, ${postalCode}`);
      return {};
    }

    const avgPricePerM2 =
      validComparables.reduce((sum, c) => {
        const pricePerM2 = Number(c.rentaMensual) / Number(c.superficie);
        return sum + pricePerM2;
      }, 0) / validComparables.length;

    return {
      avgPricePerM2: Math.round(avgPricePerM2 * 100) / 100,
      trend: 'STABLE', // Por ahora estático, en producción vendría de API externa
      comparables: validComparables.map((c) => ({
        address: c.building.direccion,
        squareMeters: Number(c.superficie),
        rooms: c.habitaciones || 0,
        price: Number(c.rentaMensual) * 12, // Precio anual estimado
        pricePerM2: Number(c.rentaMensual) / Number(c.superficie),
      })),
    };
  } catch (error) {
    logger.error('Error fetching market data:', error);
    return {};
  }
}

/**
 * Obtiene datos de mercado consolidados desde múltiples plataformas externas
 * (Idealista, Fotocasa, Habitaclia, Notariado, INE, base interna)
 */
async function fetchExternalMarketDataFromPlatforms(
  city: string,
  postalCode: string,
  address?: string,
  companyId?: string,
  squareMeters?: number,
  rooms?: number
): Promise<AggregatedMarketData> {
  return getAggregatedMarketData({
    city,
    postalCode,
    address,
    companyId,
    squareMeters,
    rooms,
  });
}

// ============================================================================
// VALORACIÓN CON IA
// ============================================================================

/**
 * Genera prompt optimizado para Claude con datos de múltiples plataformas
 */
function buildValuationPrompt(
  property: PropertyFeatures,
  marketData: MarketData,
  platformDataText?: string
): string {
  const featuresText = `
Ubicación:
- Dirección: ${property.address}
- Ciudad: ${property.city}
- Código Postal: ${property.postalCode}
${property.province ? `- Provincia: ${property.province}` : ''}
${property.neighborhood ? `- Barrio: ${property.neighborhood}` : ''}

Características:
- Superficie: ${property.squareMeters} m²
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
${property.floor !== undefined ? `- Planta: ${property.floor}` : ''}
- Ascensor: ${property.hasElevator ? 'Sí' : 'No'}
- Parking: ${property.hasParking ? 'Sí' : 'No'}
- Jardín: ${property.hasGarden ? 'Sí' : 'No'}
- Piscina: ${property.hasPool ? 'Sí' : 'No'}
- Terraza: ${property.hasTerrace ? 'Sí' : 'No'}
- Garaje: ${property.hasGarage ? 'Sí' : 'No'}
- Estado: ${property.condition}
${property.yearBuilt ? `- Año de construcción: ${property.yearBuilt}` : ''}
`;

  const internalMarketText = `
Datos internos del mercado:
${marketData.avgPricePerM2 ? `- Precio medio por m² (base interna): ${marketData.avgPricePerM2}€/m²` : ''}
${marketData.trend ? `- Tendencia interna: ${marketData.trend}` : ''}
${
  marketData.comparables && marketData.comparables.length > 0
    ? `Comparables del portfolio interno:
${marketData.comparables
  .map(
    (c, i) =>
      `${i + 1}. ${c.address}: ${c.squareMeters}m², ${c.rooms} hab., ${c.price}€ (${c.pricePerM2.toFixed(2)}€/m²)`
  )
  .join('\n')}`
    : ''
}
`;

  return `Eres un tasador inmobiliario certificado con 20 años de experiencia en el mercado español.

Tu tarea: Valorar esta propiedad con precisión, utilizando datos de MÚLTIPLES FUENTES de mercado.

PROPIEDAD A VALORAR:
${featuresText}

${platformDataText || '(Sin datos de plataformas externas disponibles)'}

${internalMarketText}

INSTRUCCIONES:
1. Analiza todas las características de la propiedad
2. CRUZA los datos de las diferentes plataformas (Idealista Data, Idealista, Fotocasa, Notariado, INE, etc.)
3. Prioriza los PRECIOS REALES del Notariado (escriturados) sobre los asking prices de portales
4. Los datos de Idealista Data Platform (fiabilidad 88%) son datos profesionales agregados — más fiables que asking prices individuales de portales
5. Los asking prices de Idealista/Fotocasa (scraping) están inflados ~12% respecto al cierre real
6. Compara con propiedades similares de todas las fuentes
7. Calcula un precio estimado realista basado en la ponderación de fuentes
8. Indica en el reasoning qué fuentes pesaron más en tu valoración

Proporciona tu valoración en formato JSON con la siguiente estructura exacta:

{
  "estimatedValue": number,
  "confidenceScore": number (0-100),
  "minValue": number,
  "maxValue": number,
  "reasoning": "string con explicación detallada incluyendo qué fuentes de datos usaste y cómo las ponderaste (máximo 500 palabras)",
  "keyFactors": ["factor1", "factor2", "factor3", ...],
  "estimatedRent": number (renta mensual estimada),
  "estimatedROI": number (ROI anual en porcentaje),
  "capRate": number (tasa de capitalización en porcentaje),
  "recommendations": ["recomendación1", "recomendación2", "recomendación3"]
}

IMPORTANTE:
- estimatedValue debe ser el precio de venta estimado en euros
- confidenceScore: mayor si hay datos del Notariado/INE, menor si solo hay asking prices
- minValue y maxValue: rango razonable (±10-15% del valor estimado)
- En el reasoning, menciona explícitamente las fuentes consultadas y su peso
- keyFactors: 3-5 factores clave incluyendo las fuentes de datos que influyeron
- recommendations: sugerencias para aumentar el valor

Sé preciso, realista y profesional en tu análisis.`;
}

/**
 * Valora una propiedad usando IA (Claude) con datos de múltiples plataformas
 */
export async function valuateProperty(
  property: PropertyFeatures,
  marketData: MarketData,
  aggregatedPlatformData?: AggregatedMarketData
): Promise<ValuationResult> {
  try {
    const platformDataText = aggregatedPlatformData
      ? formatPlatformDataForPrompt(aggregatedPlatformData)
      : undefined;

    const prompt = buildValuationPrompt(property, marketData, platformDataText);

    logger.info('🏡 Starting property valuation with AI', {
      city: property.city,
      squareMeters: property.squareMeters,
      rooms: property.rooms,
      platformSources: aggregatedPlatformData?.sourcesUsed || [],
    });

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      temperature: 0.3, // Baja temperatura para respuestas más consistentes
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extraer el contenido de texto
    const content = message.content.find((block) => block.type === 'text');
    if (!content || content.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    // Parsear el JSON de la respuesta
    const responseText = content.text;

    // Extraer JSON del texto (puede venir envuelto en markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('No JSON found in AI response:', responseText);
      throw new Error('Invalid JSON response from AI');
    }

    const result: ValuationResult = JSON.parse(jsonMatch[0]);

    // Validar resultado
    if (!result.estimatedValue || !result.confidenceScore || !result.minValue || !result.maxValue) {
      throw new Error('Incomplete valuation result from AI');
    }

    // Calcular precio por m²
    result.pricePerM2 = Math.round((result.estimatedValue / property.squareMeters) * 100) / 100;

    // Agregar metadatos de plataformas usadas
    if (aggregatedPlatformData) {
      result.platformSources = aggregatedPlatformData.sourcesUsed;
      result.platformDataSummary = `Datos obtenidos de ${aggregatedPlatformData.sourcesUsed.length} fuentes: ${aggregatedPlatformData.sourcesUsed.join(', ')}. Fiabilidad global: ${aggregatedPlatformData.overallReliability}%`;
    }

    logger.info('✅ Property valuation completed', {
      estimatedValue: result.estimatedValue,
      confidenceScore: result.confidenceScore,
      platformSources: result.platformSources,
    });

    return result;
  } catch (error) {
    logger.error('Error in property valuation:', error);
    throw new Error(`Failed to valuate property: ${error}`);
  }
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Valora una propiedad y guarda el resultado en base de datos
 */
export async function valuateAndSaveProperty(request: ValuationRequest): Promise<any> {
  try {
    const { property, userId, companyId, unitId, ipAddress, userAgent } = request;

    // 1. Obtener datos del mercado de múltiples plataformas
    let marketData = request.marketData;
    let aggregatedPlatformData = request.aggregatedPlatformData;

    // Obtener datos de plataformas externas si no se proporcionaron
    if (!aggregatedPlatformData) {
      aggregatedPlatformData = await fetchExternalMarketDataFromPlatforms(
        property.city,
        property.postalCode,
        property.address,
        companyId,
        property.squareMeters,
        property.rooms
      );
    }

    if (!marketData || !marketData.avgPricePerM2) {
      const internalData = await fetchMarketData(property.city, property.postalCode, companyId);

      marketData = {
        avgPricePerM2:
          internalData.avgPricePerM2 || aggregatedPlatformData.weightedSalePricePerM2 || undefined,
        trend: internalData.trend || aggregatedPlatformData.marketTrend || undefined,
        comparables: internalData.comparables,
      };
    }

    // 2. Valorar con IA, pasando datos de todas las plataformas
    const valuation = await valuateProperty(property, marketData, aggregatedPlatformData);

    // 3. Guardar en base de datos
    const savedValuation = await prisma.propertyValuation.create({
      data: {
        companyId,
        unitId: unitId || null,
        requestedBy: userId,

        // Características de la propiedad
        address: property.address,
        postalCode: property.postalCode,
        city: property.city,
        province: property.province || null,
        neighborhood: property.neighborhood || null,
        squareMeters: property.squareMeters,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        floor: property.floor || null,
        hasElevator: property.hasElevator || false,
        hasParking: property.hasParking || false,
        hasGarden: property.hasGarden || false,
        hasPool: property.hasPool || false,
        hasTerrace: property.hasTerrace || false,
        hasGarage: property.hasGarage || false,
        condition: property.condition,
        yearBuilt: property.yearBuilt || null,

        // Datos del mercado
        avgPricePerM2: marketData.avgPricePerM2 || null,
        marketTrend: marketData.trend || null,
        comparables: marketData.comparables || null,

        // Resultado de la valoración
        estimatedValue: valuation.estimatedValue,
        confidenceScore: valuation.confidenceScore,
        minValue: valuation.minValue,
        maxValue: valuation.maxValue,
        pricePerM2: valuation.pricePerM2,

        // IA Details
        model: CLAUDE_MODEL,
        reasoning: valuation.reasoning,
        keyFactors: valuation.keyFactors,

        // ROI & Investment
        estimatedRent: valuation.estimatedRent || null,
        estimatedROI: valuation.estimatedROI || null,
        capRate: valuation.capRate || null,

        // Recommendations
        recommendations: valuation.recommendations,

        // Metadata
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        unit: {
          select: {
            numero: true,
            building: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    logger.info('💾 Valuation saved to database', {
      valuationId: savedValuation.id,
      estimatedValue: savedValuation.estimatedValue,
    });

    return savedValuation;
  } catch (error) {
    logger.error('Error in valuateAndSaveProperty:', error);
    throw error;
  }
}

/**
 * Obtiene historial de valoraciones de una propiedad
 */
export async function getPropertyValuationHistory(
  unitId: string,
  companyId: string
): Promise<any[]> {
  return await prisma.propertyValuation.findMany({
    where: {
      unitId,
      companyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Obtiene estadísticas de valoraciones de una empresa
 */
export async function getValuationStats(companyId: string): Promise<{
  totalValuations: number;
  avgEstimatedValue: number;
  avgConfidenceScore: number;
  topCities: Array<{ city: string; count: number; avgValue: number }>;
}> {
  const valuations = await prisma.propertyValuation.findMany({
    where: { companyId },
    select: {
      estimatedValue: true,
      confidenceScore: true,
      city: true,
    },
  });

  const totalValuations = valuations.length;
  const avgEstimatedValue =
    valuations.reduce((sum, v) => sum + v.estimatedValue, 0) / totalValuations || 0;
  const avgConfidenceScore =
    valuations.reduce((sum, v) => sum + v.confidenceScore, 0) / totalValuations || 0;

  // Agrupar por ciudad
  const citiesMap = new Map<string, { count: number; totalValue: number }>();
  valuations.forEach((v) => {
    const current = citiesMap.get(v.city) || { count: 0, totalValue: 0 };
    citiesMap.set(v.city, {
      count: current.count + 1,
      totalValue: current.totalValue + v.estimatedValue,
    });
  });

  const topCities = Array.from(citiesMap.entries())
    .map(([city, data]) => ({
      city,
      count: data.count,
      avgValue: Math.round(data.totalValue / data.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalValuations,
    avgEstimatedValue: Math.round(avgEstimatedValue),
    avgConfidenceScore: Math.round(avgConfidenceScore * 100) / 100,
    topCities,
  };
}
