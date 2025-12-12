/**
 * DocuSign Integration Service (REST API)
 * 
 * Este servicio maneja toda la integración con DocuSign para firma digital de documentos.
 * Utiliza JWT (JSON Web Token) para autenticación con la API de DocuSign.
 * Implementación usando fetch directo a la API REST para evitar problemas de webpack.
 * 
 * Funciones principales:
 * - Autenticación JWT con DocuSign
 * - Creación de sobres (envelopes) para firma
 * - Obtención del estado de documentos
 * - Descarga de documentos firmados
 * - Envío de recordatorios a firmantes
 * - Validación de webhooks
 */

import jwt from 'jsonwebtoken';
import logger, { logError } from '@/lib/logger';

// ============================================
// CONFIGURACIÓN
// ============================================

const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY!;
const USER_ID = process.env.DOCUSIGN_USER_ID!;
const ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID!;
const PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY!;
const BASE_PATH = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';
const OAUTH_BASE_PATH = process.env.DOCUSIGN_OAUTH_BASE_PATH || 'https://account-d.docusign.com';

// Scopes necesarios para la aplicación
const SCOPES = [
  'signature',
  'impersonation'
];

// ============================================
// TIPOS
// ============================================

export interface DocuSignSigner {
  nombre: string;
  email: string;
  orden: number;
  rol?: string;
}

export interface DocuSignDocument {
  nombre: string;
  pdfBase64: string; // PDF codificado en base64
}

export interface CreateEnvelopeOptions {
  documento: DocuSignDocument;
  firmantes: DocuSignSigner[];
  asunto: string;
  mensaje?: string;
  ordenSecuencial?: boolean;
  diasExpiracion?: number;
}

export interface EnvelopeStatus {
  envelopeId: string;
  estado: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  fechaCreacion: Date;
  fechaEnvio?: Date;
  fechaCompletado?: Date;
  firmantes: FirmanteStatus[];
}

export interface FirmanteStatus {
  nombre: string;
  email: string;
  estado: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined';
  fechaEnvio?: Date;
  fechaFirma?: Date;
  ipFirma?: string;
}

// ============================================
// CLASE PRINCIPAL: DocuSignService
// ============================================

