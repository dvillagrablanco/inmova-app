/**
 * API Route: Webhook de Signaturit
 * POST /api/webhooks/signaturit
 *
 * Recibe notificaciones de Signaturit cuando:
 * - Un documento es firmado
 * - Un documento es rechazado
 * - Un documento expira
 * - Cualquier cambio de estado
 *
 * Documentación: https://docs.signaturit.com/api/v3/#webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import * as SignaturitService from '@/lib/signaturit-service';
import { prisma } from '@/lib/db';
import * as S3Service from '@/lib/aws-s3-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/signaturit
 *
 * Signaturit envía eventos en este formato:
 * {
 *   event: 'signature_ready' | 'signature_completed' | 'signature_declined' | 'signature_expired',
 *   data: {
 *     id: string,
 *     status: string,
 *     documents: [{ id: string, name: string }],
 *     signers: [{ email: string, signed_at?: string }],
 *     ...
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener body raw para verificar firma
    const bodyText = await request.text();
    const signature = request.headers.get('X-Signaturit-Signature') || '';

    // 2. Parsear body
    const body = JSON.parse(bodyText);
    const event = body.event;
    const data = body.data;

    logger.info('[Signaturit Webhook] Event received', { event, signatureId: data.id });

    // 3. Verificar firma del webhook (usando webhook secret global de Inmova)
    const isValid = SignaturitService.verifyWebhookSignature(bodyText, signature);

    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.error('[Signaturit Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 4. Buscar firma/ documento asociado
    const signatureRecord = await prisma.contractSignature.findFirst({
      where: { externalId: data.id },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    const documento = await prisma.documentoFirma.findFirst({
      where: { signaturitId: data.id },
    });

    if (!signatureRecord && !documento) {
      logger.warn('[Signaturit Webhook] Signature not found:', data.id);
      return NextResponse.json({ received: true, warning: 'Signature not found' });
    }

    // 5. Procesar evento según tipo
    switch (event) {
      case 'signature_ready':
        await handleSignatureReady(signatureRecord, documento, data);
        break;

      case 'signature_completed':
        await handleSignatureCompleted(signatureRecord, documento, data);
        break;

      case 'signature_declined':
        await handleSignatureDeclined(signatureRecord, documento, data);
        break;

      case 'signature_expired':
        await handleSignatureExpired(signatureRecord, documento, data);
        break;

      case 'signature_canceled':
        await handleSignatureCanceled(signatureRecord, documento, data);
        break;

      default:
        logger.warn('[Signaturit Webhook] Unknown event', { event, signatureId: data.id });
    }

    // 6. Respuesta OK (Signaturit requiere 200 OK)
    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('[Signaturit Webhook] Error:', error);

    // Retornar 200 para que Signaturit no reintente
    // (ya logueamos el error)
    return NextResponse.json({ received: true, error: error.message });
  }
}

/**
 * Maneja evento: signature_ready
 * El documento está listo para ser firmado
 */
async function handleSignatureReady(signatureRecord: any | null, documento: any | null, data: any) {
  try {
    if (signatureRecord) {
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: {
          status: 'PENDING',
          sentAt: signatureRecord.sentAt || new Date(),
        },
      });
    }

    if (documento) {
      await prisma.documentoFirma.update({
        where: { id: documento.id },
        data: {
          estado: 'PENDING',
        },
      });
    }

    // Log de auditoría
    if (signatureRecord?.contractId) {
      await prisma.auditLog.create({
        data: {
          action: 'SIGNATURE_READY',
          entityType: 'CONTRACT',
          entityId: signatureRecord.contractId,
          details: { signatureId: data.id },
        },
      });
    }

    logger.info('[Signaturit] Signature ready', { signatureId: data.id });
  } catch (error: any) {
    logger.error('[handleSignatureReady] Error:', error);
  }
}

/**
 * Maneja evento: signature_completed
 * Todos los firmantes han firmado el documento
 */
