/**
 * SERVICIO DE FIRMA DIGITAL PARA CONTRATOS DE MEDIA ESTANCIA
 * 
 * Integración con Signaturit para firma electrónica legal
 */

import { prisma } from '../db';
import { generateContractPDF } from './pdf-generator';

// ==========================================
// TIPOS
// ==========================================

export interface Signatory {
  email: string;
  name: string;
  phone?: string;
  role: 'arrendador' | 'arrendatario' | 'testigo' | 'avalista';
}

export interface SignatureRequest {
  contractId: string;
  signatories: Signatory[];
  subject?: string;
  body?: string;
  expirationDays?: number;
  reminders?: {
    enabled: boolean;
    intervalDays: number;
  };
}

export interface SignatureStatus {
  id: string;
  contractId: string;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'expired' | 'cancelled';
  signatories: SignatoryStatus[];
  createdAt: Date;
  expiresAt?: Date;
  completedAt?: Date;
  signatureUrl: string;
  documentUrl?: string;
}

export interface SignatoryStatus {
  email: string;
  name: string;
  role: string;
  status: 'pending' | 'opened' | 'signed' | 'declined';
  signedAt?: Date;
}

export interface SignatureWebhookPayload {
  event: 'signature.completed' | 'signature.declined' | 'signature.expired' | 'document.opened';
  signatureId: string;
  signatoryEmail?: string;
  timestamp: string;
}

// ==========================================
// CLIENTE SIGNATURIT
// ==========================================

class SignaturitClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SIGNATURIT_API_KEY || '';
    this.baseUrl = process.env.SIGNATURIT_API_URL || 'https://api.signaturit.com/v3';
    
    if (!this.apiKey) {
      console.warn('[SignaturitClient] API key no configurada');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Signaturit API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Crea una solicitud de firma
   */
  async createSignature(data: {
    files: Array<{ name: string; content: string }>;
    recipients: Array<{
      email: string;
      fullname: string;
      phone?: string;
    }>;
    subject: string;
    body: string;
    callbackUrl?: string;
    expiration?: number;
    reminders?: number;
  }): Promise<any> {
    return this.request('/signatures.json', {
      method: 'POST',
      body: JSON.stringify({
        files: data.files,
        recipients: data.recipients,
        subject: data.subject,
        body: data.body,
        callback_url: data.callbackUrl,
        expire_time: data.expiration,
        reminders: data.reminders,
        delivery_type: 'email',
        branding_id: process.env.SIGNATURIT_BRANDING_ID,
      }),
    });
  }

  /**
   * Obtiene el estado de una firma
   */
  async getSignature(signatureId: string): Promise<any> {
    return this.request(`/signatures/${signatureId}.json`);
  }

  /**
   * Cancela una solicitud de firma
   */
  async cancelSignature(signatureId: string): Promise<any> {
    return this.request(`/signatures/${signatureId}/cancel.json`, {
      method: 'PATCH',
    });
  }

  /**
   * Descarga el documento firmado
   */
  async downloadSignedDocument(signatureId: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/signatures/${signatureId}/download/signed`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error descargando documento: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Envía recordatorio
   */
  async sendReminder(signatureId: string): Promise<any> {
    return this.request(`/signatures/${signatureId}/reminder.json`, {
      method: 'POST',
    });
  }
}

const signaturitClient = new SignaturitClient();

// ==========================================
// SERVICIO DE FIRMA
// ==========================================

/**
 * Inicia el proceso de firma digital para un contrato
 */
export async function initializeSignature(
  request: SignatureRequest
): Promise<SignatureStatus> {
  // Generar PDF del contrato
  const pdfResult = await generateContractPDF(request.contractId);
  
  // Convertir PDF a base64
  const pdfBase64 = pdfResult.buffer.toString('base64');

  // Crear solicitud en Signaturit
  const signatureResponse = await signaturitClient.createSignature({
    files: [{
      name: pdfResult.filename,
      content: pdfBase64,
    }],
    recipients: request.signatories.map(s => ({
      email: s.email,
      fullname: s.name,
      phone: s.phone,
    })),
    subject: request.subject || 'Firma de Contrato de Arrendamiento por Temporada',
    body: request.body || `Estimado/a,\n\nAdjuntamos el contrato de arrendamiento para su firma digital.\n\nPor favor, revise el documento y proceda a firmarlo.\n\nSaludos,\nInmova App`,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/signaturit`,
    expiration: request.expirationDays || 7,
    reminders: request.reminders?.enabled ? request.reminders.intervalDays : undefined,
  });

  // Guardar en base de datos
  await prisma.contract.update({
    where: { id: request.contractId },
    data: {
      signatureId: signatureResponse.id,
      signatureStatus: 'pending',
      signatureRequestedAt: new Date(),
    },
  });

  // Crear registro de firma
  const signatureRecord = await prisma.contractSignature.create({
    data: {
      contractId: request.contractId,
      signatureId: signatureResponse.id,
      status: 'pending',
      signatories: request.signatories.map(s => ({
        ...s,
        status: 'pending',
      })),
      expiresAt: new Date(Date.now() + (request.expirationDays || 7) * 24 * 60 * 60 * 1000),
    },
  });

  return {
    id: signatureResponse.id,
    contractId: request.contractId,
    status: 'pending',
    signatories: request.signatories.map(s => ({
      email: s.email,
      name: s.name,
      role: s.role,
      status: 'pending',
    })),
    createdAt: new Date(),
    expiresAt: signatureRecord.expiresAt || undefined,
    signatureUrl: signatureResponse.signature_url || signatureResponse.url,
  };
}

/**
 * Obtiene el estado actual de una firma
 */