class DocuSignService {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    // No se necesita inicialización
  }

  // ============================================
  // AUTENTICACIÓN JWT
  // ============================================

  /**
   * Obtiene un access token válido usando JWT.
   * Si el token actual es válido, lo reutiliza.
   * Si no, solicita uno nuevo.
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Si ya tenemos un token válido, lo reutilizamos
      if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      logger.info('[DocuSign] Solicitando nuevo access token...');

      // Formatear la clave privada (remover quotes si existen)
      let privateKey = PRIVATE_KEY;
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }

      // Reemplazar \n literals con newlines reales
      privateKey = privateKey.replace(/\\n/g, '\n');

      // Crear JWT
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: INTEGRATION_KEY,
        sub: USER_ID,
        aud: OAUTH_BASE_PATH,
        iat: now,
        exp: now + 3600, // 1 hora
        scope: SCOPES.join(' ')
      };

      const jwtToken = jwt.sign(jwtPayload, privateKey, {
        algorithm: 'RS256'
      });

      // Solicitar token de acceso usando el JWT
      const tokenUrl = `${OAUTH_BASE_PATH}/oauth/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error al obtener token: ${response.status} ${error}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Calcular cuándo expira el token (con 5 minutos de margen)
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiresAt = new Date(Date.now() + (expiresIn - 300) * 1000);

      logger.info('[DocuSign] Access token obtenido exitosamente');
      return this.accessToken;
    } catch (error: any) {
      logError(error, { message: '[DocuSign] Error al obtener access token' });
      throw new Error(`Error de autenticación con DocuSign: ${error.message}`);
    }
  }

  // ============================================
  // CREACIÓN DE SOBRES (ENVELOPES)
  // ============================================

  /**
   * Crea un sobre (envelope) en DocuSign y lo envía para firma.
   * 
   * @param options Opciones para crear el sobre
   * @returns ID del sobre creado y URL del documento
   */
  async createEnvelope(options: CreateEnvelopeOptions): Promise<{
    envelopeId: string;
    estado: string;
    uri: string;
  }> {
    try {
      const token = await this.getAccessToken();

      logger.info('[DocuSign] Creando sobre para firma...', {
        asunto: options.asunto,
        firmantes: options.firmantes.length,
        ordenSecuencial: options.ordenSecuencial
      });

      // Preparar el documento
      const document = {
        documentBase64: options.documento.pdfBase64,
        name: options.documento.nombre,
        fileExtension: 'pdf',
        documentId: '1'
      };

      // Preparar los firmantes
      const signers = options.firmantes.map((firmante, index) => ({
        email: firmante.email,
        name: firmante.nombre,
        recipientId: (index + 1).toString(),
        routingOrder: options.ordenSecuencial ? firmante.orden.toString() : '1',
        tabs: {
          signHereTabs: [{
            documentId: '1',
            pageNumber: '1',
            xPosition: '100',
            yPosition: '150',
            tabLabel: `Firma_${firmante.nombre}`,
            optional: 'false'
          }]
        }
      }));

      // Crear el envelope
      const envelopeDefinition = {
        emailSubject: options.asunto,
        emailBlurb: options.mensaje || 'Por favor, firme el documento adjunto.',
        documents: [document],
        recipients: {
          signers: signers
        },
        status: 'sent',
        notification: {
          useAccountDefaults: 'false',
          reminders: {
            reminderEnabled: 'true',
            reminderDelay: '3',
            reminderFrequency: '3'
          },
          expirations: {
            expireEnabled: 'true',
            expireAfter: (options.diasExpiracion || 30).toString(),
            expireWarn: '5'
          }
        }
      };

      // Llamar a la API REST de DocuSign
      const url = `${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}/envelopes`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error al crear envelope: ${response.status} ${error}`);
      }

      const result = await response.json();

      logger.info('[DocuSign] Sobre creado exitosamente', {
        envelopeId: result.envelopeId,
        estado: result.status
      });

      return {
        envelopeId: result.envelopeId,
        estado: result.status,
        uri: result.uri || `${BASE_PATH}/envelopes/${result.envelopeId}`
      };
    } catch (error: any) {
      logError(error, { message: '[DocuSign] Error al crear sobre' });
      throw new Error(`Error al crear sobre en DocuSign: ${error.message}`);
    }
  }

  // ============================================
  // OBTENER ESTADO DE UN SOBRE
  // ============================================

  /**
   * Obtiene el estado actual de un sobre y sus firmantes.
   * 
   * @param envelopeId ID del sobre en DocuSign
   * @returns Estado del sobre y sus firmantes
   */
  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus> {
    try {
      const token = await this.getAccessToken();

      // Obtener información del sobre
      const envelopeUrl = `${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}`;
      const envelopeResponse = await fetch(envelopeUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!envelopeResponse.ok) {
        throw new Error(`Error al obtener envelope: ${envelopeResponse.status}`);
      }

      const envelope = await envelopeResponse.json();

      // Obtener información de los firmantes
      const recipientsUrl = `${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/recipients`;
      const recipientsResponse = await fetch(recipientsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!recipientsResponse.ok) {
        throw new Error(`Error al obtener recipients: ${recipientsResponse.status}`);
      }

      const recipients = await recipientsResponse.json();

      const firmantes: FirmanteStatus[] = (recipients.signers || []).map((signer: any) => ({
        nombre: signer.name || '',
        email: signer.email || '',
        estado: this.mapDocuSignStatus(signer.status),
        fechaEnvio: signer.sentDateTime ? new Date(signer.sentDateTime) : undefined,
        fechaFirma: signer.signedDateTime ? new Date(signer.signedDateTime) : undefined,
        ipFirma: signer.ipAddress
      }));

      return {
        envelopeId: envelope.envelopeId,
        estado: this.mapDocuSignStatus(envelope.status),
        fechaCreacion: new Date(envelope.createdDateTime),
        fechaEnvio: envelope.sentDateTime ? new Date(envelope.sentDateTime) : undefined,
        fechaCompletado: envelope.completedDateTime ? new Date(envelope.completedDateTime) : undefined,
        firmantes
      };
    } catch (error: any) {
      logError(error, { message: '[DocuSign] Error al obtener estado del sobre' });
      throw new Error(`Error al obtener estado del sobre: ${error.message}`);
    }
  }

  // ============================================
  // DESCARGAR DOCUMENTO FIRMADO
  // ============================================

  /**
   * Descarga el documento firmado de un sobre.
   * 
   * @param envelopeId ID del sobre
   * @returns Buffer del PDF firmado
   */
  async downloadSignedDocument(envelopeId: string): Promise<Buffer> {
    try {
      const token = await this.getAccessToken();

      logger.info('[DocuSign] Descargando documento firmado...', { envelopeId });

      // Descargar el documento combinado
      const url = `${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/documents/combined`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error al descargar documento: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      logger.info('[DocuSign] Documento descargado exitosamente');
      return buffer;
    } catch (error: any) {
      logError(error, { message: '[DocuSign] Error al descargar documento' });
      throw new Error(`Error al descargar documento firmado: ${error.message}`);
    }
  }

  // ============================================
  // ENVIAR RECORDATORIO
  // ============================================

  /**
   * Envía un recordatorio a los firmantes pendientes.
   * 
   * @param envelopeId ID del sobre
   */
  async sendReminder(envelopeId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      logger.info('[DocuSign] Enviando recordatorio...', { envelopeId });

      // Actualizar la configuración de notificaciones del envelope
      const url = `${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification: {
            useAccountDefaults: 'false',
            reminders: {
              reminderEnabled: 'true',
              reminderDelay: '0',
              reminderFrequency: '3'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Error al enviar recordatorio: ${response.status}`);
      }

      logger.info('[DocuSign] Recordatorio enviado exitosamente');
    } catch (error: any) {
      logError(error, { message: '[DocuSign] Error al enviar recordatorio' });
      throw new Error(`Error al enviar recordatorio: ${error.message}`);
    }
  }

  // ============================================
  // VALIDACIÓN DE WEBHOOKS
  // ============================================

  /**
   * Valida la firma HMAC de un webhook de DocuSign.
   * 
   * @param payload Cuerpo del webhook
   * @param signature Firma HMAC del header
   * @returns true si la firma es válida
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const secret = process.env.DOCUSIGN_WEBHOOK_SECRET || '';
      
      if (!secret) {
        logger.warn('[DocuSign] DOCUSIGN_WEBHOOK_SECRET no está configurado');
        return true; // En desarrollo, aceptamos sin validar
      }

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('base64');

      return signature === expectedSignature;
    } catch (error: any) {
      logError(error, { message: '[DocuSign] Error al validar firma de webhook' });
      return false;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Mapea los estados de DocuSign a nuestro sistema.
   */
  private mapDocuSignStatus(docusignStatus: string): any {
    const statusMap: { [key: string]: string } = {
      'created': 'created',
      'sent': 'sent',
      'delivered': 'delivered',
      'signed': 'signed',
      'completed': 'completed',
      'declined': 'declined',
      'voided': 'voided'
    };

    return statusMap[docusignStatus.toLowerCase()] || docusignStatus;
  }
}

// Exportar instancia singleton
export const docuSignService = new DocuSignService();
export default docuSignService;
