/**
 * GOCARDLESS INTEGRATION SERVICE
 * Direct Debit (domiciliaciones bancarias) para Europa, UK, USA, Canada, Australia
 * SEPA, BACS, ACH, Autogiro, BECS, PAD, Betalingsservice
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GoCardlessConfig {
  accessToken: string;
  environment: 'sandbox' | 'live';
  enabled: boolean;
}

export interface GCCustomer {
  id?: string;
  email: string;
  givenName: string;
  familyName: string;
  companyName?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  countryCode: string; // ISO 3166-1 alpha-2
  language?: string;
  phoneNumber?: string;
  metadata?: Record<string, string>;
}

export interface GCBankAccount {
  id?: string;
  accountHolderName: string;
  accountNumberEnding?: string;
  bankName?: string;
  countryCode: string;
  currency: string;
  enabled?: boolean;
  metadata?: Record<string, string>;
}

export interface GCMandate {
  id?: string;
  reference: string;
  status?: 'pending_customer_approval' | 'pending_submission' | 'submitted' | 'active' | 'failed' | 'cancelled' | 'expired';
  scheme: 'bacs' | 'sepa_core' | 'ach' | 'autogiro' | 'becs' | 'pad' | 'betalingsservice';
  nextPossibleChargeDate?: string;
  paymentsRequireApproval?: boolean;
  metadata?: Record<string, string>;
  customerId?: string;
  customerBankAccountId?: string;
}

export interface GCPayment {
  id?: string;
  amount: number; // En centavos/céntimos
  currency: string;
  description: string;
  chargeDate?: string; // YYYY-MM-DD
  reference?: string;
  status?: 'pending_customer_approval' | 'pending_submission' | 'submitted' | 'confirmed' | 'paid_out' | 'cancelled' | 'customer_approval_denied' | 'failed' | 'charged_back';
  amountRefunded?: number;
  metadata?: Record<string, string>;
  mandateId: string;
}

export interface GCSubscription {
  id?: string;
  amount: number; // En centavos/céntimos
  currency: string;
  name: string;
  interval: number; // Número de unidades
  intervalUnit: 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number; // Para monthly (1-28)
  month?: number; // Para yearly (1-12)
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: 'pending_customer_approval' | 'customer_approval_denied' | 'active' | 'finished' | 'cancelled' | 'paused';
  metadata?: Record<string, string>;
  mandateId: string;
}

export interface GCRefund {
  id?: string;
  amount: number;
  currency: string;
  reference?: string;
  metadata?: Record<string, string>;
  paymentId: string;
}

// ============================================================================
// GOCARDLESS CLIENT
// ============================================================================

export class GoCardlessClient {
  private accessToken: string;
  private baseUrl: string;
  private version: string = '2015-07-06'; // API version

  constructor(config: GoCardlessConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.environment === 'live'
      ? 'https://api.gocardless.com'
      : 'https://api-sandbox.gocardless.com';
  }

  /**
   * Headers de autenticación
   */
  private getAuthHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'GoCardless-Version': this.version,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Crear cliente
   */
  async createCustomer(customer: GCCustomer): Promise<GCCustomer> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          customers: {
            email: customer.email,
            given_name: customer.givenName,
            family_name: customer.familyName,
            company_name: customer.companyName,
            address_line1: customer.addressLine1,
            city: customer.city,
            postal_code: customer.postalCode,
            country_code: customer.countryCode,
            language: customer.language,
            phone_number: customer.phoneNumber,
            metadata: customer.metadata,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GoCardless create customer failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`GoCardless customer created: ${data.customers.id}`);

      return {
        id: data.customers.id,
        ...customer,
      };
    } catch (error) {
      logger.error('Error creating GoCardless customer:', error);
      throw error;
    }
  }

  /**
   * Obtener cliente
   */
  async getCustomer(customerId: string): Promise<GCCustomer> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get customer: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapCustomer(data.customers);
    } catch (error) {
      logger.error('Error getting GoCardless customer:', error);
      throw error;
    }
  }

  /**
   * Listar clientes
   */
  async listCustomers(limit: number = 50): Promise<GCCustomer[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/customers?limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list customers: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.customers?.length || 0} GoCardless customers`);

      return (data.customers || []).map((c: any) => this.mapCustomer(c));
    } catch (error) {
      logger.error('Error listing GoCardless customers:', error);
      return [];
    }
  }

  /**
   * Mapear cliente de GoCardless
   */
  private mapCustomer(gcCustomer: any): GCCustomer {
    return {
      id: gcCustomer.id,
      email: gcCustomer.email,
      givenName: gcCustomer.given_name,
      familyName: gcCustomer.family_name,
      companyName: gcCustomer.company_name,
      addressLine1: gcCustomer.address_line1,
      city: gcCustomer.city,
      postalCode: gcCustomer.postal_code,
      countryCode: gcCustomer.country_code,
      language: gcCustomer.language,
      phoneNumber: gcCustomer.phone_number,
      metadata: gcCustomer.metadata,
    };
  }

  /**
   * Crear cuenta bancaria (Customer Bank Account)
   */
  async createBankAccount(params: {
    customerId: string;
    accountHolderName: string;
    accountNumber?: string;
    branchCode?: string;
    iban?: string;
    countryCode: string;
    currency: string;
    metadata?: Record<string, string>;
  }): Promise<GCBankAccount> {
    try {
      const payload: any = {
        customer_bank_accounts: {
          account_holder_name: params.accountHolderName,
          country_code: params.countryCode,
          currency: params.currency,
          metadata: params.metadata,
          links: {
            customer: params.customerId,
          },
        },
      };

      // IBAN (para SEPA)
      if (params.iban) {
        payload.customer_bank_accounts.iban = params.iban;
      }
      // Account Number + Branch Code (para BACS, ACH, etc.)
      else if (params.accountNumber) {
        payload.customer_bank_accounts.account_number = params.accountNumber;
        if (params.branchCode) {
          payload.customer_bank_accounts.branch_code = params.branchCode;
        }
      }

      const response = await fetch(`${this.baseUrl}/customer_bank_accounts`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create bank account: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`GoCardless bank account created: ${data.customer_bank_accounts.id}`);

      return {
        id: data.customer_bank_accounts.id,
        accountHolderName: params.accountHolderName,
        accountNumberEnding: data.customer_bank_accounts.account_number_ending,
        bankName: data.customer_bank_accounts.bank_name,
        countryCode: params.countryCode,
        currency: params.currency,
        enabled: data.customer_bank_accounts.enabled,
        metadata: params.metadata,
      };
    } catch (error) {
      logger.error('Error creating GoCardless bank account:', error);
      throw error;
    }
  }

  /**
   * Crear mandato (autorización de domiciliación)
   */
  async createMandate(params: {
    customerBankAccountId: string;
    scheme: GCMandate['scheme'];
    reference?: string;
    metadata?: Record<string, string>;
  }): Promise<GCMandate> {
    try {
      const response = await fetch(`${this.baseUrl}/mandates`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          mandates: {
            scheme: params.scheme,
            reference: params.reference,
            metadata: params.metadata,
            links: {
              customer_bank_account: params.customerBankAccountId,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create mandate: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`GoCardless mandate created: ${data.mandates.id}`);

      return {
        id: data.mandates.id,
        reference: data.mandates.reference,
        status: data.mandates.status,
        scheme: data.mandates.scheme,
        nextPossibleChargeDate: data.mandates.next_possible_charge_date,
        metadata: params.metadata,
        customerBankAccountId: params.customerBankAccountId,
      };
    } catch (error) {
      logger.error('Error creating GoCardless mandate:', error);
      throw error;
    }
  }

  /**
   * Obtener mandato
   */
  async getMandate(mandateId: string): Promise<GCMandate> {
    try {
      const response = await fetch(`${this.baseUrl}/mandates/${mandateId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get mandate: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapMandate(data.mandates);
    } catch (error) {
      logger.error('Error getting GoCardless mandate:', error);
      throw error;
    }
  }

  /**
   * Mapear mandato
   */
  private mapMandate(gcMandate: any): GCMandate {
    return {
      id: gcMandate.id,
      reference: gcMandate.reference,
      status: gcMandate.status,
      scheme: gcMandate.scheme,
      nextPossibleChargeDate: gcMandate.next_possible_charge_date,
      paymentsRequireApproval: gcMandate.payments_require_approval,
      metadata: gcMandate.metadata,
    };
  }

  /**
   * Crear pago (cobro único)
   */
  async createPayment(payment: GCPayment): Promise<GCPayment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          payments: {
            amount: payment.amount,
            currency: payment.currency,
            description: payment.description,
            charge_date: payment.chargeDate,
            reference: payment.reference,
            metadata: payment.metadata,
            links: {
              mandate: payment.mandateId,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create payment: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`GoCardless payment created: ${data.payments.id}`);

      return {
        ...payment,
        id: data.payments.id,
        status: data.payments.status,
        chargeDate: data.payments.charge_date,
      };
    } catch (error) {
      logger.error('Error creating GoCardless payment:', error);
      throw error;
    }
  }

  /**
   * Obtener pago
   */
  async getPayment(paymentId: string): Promise<GCPayment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapPayment(data.payments);
    } catch (error) {
      logger.error('Error getting GoCardless payment:', error);
      throw error;
    }
  }

  /**
   * Mapear pago
   */
  private mapPayment(gcPayment: any): GCPayment {
    return {
      id: gcPayment.id,
      amount: gcPayment.amount,
      currency: gcPayment.currency,
      description: gcPayment.description,
      chargeDate: gcPayment.charge_date,
      reference: gcPayment.reference,
      status: gcPayment.status,
      amountRefunded: gcPayment.amount_refunded,
      metadata: gcPayment.metadata,
      mandateId: gcPayment.links.mandate,
    };
  }

  /**
   * Cancelar pago
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/actions/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data: {} }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel payment: ${response.statusText}`);
      }

      logger.info(`GoCardless payment cancelled: ${paymentId}`);
      return true;
    } catch (error) {
      logger.error('Error cancelling GoCardless payment:', error);
      return false;
    }
  }

  /**
   * Crear suscripción (cobros recurrentes)
   */
  async createSubscription(subscription: GCSubscription): Promise<GCSubscription> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          subscriptions: {
            amount: subscription.amount,
            currency: subscription.currency,
            name: subscription.name,
            interval: subscription.interval,
            interval_unit: subscription.intervalUnit,
            day_of_month: subscription.dayOfMonth,
            month: subscription.month,
            start_date: subscription.startDate,
            end_date: subscription.endDate,
            metadata: subscription.metadata,
            links: {
              mandate: subscription.mandateId,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create subscription: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`GoCardless subscription created: ${data.subscriptions.id}`);

      return {
        ...subscription,
        id: data.subscriptions.id,
        status: data.subscriptions.status,
      };
    } catch (error) {
      logger.error('Error creating GoCardless subscription:', error);
      throw error;
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}/actions/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data: {} }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel subscription: ${response.statusText}`);
      }

      logger.info(`GoCardless subscription cancelled: ${subscriptionId}`);
      return true;
    } catch (error) {
      logger.error('Error cancelling GoCardless subscription:', error);
      return false;
    }
  }

  /**
   * Crear reembolso
   */
  async createRefund(refund: GCRefund): Promise<GCRefund> {
    try {
      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          refunds: {
            amount: refund.amount,
            reference: refund.reference,
            metadata: refund.metadata,
            links: {
              payment: refund.paymentId,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create refund: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`GoCardless refund created: ${data.refunds.id}`);

      return {
        ...refund,
        id: data.refunds.id,
      };
    } catch (error) {
      logger.error('Error creating GoCardless refund:', error);
      throw error;
    }
  }

  /**
   * Verificar webhook signature
   */
  verifyWebhookSignature(params: {
    webhookSignature: string;
    webhookBody: string;
    webhookSecret: string;
  }): boolean {
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', params.webhookSecret);
      hmac.update(params.webhookBody);
      const calculatedSignature = hmac.digest('hex');

      return calculatedSignature === params.webhookSignature;
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isGoCardlessConfigured(config?: GoCardlessConfig | null): boolean {
  if (!config) return false;
  return !!(
    config.accessToken &&
    config.enabled
  );
}

export function getGoCardlessClient(config?: GoCardlessConfig): GoCardlessClient | null {
  if (!config || !isGoCardlessConfigured(config)) {
    return null;
  }

  return new GoCardlessClient(config);
}

/**
 * Determinar el scheme adecuado según el país
 */
export function getSupportedScheme(countryCode: string): GCMandate['scheme'] | null {
  const schemeMap: Record<string, GCMandate['scheme']> = {
    // SEPA (Eurozona)
    'AT': 'sepa_core', 'BE': 'sepa_core', 'CY': 'sepa_core', 'EE': 'sepa_core',
    'FI': 'sepa_core', 'FR': 'sepa_core', 'DE': 'sepa_core', 'GR': 'sepa_core',
    'IE': 'sepa_core', 'IT': 'sepa_core', 'LV': 'sepa_core', 'LT': 'sepa_core',
    'LU': 'sepa_core', 'MT': 'sepa_core', 'NL': 'sepa_core', 'PT': 'sepa_core',
    'SK': 'sepa_core', 'SI': 'sepa_core', 'ES': 'sepa_core',
    
    // BACS (UK)
    'GB': 'bacs',
    
    // ACH (USA)
    'US': 'ach',
    
    // Autogiro (Suecia)
    'SE': 'autogiro',
    
    // BECS (Australia)
    'AU': 'becs',
    
    // PAD (Canadá)
    'CA': 'pad',
    
    // Betalingsservice (Dinamarca)
    'DK': 'betalingsservice',
  };

  return schemeMap[countryCode] || null;
}