export async function getSignatureStatus(
  contractId: string
): Promise<SignatureStatus | null> {
  const signatureRecord = await prisma.contractSignature.findFirst({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
  });

  if (!signatureRecord) {
    return null;
  }

  // Obtener estado actualizado de Signaturit
  const signaturitStatus = await signaturitClient.getSignature(signatureRecord.signatureId);

  // Mapear estado
  const statusMap: Record<string, SignatureStatus['status']> = {
    'ready': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'expired': 'expired',
    'canceled': 'cancelled',
  };

  // Actualizar registro local
  await prisma.contractSignature.update({
    where: { id: signatureRecord.id },
    data: {
      status: statusMap[signaturitStatus.status] || 'pending',
      signatories: signaturitStatus.documents?.[0]?.events?.map((e: any) => ({
        email: e.email,
        name: e.name || e.email,
        role: 'arrendatario',
        status: e.type === 'signature' ? 'signed' : 'pending',
        signedAt: e.created_at ? new Date(e.created_at) : undefined,
      })) || signatureRecord.signatories,
    },
  });

  return {
    id: signatureRecord.signatureId,
    contractId,
    status: statusMap[signaturitStatus.status] || 'pending',
    signatories: (signatureRecord.signatories as any[]) || [],
    createdAt: signatureRecord.createdAt,
    expiresAt: signatureRecord.expiresAt || undefined,
    completedAt: signaturitStatus.status === 'completed' ? new Date() : undefined,
    signatureUrl: signaturitStatus.signature_url || '',
    documentUrl: signaturitStatus.status === 'completed' ? signaturitStatus.file?.url : undefined,
  };
}

/**
 * Cancela una solicitud de firma
 */
export async function cancelSignature(contractId: string): Promise<boolean> {
  const signatureRecord = await prisma.contractSignature.findFirst({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
  });

  if (!signatureRecord) {
    throw new Error('No hay firma pendiente para este contrato');
  }

  await signaturitClient.cancelSignature(signatureRecord.signatureId);

  await prisma.contractSignature.update({
    where: { id: signatureRecord.id },
    data: { status: 'cancelled' },
  });

  await prisma.contract.update({
    where: { id: contractId },
    data: { signatureStatus: 'cancelled' },
  });

  return true;
}

/**
 * Descarga el documento firmado
 */
export async function downloadSignedDocument(
  contractId: string
): Promise<{ buffer: Buffer; filename: string }> {
  const signatureRecord = await prisma.contractSignature.findFirst({
    where: { contractId, status: 'completed' },
    orderBy: { createdAt: 'desc' },
  });

  if (!signatureRecord) {
    throw new Error('No hay documento firmado disponible');
  }

  const buffer = await signaturitClient.downloadSignedDocument(signatureRecord.signatureId);

  return {
    buffer,
    filename: `contrato-firmado-${contractId}.pdf`,
  };
}

/**
 * Envía recordatorio de firma
 */
export async function sendSignatureReminder(contractId: string): Promise<boolean> {
  const signatureRecord = await prisma.contractSignature.findFirst({
    where: { contractId, status: { in: ['pending', 'in_progress'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!signatureRecord) {
    throw new Error('No hay firma pendiente para este contrato');
  }

  await signaturitClient.sendReminder(signatureRecord.signatureId);

  return true;
}

/**
 * Procesa webhook de Signaturit
 */
export async function processSignatureWebhook(
  payload: SignatureWebhookPayload
): Promise<void> {
  const signatureRecord = await prisma.contractSignature.findFirst({
    where: { signatureId: payload.signatureId },
  });

  if (!signatureRecord) {
    console.warn(`[Signature Webhook] Firma no encontrada: ${payload.signatureId}`);
    return;
  }

  const eventHandlers: Record<string, () => Promise<void>> = {
    'signature.completed': async () => {
      // Todos firmaron
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      await prisma.contract.update({
        where: { id: signatureRecord.contractId },
        data: {
          signatureStatus: 'completed',
          signatureCompletedAt: new Date(),
          status: 'activo', // Activar contrato
        },
      });

      // Descargar y guardar documento firmado
      const { buffer } = await downloadSignedDocument(signatureRecord.contractId);
      
      // TODO: Guardar en S3
      console.log(`[Signature] Documento firmado descargado: ${buffer.length} bytes`);
    },

    'signature.declined': async () => {
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: { status: 'cancelled' },
      });

      await prisma.contract.update({
        where: { id: signatureRecord.contractId },
        data: { signatureStatus: 'declined' },
      });

      // TODO: Notificar al propietario
    },

    'signature.expired': async () => {
      await prisma.contractSignature.update({
        where: { id: signatureRecord.id },
        data: { status: 'expired' },
      });

      await prisma.contract.update({
        where: { id: signatureRecord.contractId },
        data: { signatureStatus: 'expired' },
      });
    },

    'document.opened': async () => {
      // Actualizar estado del firmante
      if (payload.signatoryEmail) {
        const signatories = (signatureRecord.signatories as any[]) || [];
        const updatedSignatories = signatories.map(s => 
          s.email === payload.signatoryEmail
            ? { ...s, status: 'opened' }
            : s
        );

        await prisma.contractSignature.update({
          where: { id: signatureRecord.id },
          data: {
            status: 'in_progress',
            signatories: updatedSignatories,
          },
        });
      }
    },
  };

  const handler = eventHandlers[payload.event];
  if (handler) {
    await handler();
  }
}

export default {
  initializeSignature,
  getSignatureStatus,
  cancelSignature,
  downloadSignedDocument,
  sendSignatureReminder,
  processSignatureWebhook,
};
