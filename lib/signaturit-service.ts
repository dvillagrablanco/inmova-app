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

import logger from '@/lib/logger';
// Configuración global de Signaturit (Inmova paga)
const SIGNATURIT_API_KEY = process.env.SIGNATURIT_API_KEY || '';
const SIGNATURIT_ENV = process.env.SIGNATURIT_ENV || 'sandbox'; // 'sandbox' o 'production'
const SIGNATURIT_WEBHOOK_SECRET = process.env.SIGNATURIT_WEBHOOK_SECRET || '';

const BASE_URL =
  SIGNATURIT_ENV === 'production'
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
  body?: string;
  /** Días hasta expiración (default: 30) */
  expireDays?: number;
  /** Método de entrega: email, url, sms */
  deliveryType?: 'email' | 'url' | 'sms';
  /** Enviar copia al remitente */
  sendCopyToSender?: boolean;
  /** Requiere orden de firma (uno tras otro) */
  sequentialSignature?: boolean;
  /** Callback webhook URL */
  callbackUrl?: string;
}

/**
 * Resultado de creación de firma
 */
export interface SignatureCreationResult {
  id: string;
  status: string;
  signers: Array<{
    email: string;
    name: string;
    signUrl?: string;
  }>;
  createdAt: string;
}

/**
 * Cliente de Signaturit
 */
class SignaturitClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza una petición a la API de Signaturit
   */
  private async request(
    method: string,
    endpoint: string,
    body?: any,
    isFormData: boolean = false
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: any = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const options: any = {
      method,
      headers,
    };

    if (body) {
      if (isFormData) {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Signaturit API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Crea una solicitud de firma
   */
  async createSignature(
    pdfBuffer: Buffer,
    fileName: string,
    signers: Signer[],
    options: SignatureOptions = {}
  ): Promise<SignatureCreationResult> {
    const formData = new FormData();

    // Archivo
    formData.append('files[]', pdfBuffer, {
      filename: fileName,
      contentType: 'application/pdf',
    });

    // Firmantes
    signers.forEach((signer, index) => {
      formData.append(`recipients[${index}][email]`, signer.email);
      formData.append(`recipients[${index}][fullname]`, signer.name);
      if (signer.phone) {
        formData.append(`recipients[${index}][phone]`, signer.phone);
      }
      if (signer.requireSmsVerification) {
        formData.append(`recipients[${index}][require_sms_verification]`, '1');
      }
    });

    // Opciones
    if (options.subject) {
      formData.append('subject', options.subject);
    }
    if (options.body) {
      formData.append('body', options.body);
    }
    if (options.expireDays) {
      formData.append('expire_time', String(options.expireDays * 24 * 3600));
    }
    if (options.deliveryType) {
      formData.append('delivery_type', options.deliveryType);
    }
    if (options.sendCopyToSender) {
      formData.append('send_copy_to_sender', '1');
    }
    if (options.sequentialSignature) {
      formData.append('sequential', '1');
    }
    if (options.callbackUrl) {
      formData.append('callback_url', options.callbackUrl);
    }

    // Tipo de firma
    formData.append('type', options.type || SignatureType.SIMPLE);

    const result = await this.request('POST', '/signatures.json', formData, true);
    return result;
  }

  /**
   * Obtiene el estado de una firma
   */
  async getSignature(signatureId: string): Promise<any> {
    return await this.request('GET', `/signatures/${signatureId}.json`);
  }

  /**
   * Cancela una firma pendiente
   */
  async cancelSignature(signatureId: string): Promise<any> {
    return await this.request('PATCH', `/signatures/${signatureId}/cancel.json`);
  }

  /**
   * Descarga el documento firmado
   */
  async downloadSignedDocument(signatureId: string, documentId: string): Promise<Buffer> {
    const url = `${this.baseUrl}/signatures/${signatureId}/documents/${documentId}/download`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error downloading document: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Descarga el certificado de la firma
   */
  async downloadCertificate(signatureId: string): Promise<Buffer> {
    const url = `${this.baseUrl}/signatures/${signatureId}/certificate/download`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error downloading certificate: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Cliente singleton
const signaturitClient = new SignaturitClient(SIGNATURIT_API_KEY, BASE_URL);

/**
 * Crea una solicitud de firma
 * 
 * @param pdfBuffer - Buffer del PDF a firmar
 * @param fileName - Nombre del archivo
 * @param signers - Array de firmantes
 * @param options - Opciones de firma
 * @returns Resultado con ID de la firma y URLs
 */
export async function createSignature(
  pdfBuffer: Buffer,
  fileName: string,
  signers: Signer[],
  options: SignatureOptions = {}
): Promise<SignatureCreationResult> {
  if (!isSignaturitConfigured()) {
    throw new Error('Signaturit no está configurado. Configure SIGNATURIT_API_KEY en .env');
  }

  return await signaturitClient.createSignature(pdfBuffer, fileName, signers, options);
}

/**
 * Obtiene el estado de una firma
 * 
 * @param signatureId - ID de la firma
 * @returns Estado de la firma
 */
export async function getSignature(signatureId: string): Promise<any> {
  return await signaturitClient.getSignature(signatureId);
}

/**
 * Cancela una firma pendiente
 * 
 * @param signatureId - ID de la firma
 * @returns Resultado de la cancelación
 */
export async function cancelSignature(signatureId: string): Promise<any> {
  return await signaturitClient.cancelSignature(signatureId);
}

/**
 * Descarga el documento firmado
 * 
 * @param signatureId - ID de la firma
 * @param documentId - ID del documento
 * @returns Buffer del PDF firmado
 */
export async function downloadSignedDocument(signatureId: string, documentId: string): Promise<Buffer> {
  return await signaturitClient.downloadSignedDocument(signatureId, documentId);
}

/**
 * Descarga el certificado de la firma
 * 
 * @param signatureId - ID de la firma
 * @returns Buffer del certificado
 */
export async function downloadCertificate(signatureId: string): Promise<Buffer> {
  return await signaturitClient.downloadCertificate(signatureId);
}

/**
 * Verifica la firma de un webhook de Signaturit
 * 
 * @param bodyText - Texto del body del request
 * @param signature - Firma del header X-Signaturit-Signature
 * @returns true si la firma es válida
 */
export function verifyWebhookSignature(bodyText: string, signature: string): boolean {
  if (!SIGNATURIT_WEBHOOK_SECRET) {
    logger.warn('[Signaturit] Webhook secret no configurado. Saltando verificación.');
    return true;
  }

  const computedSignature = crypto
    .createHmac('sha256', SIGNATURIT_WEBHOOK_SECRET)
    .update(bodyText)
    .digest('hex');

  return computedSignature === signature;
}

/**
 * Verifica si Signaturit está configurado
 */
export function isSignaturitConfigured(): boolean {
  return !!SIGNATURIT_API_KEY;
}
