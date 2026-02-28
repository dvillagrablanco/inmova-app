/**
 * API Endpoint: Clasificar Incidencia con IA
 * 
 * POST /api/incidents/classify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { classifyAndSaveIncident } from '@/lib/incident-classification-service';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// VALIDACIÓN CON ZOD
// ============================================================================

const classifyIncidentSchema = z.object({
  incidentId: z.string().min(1, 'ID de incidencia requerido'),
  title: z.string().min(5, 'Título requerido (mínimo 5 caracteres)'),
  description: z.string().min(10, 'Descripción requerida (mínimo 10 caracteres)'),
  location: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  reportedBy: z.string().optional(),
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
      
      const validationResult = classifyIncidentSchema.safeParse(body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error in incident classification:', { errors });
        
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        );
      }

      const validatedData = validationResult.data;

      // 3. Clasificar incidencia
      logger.info('🔍 Classifying incident', {
        incidentId: validatedData.incidentId,
        companyId,
      });

      const startTime = Date.now();

      const classification = await classifyAndSaveIncident(
        validatedData.incidentId,
        {
          title: validatedData.title,
          description: validatedData.description,
          location: validatedData.location,
          photos: validatedData.photos,
          reportedBy: validatedData.reportedBy,
        }
      );

      const duration = Date.now() - startTime;

      logger.info('✅ Incident classified', {
        classificationId: classification.id,
        category: classification.category,
        urgency: classification.urgency,
        duration: `${duration}ms`,
      });

      // 4. Respuesta exitosa
      return NextResponse.json(
        {
          success: true,
          data: {
            id: classification.id,
            incidentId: classification.incidentId,
            category: classification.category,
            urgency: classification.urgency,
            estimatedCost: classification.estimatedCost,
            estimatedDuration: classification.estimatedDuration,
            providerType: classification.providerType,
            suggestedProvider: classification.provider || null,
            analysis: classification.aiAnalysis,
            keywords: classification.keywords,
            confidence: classification.confidence,
            immediateActions: classification.immediateActions,
            preventiveMeasures: classification.preventiveMeasures,
            createdAt: classification.createdAt,
          },
          message: 'Incidencia clasificada exitosamente',
        },
        { status: 201 }
      );
    } catch (error: any) {
      logger.error('Error in incident classification API:', error);

      // Manejar errores específicos
      if (error.message?.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          {
            error: 'Servicio de IA no configurado',
            message: 'La clasificación automática no está disponible.',
          },
          { status: 503 }
        );
      }

      if (error.message?.includes('Failed to classify')) {
        return NextResponse.json(
          {
            error: 'Error en la clasificación',
            message: 'No se pudo clasificar la incidencia. Intenta de nuevo.',
          },
          { status: 500 }
        );
      }

      // Error genérico
      return NextResponse.json(
        {
          error: 'Error interno del servidor',
          message: 'Ocurrió un error al clasificar la incidencia.',
        },
        { status: 500 }
      );
    }
  });
}
