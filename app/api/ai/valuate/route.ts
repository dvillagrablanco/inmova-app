import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * API Route: Valoración Automática con IA
 * POST /api/ai/valuate
 *
 * Usa Claude AI para estimar el valor de una propiedad
 * basándose en sus características y datos del mercado obtenidos
 * de múltiples plataformas: Idealista, Fotocasa, Habitaclia,
 * Notariado, INE y base de datos interna.
 *
 * Auth: Requiere sesión activa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as ClaudeAIService from '@/lib/claude-ai-service';
import { PropertyData } from '@/lib/claude-ai-service';
import { z } from 'zod';
import { checkAILimit, createLimitExceededResponse, logUsageWarning } from '@/lib/usage-limits';
import { trackUsage } from '@/lib/usage-tracking-service';
import {
  getAggregatedMarketData,
  formatPlatformDataForPrompt,
} from '@/lib/external-platform-data-service';
import { analyzeAndValuateProperty, type PropertyForAnalysis } from '@/lib/ai-property-analysis';
import { resolveCompanyScope } from '@/lib/company-scope';
import { createUnifiedValuation } from '@/lib/unified-valuation-service';

import logger from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Helper para mapear estado de conservación
function mapCondition(estado?: string): 'NEW' | 'GOOD' | 'NEEDS_RENOVATION' {
  switch (estado) {
    case 'excelente':
    case 'NEW':
      return 'NEW';
    case 'muy_bueno':
    case 'bueno':
    case 'normal':
    case 'GOOD':
      return 'GOOD';
    case 'reformar':
    case 'NEEDS_RENOVATION':
      return 'NEEDS_RENOVATION';
    default:
      return 'GOOD';
  }
}

function normalizeValuationPropertyType(value?: string): PropertyForAnalysis['propertyType'] {
  switch (value) {
    case 'local':
      return 'local_comercial';
    case 'coworking_space':
      return 'coworking';
    case 'edificio_completo':
      return 'edificio';
    case 'solar':
      return 'terreno';
    default:
      return (value as PropertyForAnalysis['propertyType']) || 'vivienda';
  }
}

function mapUnitTypeToValuationType(value?: string): PropertyForAnalysis['propertyType'] {
  switch (value) {
    case 'local':
      return 'local_comercial';
    case 'coworking_space':
      return 'coworking';
    default:
      return normalizeValuationPropertyType(value);
  }
}

function estimateSalePriceFromRent(monthlyRent: number, propertyType?: string): number {
  const capRates: Record<string, number> = {
    vivienda: 0.045,
    local_comercial: 0.065,
    oficina: 0.055,
    nave_industrial: 0.07,
    garaje: 0.05,
    trastero: 0.085,
    terreno: 0.02,
    edificio: 0.05,
    coworking: 0.06,
  };
  const normalizedType = normalizeValuationPropertyType(propertyType);
  const capRate = capRates[normalizedType] || capRates.vivienda;

  return capRate > 0 ? Math.round((monthlyRent * 12) / capRate) : 0;
}

function inferLocationFromAddress(address?: string | null): { city?: string; postalCode?: string } {
  const value = String(address || '').trim();
  if (!value) return {};

  const postalCode = value.match(/\b(\d{5})\b/)?.[1];
  const segments = value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const citySegment = segments.length > 1 ? segments[segments.length - 1] : '';
  const city = citySegment
    .replace(/\b\d{5}\b/g, '')
    .replace(/\([^)]*\)/g, '')
    .trim();

  return {
    city: city || undefined,
    postalCode,
  };
}

// Función mejorada de valoración con Claude
async function valuatePropertyEnhanced(
  property: PropertyData,
  options: {
    finalidad: string;
    caracteristicas: string[];
    orientacion: string;
    descripcionAdicional: string;
    comparables: any[];
    platformDataText?: string;
  }
) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  const caracteristicasStr =
    options.caracteristicas.length > 0 ? options.caracteristicas.join(', ') : 'Ninguna adicional';

  const comparablesStr =
    options.comparables.length > 0
      ? options.comparables
          .map((c) => `- ${c.address}: ${c.price}€ (${c.squareMeters}m²)`)
          .join('\n')
      : 'No se encontraron comparables en la base de datos interna.';

  const prompt = `Eres un tasador inmobiliario certificado con 20 años de experiencia en el mercado español.

PROPIEDAD A VALORAR:
- Ubicación: ${property.address}, ${property.city}
- Superficie: ${property.squareMeters}m²
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
- Planta: ${property.floor || 'Bajo/N.A.'}
- Orientación: ${options.orientacion}
- Estado: ${property.condition === 'NEW' ? 'A estrenar' : property.condition === 'NEEDS_RENOVATION' ? 'A reformar' : 'Buen estado'}
- Características: ${caracteristicasStr}
${options.descripcionAdicional ? `- Información adicional: ${options.descripcionAdicional}` : ''}

PROPIEDADES COMPARABLES DEL PORTFOLIO INTERNO:
${comparablesStr}

${
  options.platformDataText ||
  (() => {
    try {
      const { getMarketDataByAddress } = require('@/lib/market-data-service');
      const mktData = getMarketDataByAddress(`${property.address}, ${property.city}`);
      if (mktData) {
        return `=== DATOS DE MERCADO (fuente: datos de referencia estáticos) ===
