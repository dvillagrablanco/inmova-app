/**
 * API Endpoint: Encontrar Matches para Inquilino
 * 
 * POST /api/matching/find
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { findBestMatches, saveMatches } from '@/lib/tenant-matching-service';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// VALIDACIÓN CON ZOD
// ============================================================================

const findMatchesSchema = z.object({
  tenantId: z.string().min(1, 'ID de inquilino requerido'),
  limit: z.number().int().min(1).max(50).optional().default(10),
  useAI: z.boolean().optional().default(true),
  saveResults: z.boolean().optional().default(true),
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
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      const companyId = session.user.companyId;
      if (!companyId) {
        return NextResponse.json(
          { error: 'Company ID no encontrado' },
          { status: 400 }
        );
      }

      // 2. Parsear y validar body
      const body = await req.json();
      
      const validationResult = findMatchesSchema.safeParse(body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error in matching:', { errors });
        
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        );
      }

      const validatedData = validationResult.data;

      // 3. Verificar que el inquilino existe y pertenece a la empresa
      const { getPrismaClient } = await import('@/lib/db');
      const prisma = getPrismaClient();
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: validatedData.tenantId,
          companyId,
        },
      });

      if (!tenant) {
        return NextResponse.json(
          { error: 'Inquilino no encontrado o no autorizado' },
          { status: 404 }
        );
      }

      // 4. Buscar matches
      logger.info('🔍 Finding matches', {
        tenantId: validatedData.tenantId,
        companyId,
        limit: validatedData.limit,
        useAI: validatedData.useAI,
      });

      const startTime = Date.now();

      const matches = await findBestMatches(
        validatedData.tenantId,
        companyId,
        validatedData.limit,
        validatedData.useAI
      );

      const duration = Date.now() - startTime;

      // 5. Guardar resultados si se solicita
      if (validatedData.saveResults && matches.length > 0) {
        await saveMatches(matches, companyId);
      }

      logger.info('✅ Matching completed', {
        matches: matches.length,
        duration: `${duration}ms`,
      });

      // 6. Respuesta exitosa
      return NextResponse.json(
        {
          success: true,
          data: {
            tenantId: validatedData.tenantId,
            tenantName: tenant.nombreCompleto,
            matches: matches.map((m) => ({
              unitId: m.unitId,
              matchScore: m.matchScore,
              scores: {
                location: m.locationScore,
                price: m.priceScore,
                features: m.featuresScore,
                size: m.sizeScore,
                availability: m.availabilityScore,
              },
              recommendation: m.aiRecommendation,
              pros: m.pros,
              cons: m.cons,
            })),
            totalMatches: matches.length,
            avgScore: matches.length > 0
              ? Math.round(
                  matches.reduce((sum, m) => sum + m.matchScore, 0) /
                    matches.length
                )
              : 0,
          },
          message: `${matches.length} matches encontrados`,
        },
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error in matching API:', error);

      // Manejar errores específicos
      if (error.message?.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          {
            error: 'Servicio de IA no configurado',
            message: 'El análisis con IA no está disponible.',
          },
          { status: 503 }
        );
      }

      // Error genérico
      return NextResponse.json(
        {
          error: 'Error interno del servidor',
          message: 'Ocurrió un error al buscar matches. Intenta de nuevo.',
        },
        { status: 500 }
      );
    }
  });
}
