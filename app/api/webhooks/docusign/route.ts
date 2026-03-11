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
 *   Include HMAC Signature: Yes (configure key in DOCUSIGN_CONNECT_KEY)
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

/**
 * Verify HMAC signature from DocuSign Connect.
 * DocuSign sends the signature in X-DocuSign-Signature-1 header,
 * computed as HMAC-SHA256 of the raw body using the Connect Key.
 */
function verifyDocuSignSignature(rawBody: string, signature: string | null, connectKey: string): boolean {
  if (!signature) return false;
  const computed = crypto.createHmac('sha256', connectKey).update(rawBody, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  // 1. Verify HMAC signature before processing anything
  const connectKey = process.env.DOCUSIGN_CONNECT_KEY;
  if (!connectKey) {
    logger.error('[DocuSign Webhook] DOCUSIGN_CONNECT_KEY not configured — rejecting request');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-docusign-signature-1');

  if (!verifyDocuSignSignature(rawBody, signature, connectKey)) {
    logger.warn('[DocuSign Webhook] Invalid HMAC signature — rejecting request');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const prisma = await getPrisma();
  
  try {
    // 2. Parse JSON body (already validated by HMAC)
    const payload = JSON.parse(rawBody);
    
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

    // 3. Save raw webhook for audit trail
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

    // 4. Find the corresponding ContractSignature
    const signatureRecord = await prisma.contractSignature.findFirst({
      where: {
        externalId: envelopeId,
        provider: 'DOCUSIGN',
      },
    });

    if (!signatureRecord) {
      logger.warn('[DocuSign Webhook] No matching signature found for envelope:', envelopeId);
      return NextResponse.json({ received: true, matched: false });
    }

    // 5. Map status and update if it's a terminal status
    const newStatus = STATUS_MAP[event];
    
    if (!newStatus) {
      logger.info('[DocuSign Webhook] Unhandled event type:', event);
      return NextResponse.json({ received: true, event, action: 'ignored' });
    }

    // Only update for terminal status changes
    const isTerminal = ['SIGNED', 'DECLINED', 'EXPIRED'].includes(newStatus);
    const isStatusChange = newStatus !== signatureRecord.status;

    if (isTerminal && isStatusChange) {
      // Extract signer info if available
      const recipientStatuses = payload?.recipients?.signers || 
                                 payload?.EnvelopeStatus?.RecipientStatuses || [];
      
      // Update signatories with their individual status
      let updatedSignatories = signatureRecord.signatories;
      if (Array.isArray(updatedSignatories) && Array.isArray(recipientStatuses)) {
        updatedSignatories = (updatedSignatories as any[]).map((s: any) => {
          const recipientMatch = recipientStatuses.find(
            (r: any) => (r.email || r.Email)?.toLowerCase() === s.email?.toLowerCase()
          );
          if (recipientMatch) {
            const recipientStatus = (recipientMatch.status || recipientMatch.Status || '').toLowerCase();
            return {
              ...s,
              status: recipientStatus === 'completed' ? 'SIGNED' : 
                      recipientStatus === 'declined' ? 'DECLINED' : s.status,
              signedAt: recipientStatus === 'completed' 
                ? (recipientMatch.signedDateTime || recipientMatch.SignedDateTime || new Date().toISOString())
                : s.signedAt,
            };
          }
          return s;
        });
      }

      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
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

      logger.info(`[DocuSign Webhook] Signature ${signatureRecord.id} updated to ${newStatus}`, {
        envelopeId,
        contractId: signatureRecord.contractId,
        previousStatus: signatureRecord.status,
        newStatus,
      });
    } else {
      logger.info(`[DocuSign Webhook] No status change needed for ${event}`, {
        currentStatus: signatureRecord.status,
        mappedStatus: newStatus,
      });
    }

    // 6. Always return 200 to DocuSign (prevent retries)
    return NextResponse.json({
      received: true,
      matched: true,
      envelopeId,
      action: isTerminal && isStatusChange ? 'updated' : 'no_change',
    });

  } catch (error: any) {
    logger.error('[DocuSign Webhook] Error processing:', error.message);
    
    // Still return 200 to prevent DocuSign from retrying on our errors
    return NextResponse.json(
      { received: true, error: 'Processing error' },
      { status: 200 }
    );
  }
}