- Zona: ${mktData.zona}

PRECIOS REALES (escriturados, fuente: Notariado penotariado.com):
- Precio venta REAL: ${mktData.precioRealVentaM2}€/m² (transacciones escrituradas)
- Alquiler REAL: ${mktData.precioRealAlquilerM2}€/m²/mes

ASKING PRICES (portales Idealista/Fotocasa — NO son precio real, son ~12% superiores):
- Asking price venta: ${mktData.askingPriceVentaM2}€/m² (precio de oferta, no de cierre)
- Asking price alquiler: ${mktData.askingPriceAlquilerM2}€/m²/mes

- Garaje venta medio: ${mktData.precioGarajeVenta}€
- Garaje alquiler medio: ${mktData.precioGarajeAlquiler}€/mes
- Tendencia: ${mktData.tendencia}
- Demanda: ${mktData.demanda}
- Fuentes: ${mktData.fuenteNotarial} + ${mktData.fuente}

IMPORTANTE: Basa tu valoración en los PRECIOS REALES escriturados del Notariado, NO en los asking prices de portales.`;
      }
      return 'No se encontraron datos de mercado para esta zona.';
    } catch {
      return 'Datos de mercado no disponibles.';
    }
  })()
}

FINALIDAD: ${options.finalidad === 'venta' ? 'Venta' : options.finalidad === 'alquiler' ? 'Alquiler' : 'Venta y Alquiler'}

Tu tarea: Proporciona una VALORACIÓN COMPLETA en formato JSON EXACTO como se muestra abajo.

IMPORTANTE: El inmueble está en ${property.city.toUpperCase()}. Basa tu valoración EXCLUSIVAMENTE en el mercado de ${property.city}, NO en el de otra ciudad. Usa precios de mercado reales de ${property.city} y su zona en el momento actual (2025-2026).

Responde SOLO con el JSON, sin texto adicional:
{
  "valorEstimado": <número entero en euros para venta>,
  "valorMinimo": <número entero en euros>,
  "valorMaximo": <número entero en euros>,
  "precioM2": <número entero precio por m²>,
  "confianza": <número 60-95 indicando porcentaje de confianza>,
  "tendenciaMercado": "<alcista|bajista|estable>",
  "porcentajeTendencia": <número 1-10 indicando % de tendencia>,
  "comparables": [
    {
      "direccion": "<dirección ficticia similar zona>",
      "precio": <número>,
      "superficie": <número>,
      "precioM2": <número>,
      "similitud": <número 0.7-0.95>
    }
  ],
  "factoresPositivos": ["<factor1>", "<factor2>", "<factor3>"],
  "factoresNegativos": ["<factor1>", "<factor2>"],
  "recomendaciones": ["<recomendación1>", "<recomendación2>", "<recomendación3>"],
  "analisisMercado": "<análisis de 2-3 frases sobre el mercado de la zona>",
  "tiempoEstimadoVenta": "<ej: 2-3 meses>",
  "rentabilidadAlquiler": <número indicando % anual bruto>,
  "alquilerEstimado": <número mensual en euros>
}`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || CLAUDE_MODEL_PRIMARY,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      // Extraer JSON del texto
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Asegurar que comparables tenga al menos 3 elementos
        if (!result.comparables || result.comparables.length < 3) {
          result.comparables = generateMockComparables(property, result.precioM2);
        }
        return result;
      }
    }
    throw new Error('No se pudo parsear la respuesta de Claude');
  } catch (error: any) {
    logger.error('Error en valoración Claude:', error);
    // Devolver valoración por defecto basada en datos
    return generateFallbackValuation(property, options.finalidad);
  }
}

// Generar comparables mock si no hay suficientes
function generateMockComparables(property: PropertyData, precioM2: number) {
  const basePrice = precioM2 || 3000;
  return [
    {
      direccion: `Calle cercana, ${property.city}`,
      precio: Math.round(basePrice * property.squareMeters * 0.95),
      superficie: property.squareMeters - 5,
      precioM2: Math.round(basePrice * 0.95),
      similitud: 0.88,
    },
    {
      direccion: `Zona similar, ${property.city}`,
      precio: Math.round(basePrice * property.squareMeters * 1.05),
      superficie: property.squareMeters + 8,
      precioM2: Math.round(basePrice * 1.02),
      similitud: 0.82,
    },
    {
      direccion: `Barrio próximo, ${property.city}`,
      precio: Math.round(basePrice * property.squareMeters * 0.92),
      superficie: property.squareMeters - 2,
      precioM2: Math.round(basePrice * 0.98),
      similitud: 0.79,
    },
  ];
}

