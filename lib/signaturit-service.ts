/**
 * Servicio de Firma Digital con Signaturit
 * Cumple con eIDAS (UE)
 * 
 * Documentación: https://docs.signaturit.com/
 * 
 * @module SignaturitService
 */

import { prisma } from './db';
import logger from './logger';
import crypto from 'crypto';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SIGNATURIT_API_KEY = process.env.SIGNATURIT_API_KEY;
const SIGNATURIT_ENV = process.env.SIGNATURIT_ENVIRONMENT || 'sandbox'; // sandbox | production
const SIGNATURIT_API_URL = SIGNATURIT_ENV === 'production'
  ? 'https://api.signaturit.com/v3'
  : 'https://api.sandbox.signaturit.com/v3';

// ============================================================================
// TIPOS
// ============================================================================

export interface Signatory {
  email: string;
  name: string;
  role: 'LANDLORD' | 'TENANT' | 'GUARANTOR' | 'WITNESS';
}

export interface SignatureRequest {
  contractId: string;
  documentUrl: string;
  documentName: string;
  signatories: Signatory[];
  expirationDays?: number;
  emailSubject?: string;
  emailMessage?: string;
  companyId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SignatureResponse {
  id: string; // ID interno
  externalId: string; // ID de Signaturit
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
  signingUrl: string;
  completedUrl?: string;
  expiresAt: Date;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class SignaturitService {
  /**
   * Verifica si Signaturit está configurado
   */
  static isConfigured(): boolean {
    return !!SIGNATURIT_API_KEY;
  }

  /**
   * Crea una solicitud de firma digital
   */
  static async createSignature(
    request: SignatureRequest
  ): Promise<SignatureResponse> {
    if (!this.isConfigured()) {
      throw new Error('SIGNATURIT_API_KEY no está configurada. Verifica tu .env');
    }

    try {
      logger.info('📝 Creating signature request', {
        contractId: request.contractId,
        signatories: request.signatories.length,
      });

      // 1. Obtener el documento (PDF del contrato)
      const documentBuffer = await this.fetchDocument(request.documentUrl);
      const documentHash = this.calculateHash(documentBuffer);

      // 2. Preparar request para Signaturit
      const formData = new FormData();
      
      // Documento
      const blob = new Blob([documentBuffer], { type: 'application/pdf' });
      formData.append('files[]', blob, request.documentName);

      // Destinatarios
      request.signatories.forEach((sig, index) => {
        formData.append(`recipients[${index}][email]`, sig.email);
        formData.append(`recipients[${index}][fullname]`, sig.name);
      });

      // Configuración
      formData.append('subject', request.emailSubject || 'Firma de contrato de arrendamiento');
      formData.append('body', request.emailMessage || 'Por favor, revisa y firma el contrato adjunto.');
      formData.append('expires_in', String(request.expirationDays || 30));
      
      // Callbacks (webhooks)
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/signaturit`;
      formData.append('events', JSON.stringify(['signature_completed', 'signature_declined']));
      formData.append('callback_url', webhookUrl);

      // 3. Enviar request a Signaturit
      const response = await fetch(`${SIGNATURIT_API_URL}/signatures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SIGNATURIT_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Signaturit API error: ${JSON.stringify(error)}`);
      }

      const signatureData = await response.json();

      // 4. Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (request.expirationDays || 30));

      // 5. Guardar en base de datos
      const signature = await prisma.contractSignature.create({
        data: {
          companyId: request.companyId,
          contractId: request.contractId,
          provider: 'SIGNATURIT',
          externalId: signatureData.id,
          documentUrl: request.documentUrl,
          documentName: request.documentName,
          documentHash,
          signatories: request.signatories.map(s => ({
            email: s.email,
            name: s.name,
            role: s.role,
            status: 'PENDING',
            signedAt: null,
          })),
          status: 'PENDING',
          signingUrl: signatureData.recipients[0]?.email_url || '',
          emailSubject: request.emailSubject,
          emailMessage: request.emailMessage,
          sentAt: new Date(),
          expiresAt,
          requestedBy: request.userId,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        },
      });

      logger.info('✅ Signature request created', {
        id: signature.id,
        externalId: signatureData.id,
      });

      return {
        id: signature.id,
        externalId: signatureData.id,
        status: 'PENDING',
        signingUrl: signatureData.recipients[0]?.email_url || '',
        expiresAt,
      };
    } catch (error: any) {
      logger.error('❌ Error creating signature:', error);
      throw new Error(`Failed to create signature: ${error.message}`);
    }
  }

  /**
   * Obtiene el estado de una firma
   */
  static async getSignatureStatus(signatureId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('SIGNATURIT_API_KEY no está configurada');
    }

    try {
      const signature = await prisma.contractSignature.findUnique({
        where: { id: signatureId },
      });

      if (!signature || !signature.externalId) {
        throw new Error('Signature not found');
      }

      // Consultar estado en Signaturit
      const response = await fetch(
        `${SIGNATURIT_API_URL}/signatures/${signature.externalId}`,
        {
          headers: {
            'Authorization': `Bearer ${SIGNATURIT_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch signature status');
      }

      const data = await response.json();

      // Actualizar estado en BD
      const status = this.mapSignaturitStatus(data.status);
      
      await prisma.contractSignature.update({
        where: { id: signatureId },
        data: {
          status,
          completedAt: status === 'SIGNED' ? new Date() : undefined,
          completedUrl: data.download_url || undefined,
        },
      });

      return {
        id: signature.id,
        externalId: data.id,
        status,
        signatories: data.recipients,
        completedUrl: data.download_url,
      };
    } catch (error: any) {
      logger.error('❌ Error getting signature status:', error);
      throw new Error(`Failed to get signature status: ${error.message}`);
    }
  }

  /**
   * Descarga el documento firmado
   */
  static async downloadSignedDocument(signatureId: string): Promise<Buffer> {
    if (!this.isConfigured()) {
      throw new Error('SIGNATURIT_API_KEY no está configurada');
    }

    try {
      const signature = await prisma.contractSignature.findUnique({
        where: { id: signatureId },
      });

      if (!signature || !signature.externalId) {
        throw new Error('Signature not found');
      }

      if (signature.status !== 'SIGNED') {
        throw new Error('Document not yet signed');
      }

      // Descargar documento firmado de Signaturit
      const response = await fetch(
        `${SIGNATURIT_API_URL}/signatures/${signature.externalId}/download/signed`,
        {
          headers: {
            'Authorization': `Bearer ${SIGNATURIT_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download signed document');
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      logger.info('✅ Signed document downloaded', {
        signatureId,
        size: buffer.length,
      });

      return buffer;
    } catch (error: any) {
      logger.error('❌ Error downloading signed document:', error);
      throw new Error(`Failed to download signed document: ${error.message}`);
    }
  }

  /**
   * Procesa un webhook de Signaturit
   */
  static async processWebhook(payload: any): Promise<void> {
    try {
      logger.info('📥 Processing Signaturit webhook', {
        event: payload.event,
        signatureId: payload.data?.id,
      });

      const externalId = payload.data?.id;
      
      if (!externalId) {
        throw new Error('Invalid webhook payload: missing signature ID');
      }

      // Buscar firma en BD
      const signature = await prisma.contractSignature.findFirst({
        where: { externalId },
      });

      if (!signature) {
        logger.warn('⚠️ Signature not found for external ID', { externalId });
        return;
      }

      // Procesar según evento
      const event = payload.event;
      let newStatus: any = signature.status;

      switch (event) {
        case 'signature_completed':
          newStatus = 'SIGNED';
          await prisma.contractSignature.update({
            where: { id: signature.id },
            data: {
              status: 'SIGNED',
              completedAt: new Date(),
              completedUrl: payload.data?.download_url,
            },
          });

          // Actualizar estado del contrato
          await prisma.contract.update({
            where: { id: signature.contractId },
            data: {
              estado: 'ACTIVO',
              firmadoDigitalmente: true,
            },
          });

          logger.info('✅ Contract signature completed', {
            signatureId: signature.id,
            contractId: signature.contractId,
          });
          break;

        case 'signature_declined':
          newStatus = 'DECLINED';
          await prisma.contractSignature.update({
            where: { id: signature.id },
            data: {
              status: 'DECLINED',
            },
          });

          logger.warn('⚠️ Contract signature declined', {
            signatureId: signature.id,
          });
          break;

        case 'signature_expired':
          newStatus = 'EXPIRED';
          await prisma.contractSignature.update({
            where: { id: signature.id },
            data: {
              status: 'EXPIRED',
            },
          });
          break;

        default:
          logger.info('ℹ️ Unhandled webhook event', { event });
      }

      // Guardar webhook en BD para auditoría
      await prisma.signatureWebhook.create({
        data: {
          signatureId: signature.id,
          provider: 'SIGNATURIT',
          event,
          externalEventId: payload.id,
          rawPayload: payload,
          processed: true,
          processedAt: new Date(),
        },
      });

    } catch (error: any) {
      logger.error('❌ Error processing webhook:', error);
      
      // Guardar webhook fallido
      await prisma.signatureWebhook.create({
        data: {
          signatureId: payload.data?.id || 'unknown',
          provider: 'SIGNATURIT',
          event: payload.event || 'unknown',
          rawPayload: payload,
          processed: false,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Obtiene el documento desde URL
   */
  private static async fetchDocument(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Calcula el hash SHA-256 del documento
   */
  private static calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Mapea estado de Signaturit a nuestro enum
   */
  private static mapSignaturitStatus(status: string): string {
    const mapping: Record<string, string> = {
      'signed': 'SIGNED',
      'completed': 'SIGNED',
      'declined': 'DECLINED',
      'expired': 'EXPIRED',
      'pending': 'PENDING',
    };
    return mapping[status.toLowerCase()] || 'PENDING';
  }
}

export default SignaturitService;
