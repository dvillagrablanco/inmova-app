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
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const valuateSchema = z.object({
  address: z.string().min(5),
  postalCode: z.string(),
  city: z.string().min(2),
  province: z.string().optional(),
  neighborhood: z.string().optional(),
  squareMeters: z.number().positive(),
  rooms: z.number().int().positive(),
  bathrooms: z.number().int().positive(),
  floor: z.number().int().optional(),
  hasElevator: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  hasTerrace: z.boolean().optional(),
  condition: z.enum(['NEW', 'GOOD', 'NEEDS_RENOVATION']).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  // Campos opcionales para mejorar precisión
  avgPricePerM2: z.number().positive().optional(),
  marketTrend: z.enum(['UP', 'DOWN', 'STABLE']).optional(),
  unitId: z.string().cuid().optional(), // Si es una propiedad existente
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
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión para usar la valoración IA.' },
        { status: 401 }
      );
    }

    // 2. Verificar que Claude esté configurado
    if (!ClaudeAIService.isClaudeConfigured()) {
      return NextResponse.json(
        {
          error: 'IA no configurada',
          message: 'El servicio de valoración con IA no está disponible. Contacta al administrador para configurar Claude AI.',
        },
        { status: 503 }
      );
    }

    // 3. Parsear y validar body
    const body = await request.json();
    const validated = valuateSchema.parse(body);

    // 4. Si hay unitId, enriquecer con datos comparables de BD
    let comparables: any[] = [];
    if (validated.unitId) {
      // Buscar propiedades similares en la misma ciudad
      const similarUnits = await prisma.unit.findMany({
        where: {
          building: {
            ciudad: validated.city,
          },
          superficieConstruida: {
            gte: validated.squareMeters * 0.8,
            lte: validated.squareMeters * 1.2,
          },
          numHabitaciones: validated.rooms,
          NOT: {
            id: validated.unitId,
          },
        },
        select: {
          id: true,
          building: {
            select: {
              direccion: true,
              ciudad: true,
            },
          },
          superficieConstruida: true,
          precioAlquiler: true,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      comparables = similarUnits
        .filter((u) => u.precioAlquiler)
        .map((u) => ({
          address: `${u.building?.direccion}, ${u.building?.ciudad}`,
          price: u.precioAlquiler!,
          squareMeters: u.superficieConstruida || validated.squareMeters,
        }));
    }

    // 5. Preparar datos para IA
    const propertyData: PropertyData = {
      ...validated,
      comparables: comparables.length > 0 ? comparables : undefined,
    };

    // 6. Llamar a Claude AI
    const valuation = await ClaudeAIService.valuateProperty(propertyData);

    // 7. Guardar valoración en BD
    if (validated.unitId) {
      await prisma.propertyValuation.create({
        data: {
          companyId: session.user.companyId,
          unitId: validated.unitId,
          address: validated.address,
          postalCode: validated.postalCode,
          city: validated.city,
          province: validated.province,
          neighborhood: validated.neighborhood,
          squareMeters: validated.squareMeters,
          rooms: validated.rooms,
          bathrooms: validated.bathrooms,
          floor: validated.floor,
          hasElevator: validated.hasElevator || false,
          hasParking: validated.hasParking || false,
          hasGarden: validated.hasGarden || false,
          hasPool: validated.hasPool || false,
          hasTerrace: validated.hasTerrace || false,
          condition: validated.condition || 'GOOD',
          yearBuilt: validated.yearBuilt,
          avgPricePerM2: validated.avgPricePerM2,
          marketTrend: validated.marketTrend,
          comparables: comparables,
          estimatedValue: valuation.estimatedValue,
          minValue: valuation.minValue,
          maxValue: valuation.maxValue,
          confidenceScore: valuation.confidenceScore,
          reasoning: valuation.reasoning,
          keyFactors: valuation.keyFactors,
          recommendations: valuation.recommendations,
          model: 'claude-3-5-sonnet',
        },
      });
    }

    // 8. Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'AI_VALUATION',
        entityType: 'UNIT',
        entityId: validated.unitId || null,
        details: {
          address: validated.address,
          city: validated.city,
          estimatedValue: valuation.estimatedValue,
        },
      },
    });

    // 9. Respuesta exitosa
    return NextResponse.json({
      success: true,
      valuation,
      message: 'Valoración completada con éxito',
    });
  } catch (error: any) {
    console.error('[API AI Valuate] Error:', error);

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
    console.error('[API AI Valuate GET] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo valoraciones' },
      { status: 500 }
    );
  }
}
