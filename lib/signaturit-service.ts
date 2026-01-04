/**
 * Signaturit Service - Firma Digital de Contratos
 * 
 * Signaturit es un proveedor certificado de firma electrónica que cumple con:
 * - eIDAS (Reglamento UE de identificación electrónica)
 * - Ley 6/2020 de Servicios Electrónicos de Confianza
 * - Validez legal en toda la UE
 * 
 * Features:
 * - Firma electrónica simple
 * - Firma electrónica avanzada
 * - Firma electrónica cualificada (máximo nivel legal)
 * - Multi-firmantes
 * - Workflow personalizado
 * - Certificados de firma
 * - Archivo legal durante 10 años
 * 
 * @module lib/signaturit-service
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import crypto from 'crypto';

// Configuración
const SIGNATURIT_API_KEY = process.env.SIGNATURIT_API_KEY || '';
const SIGNATURIT_ENV = process.env.SIGNATURIT_ENV || 'sandbox'; // 'sandbox' o 'production'
const API_BASE_URL = SIGNATURIT_ENV === 'production' 
  ? 'https://api.signaturit.com/v3'
  : 'https://api.sandbox.signaturit.com/v3';

/**
 * Tipo de firma
 */
export enum SignatureType {
  SIMPLE = 'simple',       // Firma simple (OTP por email/SMS)
  ADVANCED = 'advanced',   // Firma avanzada (certificado digital)
  QUALIFIED = 'qualified', // Firma cualificada (máximo nivel legal)
}

/**
 * Estado de la firma
 */
export enum SignatureStatus {
  READY = 'ready',           // Listo para firmar
  COMPLETED = 'completed',   // Firmado por todos
  DECLINED = 'declined',     // Rechazado
  EXPIRED = 'expired',       // Expirado
  CANCELED = 'canceled',     // Cancelado
}

/**
 * Firmante
 */
export interface Signer {
  /** Email del firmante */
  email: string;
  /** Nombre completo */
  name: string;
  /** Teléfono (opcional, requerido para SMS OTP) */
  phone?: string;
  /** Requiere verificación por SMS */
  requireSmsVerification?: boolean;
}

/**
 * Opciones de firma
 */
export interface SignatureOptions {
  /** Tipo de firma */
  type?: SignatureType;
  /** Asunto del email */
  subject?: string;
  /** Mensaje personalizado */
  message?: string;
  /** Días hasta expiración (default: 30) */
  expirationDays?: number;
  /** Enviar email de recordatorio automático */
  sendReminders?: boolean;
  /** Requerir código OTP por email */
  requireEmailOtp?: boolean;
  /** Callback URL para webhooks */
  callbackUrl?: string;
}

/**
 * Resultado de creación de firma
 */
export interface SignatureResult {
  success: boolean;
  signatureId?: string;
  documentsIds?: string[];
  signers?: any[];
  status?: SignatureStatus;
  signUrl?: string;
  error?: string;
}

/**
 * Detalle de firma
 */
export interface SignatureDetail {
  id: string;
  status: SignatureStatus;
  signers: any[];
  documents: any[];
  createdAt: string;
  completedAt?: string;
  certificateUrl?: string;
}

/**
 * Cliente Signaturit (singleton)
 */
class SignaturitClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = SIGNATURIT_API_KEY;
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Headers de autenticación
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'Inmova-App/1.0',
    };
  }

  /**
   * Request genérico
   */
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = this.getHeaders();

      const options: any = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        if (body instanceof FormData) {
          // FormData maneja sus propios headers
          options.body = body;
          // NO añadir Content-Type, FormData lo hace automáticamente
          delete headers['Content-Type'];
        } else {
          options.headers['Content-Type'] = 'application/json';
          options.body = JSON.stringify(body);
        }
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Signaturit API error');
      }

      return data;
    } catch (error: any) {
      console.error('[Signaturit] Request error:', error);
      throw error;
    }
  }

  /**
   * Crea una solicitud de firma
   * 
   * @param pdfBuffer - Buffer del PDF a firmar
   * @param fileName - Nombre del archivo
   * @param signers - Array de firmantes
   * @param options - Opciones adicionales
   * @returns Resultado de la creación
   */
  async createSignature(
    pdfBuffer: Buffer,
    fileName: string,
    signers: Signer[],
    options: SignatureOptions = {}
  ): Promise<SignatureResult> {
    try {
      // Validar que haya firmantes
      if (!signers || signers.length === 0) {
        throw new Error('Al menos un firmante es requerido');
      }

      // Preparar FormData
      const form = new FormData();

      // Archivo PDF
      form.append('files[]', pdfBuffer, {
        filename: fileName,
        contentType: 'application/pdf',
      });

      // Firmantes
      signers.forEach((signer, index) => {
        form.append(`recipients[${index}][email]`, signer.email);
        form.append(`recipients[${index}][name]`, signer.name);
        
        if (signer.phone) {
          form.append(`recipients[${index}][phone]`, signer.phone);
        }

        if (signer.requireSmsVerification) {
          form.append(`recipients[${index}][require_sms_verification]`, '1');
        }
      });

      // Opciones
      if (options.subject) {
        form.append('subject', options.subject);
      }

      if (options.message) {
        form.append('body', options.message);
      }

      if (options.type) {
        form.append('type', options.type);
      }

      if (options.expirationDays) {
        form.append('expire_time', options.expirationDays.toString());
      }

      if (options.sendReminders) {
        form.append('send_reminders', '1');
      }

      if (options.requireEmailOtp) {
        form.append('require_email_verification', '1');
      }

      if (options.callbackUrl) {
        form.append('callback_url', options.callbackUrl);
      }

      // Request a API
      const data = await this.request('/signatures.json', 'POST', form);

      return {
        success: true,
        signatureId: data.id,
        documentsIds: data.documents?.map((d: any) => d.id),
        signers: data.signers,
        status: data.status as SignatureStatus,
        signUrl: data.signers?.[0]?.sign_url,
      };
    } catch (error: any) {
      console.error('[Signaturit] Create signature error:', error);
      return {
        success: false,
        error: error.message || 'Error creando firma',
      };
    }
  }

  /**
   * Obtiene el estado de una firma
   */
  async getSignature(signatureId: string): Promise<SignatureDetail | null> {
    try {
      const data = await this.request(`/signatures/${signatureId}.json`);

      return {
        id: data.id,
        status: data.status as SignatureStatus,
        signers: data.signers,
        documents: data.documents,
        createdAt: data.created_at,
        completedAt: data.completed_at,
        certificateUrl: data.certificate_url,
      };
    } catch (error: any) {
      console.error('[Signaturit] Get signature error:', error);
      return null;
    }
  }

  /**
   * Cancela una firma pendiente
   */
  async cancelSignature(signatureId: string): Promise<boolean> {
    try {
      await this.request(`/signatures/${signatureId}/cancel.json`, 'POST');
      return true;
    } catch (error: any) {
      console.error('[Signaturit] Cancel signature error:', error);
      return false;
    }
  }

  /**
   * Descarga el documento firmado
   */
  async downloadSignedDocument(documentId: string): Promise<Buffer | null> {
    try {
      const url = `${this.baseUrl}/signatures/documents/${documentId}/download`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error downloading document');
      }

      const buffer = await response.buffer();
      return buffer;
    } catch (error: any) {
      console.error('[Signaturit] Download document error:', error);
      return null;
    }
  }

  /**
   * Descarga el certificado de firma
   */
  async downloadCertificate(signatureId: string): Promise<Buffer | null> {
    try {
      const url = `${this.baseUrl}/signatures/${signatureId}/certificate.json`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error downloading certificate');
      }

      const buffer = await response.buffer();
      return buffer;
    } catch (error: any) {
      console.error('[Signaturit] Download certificate error:', error);
      return null;
    }
  }

  /**
   * Envía recordatorio a firmantes pendientes
   */
  async sendReminder(signatureId: string): Promise<boolean> {
    try {
      await this.request(`/signatures/${signatureId}/reminder.json`, 'POST');
      return true;
    } catch (error: any) {
      console.error('[Signaturit] Send reminder error:', error);
      return false;
    }
  }
}

// Instancia singleton
let signaturitClient: SignaturitClient | null = null;

/**
 * Obtiene el cliente Signaturit (lazy loading)
 */
function getSignaturitClient(): SignaturitClient {
  if (!signaturitClient) {
    if (!SIGNATURIT_API_KEY) {
      throw new Error('SIGNATURIT_API_KEY not configured');
    }
    signaturitClient = new SignaturitClient();
  }
  return signaturitClient;
}

/**
 * Verifica si Signaturit está configurado
 */
export function isSignaturitConfigured(): boolean {
  return !!SIGNATURIT_API_KEY;
}

/**
 * Verifica la firma de un webhook
 * Signaturit envía firma HMAC en header X-Signaturit-Signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    const webhookSecret = process.env.SIGNATURIT_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      console.warn('[Signaturit] SIGNATURIT_WEBHOOK_SECRET not configured');
      return true; // Permitir en desarrollo
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error: any) {
    console.error('[Signaturit] Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Servicio de Signaturit exportado
 */
export const SignaturitService = {
  createSignature: (
    pdfBuffer: Buffer,
    fileName: string,
    signers: Signer[],
    options?: SignatureOptions
  ) => getSignaturitClient().createSignature(pdfBuffer, fileName, signers, options),
  
  getSignature: (signatureId: string) => 
    getSignaturitClient().getSignature(signatureId),
  
  cancelSignature: (signatureId: string) => 
    getSignaturitClient().cancelSignature(signatureId),
  
  downloadSignedDocument: (documentId: string) => 
    getSignaturitClient().downloadSignedDocument(documentId),
  
  downloadCertificate: (signatureId: string) => 
    getSignaturitClient().downloadCertificate(signatureId),
  
  sendReminder: (signatureId: string) => 
    getSignaturitClient().sendReminder(signatureId),
  
  isConfigured: isSignaturitConfigured,
  
  verifyWebhookSignature,
};
