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

// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
import logger from './logger';
import crypto from 'crypto';

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
      // Simulated implementation - En producción, usar SDK oficial
      logger.info('📝 Creating signature request with Signaturit', {
        contractId: request.contractId,
        signatories: request.signatories.length,
      });
      
      // Mock de respuesta para desarrollo
      // En producción:
      // const signaturit = require('@signaturit/signaturit-sdk');
      // const client = new signaturit.Client(this.apiKey);
      // const result = await client.createSignature({ ... });
      
      const externalId = `sig_${crypto.randomBytes(16).toString('hex')}`;
      const signingUrl = `https://app.signaturit.com/sign/${externalId}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 7));
      
      return {
        externalId,
        signingUrl,
        expiresAt,
      };
    } catch (error) {
      logger.error('Error creating Signaturit signature:', error);
      throw new Error(`Signaturit error: ${error}`);
    }
  }
  
  async getSignatureStatus(externalId: string) {
    try {
      // Mock - En producción usar SDK
      return {
        status: 'PENDING' as const,
        completedUrl: undefined,
      };
    } catch (error) {
      logger.error('Error getting Signaturit status:', error);
      throw error;
    }
  }
  
  async cancelSignature(externalId: string) {
    try {
      logger.info('❌ Cancelling Signaturit signature:', externalId);
      // Mock - En producción usar SDK
    } catch (error) {
      logger.error('Error cancelling Signaturit signature:', error);
      throw error;
    }
  }
  
  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    try {
      // Mock - En producción usar SDK para descargar documento firmado
      return Buffer.from('Mock signed document');
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
  private integrationKey: string;
  private accountId: string;
  private userId: string;
  private basePath: string;
  private privateKey: string;
  
  constructor() {
    this.integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || '';
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || '';
    this.userId = process.env.DOCUSIGN_USER_ID || '';
    this.basePath = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';
    this.privateKey = process.env.DOCUSIGN_PRIVATE_KEY || '';
    
    if (!this.integrationKey || !this.accountId) {
      logger.warn('DocuSign not fully configured - set DOCUSIGN_INTEGRATION_KEY and DOCUSIGN_ACCOUNT_ID');
    }
  }

  private async getAccessToken(): Promise<string> {
    const docusign = require('docusign-esign');
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath(this.basePath);

    // JWT Auth
    if (this.privateKey && this.userId) {
      try {
        const results = await apiClient.requestJWTUserToken(
          this.integrationKey,
          this.userId,
          ['signature', 'impersonation'],
          Buffer.from(this.privateKey, 'utf8'),
          3600
        );
        return results.body.access_token;
      } catch (jwtError: any) {
        logger.error('DocuSign JWT auth failed:', jwtError.message);
        throw new Error('DocuSign authentication failed. Check DOCUSIGN_PRIVATE_KEY and DOCUSIGN_USER_ID.');
      }
    }

    throw new Error('DocuSign credentials not configured. Need DOCUSIGN_PRIVATE_KEY + DOCUSIGN_USER_ID for JWT auth.');
  }
  
  async createSignatureRequest(request: SignatureRequest) {
    try {
      logger.info('Creating signature request with DocuSign', {
        contractId: request.contractId,
        signatories: request.signatories.length,
      });
      
      const docusign = require('docusign-esign');
      const accessToken = await this.getAccessToken();
      
      const apiClient = new docusign.ApiClient();
      apiClient.setBasePath(this.basePath);
      apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
      
      const envelopesApi = new docusign.EnvelopesApi(apiClient);
      
      // Construir envelope
      const signers = request.signatories.map((s, idx) => {
        const signer = new docusign.Signer();
        signer.email = s.email;
        signer.name = s.name;
        signer.recipientId = String(idx + 1);
        signer.routingOrder = String(idx + 1);
        
        // Añadir tab de firma
        const signHere = new docusign.SignHere();
        signHere.anchorString = '/firma/';
        signHere.anchorUnits = 'pixels';
        signHere.anchorXOffset = '0';
        signHere.anchorYOffset = '0';
        
        signer.tabs = new docusign.Tabs();
        signer.tabs.signHereTabs = [signHere];
        
        return signer;
      });
      
      const recipients = new docusign.Recipients();
      recipients.signers = signers;
      
      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.emailSubject = request.emailSubject || 'Firma de contrato de arrendamiento - Inmova';
      envelopeDefinition.emailBlurb = request.emailMessage || 'Por favor, revisa y firma el documento adjunto.';
      envelopeDefinition.recipients = recipients;
      envelopeDefinition.status = 'sent';
      
      // Documento desde URL
      const document = new docusign.Document();
      document.documentBase64 = ''; // Se rellenaría con el PDF real
      document.name = request.documentName || 'Contrato';
      document.fileExtension = 'pdf';
      document.documentId = '1';
      envelopeDefinition.documents = [document];
      
      const results = await envelopesApi.createEnvelope(this.accountId, {
        envelopeDefinition,
      });
      
      const externalId = results.envelopeId;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 7));
      
      // Obtener URL de firma para el primer firmante
      const viewRequest = new docusign.RecipientViewRequest();
      viewRequest.returnUrl = `${process.env.NEXTAUTH_URL || 'https://inmovaapp.com'}/contratos?signed=true`;
      viewRequest.authenticationMethod = 'none';
      viewRequest.email = request.signatories[0].email;
      viewRequest.userName = request.signatories[0].name;
      viewRequest.recipientId = '1';
      
      let signingUrl = `https://demo.docusign.net/Signing/${externalId}`;
      try {
        const viewResults = await envelopesApi.createRecipientView(this.accountId, externalId, {
          recipientViewRequest: viewRequest,
        });
        signingUrl = viewResults.url;
      } catch (viewErr) {
        logger.warn('Could not get embedded signing URL, using envelope ID');
      }
      
      logger.info(`DocuSign envelope created: ${externalId}`);
      
      return {
        externalId,
        signingUrl,
        expiresAt,
      };
    } catch (error: any) {
      logger.error('Error creating DocuSign signature:', error.message);
      throw new Error(`DocuSign error: ${error.message}`);
    }
  }
  
  async getSignatureStatus(externalId: string) {
    try {
      const docusign = require('docusign-esign');
      const accessToken = await this.getAccessToken();
      
      const apiClient = new docusign.ApiClient();
      apiClient.setBasePath(this.basePath);
      apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
      
      const envelopesApi = new docusign.EnvelopesApi(apiClient);
      const envelope = await envelopesApi.getEnvelope(this.accountId, externalId);
      
      const statusMap: Record<string, 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED'> = {
        sent: 'PENDING',
        delivered: 'PENDING',
        completed: 'SIGNED',
        declined: 'DECLINED',
        voided: 'EXPIRED',
      };
      
      return {
        status: statusMap[envelope.status] || 'PENDING',
        completedUrl: envelope.status === 'completed' ? envelope.certificateUri : undefined,
      };
    } catch (error: any) {
      logger.error('Error getting DocuSign status:', error.message);
      throw error;
    }
  }
  
  async cancelSignature(externalId: string) {
    try {
      const docusign = require('docusign-esign');
      const accessToken = await this.getAccessToken();
      
      const apiClient = new docusign.ApiClient();
      apiClient.setBasePath(this.basePath);
      apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
      
      const envelopesApi = new docusign.EnvelopesApi(apiClient);
      const envelope = new docusign.Envelope();
      envelope.status = 'voided';
      envelope.voidedReason = 'Cancelled from Inmova';
      
      await envelopesApi.update(this.accountId, externalId, { envelope });
      logger.info(`DocuSign envelope voided: ${externalId}`);
    } catch (error: any) {
      logger.error('Error cancelling DocuSign envelope:', error.message);
      throw error;
    }
  }
  
  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    try {
      const docusign = require('docusign-esign');
      const accessToken = await this.getAccessToken();
      
      const apiClient = new docusign.ApiClient();
      apiClient.setBasePath(this.basePath);
      apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
      
      const envelopesApi = new docusign.EnvelopesApi(apiClient);
      const documentBuffer = await envelopesApi.getDocument(this.accountId, externalId, 'combined');
      
      return Buffer.from(documentBuffer);
    } catch (error: any) {
      logger.error('Error downloading signed document:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// PROVEEDOR: SELF-HOSTED (Firma Simple)
// ============================================================================

class SelfHostedProvider implements ISignatureProvider {
  async createSignatureRequest(request: SignatureRequest) {
    try {
      logger.info('📝 Creating self-hosted signature request', {
        contractId: request.contractId,
      });
      
      // Para firma simple auto-hospedada
      // Generar URL única de firma
      const externalId = crypto.randomBytes(32).toString('hex');
      const signingUrl = `${process.env.NEXTAUTH_URL}/sign/${externalId}`;
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
    return {
      status: 'PENDING' as const,
      completedUrl: undefined,
    };
  }
  
  async cancelSignature(externalId: string) {
    logger.info('❌ Cancelling self-hosted signature:', externalId);
  }
  
  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    return Buffer.from('Mock signed document');
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
function calculateDocumentHash(documentUrl: string): string {
  // En producción, descargar el archivo y calcular hash real
  return crypto
    .createHash('sha256')
    .update(documentUrl)
    .digest('hex');
}

/**
 * Crea una solicitud de firma digital
 */
export async function createSignatureRequest(
  request: SignatureRequest
): Promise<SignatureResponse> {
  try {
    const provider = request.provider || (process.env.DOCUSIGN_INTEGRATION_KEY ? 'DOCUSIGN' : 'SIGNATURIT');
    
    logger.info('🚀 Creating digital signature request', {
      contractId: request.contractId,
      provider,
      signatories: request.signatories.length,
    });
    
    // 1. Calcular hash del documento
    const documentHash = calculateDocumentHash(request.documentUrl);
    
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
  const prisma = await getPrisma();
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