// Valoración de respaldo si falla Claude
function generateFallbackValuation(property: PropertyData, finalidad: string) {
  // Precios base por m² según ciudad (aproximados 2024)
  const preciosBase: Record<string, number> = {
    Madrid: 4200,
    Barcelona: 4500,
    Valencia: 2300,
    Sevilla: 2100,
    Málaga: 2800,
    default: 2500,
  };

  const precioBase = preciosBase[property.city] || preciosBase['default'];
  const superficie = property.squareMeters;

  // Ajustes por características
  let multiplicador = 1;
  if (property.hasElevator) multiplicador += 0.05;
  if (property.hasParking) multiplicador += 0.08;
  if (property.hasPool) multiplicador += 0.06;
  if (property.condition === 'NEW') multiplicador += 0.15;
  if (property.condition === 'NEEDS_RENOVATION') multiplicador -= 0.15;

  const precioM2 = Math.round(precioBase * multiplicador);
  const valorEstimado = Math.round(precioM2 * superficie);

  return {
    valorEstimado,
    valorMinimo: Math.round(valorEstimado * 0.9),
    valorMaximo: Math.round(valorEstimado * 1.1),
    precioM2,
    confianza: 65,
    tendenciaMercado: 'estable',
    porcentajeTendencia: 2,
    comparables: generateMockComparables(property, precioM2),
    factoresPositivos: [
      `Ubicación en ${property.city}`,
      `${property.rooms} habitaciones`,
      'Superficie adecuada',
    ],
    factoresNegativos: ['Valoración automática (sin IA)', 'Datos de mercado limitados'],
    recomendaciones: [
      'Solicitar tasación profesional para mayor precisión',
      'Comparar con propiedades similares en portales',
      'Considerar mejoras para aumentar valor',
    ],
    analisisMercado: `El mercado inmobiliario en ${property.city} presenta una tendencia estable. Los precios por m² rondan los ${precioM2}€ en zonas similares.`,
    tiempoEstimadoVenta: '3-4 meses',
    rentabilidadAlquiler: 4.5,
    alquilerEstimado: Math.round((valorEstimado * 0.045) / 12),
  };
}

// Schema de validación flexible para la nueva página de valoración
const valuateSchema = z.object({
  // Campos requeridos (coerce para tolerar strings del formulario)
  superficie: z.coerce.number().positive(),

  // Tipo de activo — determina metodología de valoración, yields, gastos y riesgos
  tipoActivo: z
    .enum([
      'vivienda',
      'local_comercial',
      'oficina',
      'nave_industrial',
      'garaje',
      'trastero',
      'terreno',
      'edificio',
      'coworking',
    ])
    .optional()
    .default('vivienda'),

  // Campos opcionales básicos
  habitaciones: z.coerce.number().int().nonnegative().optional().default(0),
  banos: z.coerce.number().int().nonnegative().optional().default(0),
  antiguedad: z.coerce.number().int().nonnegative().optional().default(0),
  planta: z.coerce.number().int().optional().default(0),

  // Características opcionales
  estadoConservacion: z
    .enum(['excelente', 'muy_bueno', 'bueno', 'normal', 'reformar'])
    .optional()
    .default('bueno'),
  orientacion: z.enum(['norte', 'sur', 'este', 'oeste']).optional().default('sur'),
  finalidad: z.enum(['venta', 'alquiler', 'ambos']).optional().default('venta'),
  caracteristicas: z.array(z.string()).optional().default([]),
  descripcionAdicional: z.string().optional().default(''),

  // Ubicación
  direccion: z.string().optional().default(''),
  ciudad: z.string().optional().default('Madrid'),
  codigoPostal: z.string().optional().default(''),

  // IDs opcionales
  unitId: z.string().optional(),
  buildingId: z.string().optional(),
  propertyId: z.string().optional(),

  // Compatibilidad con esquema antiguo (alias)
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  neighborhood: z.string().optional(),
  squareMeters: z.coerce.number().positive().optional(),
  rooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  floor: z.coerce.number().int().optional(),
  hasElevator: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  hasTerrace: z.boolean().optional(),
  condition: z.enum(['NEW', 'GOOD', 'NEEDS_RENOVATION']).optional(),
  yearBuilt: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional(),
  avgPricePerM2: z.coerce.number().positive().optional(),
  marketTrend: z.enum(['UP', 'DOWN', 'STABLE']).optional(),

  // === Campos avanzados (RICS Red Book 2024 / IVS / ECO 805/2003) ===
  // ESG / energía
  certificadoEnergetico: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  consumoEnergeticoKwhM2: z.coerce.number().nonnegative().optional(),
  emisionesCo2KgM2: z.coerce.number().nonnegative().optional(),
  // Calidad ubicación
  proximidadTransportePublico: z.enum(['excelente', 'buena', 'regular', 'mala']).optional(),
  distanciaMetroMin: z.coerce.number().nonnegative().optional(),
  zonaRuido: z.enum(['tranquila', 'media', 'ruidosa']).optional(),
  proximidadServicios: z.enum(['excelente', 'buena', 'regular', 'mala']).optional(),
  calidadColegios: z.enum(['alta', 'media', 'baja']).optional(),
  zonaVerdeProxima: z.boolean().optional(),
  vistas: z.enum(['panoramicas', 'despejadas', 'normales', 'limitadas']).optional(),
  zonaTensionada: z.boolean().optional(),
  zbe: z.boolean().optional(),
  // Riesgos
  riesgoInundacion: z.enum(['alto', 'medio', 'bajo']).optional(),
  ite: z.enum(['favorable', 'desfavorable', 'pendiente']).optional(),
  cedulaHabitabilidad: z.boolean().optional(),
  derramasPendientes: z.coerce.number().nonnegative().optional(),
  inquilinosRentaAntigua: z.coerce.number().int().nonnegative().optional(),
  // Económicos
  ibiAnual: z.coerce.number().nonnegative().optional(),
  comunidadMensual: z.coerce.number().nonnegative().optional(),
  rentaActualMensual: z.coerce.number().nonnegative().optional(),
  squareMetersUtil: z.coerce.number().positive().optional(),
  yearLastRenovation: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
});

