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
import { SignatureStatus } from '@/lib/signaturit-service';

import * as S3Service from '@/lib/aws-s3-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


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
  const prisma = await getPrisma();
  try {
    // 1. Obtener body raw para verificar firma
    const bodyText = await request.text();
    const signature = request.headers.get('X-Signaturit-Signature') || '';

    // 2. Parsear body
    const body = JSON.parse(bodyText);
    const event = body.event;
    const data = body.data;

    console.log('[Signaturit Webhook] Event received:', event, 'ID:', data.id);

    // 3. Verificar firma del webhook (usando webhook secret global de Inmova)
    const isValid = SignaturitService.verifyWebhookSignature(bodyText, signature);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.error('[Signaturit Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 4. Buscar contrato asociado
    const contract = await prisma.contract.findFirst({
      where: { signatureId: data.id },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        tenant: true,
      },
    });

    if (!contract) {
      logger.warn('[Signaturit Webhook] Contract not found for signature:', data.id);
      return NextResponse.json({ received: true, warning: 'Contract not found' });
    }

    // 5. Procesar evento según tipo
    switch (event) {
      case 'signature_ready':
        await handleSignatureReady(contract, data);
        break;

      case 'signature_completed':
        await handleSignatureCompleted(contract, data);
        break;

      case 'signature_declined':
        await handleSignatureDeclined(contract, data);
        break;

      case 'signature_expired':
        await handleSignatureExpired(contract, data);
        break;

      case 'signature_canceled':
        await handleSignatureCanceled(contract, data);
        break;

      default:
        console.log('[Signaturit Webhook] Unknown event:', event);
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
async function handleSignatureReady(contract: any, data: any) {
  try {
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureStatus: 'READY',
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_READY',
        entityType: 'CONTRACT',
        entityId: contract.id,
        changes: JSON.stringify({ signatureId: data.id }),
      },
    });

    console.log('[Signaturit] Signature ready:', data.id);
  } catch (error: any) {
    logger.error('[handleSignatureReady] Error:', error);
  }
}

/**
 * Maneja evento: signature_completed
 * Todos los firmantes han firmado el documento
 */
async function handleSignatureCompleted(contract: any, data: any) {
  try {
    // 1. Actualizar estado del contrato
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureStatus: 'COMPLETED',
        signatureCompletedAt: new Date(),
        estado: 'ACTIVO', // Activar contrato
      },
    });

    // 2. Descargar documento firmado y guardarlo en S3 (si está configurado)
    if (S3Service.isS3Configured() && data.documents && data.documents.length > 0) {
      try {
        const documentId = data.documents[0].id;
        const signedPdf = await SignaturitService.downloadSignedDocument(
          data.id,
          documentId
        );

        if (signedPdf) {
          const uploadResult = await S3Service.uploadToS3(
            signedPdf,
            'contracts/signed',
            'pdf',
            `contract-${contract.id}-signed.pdf`,
            'application/pdf'
          );

          if (uploadResult.success) {
            await prisma.contract.update({
              where: { id: contract.id },
              data: {
                signedDocumentUrl: uploadResult.url,
              },
            });
          }
        }
      } catch (error) {
        logger.error('[handleSignatureCompleted] Error downloading signed document:', error);
        // No fallar el webhook por esto
      }
    }

    // 3. Descargar certificado de firma
    if (S3Service.isS3Configured()) {
      try {
        const certificate = await SignaturitService.downloadCertificate(data.id);

        if (certificate) {
          const uploadResult = await S3Service.uploadToS3(
            certificate,
            'contracts/certificates',
            'pdf',
            `contract-${contract.id}-certificate.pdf`,
            'application/pdf'
          );

          if (uploadResult.success) {
            await prisma.contract.update({
              where: { id: contract.id },
              data: {
                certificateUrl: uploadResult.url,
              },
            });
          }
        }
      } catch (error) {
        logger.error('[handleSignatureCompleted] Error downloading certificate:', error);
      }
    }

    // 4. Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_COMPLETED',
        entityType: 'CONTRACT',
        entityId: contract.id,
        changes: JSON.stringify({
          signatureId: data.id,
          signers: data.signers?.map((s: any) => ({
            email: s.email,
            signedAt: s.signed_at,
          })),
        }),
      },
    });

    // 5. Enviar notificación al propietario (opcional)
    // await sendContractSignedNotification(contract);

    console.log('[Signaturit] Signature completed:', data.id);
  } catch (error: any) {
    logger.error('[handleSignatureCompleted] Error:', error);
  }
}

/**
 * Maneja evento: signature_declined
 * Un firmante ha rechazado el documento
 */
async function handleSignatureDeclined(contract: any, data: any) {
  try {
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureStatus: 'DECLINED',
        estado: 'BORRADOR', // Volver a borrador
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_DECLINED',
        entityType: 'CONTRACT',
        entityId: contract.id,
        changes: JSON.stringify({
          signatureId: data.id,
          reason: data.decline_reason,
        }),
      },
    });

    // Notificar al propietario
    // await sendContractDeclinedNotification(contract);

    console.log('[Signaturit] Signature declined:', data.id);
  } catch (error: any) {
    logger.error('[handleSignatureDeclined] Error:', error);
  }
}

/**
 * Maneja evento: signature_expired
 * La firma ha expirado sin completarse
 */
async function handleSignatureExpired(contract: any, data: any) {
  try {
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureStatus: 'EXPIRED',
        estado: 'BORRADOR',
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_EXPIRED',
        entityType: 'CONTRACT',
        entityId: contract.id,
        changes: JSON.stringify({ signatureId: data.id }),
      },
    });

    // Notificar al propietario
    // await sendContractExpiredNotification(contract);

    console.log('[Signaturit] Signature expired:', data.id);
  } catch (error: any) {
    logger.error('[handleSignatureExpired] Error:', error);
  }
}

/**
 * Maneja evento: signature_canceled
 * La firma ha sido cancelada
 */
async function handleSignatureCanceled(contract: any, data: any) {
  try {
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureStatus: 'CANCELED',
        estado: 'BORRADOR',
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_CANCELED',
        entityType: 'CONTRACT',
        entityId: contract.id,
        changes: JSON.stringify({ signatureId: data.id }),
      },
    });

    console.log('[Signaturit] Signature canceled:', data.id);
  } catch (error: any) {
    logger.error('[handleSignatureCanceled] Error:', error);
  }
}
