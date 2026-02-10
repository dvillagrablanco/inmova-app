/**
 * API Endpoint: Valoración Automática de Propiedades
 * 
 * POST /api/valuations/estimate
 * 
 * Utiliza IA (Anthropic Claude) para valorar propiedades inmobiliarias
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { valuateAndSaveProperty } from '@/lib/property-valuation-service';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDACIÓN CON ZOD
// ============================================================================

const propertyValuationSchema = z.object({
  // Características de la propiedad
  address: z.string().min(5, 'Dirección requerida'),
  postalCode: z.string().min(4, 'Código postal requerido'),
  city: z.string().min(2, 'Ciudad requerida'),
  province: z.string().optional(),
  neighborhood: z.string().optional(),
  squareMeters: z.number().positive('Superficie debe ser positiva'),
  rooms: z.number().int().positive('Número de habitaciones debe ser positivo'),
  bathrooms: z.number().int().positive('Número de baños debe ser positivo'),
  floor: z.number().int().optional(),
  hasElevator: z.boolean().optional().default(false),
  hasParking: z.boolean().optional().default(false),
  hasGarden: z.boolean().optional().default(false),
  hasPool: z.boolean().optional().default(false),
  hasTerrace: z.boolean().optional().default(false),
  hasGarage: z.boolean().optional().default(false),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_RENOVATION', 'POOR']),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  
  // Opcional: ID de unidad existente
  unitId: z.string().optional(),
});

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      // 1. Autenticación
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'No autorizado. Debes iniciar sesión.' },
          { status: 401 }
        );
      }

      const userId = session.user.id;
      const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;

      if (!userId || !companyId) {
        return NextResponse.json(
          { error: 'Usuario o empresa no encontrado' },
          { status: 400 }
        );
      }

      // 2. Parsear y validar body
      const body = await req.json();
      
      const validationResult = propertyValuationSchema.safeParse(body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error in property valuation:', { errors });
        
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        );
      }

      const validatedData = validationResult.data;

      // 3. Obtener metadata de la request
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      // 4. Ejecutar valoración con IA
      logger.info('🏡 Starting property valuation', {
        userId,
        companyId,
        city: validatedData.city,
        squareMeters: validatedData.squareMeters,
      });

      const startTime = Date.now();

      const valuation = await valuateAndSaveProperty({
        property: validatedData,
        userId,
        companyId,
        unitId: validatedData.unitId,
        ipAddress,
        userAgent,
      });

      const duration = Date.now() - startTime;

      logger.info('✅ Property valuation completed', {
        valuationId: valuation.id,
        estimatedValue: valuation.estimatedValue,
        duration: `${duration}ms`,
      });

      // 5. Respuesta exitosa
      return NextResponse.json(
        {
          success: true,
          data: {
            id: valuation.id,
            estimatedValue: valuation.estimatedValue,
            confidenceScore: valuation.confidenceScore,
            minValue: valuation.minValue,
            maxValue: valuation.maxValue,
            pricePerM2: valuation.pricePerM2,
            reasoning: valuation.reasoning,
            keyFactors: valuation.keyFactors,
            estimatedRent: valuation.estimatedRent,
            estimatedROI: valuation.estimatedROI,
            capRate: valuation.capRate,
            recommendations: valuation.recommendations,
            marketData: {
              avgPricePerM2: valuation.avgPricePerM2,
              trend: valuation.marketTrend,
              comparables: valuation.comparables,
            },
            createdAt: valuation.createdAt,
          },
          message: 'Valoración completada exitosamente',
        },
        { status: 201 }
      );
    } catch (error: any) {
      logger.error('Error in property valuation API:', error);

      // Manejar errores específicos
      if (error.message?.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          {
            error: 'Servicio de IA no configurado',
            message: 'La clave API de Anthropic no está configurada. Contacta al administrador.',
          },
          { status: 503 }
        );
      }

      if (error.message?.includes('Failed to valuate property')) {
        return NextResponse.json(
          {
            error: 'Error en la valoración',
            message: 'No se pudo completar la valoración. Intenta de nuevo.',
          },
          { status: 500 }
        );
      }

      // Error genérico
      return NextResponse.json(
        {
          error: 'Error interno del servidor',
          message: 'Ocurrió un error al procesar la valoración. Intenta de nuevo más tarde.',
        },
        { status: 500 }
        );
    }
  });
}
