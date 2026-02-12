/**
 * API Endpoint: Clasificar Incidencia con IA
 * 
 * POST /api/v1/maintenance/classify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { classifyIncident, createMaintenanceRequest } from '@/lib/maintenance-classification-service';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// VALIDACIÓN CON ZOD
// ============================================================================

const classifyIncidentSchema = z.object({
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  photos: z.array(z.string().url()).optional(),
  location: z.string().optional(),
  unitId: z.string().optional(),
  createRequest: z.boolean().optional().default(false), // Si crear solicitud automáticamente
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

      const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
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
        
        logger.warn('Validation error in classify incident:', { errors });
        
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
        companyId,
        description: validatedData.description.substring(0, 50) + '...',
        createRequest: validatedData.createRequest,
      });

      const startTime = Date.now();

      const classification = await classifyIncident({
        description: validatedData.description,
        photos: validatedData.photos,
        location: validatedData.location,
        unitId: validatedData.unitId,
        reportedBy: session.user.email,
      });

      const duration = Date.now() - startTime;

      // 4. Crear solicitud de mantenimiento si se solicita
      let request = null;
      if (validatedData.createRequest && validatedData.unitId) {
        const result = await createMaintenanceRequest({
          companyId,
          propertyId: validatedData.unitId, // Asumiendo que unitId es propertyId
          unitId: validatedData.unitId,
          description: validatedData.description,
          photos: validatedData.photos,
          location: validatedData.location,
          reportedBy: session.user.email,
        });
        request = result.request;
      }

      logger.info('✅ Incident classified', {
        category: classification.category,
        urgency: classification.urgency,
        cost: classification.estimatedCost,
        duration: `${duration}ms`,
      });

      // 5. Respuesta exitosa
      return NextResponse.json(
        {
          success: true,
          data: {
            classification: {
              category: classification.category,
              urgency: classification.urgency,
              estimatedCost: classification.estimatedCost,
              estimatedCostRange: {
                min: classification.estimatedCostMin,
                max: classification.estimatedCostMax,
              },
              providerType: classification.providerType,
              actionRequired: classification.actionRequired,
              timeEstimate: classification.timeEstimate,
              reasoning: classification.reasoning,
              recommendations: classification.recommendations,
              requiresEmergencyCall: classification.requiresEmergencyCall,
            },
            ...(request && {
              request: {
                id: request.id,
                status: request.estado,
                createdAt: request.createdAt,
              },
            }),
          },
          message: 'Incidencia clasificada exitosamente',
        },
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error in classify incident API:', error);

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

      // Error genérico
      return NextResponse.json(
        {
          error: 'Error interno del servidor',
          message: 'Ocurrió un error al clasificar la incidencia. Intenta de nuevo.',
        },
        { status: 500 }
      );
    }
  });
}
