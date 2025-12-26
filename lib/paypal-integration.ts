/**
 * PAYPAL INTEGRATION SERVICE
 * Pagos únicos y suscripciones recurrentes
 * Alternativa a Stripe para usuarios de PayPal
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type PayPalEnvironment = 'sandbox' | 'production';

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: PayPalEnvironment;
  webhookId?: string;
  enabled: boolean;
}

export interface CreatePaymentParams {
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionParams {
  planId: string;
  subscriberEmail: string;
  subscriberName: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  id: string;
  status: string;
  approvalUrl?: string;
  amount: number;
  currency: string;
}

// ============================================================================
// PAYPAL CLIENT
// ============================================================================

export class PayPalClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(config: PayPalConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Obtener access token (OAuth 2.0)
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Si ya tenemos un token válido, usarlo
      if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`PayPal auth failed: ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      logger.error('Error getting PayPal access token:', error);
      throw error;
    }
  }

  /**
   * Headers de autenticación
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Crear orden de pago único
   */
  async createOrder(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const headers = await this.getAuthHeaders();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: params.currency || 'EUR',
              value: params.amount.toFixed(2),
            },
            description: params.description,
            custom_id: JSON.stringify(params.metadata || {}),
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          brand_name: 'INMOVA',
          shipping_preference: 'NO_SHIPPING',
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal order creation failed: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      // Encontrar URL de aprobación
      const approveLink = data.links?.find((link: any) => link.rel === 'approve');

      logger.info(`PayPal order created: ${data.id}`);

      return {
        id: data.id,
        status: data.status,
        approvalUrl: approveLink?.href,
        amount: params.amount,
        currency: params.currency || 'EUR',
      };
    } catch (error) {
      logger.error('Error creating PayPal order:', error);
      throw error;
    }
  }

  /**
   * Capturar pago (después de aprobación del usuario)
   */
  async captureOrder(orderId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal capture failed: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`PayPal order captured: ${orderId}`, { status: data.status });

      return data;
    } catch (error) {
      logger.error('Error capturing PayPal order:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de orden
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get PayPal order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting PayPal order:', error);
      throw error;
    }
  }

  /**
   * Crear plan de suscripción
   */
  async createBillingPlan(params: {
    name: string;
    description: string;
    amount: number;
    currency?: string;
    intervalUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
    intervalCount?: number;
  }): Promise<string> {
    try {
      const headers = await this.getAuthHeaders();

      const planData = {
        product_id: 'INMOVA_RENT', // Crear producto primero si no existe
        name: params.name,
        description: params.description,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: params.intervalUnit,
              interval_count: params.intervalCount || 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinito
            pricing_scheme: {
              fixed_price: {
                value: params.amount.toFixed(2),
                currency_code: params.currency || 'EUR',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 3,
        },
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create billing plan: ${error.message}`);
      }

      const data = await response.json();
      logger.info(`PayPal billing plan created: ${data.id}`);

      return data.id;
    } catch (error) {
      logger.error('Error creating billing plan:', error);
      throw error;
    }
  }

  /**
   * Crear suscripción
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<PaymentResult> {
    try {
      const headers = await this.getAuthHeaders();

      const subscriptionData = {
        plan_id: params.planId,
        subscriber: {
          name: {
            given_name: params.subscriberName.split(' ')[0],
            surname: params.subscriberName.split(' ').slice(1).join(' ') || '',
          },
          email_address: params.subscriberEmail,
        },
        application_context: {
          brand_name: 'INMOVA',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.NEXT_PUBLIC_URL}/payments/paypal/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_URL}/payments/paypal/cancel`,
        },
        custom_id: JSON.stringify(params.metadata || {}),
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      const data = await response.json();

      const approveLink = data.links?.find((link: any) => link.rel === 'approve');

      logger.info(`PayPal subscription created: ${data.id}`);

      return {
        id: data.id,
        status: data.status,
        approvalUrl: approveLink?.href,
        amount: 0, // Amount is in the plan
        currency: 'EUR',
      };
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            reason: reason || 'Customer request',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to cancel subscription: ${error.message}`);
      }

      logger.info(`PayPal subscription canceled: ${subscriptionId}`);
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de suscripción
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get subscription: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Verificar webhook signature
   */
  async verifyWebhookSignature(params: {
    webhookId: string;
    transmissionId: string;
    transmissionTime: string;
    certUrl: string;
    authAlgo: string;
    transmissionSig: string;
    webhookEvent: any;
  }): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.verification_status === 'SUCCESS';
    } catch (error) {
      logger.error('Error verifying webhook:', error);
      return false;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validar configuración de PayPal
 */
export function isPayPalConfigured(config?: PayPalConfig | null): boolean {
  if (!config) return false;
  return !!(config.clientId && config.clientSecret && config.enabled);
}

/**
 * Obtener configuración de PayPal desde variables de entorno
 */
export function getPayPalConfigFromEnv(): PayPalConfig | null {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = (process.env.PAYPAL_ENVIRONMENT || 'sandbox') as PayPalEnvironment;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    environment,
    webhookId,
    enabled: true,
  };
}

/**
 * Obtener cliente de PayPal
 */
export function getPayPalClient(config?: PayPalConfig): PayPalClient | null {
  const paypalConfig = config || getPayPalConfigFromEnv();

  if (!paypalConfig || !isPayPalConfigured(paypalConfig)) {
    return null;
  }

  return new PayPalClient(paypalConfig);
}
