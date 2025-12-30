/**
 * API Endpoint: Crear Solicitud de Firma Digital
 * 
 * POST /api/signatures/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createSignatureRequest } from '@/lib/digital-signature-service';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDACIÓN CON ZOD
// ============================================================================

const signatorySchema = z.object({
  name: z.string().min(2, 'Nombre del firmante requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(['LANDLORD', 'TENANT', 'WITNESS', 'OTHER']),
  phone: z.string().optional(),
});

const createSignatureSchema = z.object({
  contractId: z.string().min(1, 'ID de contrato requerido'),
  documentUrl: z.string().url('URL de documento inválida'),
  documentName: z.string().min(1, 'Nombre de documento requerido'),
  signatories: z.array(signatorySchema).min(1, 'Al menos un firmante requerido'),
  provider: z.enum(['DOCUSIGN', 'SIGNATURIT', 'SELF_HOSTED']).optional(),
  emailSubject: z.string().optional(),
  emailMessage: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(90).optional().default(7),
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

      const userId = session.user.id;
      const companyId = session.user.companyId;

      if (!userId || !companyId) {
        return NextResponse.json(
          { error: 'Usuario o empresa no encontrado' },
          { status: 400 }
        );
      }

      // 2. Parsear y validar body
      const body = await req.json();
      
      const validationResult = createSignatureSchema.safeParse(body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error in signature creation:', { errors });
        
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        );
      }

      const validatedData = validationResult.data;

      // 3. Verificar que el contrato existe y pertenece a la empresa
      const { prisma } = await import('@/lib/db');
      const contract = await prisma.contract.findFirst({
        where: {
          id: validatedData.contractId,
          companyId,
        },
      });

      if (!contract) {
        return NextResponse.json(
          { error: 'Contrato no encontrado o no autorizado' },
          { status: 404 }
        );
      }

      // 4. Obtener metadata de la request
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      // 5. Crear solicitud de firma
      logger.info('📝 Creating signature request', {
        userId,
        companyId,
        contractId: validatedData.contractId,
        signatories: validatedData.signatories.length,
      });

      const startTime = Date.now();

      const signature = await createSignatureRequest({
        ...validatedData,
        companyId,
        requestedBy: userId,
        ipAddress,
        userAgent,
      });

      const duration = Date.now() - startTime;

      logger.info('✅ Signature request created successfully', {
        signatureId: signature.id,
        duration: `${duration}ms`,
      });

      // 6. Respuesta exitosa
      return NextResponse.json(
        {
          success: true,
          data: signature,
          message: 'Solicitud de firma creada exitosamente',
        },
        { status: 201 }
      );
    } catch (error: any) {
      logger.error('Error in signature creation API:', error);

      // Manejar errores específicos
      if (error.message?.includes('API_KEY')) {
        return NextResponse.json(
          {
            error: 'Servicio de firma no configurado',
            message: 'El proveedor de firma digital no está configurado. Contacta al administrador.',
          },
          { status: 503 }
        );
      }

      // Error genérico
      return NextResponse.json(
        {
          error: 'Error interno del servidor',
          message: 'Ocurrió un error al crear la solicitud de firma. Intenta de nuevo.',
        },
        { status: 500 }
      );
    }
  });
}
