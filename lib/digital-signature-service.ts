/**
 * Servicio de Firma Digital de Contratos
 * 
 * Abstracción para múltiples proveedores de firma electrónica:
 * - Signaturit (eIDAS compliant, Europa)
 * - DocuSign (líder global)
 * - Self-hosted (firma simple con certificado propio)
 * 
 * @module DigitalSignatureService
 */

import { prisma } from './db';
import logger from './logger';
import crypto from 'crypto';
import { z } from 'zod';
import { fetchJson } from '@/lib/integrations/http-client';
import {
  createSignature as createSignaturitSignature,
  getSignature as getSignaturitSignature,
  cancelSignature as cancelSignaturitSignature,
  downloadSignedDocument as downloadSignaturitDocument,
  SignatureType,
} from './signaturit-service';

// ============================================================================
// TIPOS
// ============================================================================

export type SignatureProvider = 'DOCUSIGN' | 'SIGNATURIT' | 'SELF_HOSTED';

export interface Signatory {
  name: string;
  email: string;
  role: 'LANDLORD' | 'TENANT' | 'WITNESS' | 'OTHER';
  phone?: string;
}

export interface SignatureRequest {
  contractId: string;
  companyId: string;
  documentUrl: string;
  documentName: string;
  signatories: Signatory[];
  provider?: SignatureProvider;
  emailSubject?: string;
  emailMessage?: string;
  expiresInDays?: number;
  requestedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SignatureResponse {
  id: string;
  signatureId: string; // ID en la BD
  externalId?: string; // ID en proveedor externo
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
  signingUrl?: string;
  completedUrl?: string;
  expiresAt?: Date;
}

export interface SignatureStatusUpdate {
  status: 'SIGNED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
  signedBy?: string;
  signedAt?: Date;
  ipAddress?: string;
  completedUrl?: string;
}

// ============================================================================
// INTERFAZ DE PROVEEDOR
// ============================================================================

interface ISignatureProvider {
  createSignatureRequest(request: SignatureRequest): Promise<{
    externalId: string;
    signingUrl: string;
    expiresAt: Date;
  }>;
  
  getSignatureStatus(externalId: string): Promise<{
    status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
    completedUrl?: string;
  }>;
  
  cancelSignature(externalId: string): Promise<void>;
  
  downloadSignedDocument(externalId: string): Promise<Buffer>;
}

// ============================================================================
// PROVEEDOR: SIGNATURIT
// ============================================================================

class SignaturitProvider implements ISignatureProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.signaturit.com/v3';
  
  constructor() {
    this.apiKey = process.env.SIGNATURIT_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('SIGNATURIT_API_KEY not configured');
    }
  }
  
  async createSignatureRequest(request: SignatureRequest) {
    try {
      logger.info('📝 Creating signature request with Signaturit', {
        contractId: request.contractId,
        signatories: request.signatories.length,
      });

      if (!this.apiKey) {
        throw new Error('SIGNATURIT_API_KEY no configurada');
      }

      const pdfResponse = await fetch(request.documentUrl);
      if (!pdfResponse.ok) {
        throw new Error('No se pudo descargar el documento para firmar');
      }
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

      const signers = request.signatories.map((signer) => ({
        email: signer.email,
        name: signer.name,
        phone: signer.phone,
      }));

      const signature = await createSignaturitSignature(pdfBuffer, request.documentName, signers, {
        type: SignatureType.SIMPLE,
        subject: request.emailSubject,
        body: request.emailMessage,
        expireDays: request.expiresInDays || 7,
        deliveryType: 'url',
      });

      const signingUrl = signature.signers?.[0]?.signUrl;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 7));

      return {
        externalId: signature.id,
        signingUrl: signingUrl || '',
        expiresAt,
      };
    } catch (error) {
      logger.error('Error creating Signaturit signature:', error);
      throw new Error(`Signaturit error: ${error}`);
    }
  }
  
  async getSignatureStatus(externalId: string) {
    try {
      const signature = await getSignaturitSignature(externalId);
      const status = signature?.status || signature?.state || 'ready';
      const mapStatus = (value: string) => {
        switch (value) {
          case 'completed':
            return 'SIGNED';
          case 'declined':
            return 'DECLINED';
          case 'expired':
            return 'EXPIRED';
          case 'canceled':
            return 'CANCELLED';
          default:
            return 'PENDING';
        }
      };

      return {
        status: mapStatus(status),
        completedUrl: signature?.signers?.[0]?.sign_url,
      };
    } catch (error) {
      logger.error('Error getting Signaturit status:', error);
      throw error;
    }
  }
  
  async cancelSignature(externalId: string) {
    try {
      logger.info('❌ Cancelling Signaturit signature:', externalId);
      await cancelSignaturitSignature(externalId);
    } catch (error) {
      logger.error('Error cancelling Signaturit signature:', error);
      throw error;
    }
  }
  
  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    try {
      const signature = await getSignaturitSignature(externalId);
      const documentId = signature?.documents?.[0]?.id;
      if (!documentId) {
        throw new Error('No se encontró documento firmado');
      }
      return await downloadSignaturitDocument(externalId, documentId);
    } catch (error) {
      logger.error('Error downloading signed document:', error);
      throw error;
    }
  }
}