/**
 * POST /api/ai/valuate
 *
 * Body: PropertyData (ver schema)
 *
 * Response:
 * {
 *   success: true,
 *   valuation: {
 *     estimatedValue: number,
 *     minValue: number,
 *     maxValue: number,
 *     confidenceScore: number,
 *     reasoning: string,
 *     keyFactors: string[],
 *     recommendations: string[]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión para usar la valoración IA.' },
        { status: 401 }
      );
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    // 2. Verificar límite de IA (estimar ~1000 tokens por valoración)
    const ESTIMATED_TOKENS_PER_VALUATION = 1000;
    const limitCheck = await checkAILimit(session.user.companyId, ESTIMATED_TOKENS_PER_VALUATION);

    if (!limitCheck.allowed) {
      return createLimitExceededResponse(limitCheck);
    }

    // Log warning si está cerca del límite (80%)
    logUsageWarning(session.user.companyId, limitCheck);

    // 3. Verificar que Claude esté configurado
    if (!ClaudeAIService.isClaudeConfigured()) {
      return NextResponse.json(
        {
          error: 'IA no configurada',
          message:
            'El servicio de valoración con IA no está disponible. Contacta al administrador para configurar Claude AI.',
        },
        { status: 503 }
      );
    }

    // 4. Parsear y validar body
    const body = await request.json();
    const validated = valuateSchema.parse(body);

    let ciudad = validated.ciudad || validated.city || '';
    let direccion = validated.direccion || validated.address || '';
    let codigoPostal = validated.codigoPostal || validated.postalCode || '';
    let superficie = validated.superficie || validated.squareMeters || 80;
    let habitaciones = validated.habitaciones || validated.rooms || 0;
    let banos = validated.banos || validated.bathrooms || 0;
    let planta = validated.planta || validated.floor || 0;
    let propertyType = normalizeValuationPropertyType(validated.tipoActivo);
    let yearBuilt = validated.yearBuilt;
    let hasElevator =
      validated.caracteristicas?.includes('ascensor') || validated.hasElevator || false;
    let hasParking =
      validated.caracteristicas?.includes('garaje') ||
      validated.caracteristicas?.includes('parking') ||
      validated.hasParking ||
      false;
    let hasGarden = validated.caracteristicas?.includes('jardin') || validated.hasGarden || false;
    let hasPool = validated.caracteristicas?.includes('piscina') || validated.hasPool || false;
    let hasTerrace =
      validated.hasTerrace || validated.caracteristicas?.includes('terraza') || false;
    // RICS Red Book 2024: factores ESG / económicos del activo
    let certificadoEnergetico:
      | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null = null;
    let ibiAnualReal: number | undefined = undefined;
    let comunidadMensualReal: number | undefined = undefined;
    let rentaActualMensualReal: number | undefined = undefined;
    let superficieUtilReal: number | undefined = undefined;
    let sameAssetComparables: any[] = [];
    let valuationCompanyId = scope.activeCompanyId || session.user.companyId;

    const normalizeCee = (cee: unknown):
      | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null => {
      if (!cee || typeof cee !== 'string') return null;
      const letter = cee.trim().toUpperCase().charAt(0);
      return ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(letter)
        ? (letter as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G')
        : null;
    };

    if (validated.unitId) {
      const selectedUnit = await prisma.unit.findFirst({
        where: {
          id: validated.unitId,
          building: { companyId: { in: scope.scopeCompanyIds } },
        },
        select: {
          id: true,
          tipo: true,
          superficie: true,
          superficieUtil: true,
          habitaciones: true,
          banos: true,
          planta: true,
          orientacion: true,
          referenciaCatastral: true,
          precioCompra: true,
          valorMercado: true,
          rentaMensual: true,
          aireAcondicionado: true,
          calefaccion: true,
          terraza: true,
          gastosComunidad: true,
          ibiAnual: true,
          buildingId: true,
          building: {
            select: {
              companyId: true,
              direccion: true,
              referenciaCatastral: true,
              anoConstructor: true,
              certificadoEnergetico: true,
              estadoConservacion: true,
              ascensor: true,
              garaje: true,
              trastero: true,
              piscina: true,
              jardin: true,
              ibiAnual: true,
              gastosComunidad: true,
              tipo: true,
            },
          },
        },
      });

      if (selectedUnit) {
        valuationCompanyId = selectedUnit.building?.companyId || valuationCompanyId;
        const inferredLocation = inferLocationFromAddress(selectedUnit.building?.direccion);

        direccion = direccion || selectedUnit.building?.direccion || '';
        ciudad = ciudad || inferredLocation.city || '';
        codigoPostal = codigoPostal || inferredLocation.postalCode || '';
        superficie = superficie || selectedUnit.superficie || 0;
        habitaciones = habitaciones || selectedUnit.habitaciones || 0;
        banos = banos || selectedUnit.banos || 0;
        planta = planta || selectedUnit.planta || 0;
        propertyType = mapUnitTypeToValuationType(selectedUnit.tipo);
        yearBuilt = yearBuilt || selectedUnit.building?.anoConstructor || undefined;
        hasElevator = hasElevator || !!selectedUnit.building?.ascensor;
        hasParking = hasParking || !!selectedUnit.building?.garaje;
        hasGarden = hasGarden || !!selectedUnit.building?.jardin;
        hasPool = hasPool || !!selectedUnit.building?.piscina;
        hasTerrace = hasTerrace || !!selectedUnit.terraza;

        // RICS Red Book 2024: factores ESG y económicos del activo
        certificadoEnergetico =
          certificadoEnergetico || normalizeCee(selectedUnit.building?.certificadoEnergetico);
        ibiAnualReal =
          ibiAnualReal ?? selectedUnit.ibiAnual ?? selectedUnit.building?.ibiAnual ?? undefined;
        comunidadMensualReal =
          comunidadMensualReal ??
          selectedUnit.gastosComunidad ??
          selectedUnit.building?.gastosComunidad ??
          undefined;
        rentaActualMensualReal = rentaActualMensualReal ?? selectedUnit.rentaMensual ?? undefined;
        superficieUtilReal = superficieUtilReal ?? selectedUnit.superficieUtil ?? undefined;

        const similarUnits = await prisma.unit.findMany({
          where: {
            buildingId: selectedUnit.buildingId,
            tipo: selectedUnit.tipo,
            superficie: {
              gte: superficie * 0.8,
              lte: superficie * 1.2,
            },
            ...(habitaciones && propertyType === 'vivienda'
              ? { habitaciones: { gte: Math.max(0, habitaciones - 1), lte: habitaciones + 1 } }
              : {}),
            NOT: {
              id: validated.unitId,
            },
          },
          select: {
            id: true,
            numero: true,
            superficie: true,
            rentaMensual: true,
            precioCompra: true,
            valorMercado: true,
            habitaciones: true,
            banos: true,
            building: {
              select: {
                direccion: true,
              },
            },
          },
          take: 6,
          orderBy: {
            createdAt: 'desc',
          },
        });

        sameAssetComparables = similarUnits
          .map((unit) => {
            const explicitValue = Number(unit.valorMercado || unit.precioCompra || 0);
            const estimatedValue =
              explicitValue > 0
                ? explicitValue
                : estimateSalePriceFromRent(Number(unit.rentaMensual || 0), propertyType);
            const surface = Number(unit.superficie || superficie);

            if (estimatedValue <= 0 || surface <= 0) {
              return null;
            }

            return {
              address: `${unit.building?.direccion || direccion} - Unidad ${unit.numero}`,
              price: estimatedValue,
              squareMeters: surface,
              rooms: unit.habitaciones || undefined,
              bathrooms: unit.banos || undefined,
            };
          })
          .filter(Boolean);
      }
    } else if (validated.buildingId) {
      const selectedBuilding = await prisma.building.findFirst({
        where: {
          id: validated.buildingId,
          companyId: { in: scope.scopeCompanyIds },
        },
        select: {
          companyId: true,
          direccion: true,
          referenciaCatastral: true,
          anoConstructor: true,
          tipo: true,
          ascensor: true,
          garaje: true,
          trastero: true,
          piscina: true,
          jardin: true,
          units: {
            select: {
              superficie: true,
              habitaciones: true,
              banos: true,
              planta: true,
              rentaMensual: true,
            },
            take: 5,
          },
        },
      });

      if (selectedBuilding) {
        valuationCompanyId = selectedBuilding.companyId || valuationCompanyId;
        const inferredLocation = inferLocationFromAddress(selectedBuilding.direccion);
        direccion = direccion || selectedBuilding.direccion || '';
        ciudad = ciudad || inferredLocation.city || '';
        codigoPostal = codigoPostal || inferredLocation.postalCode || '';
        yearBuilt = yearBuilt || selectedBuilding.anoConstructor || undefined;
        hasElevator = hasElevator || !!selectedBuilding.ascensor;
        hasParking = hasParking || !!selectedBuilding.garaje;
        hasGarden = hasGarden || !!selectedBuilding.jardin;
        hasPool = hasPool || !!selectedBuilding.piscina;
        propertyType = propertyType || 'edificio';

        if (selectedBuilding.units.length > 0) {
          const surfaces = selectedBuilding.units
            .map((unit) => Number(unit.superficie || 0))
            .filter(Boolean);
          const avgSurface =
            surfaces.length > 0 ? surfaces.reduce((a, b) => a + b, 0) / surfaces.length : 0;
          superficie = superficie || avgSurface;
          habitaciones =
            habitaciones ||
            Math.round(
              selectedBuilding.units.reduce(
                (sum, unit) => sum + Number(unit.habitaciones || 0),
                0
              ) / selectedBuilding.units.length
            ) ||
            0;
          banos =
            banos ||
            Math.round(
              selectedBuilding.units.reduce((sum, unit) => sum + Number(unit.banos || 0), 0) /
                selectedBuilding.units.length
            ) ||
            0;
        }
      }
    }

    if (!ciudad) {
      return NextResponse.json({ error: 'Ciudad requerida para la valoración' }, { status: 400 });
    }

    let aggregatedPlatformData;
    let platformDataText = '';
    try {
      aggregatedPlatformData = await getAggregatedMarketData({
        city: ciudad,
        postalCode: codigoPostal,
        address: direccion,
        companyId: valuationCompanyId || session.user.companyId,
        squareMeters: superficie,
        rooms: habitaciones,
        propertyType,
      });
      platformDataText = formatPlatformDataForPrompt(aggregatedPlatformData);
      logger.info('[AI Valuate] Datos de plataformas obtenidos', {
        sourcesUsed: aggregatedPlatformData.sourcesUsed,
        reliability: aggregatedPlatformData.overallReliability,
        comparablesCount: aggregatedPlatformData.allComparables.length,
      });
    } catch (platformError) {
      logger.warn(
        '[AI Valuate] Error obteniendo datos de plataformas, continuando sin ellos:',
        platformError
      );
    }

    const comparables = sameAssetComparables;

    // 7. Preparar datos para IA multi-paso (RICS Red Book 2024 — incluye ESG)
    const propertyForAnalysis: PropertyForAnalysis = {
      propertyType,
      address: direccion,
      city: ciudad,
      postalCode: codigoPostal,
      squareMeters: superficie,
      squareMetersUtil: superficieUtilReal,
      rooms: habitaciones,
      bathrooms: banos,
      floor: planta || undefined,
      condition: mapCondition(validated.estadoConservacion || validated.condition),
      yearBuilt,
      hasElevator,
      hasParking,
      hasGarden,
      hasPool,
      hasTerrace,
      hasGarage: hasParking,
      neighborhood: validated.neighborhood || undefined,
      orientacion: validated.orientacion || 'sur',
      caracteristicas: validated.caracteristicas || [],
      descripcionAdicional: validated.descripcionAdicional || '',
      finalidad: validated.finalidad || 'venta',
      // === ESG (RICS Red Book 2024) === aplicar input usuario sobre BD
      certificadoEnergetico: validated.certificadoEnergetico || certificadoEnergetico,
      consumoEnergeticoKwhM2: validated.consumoEnergeticoKwhM2,
      emisionesCo2KgM2: validated.emisionesCo2KgM2,
      // === Calidad ubicación cualitativa ===
      proximidadTransportePublico: validated.proximidadTransportePublico,
      distanciaMetroMin: validated.distanciaMetroMin,
      zonaRuido: validated.zonaRuido,
      proximidadServicios: validated.proximidadServicios,
      calidadColegios: validated.calidadColegios,
      zonaVerdeProxima: validated.zonaVerdeProxima,
      vistas: validated.vistas,
      zonaTensionada: validated.zonaTensionada,
      zbe: validated.zbe,
      // === Riesgos ===
      riesgoInundacion: validated.riesgoInundacion,
      ite: validated.ite,
      cedulaHabitabilidad: validated.cedulaHabitabilidad,
      derramasPendientes: validated.derramasPendientes,
      inquilinosRentaAntigua: validated.inquilinosRentaAntigua,
      // === Económicos del activo ===
      ibiAnual: validated.ibiAnual ?? ibiAnualReal,
      comunidadMensual: validated.comunidadMensual ?? comunidadMensualReal,
      rentaActualMensual: validated.rentaActualMensual ?? rentaActualMensualReal,
      yearLastRenovation: validated.yearLastRenovation,
    };

    const internalComparablesText =
      comparables.length > 0
        ? comparables
            .map((c: any) => `- ${c.address}: ${c.price}€ (${c.squareMeters}m²)`)
            .join('\n')
        : '';

    // 8. Valoración IA multi-paso (Fase 1: análisis comparables + Fase 2: valoración experta)
    const valuation = await analyzeAndValuateProperty(
      propertyForAnalysis,
      aggregatedPlatformData || null,
      platformDataText,
      internalComparablesText
    );

    // 9. Normalizar resultados para compatibilidad con UI
    const normalizedValuation = {
      estimatedValue: valuation.estimatedValue,
      minValue: valuation.minValue,
      maxValue: valuation.maxValue,
      confidenceScore: valuation.confidenceScore,
      pricePerM2: valuation.precioM2,
      reasoning: valuation.reasoning,
      keyFactors: [
        ...(valuation.factoresPositivos || []),
        ...(valuation.factoresNegativos || []),
      ].filter(Boolean),
      recommendations: valuation.recomendaciones || [],
      estimatedRent: valuation.alquilerEstimado,
      estimatedROI: valuation.rentabilidadAlquiler,
      capRate: valuation.capRate,
    };

    const normalizedTrend =
      valuation.tendenciaMercado ?? (valuation as { marketTrend?: string }).marketTrend;
    const marketTrend =
      normalizedTrend === 'alcista'
        ? 'UP'
        : normalizedTrend === 'bajista'
          ? 'DOWN'
          : normalizedTrend === 'estable'
            ? 'STABLE'
            : validated.marketTrend;

    // 8. Guardar valoración unificada en BD para historial consistente
    await createUnifiedValuation(prisma as any, {
      companyId: valuationCompanyId || session.user.companyId,
      requestedBy: session.user.id as string,
      unitId: validated.unitId || null,
      buildingId: validated.buildingId || null,
      address: direccion,
      city: ciudad,
      postalCode: codigoPostal,
      province: validated.province,
      neighborhood: validated.neighborhood,
      squareMeters: superficie,
      rooms: habitaciones,
      bathrooms: banos,
      floor: planta || 0,
      hasElevator,
      hasParking,
      hasGarden,
      hasPool,
      hasTerrace,
      hasGarage: hasParking,
      condition: mapCondition(validated.estadoConservacion || validated.condition),
      yearBuilt,
      estimatedValue: normalizedValuation.estimatedValue,
      minValue: normalizedValuation.minValue,
      maxValue: normalizedValuation.maxValue,
      pricePerM2: normalizedValuation.pricePerM2,
      confidenceScore: normalizedValuation.confidenceScore,
      model: process.env.ANTHROPIC_MODEL || CLAUDE_MODEL_PRIMARY,
      reasoning: normalizedValuation.reasoning,
      keyFactors: normalizedValuation.keyFactors,
      recommendations: normalizedValuation.recommendations,
      estimatedRent: normalizedValuation.estimatedRent,
      estimatedROI: normalizedValuation.estimatedROI,
      capRate: normalizedValuation.capRate,
      avgPricePerM2: validated.avgPricePerM2 ?? normalizedValuation.pricePerM2,
      marketTrend: marketTrend,
      comparables: comparables,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    // 9. Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          companyId: valuationCompanyId || session.user.companyId,
          userId: session.user.id,
          action: 'CREATE',
          entityType: 'UNIT',
          entityId: validated.unitId || null,
          changes: JSON.stringify({
            address: direccion,
            city: ciudad,
            estimatedValue: normalizedValuation.estimatedValue,
          }),
        },
      });
    } catch (auditError) {
      // No fallar si el audit log falla
      logger.warn('[AI Valuate] Error en audit log:', auditError);
    }

    // 10. Tracking de uso (Control de costos)
    await trackUsage({
      companyId: valuationCompanyId || session.user.companyId,
      service: 'claude',
      metric: 'tokens',
      value: ESTIMATED_TOKENS_PER_VALUATION, // Valor real vendría de la API
      metadata: {
        action: 'valuation',
        unitId: validated.unitId,
        address: direccion,
        estimatedValue: normalizedValuation.estimatedValue,
      },
    });

    // 13. Respuesta exitosa - devolver todos los datos incluyendo análisis IA y fuentes
    return NextResponse.json({
      success: true,
      // Campos de valoración directos (compatibilidad con UI existente)
      valorEstimado: valuation.estimatedValue,
      valorMinimo: valuation.minValue,
      valorMaximo: valuation.maxValue,
      precioM2: valuation.precioM2,
      confianza: valuation.confidenceScore,
      tendenciaMercado: valuation.tendenciaMercado,
      porcentajeTendencia: valuation.porcentajeTendencia,
      comparables: valuation.comparables,
      factoresPositivos: valuation.factoresPositivos,
      factoresNegativos: valuation.factoresNegativos,
      recomendaciones: valuation.recomendaciones,
      analisisMercado: valuation.analisisMercado,
      tiempoEstimadoVenta: valuation.tiempoEstimadoVenta,
      rentabilidadAlquiler: valuation.rentabilidadAlquiler,
      alquilerEstimado: valuation.alquilerEstimado,
      // Media estancia
      alquilerMediaEstancia: valuation.alquilerMediaEstancia,
      alquilerMediaEstanciaMin: valuation.alquilerMediaEstanciaMin,
      alquilerMediaEstanciaMax: valuation.alquilerMediaEstanciaMax,
      rentabilidadMediaEstancia: valuation.rentabilidadMediaEstancia,
      ocupacionEstimadaMediaEstancia: valuation.ocupacionEstimadaMediaEstancia,
      perfilInquilinoMediaEstancia: valuation.perfilInquilinoMediaEstancia,
      // Nuevos campos de análisis IA
      reasoning: valuation.reasoning,
      metodologiaUsada: valuation.metodologiaUsada,
      phase1Summary: valuation.phase1Summary,
      aiSourcesUsed: valuation.sourcesUsed,
      // Desglose de ajustes RICS Red Book 2024
      ajustesPorFactores: valuation.ajustesPorFactores,
      platformSources: aggregatedPlatformData
        ? {
            sourcesUsed: aggregatedPlatformData.sourcesUsed,
            sourcesFailed: aggregatedPlatformData.sourcesFailed,
            overallReliability: aggregatedPlatformData.overallReliability,
            weightedSalePricePerM2: aggregatedPlatformData.weightedSalePricePerM2,
            weightedRentPricePerM2: aggregatedPlatformData.weightedRentPricePerM2,
            marketTrend: aggregatedPlatformData.marketTrend,
            trendPercentage: aggregatedPlatformData.trendPercentage,
            demandLevel: aggregatedPlatformData.demandLevel,
            avgDaysOnMarket: aggregatedPlatformData.avgDaysOnMarket,
            dataFreshness: aggregatedPlatformData.dataFreshness,
            platformDetails: aggregatedPlatformData.platformData.map((pd) => ({
              source: pd.source,
              sourceLabel: pd.sourceLabel,
              sourceUrl: pd.sourceUrl,
              reliability: pd.reliability,
              dataType: pd.dataType,
              pricePerM2Sale: pd.pricePerM2Sale,
              pricePerM2Rent: pd.pricePerM2Rent,
              sampleSize: pd.sampleSize,
              trend: pd.trend,
              trendPercentage: pd.trendPercentage,
              demandLevel: pd.demandLevel,
              avgDaysOnMarket: pd.avgDaysOnMarket,
              rawData: pd.rawData || null,
            })),
            comparablesCount: aggregatedPlatformData.allComparables.length,
          }
        : null,
      message: 'Valoración completada con éxito',
    });
  } catch (error: any) {
    logger.error('[API AI Valuate] Error:', error);

    // Error de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Error de IA
    if (error.message?.includes('IA')) {
      return NextResponse.json(
        {
          error: 'Error en valoración IA',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        error: 'Error procesando valoración',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/valuate?unitId=xxx
 * Obtiene valoraciones anteriores de una propiedad
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    if (!unitId) {
      return NextResponse.json({ error: 'unitId requerido' }, { status: 400 });
    }

    // Obtener valoraciones
    const valuations = await prisma.propertyValuation.findMany({
      where: {
        unitId,
        companyId: { in: scope.scopeCompanyIds },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      valuations,
    });
  } catch (error: any) {
    logger.error('[API AI Valuate GET] Error:', error);
    return NextResponse.json({ error: 'Error obteniendo valoraciones' }, { status: 500 });
  }
}
