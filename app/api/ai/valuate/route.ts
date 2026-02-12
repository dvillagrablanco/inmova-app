import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * API Route: Valoración Automática con IA
 * POST /api/ai/valuate
 * 
 * Usa Claude AI para estimar el valor de una propiedad
 * basándose en sus características y datos del mercado
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

// Función mejorada de valoración con Claude
async function valuatePropertyEnhanced(
  property: PropertyData,
  options: {
    finalidad: string;
    caracteristicas: string[];
    orientacion: string;
    descripcionAdicional: string;
    comparables: any[];
  }
) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  const caracteristicasStr = options.caracteristicas.length > 0 
    ? options.caracteristicas.join(', ') 
    : 'Ninguna adicional';

  const comparablesStr = options.comparables.length > 0
    ? options.comparables.map(c => `- ${c.address}: ${c.price}€ (${c.squareMeters}m²)`).join('\n')
    : 'No se encontraron comparables en la base de datos.';

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

PROPIEDADES COMPARABLES EN BD:
${comparablesStr}

FINALIDAD: ${options.finalidad === 'venta' ? 'Venta' : options.finalidad === 'alquiler' ? 'Alquiler' : 'Venta y Alquiler'}

Tu tarea: Proporciona una VALORACIÓN COMPLETA en formato JSON EXACTO como se muestra abajo.
Considera el mercado español actual (2024-2025), la ubicación en ${property.city}, y todas las características.

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
      model: process.env.ANTHROPIC_MODEL || CLAUDE_MODEL_FAST,
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
    'Madrid': 4200,
    'Barcelona': 4500,
    'Valencia': 2300,
    'Sevilla': 2100,
    'Málaga': 2800,
    'default': 2500,
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
    factoresNegativos: [
      'Valoración automática (sin IA)',
      'Datos de mercado limitados',
    ],
    recomendaciones: [
      'Solicitar tasación profesional para mayor precisión',
      'Comparar con propiedades similares en portales',
      'Considerar mejoras para aumentar valor',
    ],
    analisisMercado: `El mercado inmobiliario en ${property.city} presenta una tendencia estable. Los precios por m² rondan los ${precioM2}€ en zonas similares.`,
    tiempoEstimadoVenta: '3-4 meses',
    rentabilidadAlquiler: 4.5,
    alquilerEstimado: Math.round(valorEstimado * 0.045 / 12),
  };
}

