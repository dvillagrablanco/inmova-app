/**
 * BIZUM INTEGRATION SERVICE
 * Sistema de pagos instantáneos español (P2P)
 * Integración a través de pasarelas bancarias
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BizumConfig {
  merchantId: string;
  secretKey: string;
  bankProvider: 'redsys' | 'santander' | 'bbva' | 'caixabank'; // Bancos que soportan Bizum
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

export interface CreateBizumPaymentParams {
  amount: number;
  phoneNumber: string; // Número de teléfono del pagador
  concept: string;
  reference: string;
  notificationUrl?: string;
  metadata?: Record<string, any>;
}

export interface BizumPaymentResult {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount: number;
  phoneNumber: string;
  reference: string;
  transactionId?: string;
  errorMessage?: string;
}

// ============================================================================
// BIZUM CLIENT (Vía Redsys como pasarela principal)
// ============================================================================

export class BizumClient {
  private merchantId: string;
  private secretKey: string;
  private bankProvider: string;
  private baseUrl: string;

  constructor(config: BizumConfig) {
    this.merchantId = config.merchantId;
    this.secretKey = config.secretKey;
    this.bankProvider = config.bankProvider;

    // URLs según entorno
    this.baseUrl =
      config.environment === 'production'
        ? this.getProductionUrl(config.bankProvider)
        : this.getSandboxUrl(config.bankProvider);
  }

  private getProductionUrl(provider: string): string {
    const urls: Record<string, string> = {
      redsys: 'https://sis.redsys.es/sis/rest/trataPeticionREST',
      santander: 'https://api.santander.com/bizum/v1',
      bbva: 'https://apis.bbva.com/bizum/v1',
      caixabank: 'https://api.caixabank.com/bizum/v1',
    };
    return urls[provider] || urls.redsys;
  }

  private getSandboxUrl(provider: string): string {
    const urls: Record<string, string> = {
      redsys: 'https://sis-t.redsys.es:25443/sis/rest/trataPeticionREST',
      santander: 'https://api-sandbox.santander.com/bizum/v1',
      bbva: 'https://apis-sandbox.bbva.com/bizum/v1',
      caixabank: 'https://api-sandbox.caixabank.com/bizum/v1',
    };
    return urls[provider] || urls.redsys;
  }

  /**
   * Normalizar número de teléfono español
   */
  private normalizePhoneNumber(phone: string): string {
    // Eliminar espacios y caracteres especiales
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

    // Si empieza con +34, quitar el prefijo
    if (normalized.startsWith('+34')) {
      normalized = normalized.substring(3);
    }

    // Si empieza con 34, quitar el prefijo
    if (normalized.startsWith('34') && normalized.length > 9) {
      normalized = normalized.substring(2);
    }

    // Validar que tenga 9 dígitos
    if (normalized.length !== 9) {
      throw new Error('Invalid Spanish phone number. Must be 9 digits.');
    }

    return normalized;
  }

  /**
   * Generar firma HMAC-SHA256 para Redsys
   */
  private generateSignature(params: string): string {
    const crypto = require('crypto');
    const key = Buffer.from(this.secretKey, 'base64');
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(params);
    return hmac.digest('base64');
  }

  /**
   * Crear solicitud de pago Bizum
   */
  async createPayment(params: CreateBizumPaymentParams): Promise<BizumPaymentResult> {
    try {
      const phoneNumber = this.normalizePhoneNumber(params.phoneNumber);

      // Formato específico según el proveedor
      if (this.bankProvider === 'redsys') {
        return await this.createRedsysBizumPayment({
          ...params,
          phoneNumber,
        });
      }

      // Otros proveedores seguirían un flujo similar
      throw new Error(`Provider ${this.bankProvider} not fully implemented yet`);
    } catch (error) {
      logger.error('Error creating Bizum payment:', error);
      throw error;
    }
  }

  /**
   * Crear pago Bizum vía Redsys
   */
  private async createRedsysBizumPayment(
    params: CreateBizumPaymentParams & { phoneNumber: string }
  ): Promise<BizumPaymentResult> {
    try {
      const merchantParameters = {
        DS_MERCHANT_AMOUNT: (params.amount * 100).toString(), // Céntimos
        DS_MERCHANT_ORDER: params.reference,
        DS_MERCHANT_MERCHANTCODE: this.merchantId,
        DS_MERCHANT_CURRENCY: '978', // EUR
        DS_MERCHANT_TRANSACTIONTYPE: '0', // Autorización
        DS_MERCHANT_TERMINAL: '1',
        DS_MERCHANT_MERCHANTURL: params.notificationUrl || '',
        DS_MERCHANT_PAYMETHODS: 'z', // 'z' = Bizum
        DS_MERCHANT_PRODUCTDESCRIPTION: params.concept,
        DS_MERCHANT_BIZUM_PHONENUMBER: params.phoneNumber,
      };

      // Codificar en Base64
      const merchantParamsB64 = Buffer.from(JSON.stringify(merchantParameters)).toString('base64');

      // Generar firma
      const signature = this.generateSignature(merchantParamsB64);

      // Preparar petición
      const requestData = {
        Ds_SignatureVersion: 'HMAC_SHA256_V1',
        Ds_MerchantParameters: merchantParamsB64,
        Ds_Signature: signature,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Redsys Bizum API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Decodificar respuesta
      const responseParams = JSON.parse(
        Buffer.from(data.Ds_MerchantParameters, 'base64').toString('utf-8')
      );

      logger.info(`Bizum payment created: ${params.reference}`, {
        phoneNumber: params.phoneNumber,
        amount: params.amount,
      });

      return {
        id: responseParams.Ds_Order || params.reference,
        status: this.mapRedsysStatus(responseParams.Ds_Response),
        amount: params.amount,
        phoneNumber: params.phoneNumber,
        reference: params.reference,
        transactionId: responseParams.Ds_AuthorisationCode,
        errorMessage: responseParams.Ds_ErrorCode
          ? `Error ${responseParams.Ds_ErrorCode}`
          : undefined,
      };
    } catch (error) {
      logger.error('Error creating Redsys Bizum payment:', error);
      throw error;
    }
  }

  /**
   * Mapear códigos de respuesta de Redsys a estados
   */
  private mapRedsysStatus(responseCode: string): 'pending' | 'completed' | 'failed' | 'expired' {
    const code = parseInt(responseCode);

    if (code >= 0 && code <= 99) {
      return 'completed'; // Transacción autorizada
    } else if (code === 9915) {
      return 'pending'; // Pendiente de confirmación
    } else if (code === 9998) {
      return 'expired'; // Expirado
    } else {
      return 'failed'; // Denegada o error
    }
  }

  /**
   * Consultar estado de pago Bizum
   */
  async getPaymentStatus(reference: string): Promise<BizumPaymentResult | null> {
    try {
      // Implementación depende del proveedor
      // Por ahora, retornar null si no está implementado
      logger.warn(`getPaymentStatus not implemented for ${this.bankProvider}`);
      return null;
    } catch (error) {
      logger.error('Error getting Bizum payment status:', error);
      return null;
    }
  }

  /**
   * Procesar notificación webhook de Bizum
   */
  async processWebhook(webhookData: any): Promise<BizumPaymentResult> {
    try {
      // Verificar firma
      const merchantParamsB64 = webhookData.Ds_MerchantParameters;
      const receivedSignature = webhookData.Ds_Signature;
      const calculatedSignature = this.generateSignature(merchantParamsB64);

      if (receivedSignature !== calculatedSignature) {
        throw new Error('Invalid webhook signature');
      }

      // Decodificar parámetros
      const params = JSON.parse(Buffer.from(merchantParamsB64, 'base64').toString('utf-8'));

      logger.info(`Bizum webhook received: ${params.Ds_Order}`, {
        response: params.Ds_Response,
      });

      return {
        id: params.Ds_Order,
        status: this.mapRedsysStatus(params.Ds_Response),
        amount: parseInt(params.Ds_Amount) / 100,
        phoneNumber: params.Ds_Merchant_BizumPhoneNumber || '',
        reference: params.Ds_Order,
        transactionId: params.Ds_AuthorisationCode,
      };
    } catch (error) {
      logger.error('Error processing Bizum webhook:', error);
      throw error;
    }
  }

  /**
   * Solicitar reembolso
   */
  async refund(params: {
    originalReference: string;
    amount: number;
    reason?: string;
  }): Promise<{ success: boolean; refundId?: string; errorMessage?: string }> {
    try {
      const merchantParameters = {
        DS_MERCHANT_AMOUNT: (params.amount * 100).toString(),
        DS_MERCHANT_ORDER: params.originalReference,
        DS_MERCHANT_MERCHANTCODE: this.merchantId,
        DS_MERCHANT_CURRENCY: '978',
        DS_MERCHANT_TRANSACTIONTYPE: '3', // Devolución
        DS_MERCHANT_TERMINAL: '1',
      };

      const merchantParamsB64 = Buffer.from(JSON.stringify(merchantParameters)).toString('base64');
      const signature = this.generateSignature(merchantParamsB64);

      const requestData = {
        Ds_SignatureVersion: 'HMAC_SHA256_V1',
        Ds_MerchantParameters: merchantParamsB64,
        Ds_Signature: signature,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.statusText}`);
      }

      const data = await response.json();
      const responseParams = JSON.parse(
        Buffer.from(data.Ds_MerchantParameters, 'base64').toString('utf-8')
      );

      const success =
        parseInt(responseParams.Ds_Response) >= 0 && parseInt(responseParams.Ds_Response) <= 99;

      logger.info(`Bizum refund ${success ? 'successful' : 'failed'}: ${params.originalReference}`);

      return {
        success,
        refundId: responseParams.Ds_AuthorisationCode,
        errorMessage: success ? undefined : `Error ${responseParams.Ds_ErrorCode}`,
      };
    } catch (error) {
      logger.error('Error processing refund:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validar configuración de Bizum
 */
export function isBizumConfigured(config?: BizumConfig | null): boolean {
  if (!config) return false;
  return !!(config.merchantId && config.secretKey && config.bankProvider && config.enabled);
}

/**
 * Obtener configuración de Bizum desde variables de entorno
 */
export function getBizumConfigFromEnv(): BizumConfig | null {
  const merchantId = process.env.BIZUM_MERCHANT_ID;
  const secretKey = process.env.BIZUM_SECRET_KEY;
  const bankProvider = (process.env.BIZUM_BANK_PROVIDER || 'redsys') as BizumConfig['bankProvider'];
  const environment = (process.env.BIZUM_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  if (!merchantId || !secretKey) {
    return null;
  }

  return {
    merchantId,
    secretKey,
    bankProvider,
    environment,
    enabled: true,
  };
}

/**
 * Obtener cliente de Bizum
 */
export function getBizumClient(config?: BizumConfig): BizumClient | null {
  const bizumConfig = config || getBizumConfigFromEnv();

  if (!bizumConfig || !isBizumConfigured(bizumConfig)) {
    return null;
  }

  return new BizumClient(bizumConfig);
}

/**
 * Validar número de teléfono español
 */
export function isValidSpanishPhone(phone: string): boolean {
  const normalized = phone.replace(/[\s\-\(\)]/g, '');
  const regex = /^(\+34|34)?[6789]\d{8}$/;
  return regex.test(normalized);
}