// ============================================================================
// PROVEEDOR: DOCUSIGN
// ============================================================================

class DocuSignProvider implements ISignatureProvider {
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;
  private accessToken: string;
  
  constructor() {
    this.apiKey = process.env.DOCUSIGN_INTEGRATION_KEY || '';
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || '';
    this.accessToken = process.env.DOCUSIGN_ACCESS_TOKEN || '';
    this.baseUrl = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';
    
    if (!this.apiKey || !this.accountId || !this.accessToken) {
      logger.warn('DocuSign not fully configured');
    }
  }
  
  async createSignatureRequest(request: SignatureRequest) {
    try {
      logger.info('📝 Creating signature request with DocuSign', {
        contractId: request.contractId,
        signatories: request.signatories.length,
      });
      
      if (!this.accountId || !this.accessToken) {
        throw new Error('DOCUSIGN_ACCESS_TOKEN no configurado');
      }

      const pdfResponse = await fetch(request.documentUrl);
      if (!pdfResponse.ok) {
        throw new Error('No se pudo descargar el documento para firmar');
      }
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

      const envelopeBody = {
        emailSubject: request.emailSubject || 'Firma de documento',
        documents: [
          {
            documentBase64: pdfBuffer.toString('base64'),
            name: request.documentName,
            fileExtension: 'pdf',
            documentId: '1',
          },
        ],
        recipients: {
          signers: request.signatories.map((signer, index) => ({
            email: signer.email,
            name: signer.name,
            recipientId: String(index + 1),
            routingOrder: String(index + 1),
          })),
        },
        status: 'sent',
      };

      const { data: envelope } = await fetchJson<{ envelopeId: string }>(
        `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: envelopeBody,
          timeoutMs: 20_000,
          circuitKey: 'docusign-envelope',
        }
      );

      const envelopeSchema = z.object({ envelopeId: z.string() });
      const parsedEnvelope = envelopeSchema.parse(envelope);

      const firstSigner = request.signatories[0];
      const viewBody = {
        returnUrl: process.env.DOCUSIGN_RETURN_URL || request.documentUrl,
        authenticationMethod: 'none',
        email: firstSigner.email,
        userName: firstSigner.name,
        recipientId: '1',
      };

      const { data: view } = await fetchJson<{ url: string }>(
        `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${parsedEnvelope.envelopeId}/views/recipient`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: viewBody,
          timeoutMs: 20_000,
          circuitKey: 'docusign-view',
        }
      );

      const viewSchema = z.object({ url: z.string() });
      const parsedView = viewSchema.parse(view);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 7));
      
      return {
        externalId: parsedEnvelope.envelopeId,
        signingUrl: parsedView.url,
        expiresAt,
      };
    } catch (error) {
      logger.error('Error creating DocuSign signature:', error);
      throw new Error(`DocuSign error: ${error}`);
    }
  }
  
  async getSignatureStatus(externalId: string) {
    try {
      if (!this.accountId || !this.accessToken) {
        throw new Error('DOCUSIGN_ACCESS_TOKEN no configurado');
      }

      const { data } = await fetchJson<{ status: string }>(
        `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${externalId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          timeoutMs: 15_000,
          circuitKey: 'docusign-status',
        }
      );

      const status = data.status?.toLowerCase();
      const mapStatus = (value?: string) => {
        switch (value) {
          case 'completed':
            return 'SIGNED';
          case 'declined':
            return 'DECLINED';
          case 'voided':
            return 'CANCELLED';
          case 'expired':
            return 'EXPIRED';
          default:
            return 'PENDING';
        }
      };

      return {
        status: mapStatus(status),
        completedUrl: undefined,
      };
    } catch (error) {
      logger.error('Error getting DocuSign status:', error);
      throw error;
    }
  }
  