// Schema de validación flexible para la nueva página de valoración
const valuateSchema = z.object({
  // Campos requeridos
  superficie: z.number().positive(),
  
  // Campos opcionales básicos
  habitaciones: z.number().int().nonnegative().optional().default(0),
  banos: z.number().int().nonnegative().optional().default(0),
  antiguedad: z.number().int().nonnegative().optional().default(0),
  planta: z.number().int().optional().default(0),
  
  // Características opcionales
  estadoConservacion: z.enum(['excelente', 'muy_bueno', 'bueno', 'normal', 'reformar']).optional().default('bueno'),
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
  propertyId: z.string().optional(),
  
  // Compatibilidad con esquema antiguo (alias)
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  neighborhood: z.string().optional(),
  squareMeters: z.number().positive().optional(),
  rooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  floor: z.number().int().optional(),
  hasElevator: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  hasTerrace: z.boolean().optional(),
  condition: z.enum(['NEW', 'GOOD', 'NEEDS_RENOVATION']).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  avgPricePerM2: z.number().positive().optional(),
  marketTrend: z.enum(['UP', 'DOWN', 'STABLE']).optional(),
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
          message: 'El servicio de valoración con IA no está disponible. Contacta al administrador para configurar Claude AI.',
        },
        { status: 503 }
      );
    }

    // 4. Parsear y validar body
    const body = await request.json();
    const validated = valuateSchema.parse(body);

    // 4. Si hay unitId, enriquecer con datos comparables de BD
    let comparables: any[] = [];

    // 5. Preparar datos para IA - mapear nuevos campos al formato esperado
    const superficie = validated.superficie || validated.squareMeters || 80;
    const habitaciones = validated.habitaciones || validated.rooms || 2;
    const banos = validated.banos || validated.bathrooms || 1;
    const ciudad = validated.ciudad || validated.city || 'Madrid';
    const direccion = validated.direccion || validated.address || 'Centro';

    if (validated.unitId) {
      const selectedUnit = await prisma.unit.findFirst({
        where: {
          id: validated.unitId,
          building: { companyId: session.user.companyId },
        },
        select: {
          buildingId: true,
          building: { select: { direccion: true } },
        },
      });

      if (selectedUnit?.buildingId) {
        const similarUnits = await prisma.unit.findMany({
          where: {
            buildingId: selectedUnit.buildingId,
            superficie: {
              gte: superficie * 0.8,
              lte: superficie * 1.2,
            },
            ...(habitaciones ? { habitaciones } : {}),
            NOT: {
              id: validated.unitId,
            },
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
          orderBy: {
            createdAt: 'desc',
          },
        });

        comparables = similarUnits
          .filter((u) => u.rentaMensual)
          .map((u) => ({
            address: `${u.building?.direccion || selectedUnit.building?.direccion || ''} - Unidad ${u.numero}`,
            price: (u.rentaMensual || 0) * 12 * 15,
            squareMeters: u.superficie || superficie,
          }));
      }
    }
    
    const propertyData: PropertyData = {
      address: direccion,
      city: ciudad,
      postalCode: validated.codigoPostal || validated.postalCode || '',
      squareMeters: superficie,
      rooms: habitaciones,
      bathrooms: banos,
      floor: validated.planta || validated.floor || 0,
      hasElevator: validated.caracteristicas?.includes('ascensor') || validated.hasElevator || false,
      hasParking:
        validated.caracteristicas?.includes('garaje') ||
        validated.caracteristicas?.includes('parking') ||
        validated.hasParking ||
        false,
      hasGarden: validated.caracteristicas?.includes('jardin') || validated.hasGarden || false,
      hasPool: validated.caracteristicas?.includes('piscina') || validated.hasPool || false,
      condition: mapCondition(validated.estadoConservacion || validated.condition),
      neighborhood: validated.neighborhood || '',
    };

    // 6. Llamar a Claude AI para valoración completa
    const valuation = await valuatePropertyEnhanced(propertyData, {
      finalidad: validated.finalidad || 'venta',
      caracteristicas: validated.caracteristicas || [],
      orientacion: validated.orientacion || 'sur',
      descripcionAdicional: validated.descripcionAdicional || '',
      comparables,
    });

    // 7. Normalizar resultados de IA
    const normalizedValuation = {
      estimatedValue: valuation.valorEstimado ?? valuation.estimatedValue ?? 0,
      minValue: valuation.valorMinimo ?? valuation.minValue ?? 0,
      maxValue: valuation.valorMaximo ?? valuation.maxValue ?? 0,
      confidenceScore: valuation.confianza ?? valuation.confidenceScore ?? 60,
      pricePerM2: valuation.precioM2 ?? valuation.pricePerM2 ?? undefined,
      reasoning: valuation.analisisMercado ?? valuation.reasoning ?? undefined,
      keyFactors: [
        ...(valuation.factoresPositivos || []),
        ...(valuation.factoresNegativos || []),
      ].filter(Boolean),
      recommendations: valuation.recomendaciones ?? valuation.recommendations ?? [],
      estimatedRent: valuation.alquilerEstimado ?? valuation.estimatedRent ?? undefined,
      estimatedROI: valuation.rentabilidadAlquiler ?? valuation.estimatedROI ?? undefined,
      capRate: valuation.capRate ?? undefined,
    };

    const normalizedTrend = valuation.tendenciaMercado ?? valuation.marketTrend;
    const marketTrend =
      normalizedTrend === 'alcista'
        ? 'UP'
        : normalizedTrend === 'bajista'
          ? 'DOWN'
          : normalizedTrend === 'estable'
            ? 'STABLE'
            : validated.marketTrend;

    // 8. Guardar valoración en BD
    if (validated.unitId) {
      await prisma.propertyValuation.create({
        data: {
          companyId: session.user.companyId,
          unitId: validated.unitId,
          requestedBy: session.user.id,
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          address: direccion,
          postalCode: validated.codigoPostal || validated.postalCode || '',
          city: ciudad,
          province: validated.province,
          neighborhood: validated.neighborhood,
          squareMeters: superficie,
          rooms: habitaciones,
          bathrooms: banos,
          floor: validated.planta || validated.floor || 0,
          hasElevator: propertyData.hasElevator || false,
          hasParking: propertyData.hasParking || false,
          hasGarden: propertyData.hasGarden || false,
          hasPool: propertyData.hasPool || false,
          hasTerrace:
            validated.hasTerrace || validated.caracteristicas?.includes('terraza') || false,
          hasGarage:
            propertyData.hasParking || validated.caracteristicas?.includes('garaje') || false,
          condition: mapCondition(validated.estadoConservacion || validated.condition),
          yearBuilt: validated.yearBuilt,
          avgPricePerM2: validated.avgPricePerM2 ?? normalizedValuation.pricePerM2,
          marketTrend: marketTrend,
          comparables: comparables,
          estimatedValue: normalizedValuation.estimatedValue,
          minValue: normalizedValuation.minValue,
          maxValue: normalizedValuation.maxValue,
          confidenceScore: normalizedValuation.confidenceScore,
          pricePerM2: normalizedValuation.pricePerM2,
          reasoning: normalizedValuation.reasoning,
          keyFactors: normalizedValuation.keyFactors,
          recommendations: normalizedValuation.recommendations,
          estimatedRent: normalizedValuation.estimatedRent,
          estimatedROI: normalizedValuation.estimatedROI,
          capRate: normalizedValuation.capRate,
          model: process.env.ANTHROPIC_MODEL || CLAUDE_MODEL_FAST,
        },
      });
    }

    // 9. Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          companyId: session.user.companyId,
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
      companyId: session.user.companyId,
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

    // 11. Respuesta exitosa - devolver todos los datos para la UI
    return NextResponse.json({
      success: true,
      ...valuation,
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

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    if (!unitId) {
      return NextResponse.json({ error: 'unitId requerido' }, { status: 400 });
    }

    // Obtener valoraciones
    const valuations = await prisma.propertyValuation.findMany({
      where: {
        unitId,
        companyId: session.user.companyId,
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
    return NextResponse.json(
      { error: 'Error obteniendo valoraciones' },
      { status: 500 }
    );
  }
}
