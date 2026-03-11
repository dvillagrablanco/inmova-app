// @ts-nocheck
/**
 * DocuSign Connect Webhook Endpoint
 * POST /api/webhooks/docusign
 *
 * Recibe notificaciones de DocuSign cuando:
 * - Un envelope es firmado (completed)
 * - Un envelope es rechazado (declined)
 * - Un envelope es anulado (voided)
 * - Un envelope expira
 * - Se envía un recordatorio
 *
 * DocuSign Connect envía JSON con el estado actualizado del envelope.
 *
 * Configurar en DocuSign Admin → Connect → Añadir configuración:
 *   URL: https://inmovaapp.com/api/webhooks/docusign
 *   Trigger events: Envelope Sent, Envelope Delivered, Envelope Completed,
 *                   Envelope Declined, Envelope Voided
 *   Data format: JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Map DocuSign envelope status to our internal status
const STATUS_MAP: Record<string, string> = {
  completed: 'SIGNED',
  declined: 'DECLINED',
  voided: 'EXPIRED',
  // These don't change our status but we log them
  sent: 'PENDING',
  delivered: 'PENDING',
  created: 'PENDING',
};

function isValidDocuSignSignature(body: string, signature: string, secret: string): boolean {
  const normalizedSignature = signature.trim();
  if (!normalizedSignature || !secret) return false;

  const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8');
  const digestBase64 = hmac.digest('base64');
  const digestHex = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');

  const candidates = [digestBase64, digestHex];
  return candidates.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(normalizedSignature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signatureHeader =
      req.headers.get('x-docusign-signature-1') || req.headers.get('x-docusign-signature') || '';
    const webhookSecret =
      process.env.DOCUSIGN_WEBHOOK_SECRET || process.env.DOCUSIGN_SECRET_KEY || '';

    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('[DocuSign Webhook] Webhook secret no configurado');
        return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 503 });
      }
      logger.warn('[DocuSign Webhook] Running without signature verification in non-production');
    } else if (!isValidDocuSignSignature(bodyText, signatureHeader, webhookSecret)) {
      logger.warn('[DocuSign Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const prisma = await getPrisma();

    // DocuSign Connect JSON format has the envelope info at the top level
    const envelopeId = payload?.envelopeId || payload?.EnvelopeStatus?.EnvelopeID;
    const envelopeStatus = payload?.status || payload?.EnvelopeStatus?.Status;
    const event = envelopeStatus?.toLowerCase() || 'unknown';

    logger.info('[DocuSign Webhook] Received', {
      envelopeId: envelopeId || 'unknown',
      status: envelopeStatus || 'unknown',
      event,
    });

    if (!envelopeId) {
      logger.warn('[DocuSign Webhook] No envelope ID in payload');
      // Return 200 to prevent DocuSign from retrying
      return NextResponse.json({ received: true, warning: 'No envelope ID' });
    }

    // 2. Save raw webhook for audit trail
    try {
      await prisma.signatureWebhook.create({
        data: {
          signatureId: envelopeId,
          provider: 'DOCUSIGN',
          event,
          externalEventId: payload?.eventId || null,
          rawPayload: payload,
          processed: false,
        },
      });
    } catch (saveErr: any) {
      logger.warn('[DocuSign Webhook] Could not save raw webhook:', saveErr.message);
      // Continue processing even if save fails
    }

    // 3. Find the corresponding ContractSignature
    const signature = await prisma.contractSignature.findFirst({
      where: {
        externalId: envelopeId,
        provider: 'DOCUSIGN',
      },
    });

    if (!signature) {
      logger.warn('[DocuSign Webhook] No matching signature found for envelope:', envelopeId);
      return NextResponse.json({ received: true, matched: false });
    }

    // 4. Map status and update if it's a terminal status
    const newStatus = STATUS_MAP[event];

    if (!newStatus) {
      logger.info('[DocuSign Webhook] Unhandled event type:', event);
      return NextResponse.json({ received: true, event, action: 'ignored' });
    }

    // Only update for terminal status changes
    const isTerminal = ['SIGNED', 'DECLINED', 'EXPIRED'].includes(newStatus);
    const isStatusChange = newStatus !== signature.status;

    if (isTerminal && isStatusChange) {
      // Extract signer info if available
      const recipientStatuses =
        payload?.recipients?.signers || payload?.EnvelopeStatus?.RecipientStatuses || [];

      // Update signatories with their individual status
      let updatedSignatories = signature.signatories;
      if (Array.isArray(updatedSignatories) && Array.isArray(recipientStatuses)) {
        updatedSignatories = (updatedSignatories as any[]).map((s: any) => {
          const recipientMatch = recipientStatuses.find(
            (r: any) => (r.email || r.Email)?.toLowerCase() === s.email?.toLowerCase()
          );
          if (recipientMatch) {
            const recipientStatus = (
              recipientMatch.status ||
              recipientMatch.Status ||
              ''
            ).toLowerCase();
            return {
              ...s,
              status:
                recipientStatus === 'completed'
                  ? 'SIGNED'
                  : recipientStatus === 'declined'
                    ? 'DECLINED'
                    : s.status,
              signedAt:
                recipientStatus === 'completed'
                  ? recipientMatch.signedDateTime ||
                    recipientMatch.SignedDateTime ||
                    new Date().toISOString()
                  : s.signedAt,
            };
          }
          return s;
        });
      }

      await prisma.contractSignature.update({
        where: { id: signature.id },
        data: {
          status: newStatus,
          signatories: updatedSignatories as any,
          completedAt: newStatus === 'SIGNED' ? new Date() : null,
          completedUrl: payload?.documentsUri || payload?.completedDocumentsUri || null,
          updatedAt: new Date(),
        },
      });

      // Mark webhook as processed
      await prisma.signatureWebhook.updateMany({
        where: {
          signatureId: envelopeId,
          provider: 'DOCUSIGN',
          processed: false,
        },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      logger.info(`[DocuSign Webhook] Signature ${signature.id} updated to ${newStatus}`, {
        envelopeId,
        contractId: signature.contractId,
        previousStatus: signature.status,
        newStatus,
      });
    } else {
      logger.info(`[DocuSign Webhook] No status change needed for ${event}`, {
        currentStatus: signature.status,
        mappedStatus: newStatus,
      });
    }

    // 5. Always return 200 to DocuSign (prevent retries)
    return NextResponse.json({
      received: true,
      matched: true,
      envelopeId,
      action: isTerminal && isStatusChange ? 'updated' : 'no_change',
    });
  } catch (error: any) {
    logger.error('[DocuSign Webhook] Error processing:', error.message);

    // Still return 200 to prevent DocuSign from retrying on our errors
    return NextResponse.json({ received: true, error: 'Processing error' }, { status: 200 });
  }
}