async function handleSignatureCompleted(
  signatureRecord: any | null,
  documento: any | null,
  data: any
) {
  try {
    if (signatureRecord) {
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: {
          status: 'SIGNED',
          completedAt: new Date(),
        },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.contract.update({
        where: { id: signatureRecord.contractId },
        data: {
          estado: 'activo',
        },
      });
    }

    let signedUrl: string | undefined;
    let certificateUrl: string | undefined;

    if (S3Service.isS3Configured() && data.documents && data.documents.length > 0) {
      try {
        const documentId = data.documents[0].id;
        const signedPdf = await SignaturitService.downloadSignedDocument(data.id, documentId);

        if (signedPdf) {
          const uploadResult = await S3Service.uploadToS3(
            signedPdf,
            'contracts/signed',
            'pdf',
            `contract-${signatureRecord?.contractId || data.id}-signed.pdf`,
            'application/pdf'
          );

          if (uploadResult.success) {
            signedUrl = uploadResult.url;
            if (signatureRecord) {
              await prisma.contractSignature.update({
                where: { id: signatureRecord.id },
                data: { completedUrl: uploadResult.url },
              });
            }
          }
        }
      } catch (error) {
        logger.error('[handleSignatureCompleted] Error downloading signed document:', error);
      }
    }

    if (S3Service.isS3Configured()) {
      try {
        const certificate = await SignaturitService.downloadCertificate(data.id);

        if (certificate) {
          const uploadResult = await S3Service.uploadToS3(
            certificate,
            'contracts/certificates',
            'pdf',
            `contract-${signatureRecord?.contractId || data.id}-certificate.pdf`,
            'application/pdf'
          );

          if (uploadResult.success) {
            certificateUrl = uploadResult.url;
          }
        }
      } catch (error) {
        logger.error('[handleSignatureCompleted] Error downloading certificate:', error);
      }
    }

    if (documento) {
      await prisma.documentoFirma.update({
        where: { id: documento.id },
        data: {
          estado: 'SIGNED',
          completadoEn: new Date(),
          urlFirmado: signedUrl || documento.urlFirmado,
          certificado: certificateUrl || documento.certificado,
        },
      });

      await prisma.firmante.updateMany({
        where: { documentoId: documento.id },
        data: { estado: 'firmado', firmadoEn: new Date() },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.auditLog.create({
        data: {
          action: 'SIGNATURE_COMPLETED',
          entityType: 'CONTRACT',
          entityId: signatureRecord.contractId,
          details: {
            signatureId: data.id,
            signers: data.signers?.map((s: any) => ({
              email: s.email,
              signedAt: s.signed_at,
            })),
          },
        },
      });
    }

    logger.info('[Signaturit] Signature completed', { signatureId: data.id });
  } catch (error: any) {
    logger.error('[handleSignatureCompleted] Error:', error);
  }
}

/**
 * Maneja evento: signature_declined
 * Un firmante ha rechazado el documento
 */
async function handleSignatureDeclined(
  signatureRecord: any | null,
  documento: any | null,
  data: any
) {
  try {
    if (signatureRecord) {
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: { status: 'DECLINED' },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.contract.update({
        where: { id: signatureRecord.contractId },
        data: { estado: 'borrador' },
      });
    }

    if (documento) {
      await prisma.documentoFirma.update({
        where: { id: documento.id },
        data: {
          estado: 'DECLINED',
          motivoCancelacion: data.decline_reason || 'Rechazado por firmante',
        },
      });

      await prisma.firmante.updateMany({
        where: { documentoId: documento.id, estado: 'pendiente' },
        data: { estado: 'rechazado', rechazadoEn: new Date() },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.auditLog.create({
        data: {
          action: 'SIGNATURE_DECLINED',
          entityType: 'CONTRACT',
          entityId: signatureRecord.contractId,
          details: {
            signatureId: data.id,
            reason: data.decline_reason,
          },
        },
      });
    }

    logger.info('[Signaturit] Signature declined', { signatureId: data.id });
  } catch (error: any) {
    logger.error('[handleSignatureDeclined] Error:', error);
  }
}

/**
 * Maneja evento: signature_expired
 * La firma ha expirado sin completarse
 */
async function handleSignatureExpired(
  signatureRecord: any | null,
  documento: any | null,
  data: any
) {
  try {
    if (signatureRecord) {
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: { status: 'EXPIRED' },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.contract.update({
        where: { id: signatureRecord.contractId },
        data: { estado: 'borrador' },
      });
    }

    if (documento) {
      await prisma.documentoFirma.update({
        where: { id: documento.id },
        data: { estado: 'EXPIRED' },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.auditLog.create({
        data: {
          action: 'SIGNATURE_EXPIRED',
          entityType: 'CONTRACT',
          entityId: signatureRecord.contractId,
          details: { signatureId: data.id },
        },
      });
    }

    logger.info('[Signaturit] Signature expired', { signatureId: data.id });
  } catch (error: any) {
    logger.error('[handleSignatureExpired] Error:', error);
  }
}

/**
 * Maneja evento: signature_canceled
 * La firma ha sido cancelada
 */
async function handleSignatureCanceled(
  signatureRecord: any | null,
  documento: any | null,
  data: any
) {
  try {
    if (signatureRecord) {
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: { status: 'CANCELLED' },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.contract.update({
        where: { id: signatureRecord.contractId },
        data: { estado: 'borrador' },
      });
    }

    if (documento) {
      await prisma.documentoFirma.update({
        where: { id: documento.id },
        data: {
          estado: 'CANCELLED',
          canceladoEn: new Date(),
        },
      });
    }

    if (signatureRecord?.contractId) {
      await prisma.auditLog.create({
        data: {
          action: 'SIGNATURE_CANCELED',
          entityType: 'CONTRACT',
          entityId: signatureRecord.contractId,
          details: { signatureId: data.id },
        },
      });
    }

    logger.info('[Signaturit] Signature canceled', { signatureId: data.id });
  } catch (error: any) {
    logger.error('[handleSignatureCanceled] Error:', error);
  }
}
