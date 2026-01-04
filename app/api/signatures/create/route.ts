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
import { SignaturitService, Signer, SignatureType } from '@/lib/signaturit-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const createSignatureSchema = z.object({
  contractId: z.string().cuid(),
  signers: z.array(
    z.object({
      email: z.string().email(),
      name: z.string().min(2),
      phone: z.string().optional(),
      requireSmsVerification: z.boolean().optional(),
    })
  ).min(1),
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

    // 2. Verificar que Signaturit esté configurado
    if (!SignaturitService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'Firma digital no configurada',
          message: 'El servicio de firma digital no está disponible. Contacta al administrador.',
        },
        { status: 503 }
      );
    }

    // 3. Parsear y validar body
    const body = await request.json();
    const validated = createSignatureSchema.parse(body);

    // 4. Obtener contrato de la BD
    const contract = await prisma.contract.findUnique({
      where: { id: validated.contractId },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        tenant: true,
        company: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // 5. Verificar ownership
    if (contract.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'No tienes permiso para firmar este contrato' },
        { status: 403 }
      );
    }

    // 6. Verificar que el contrato no esté ya firmado
    if (contract.estado === 'ACTIVO' || contract.estado === 'FINALIZADO') {
      return NextResponse.json(
        { error: 'El contrato ya está firmado' },
        { status: 400 }
      );
    }

    // 7. Generar PDF del contrato
    // Aquí deberías tener una función que genere el PDF
    // Por ahora, usaremos un placeholder
    const pdfBuffer = await generateContractPDF(contract);

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Error generando PDF del contrato' },
        { status: 500 }
      );
    }

    // 8. Preparar opciones de firma
    const fileName = `contrato-${contract.id}.pdf`;
    const subject =
      validated.options?.subject ||
      `Firma de Contrato de Arrendamiento - ${contract.unit?.building?.direccion || 'Propiedad'}`;
    const message =
      validated.options?.message ||
      `Por favor, revisa y firma el contrato de arrendamiento. Si tienes dudas, contacta con nosotros.`;

    const signatureOptions = {
      type: (validated.options?.type as SignatureType) || SignatureType.SIMPLE,
      subject,
      message,
      expirationDays: validated.options?.expirationDays || 30,
      requireEmailOtp: validated.options?.requireEmailOtp || true,
      sendReminders: true,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/signaturit`,
    };

    // 9. Crear firma en Signaturit
    const result = await SignaturitService.createSignature(
      pdfBuffer,
      fileName,
      validated.signers as Signer[],
      signatureOptions
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Error creando solicitud de firma',
          message: result.error,
        },
        { status: 500 }
      );
    }

    // 10. Guardar en BD
    await prisma.contract.update({
      where: { id: validated.contractId },
      data: {
        signatureId: result.signatureId,
        signatureStatus: 'PENDING',
        signatureSentAt: new Date(),
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
          signatureId: result.signatureId,
          signers: validated.signers.map((s) => s.email),
        },
      },
    });

    // 12. Respuesta exitosa
    return NextResponse.json({
      success: true,
      signatureId: result.signatureId,
      signUrl: result.signUrl,
      signers: result.signers,
      message: 'Solicitud de firma creada. Se han enviado emails a los firmantes.',
    });
  } catch (error: any) {
    console.error('[API Signature Create] Error:', error);

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
 * Genera el PDF del contrato
 * Esta función debe implementarse según tus necesidades
 * Puedes usar librerías como:
 * - jsPDF
 * - PDFKit
 * - Puppeteer (render HTML to PDF)
 * - Template + replace placeholders
 */
async function generateContractPDF(contract: any): Promise<Buffer | null> {
  try {
    // Implementación placeholder
    // En producción, aquí generarías el PDF real del contrato

    // Opción 1: Usar template HTML y Puppeteer
    // const html = renderContractTemplate(contract);
    // const pdfBuffer = await htmlToPdf(html);

    // Opción 2: Usar PDFKit
    // const pdfBuffer = await createPdfWithPdfKit(contract);

    // Por ahora, retornamos null para indicar que no está implementado
    // En producción, DEBES implementar esto
    console.warn('[generateContractPDF] PDF generation not implemented');

    // Simulación: retornar un PDF vacío (solo para testing)
    if (process.env.NODE_ENV === 'development') {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      page.drawText('Contrato de Arrendamiento (Demo)', {
        x: 50,
        y: page.getHeight() - 50,
        size: 20,
      });
      page.drawText(`ID: ${contract.id}`, {
        x: 50,
        y: page.getHeight() - 80,
        size: 12,
      });
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    }

    return null;
  } catch (error: any) {
    console.error('[generateContractPDF] Error:', error);
    return null;
  }
}