  async cancelSignature(externalId: string) {
    try {
      logger.info('❌ Cancelling DocuSign envelope:', externalId);
      if (!this.accountId || !this.accessToken) {
        throw new Error('DOCUSIGN_ACCESS_TOKEN no configurado');
      }
      await fetchJson(
        `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${externalId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: { status: 'voided', voidedReason: 'Cancelado por el usuario' },
          timeoutMs: 15_000,
          circuitKey: 'docusign-cancel',
        }
      );
    } catch (error) {
      logger.error('Error cancelling DocuSign envelope:', error);
      throw error;
    }
  }
  
  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    try {
      if (!this.accountId || !this.accessToken) {
        throw new Error('DOCUSIGN_ACCESS_TOKEN no configurado');
      }
      const response = await fetch(
        `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${externalId}/documents/combined`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DocuSign download error: ${errorText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      logger.error('Error downloading signed document:', error);
      throw error;
    }
  }
}

// ============================================================================
// PROVEEDOR: SELF-HOSTED (Firma Simple)
// ============================================================================

class SelfHostedProvider implements ISignatureProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.SELF_HOSTED_SIGNATURE_URL || '';
  }

  async createSignatureRequest(request: SignatureRequest) {
    try {
      logger.info('📝 Creating self-hosted signature request', {
        contractId: request.contractId,
      });

      if (!this.baseUrl) {
        throw new Error('SELF_HOSTED_SIGNATURE_URL no configurado');
      }

      const externalId = crypto.randomBytes(32).toString('hex');
      const signingUrl = `${this.baseUrl}/sign/${externalId}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 7));
      
      return {
        externalId,
        signingUrl,
        expiresAt,
      };
    } catch (error) {
      logger.error('Error creating self-hosted signature:', error);
      throw error;
    }
  }
  
  async getSignatureStatus(externalId: string) {
    if (!this.baseUrl) {
      throw new Error('SELF_HOSTED_SIGNATURE_URL no configurado');
    }
    const { data } = await fetchJson<{ status: string; completedUrl?: string }>(
      `${this.baseUrl}/status/${externalId}`,
      {
        timeoutMs: 10_000,
        circuitKey: 'self-hosted-signature',
      }
    );

    const status = data.status?.toUpperCase();
    return {
      status: (status as 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED') || 'PENDING',
      completedUrl: data.completedUrl,
    };
  }
  
  async cancelSignature(externalId: string) {
    if (!this.baseUrl) {
      throw new Error('SELF_HOSTED_SIGNATURE_URL no configurado');
    }
    await fetchJson(`${this.baseUrl}/cancel/${externalId}`, {
      method: 'POST',
      timeoutMs: 10_000,
      circuitKey: 'self-hosted-signature',
    });
  }
  
  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    if (!this.baseUrl) {
      throw new Error('SELF_HOSTED_SIGNATURE_URL no configurado');
    }
    const response = await fetch(`${this.baseUrl}/documents/${externalId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error descargando documento: ${errorText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

// ============================================================================
// FACTORY PATTERN
// ============================================================================

function getProvider(provider: SignatureProvider): ISignatureProvider {
  switch (provider) {
    case 'SIGNATURIT':
      return new SignaturitProvider();
    case 'DOCUSIGN':
      return new DocuSignProvider();
    case 'SELF_HOSTED':
      return new SelfHostedProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Calcula hash SHA-256 del documento
 */
async function calculateDocumentHash(documentUrl: string): Promise<string> {
  const response = await fetch(documentUrl);
  if (!response.ok) {
    throw new Error('No se pudo descargar el documento para calcular hash');
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Crea una solicitud de firma digital
 */
export async function createSignatureRequest(
  request: SignatureRequest
): Promise<SignatureResponse> {
  try {
    const provider = request.provider || 'SIGNATURIT';
    
    logger.info('🚀 Creating digital signature request', {
      contractId: request.contractId,
      provider,
      signatories: request.signatories.length,
    });
    
    // 1. Calcular hash del documento
    const documentHash = await calculateDocumentHash(request.documentUrl);
    
    // 2. Crear solicitud en proveedor externo
    const providerInstance = getProvider(provider);
    const providerResponse = await providerInstance.createSignatureRequest(request);
    
    // 3. Preparar signatarios con estado inicial
    const signatoriesData = request.signatories.map((s) => ({
      name: s.name,
      email: s.email,
      role: s.role,
      phone: s.phone || null,
      status: 'PENDING',
      signedAt: null,
      ipAddress: null,
    }));
    
    // 4. Guardar en base de datos
    const signature = await prisma.contractSignature.create({
      data: {
        companyId: request.companyId,
        contractId: request.contractId,
        provider,
        externalId: providerResponse.externalId,
        documentUrl: request.documentUrl,
        documentName: request.documentName,
        documentHash,
        signatories: signatoriesData,
        status: 'PENDING',
        signingUrl: providerResponse.signingUrl,
        emailSubject: request.emailSubject || `Firma de contrato: ${request.documentName}`,
        emailMessage: request.emailMessage || 'Por favor, revisa y firma el documento adjunto.',
        sentAt: new Date(),
        expiresAt: providerResponse.expiresAt,
        requestedBy: request.requestedBy,
        ipAddress: request.ipAddress || null,
        userAgent: request.userAgent || null,
      },
    });
    
    logger.info('✅ Digital signature request created', {
      signatureId: signature.id,
      externalId: signature.externalId,
    });
    
    // TODO: Enviar emails a firmantes
    // await sendSignatureEmails(signature);
    
    return {
      id: signature.id,
      signatureId: signature.id,
      externalId: signature.externalId || undefined,
      status: signature.status as any,
      signingUrl: signature.signingUrl || undefined,
      completedUrl: signature.completedUrl || undefined,
      expiresAt: signature.expiresAt || undefined,
    };
  } catch (error) {
    logger.error('Error creating signature request:', error);
    throw error;
  }
}

/**
 * Obtiene el estado de una solicitud de firma
 */
export async function getSignatureStatus(signatureId: string): Promise<SignatureResponse> {
  try {
    const signature = await prisma.contractSignature.findUnique({
      where: { id: signatureId },
    });
    
    if (!signature) {
      throw new Error('Signature not found');
    }
    
    // Si está pendiente, consultar proveedor externo para actualizar estado
    if (signature.status === 'PENDING' && signature.externalId) {
      const provider = getProvider(signature.provider);
      const status = await provider.getSignatureStatus(signature.externalId);
      
      // Actualizar en BD si cambió
      if (status.status !== signature.status) {
        await prisma.contractSignature.update({
          where: { id: signatureId },
          data: {
            status: status.status,
            completedUrl: status.completedUrl || null,
            completedAt: status.status === 'SIGNED' ? new Date() : null,
          },
        });
        
        return {
          id: signature.id,
          signatureId: signature.id,
          externalId: signature.externalId || undefined,
          status: status.status as any,
          signingUrl: signature.signingUrl || undefined,
          completedUrl: status.completedUrl,
          expiresAt: signature.expiresAt || undefined,
        };
      }
    }
    
    return {
      id: signature.id,
      signatureId: signature.id,
      externalId: signature.externalId || undefined,
      status: signature.status as any,
      signingUrl: signature.signingUrl || undefined,
      completedUrl: signature.completedUrl || undefined,
      expiresAt: signature.expiresAt || undefined,
    };
  } catch (error) {
    logger.error('Error getting signature status:', error);
    throw error;
  }
}

/**
 * Cancela una solicitud de firma
 */
export async function cancelSignature(
  signatureId: string,
  companyId: string
): Promise<void> {
  try {
    const signature = await prisma.contractSignature.findFirst({
      where: {
        id: signatureId,
        companyId,
      },
    });
    
    if (!signature) {
      throw new Error('Signature not found');
    }
    
    if (signature.status !== 'PENDING') {
      throw new Error('Only pending signatures can be cancelled');
    }
    
    // Cancelar en proveedor externo
    if (signature.externalId) {
      const provider = getProvider(signature.provider);
      await provider.cancelSignature(signature.externalId);
    }
    
    // Actualizar en BD
    await prisma.contractSignature.update({
      where: { id: signatureId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });
    
    logger.info('✅ Signature cancelled', { signatureId });
  } catch (error) {
    logger.error('Error cancelling signature:', error);
    throw error;
  }
}

/**
 * Procesa webhook de proveedor externo
 */
export async function processSignatureWebhook(
  provider: SignatureProvider,
  event: string,
  payload: any
): Promise<void> {
  try {
    logger.info('📨 Processing signature webhook', { provider, event });
    
    // Guardar webhook raw
    await prisma.signatureWebhook.create({
      data: {
        signatureId: payload.externalId || 'unknown',
        provider,
        event,
        rawPayload: payload,
        processed: false,
      },
    });
    
    // Procesar según evento
    switch (event) {
      case 'signature_completed':
        await handleSignatureCompleted(payload);
        break;
      case 'signature_declined':
        await handleSignatureDeclined(payload);
        break;
      case 'signature_expired':
        await handleSignatureExpired(payload);
        break;
      default:
        logger.warn(`Unknown webhook event: ${event}`);
    }
  } catch (error) {
    logger.error('Error processing webhook:', error);
    throw error;
  }
}

async function handleSignatureCompleted(payload: any) {
  const externalId = payload.externalId;
  
  const signature = await prisma.contractSignature.findFirst({
    where: { externalId },
  });
  
  if (signature) {
    await prisma.contractSignature.update({
      where: { id: signature.id },
      data: {
        status: 'SIGNED',
        completedAt: new Date(),
        completedUrl: payload.completedUrl || null,
      },
    });
    
    logger.info('✅ Signature completed', { signatureId: signature.id });
  }
}

async function handleSignatureDeclined(payload: any) {
  const externalId = payload.externalId;
  
  const signature = await prisma.contractSignature.findFirst({
    where: { externalId },
  });
  
  if (signature) {
    await prisma.contractSignature.update({
      where: { id: signature.id },
      data: {
        status: 'DECLINED',
      },
    });
    
    logger.info('❌ Signature declined', { signatureId: signature.id });
  }
}

async function handleSignatureExpired(payload: any) {
  const externalId = payload.externalId;
  
  const signature = await prisma.contractSignature.findFirst({
    where: { externalId },
  });
  
  if (signature) {
    await prisma.contractSignature.update({
      where: { id: signature.id },
      data: {
        status: 'EXPIRED',
      },
    });
    
    logger.info('⏱️ Signature expired', { signatureId: signature.id });
  }
}

/**
 * Obtiene historial de firmas de un contrato
 */
export async function getContractSignatures(
  contractId: string,
  companyId: string
): Promise<any[]> {
  return await prisma.contractSignature.findMany({
    where: {
      contractId,
      companyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}
