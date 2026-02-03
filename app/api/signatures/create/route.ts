/**
 * API Route: Crear Firma Digital
 * POST /api/signatures/create
 *
 * Crea una solicitud de firma digital con Signaturit
 * Genera PDF del contrato y envía a firmantes
 *
 * Auth: Requiere sesión activa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as SignaturitService from '@/lib/signaturit-service';
import { Signer, SignatureType } from '@/lib/signaturit-service';
import { generateContractPDF as generateContractPdf } from '@/lib/pdf-generator-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { checkUsageLimit, createLimitExceededResponse, logUsageWarning } from '@/lib/usage-limits';
import { trackUsage } from '@/lib/usage-tracking-service';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const createSignatureSchema = z.object({
  contractId: z.string().cuid(),
  signers: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        phone: z.string().optional(),
        requireSmsVerification: z.boolean().optional(),
      })
    )
    .min(1),
  options: z
    .object({
      type: z.enum(['simple', 'advanced', 'qualified']).optional(),
      subject: z.string().optional(),
      message: z.string().optional(),
      expirationDays: z.number().min(1).max(90).optional(),
      requireEmailOtp: z.boolean().optional(),
    })
    .optional(),
});

/**
 * POST /api/signatures/create
 *
 * Body:
 * {
 *   contractId: string,
 *   signers: [{ email, name, phone?, requireSmsVerification? }],
 *   options?: { type?, subject?, message?, expirationDays?, requireEmailOtp? }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   signatureId: string,
 *   signUrl: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión para crear firmas.' },
        { status: 401 }
      );
    }

    // 2. Verificar límite de firmas mensuales
    const limitCheck = await checkUsageLimit(session.user.companyId, 'signaturit');
    if (!limitCheck.allowed) {
      return createLimitExceededResponse(limitCheck);
    }

    // Log warning si está cerca del límite (80%)
    logUsageWarning(session.user.companyId, limitCheck);

    // 3. Verificar que Signaturit esté configurado (globalmente por Inmova)
    if (!SignaturitService.isSignaturitConfigured()) {
      return NextResponse.json(
        {
          error: 'Firma digital no configurada',
          message:
            'El servicio de firma digital no está disponible. Contacta al administrador de Inmova.',
        },
        { status: 503 }
      );
    }

    // 4. Parsear y validar body
    const body = await request.json();
    const validated = createSignatureSchema.parse(body);

    // 4. Obtener contrato de la BD
    const contract = await prisma.contract.findUnique({
      where: { id: validated.contractId },
      include: {
        unit: {
          include: {
            building: {
              include: {
                company: true,
              },
            },
          },
        },
        tenant: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // 5. Verificar ownership
    const companyId = contract.unit?.building?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no configurada' }, { status: 400 });
    }
    if (companyId !== session.user.companyId && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permiso para firmar este contrato' },
        { status: 403 }
      );
    }

    // 6. Verificar que el contrato no esté ya firmado
    const normalizedStatus = String(contract.estado || '').toLowerCase();
    if (normalizedStatus === 'activo' || normalizedStatus === 'finalizado') {
      return NextResponse.json({ error: 'El contrato ya está firmado' }, { status: 400 });
    }

    // 7. Generar PDF del contrato
    const contractPdfData = buildContractPdfData(contract);
    const pdfBuffer = await generateContractPdf(contractPdfData);

    if (!pdfBuffer) {
      return NextResponse.json({ error: 'Error generando PDF del contrato' }, { status: 500 });
    }

    // 8. Preparar opciones de firma
    const fileName = `contrato-${contract.id}.pdf`;
    const subject =
      validated.options?.subject ||
      `Firma de Contrato de Arrendamiento - ${contract.unit?.building?.direccion || 'Propiedad'}`;
    const message =
      validated.options?.message ||
      `Por favor, revisa y firma el contrato de arrendamiento. Si tienes dudas, contacta con nosotros.`;

    const expirationDays = validated.options?.expirationDays || 30;
    const signatureOptions = {
      type: (validated.options?.type as SignatureType) || SignatureType.SIMPLE,
      subject,
      body: message,
      expireDays: expirationDays,
      deliveryType: 'email' as const,
      sendCopyToSender: true,
      sequentialSignature: false,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/signaturit`,
    };

    // 9. Crear firma en Signaturit (usando credenciales globales de Inmova)
    const result = await SignaturitService.createSignature(
      pdfBuffer,
      fileName,
      validated.signers as Signer[],
      signatureOptions
    );

    // 10. Guardar en BD
    const documentUrl = `${process.env.NEXTAUTH_URL}/api/v1/reports/contract/${contract.id}`;
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
    const signingUrl = result.signers?.find((signer) => signer.signUrl)?.signUrl;

    const signatureRecord = await prisma.contractSignature.create({
      data: {
        companyId,
        contractId: contract.id,
        provider: 'SIGNATURIT',
        externalId: result.id,
        documentUrl,
        documentName: fileName,
        documentHash,
        signatories: validated.signers.map((signer) => ({
          name: signer.name,
          email: signer.email,
          role: 'TENANT',
          status: 'PENDING',
        })),
        status: 'PENDING',
        signingUrl,
        emailSubject: subject,
        emailMessage: message,
        remindersSent: 0,
        sentAt: new Date(),
        expiresAt,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        requestedBy: session.user.id,
      },
    });

    await prisma.documentoFirma.create({
      data: {
        companyId,
        contractId: contract.id,
        tenantId: contract.tenantId,
        titulo: `Contrato ${contract.unit?.numero || contract.id}`,
        descripcion: `Contrato de arrendamiento para ${contract.unit?.building?.direccion || 'propiedad'}`,
        tipoDocumento: 'contrato',
        signaturitId: result.id,
        estado: 'PENDING',
        urlDocumento: documentUrl,
        requiereOrden: false,
        diasExpiracion: expirationDays,
        fechaExpiracion: expiresAt,
        recordatorios: true,
        diasRecordatorio: 3,
        creadoPor: session.user.id,
        firmantes: {
          create: validated.signers.map((signer, index) => ({
            nombre: signer.name,
            email: signer.email,
            telefono: signer.phone || null,
            rol: 'inquilino',
            orden: index + 1,
            estado: 'pendiente',
          })),
        },
      },
    });

    // 11. Crear registro de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SIGNATURE_CREATED',
        entityType: 'CONTRACT',
        entityId: contract.id,
        details: {
          signatureId: signatureRecord.id,
          signers: validated.signers.map((s) => s.email),
        },
      },
    });

    // 12. Tracking de uso (Control de costos)
    await trackUsage({
      companyId: session.user.companyId,
      service: 'signaturit',
      metric: 'signatures',
      value: 1,
      metadata: {
        signatureId: signatureRecord.id,
        type: signatureOptions.type || 'simple',
        contractId: validated.contractId,
      },
    });

    // 13. Respuesta exitosa
    return NextResponse.json({
      success: true,
      signatureId: signatureRecord.id,
      signUrl: signingUrl,
      signers: result.signers,
      message: 'Solicitud de firma creada. Se han enviado emails a los firmantes.',
    });
  } catch (error: any) {
    logger.error('[API Signature Create] Error:', error);

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

    // Error genérico
    return NextResponse.json(
      {
        error: 'Error creando firma',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * Construye el payload para generar el PDF del contrato.
 */
function buildContractPdfData(contract: any) {
  const company = contract.unit?.building?.company;

  return {
    contractId: contract.id,
    property: {
      address: contract.unit?.building?.direccion || '',
      city: contract.unit?.building?.ciudad || '',
      postalCode: contract.unit?.building?.codigoPostal || '',
      rooms: contract.unit?.habitaciones || 0,
      bathrooms: contract.unit?.banos || 0,
      squareMeters: contract.unit?.superficie || 0,
    },
    landlord: {
      name: company?.contactoPrincipal || company?.nombre || 'Propietario',
      dni: company?.cif || 'N/A',
      email: company?.email || company?.emailContacto || '',
      phone: company?.telefono || company?.telefonoContacto || '',
    },
    tenant: {
      name: contract.tenant?.nombreCompleto || 'Inquilino',
      dni: contract.tenant?.dni || 'N/A',
      email: contract.tenant?.email || '',
      phone: contract.tenant?.telefono || 'N/A',
    },
    terms: {
      rentAmount: contract.rentaMensual || 0,
      deposit: contract.deposito || 0,
      startDate: contract.fechaInicio,
      endDate: contract.fechaFin,
      paymentDay: contract.diaPago || 1,
      includedServices: contract.gastosIncluidos?.length ? contract.gastosIncluidos : [],
    },
  };
}
