/**
 * GOCARDLESS INTEGRATION SERVICE
 * Direct Debit (domiciliaciones bancarias) para Europa, UK, USA, Canada, Australia
 * SEPA, BACS, ACH, Autogiro, BECS, PAD, Betalingsservice
 *
 * API Reference: https://developer.gocardless.com/api-reference
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
  countryCode: string;
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
  status?: 'pending_customer_approval' | 'pending_submission' | 'submitted' | 'active' | 'failed' | 'cancelled' | 'expired' | 'suspended_by_payer';
  scheme: 'bacs' | 'sepa_core' | 'ach' | 'autogiro' | 'becs' | 'pad' | 'betalingsservice';
  nextPossibleChargeDate?: string;
  paymentsRequireApproval?: boolean;
  metadata?: Record<string, string>;
  customerId?: string;
  customerBankAccountId?: string;
  createdAt?: string;
}

export interface GCPayment {
  id?: string;
  amount: number;
  currency: string;
  description: string;
  chargeDate?: string;
  reference?: string;
  status?: 'pending_customer_approval' | 'pending_submission' | 'submitted' | 'confirmed' | 'paid_out' | 'cancelled' | 'customer_approval_denied' | 'failed' | 'charged_back';
  amountRefunded?: number;
  metadata?: Record<string, string>;
  mandateId: string;
  links?: { mandate?: string; subscription?: string; payout?: string };
  createdAt?: string;
}

export interface GCSubscription {
  id?: string;
  amount: number;
  currency: string;
  name: string;
  interval: number;
  intervalUnit: 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  status?: 'pending_customer_approval' | 'customer_approval_denied' | 'active' | 'finished' | 'cancelled' | 'paused';
  metadata?: Record<string, string>;
  mandateId: string;
  upcomingPayments?: Array<{ chargeDate: string; amount: number }>;
}

export interface GCRefund {
  id?: string;
  amount: number;
  currency: string;
  reference?: string;
  metadata?: Record<string, string>;
  paymentId: string;
}

export interface GCPayout {
  id?: string;
  amount: number;
  currency: string;
  arrivalDate?: string;
  status?: 'pending' | 'paid' | 'bounced';
  reference?: string;
  debitReference?: string;
  createdAt?: string;
}

export interface GCCreditor {
  id: string;
  name: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  createdAt?: string;
  canCreateRefunds?: boolean;
  schemeIdentifiers?: Array<{
    name: string;
    scheme: string;
    reference: string;
    status: string;
  }>;
}

export interface GCPayoutItem {
  amount: number;
  type: 'payment_paid_out' | 'payment_failed' | 'payment_charged_back' | 'payment_refunded' | 'refund' | 'gocardless_fee' | 'app_fee' | 'revenue_share' | 'surcharge_fee';
  links: {
    payment?: string;
    mandate?: string;
    refund?: string;
  };
}

export interface GCListResult<T> {
  items: T[];
  meta: {
    cursors: { before: string | null; after: string | null };
    limit: number;
  };
}

// ============================================================================
// GOCARDLESS CLIENT
// ============================================================================

export class GoCardlessClient {
  private accessToken: string;
  private baseUrl: string;
  private version: string = '2015-07-06';

  constructor(config: GoCardlessConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.environment === 'live'
      ? 'https://api.gocardless.com'
      : 'https://api-sandbox.gocardless.com';
  }

  private getAuthHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'GoCardless-Version': this.version,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.getAuthHeaders(),
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || response.statusText;
      throw new Error(`GoCardless ${method} ${path} failed (${response.status}): ${msg}`);
    }

    return response.json();
  }

  // =========================================================================
  // CREDITOR
  // =========================================================================

  async getCreditor(): Promise<GCCreditor | null> {
    try {
      const data = await this.request<any>('GET', '/creditors');
      const c = data.creditors?.[0];
      if (!c) return null;
      return {
        id: c.id,
        name: c.name,
        addressLine1: c.address_line1,
        city: c.city,
        postalCode: c.postal_code,
        countryCode: c.country_code,
        createdAt: c.created_at,
        canCreateRefunds: c.can_create_refunds,
        schemeIdentifiers: c.scheme_identifiers?.map((si: any) => ({
          name: si.name,
          scheme: si.scheme,
          reference: si.reference,
          status: si.status,
        })),
      };
    } catch (error) {
      logger.error('Error getting creditor:', error);
      return null;
    }
  }

  // =========================================================================
  // CUSTOMERS
  // =========================================================================

  async createCustomer(customer: GCCustomer): Promise<GCCustomer> {
    const data = await this.request<any>('POST', '/customers', {
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
    });

    logger.info(`[GC] Customer created: ${data.customers.id}`);
    return { id: data.customers.id, ...customer };
  }

  async getCustomer(customerId: string): Promise<GCCustomer> {
    const data = await this.request<any>('GET', `/customers/${customerId}`);
    return this.mapCustomer(data.customers);
  }

  async listCustomers(params?: { limit?: number; after?: string }): Promise<GCListResult<GCCustomer>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.after) qs.set('after', params.after);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await this.request<any>('GET', `/customers${query}`);
    return {
      items: (data.customers || []).map((c: any) => this.mapCustomer(c)),
      meta: data.meta || { cursors: { before: null, after: null }, limit: 50 },
    };
  }

  private mapCustomer(c: any): GCCustomer {
    return {
      id: c.id,
      email: c.email,
      givenName: c.given_name,
      familyName: c.family_name,
      companyName: c.company_name,
      addressLine1: c.address_line1,
      city: c.city,
      postalCode: c.postal_code,
      countryCode: c.country_code,
      language: c.language,
      phoneNumber: c.phone_number,
      metadata: c.metadata,
    };
  }

  // =========================================================================
  // BANK ACCOUNTS
  // =========================================================================

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
    const payload: any = {
      customer_bank_accounts: {
        account_holder_name: params.accountHolderName,
        country_code: params.countryCode,
        currency: params.currency,
        metadata: params.metadata,
        links: { customer: params.customerId },
      },
    };

    if (params.iban) {
      payload.customer_bank_accounts.iban = params.iban;
    } else if (params.accountNumber) {
      payload.customer_bank_accounts.account_number = params.accountNumber;
      if (params.branchCode) {
        payload.customer_bank_accounts.branch_code = params.branchCode;
      }
    }

    const data = await this.request<any>('POST', '/customer_bank_accounts', payload);
    const ba = data.customer_bank_accounts;

    logger.info(`[GC] Bank account created: ${ba.id}`);
    return {
      id: ba.id,
      accountHolderName: params.accountHolderName,
      accountNumberEnding: ba.account_number_ending,
      bankName: ba.bank_name,
      countryCode: params.countryCode,
      currency: params.currency,
      enabled: ba.enabled,
      metadata: params.metadata,
    };
  }

  // =========================================================================
  // MANDATES
  // =========================================================================

  async createMandate(params: {
    customerBankAccountId: string;
    scheme: GCMandate['scheme'];
    reference?: string;
    metadata?: Record<string, string>;
  }): Promise<GCMandate> {
    const data = await this.request<any>('POST', '/mandates', {
      mandates: {
        scheme: params.scheme,
        reference: params.reference,
        metadata: params.metadata,
        links: { customer_bank_account: params.customerBankAccountId },
      },
    });
    const m = data.mandates;
    logger.info(`[GC] Mandate created: ${m.id}`);
    return this.mapMandate(m);
  }

  async getMandate(mandateId: string): Promise<GCMandate> {
    const data = await this.request<any>('GET', `/mandates/${mandateId}`);
    return this.mapMandate(data.mandates);
  }

  async listMandates(params?: {
    limit?: number;
    after?: string;
    status?: string;
    customer?: string;
  }): Promise<GCListResult<GCMandate>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.after) qs.set('after', params.after);
    if (params?.status) qs.set('status', params.status);
    if (params?.customer) qs.set('customer', params.customer);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await this.request<any>('GET', `/mandates${query}`);
    return {
      items: (data.mandates || []).map((m: any) => this.mapMandate(m)),
      meta: data.meta || { cursors: { before: null, after: null }, limit: 50 },
    };
  }

  async cancelMandate(mandateId: string): Promise<boolean> {
    try {
      await this.request<any>('POST', `/mandates/${mandateId}/actions/cancel`, { data: {} });
      logger.info(`[GC] Mandate cancelled: ${mandateId}`);
      return true;
    } catch (error) {
      logger.error(`Error cancelling mandate ${mandateId}:`, error);
      return false;
    }
  }

  private mapMandate(m: any): GCMandate {
    return {
      id: m.id,
      reference: m.reference,
      status: m.status,
      scheme: m.scheme,
      nextPossibleChargeDate: m.next_possible_charge_date,
      paymentsRequireApproval: m.payments_require_approval,
      metadata: m.metadata,
      customerId: m.links?.customer,
      customerBankAccountId: m.links?.customer_bank_account,
      createdAt: m.created_at,
    };
  }

  // =========================================================================
  // PAYMENTS
  // =========================================================================

  async createPayment(payment: GCPayment): Promise<GCPayment> {
    const data = await this.request<any>('POST', '/payments', {
      payments: {
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        charge_date: payment.chargeDate,
        reference: payment.reference,
        metadata: payment.metadata,
        links: { mandate: payment.mandateId },
      },
    });
    const p = data.payments;
    logger.info(`[GC] Payment created: ${p.id} (${p.amount} ${p.currency})`);
    return this.mapPayment(p);
  }

  async getPayment(paymentId: string): Promise<GCPayment> {
    const data = await this.request<any>('GET', `/payments/${paymentId}`);
    return this.mapPayment(data.payments);
  }

  async listPayments(params?: {
    limit?: number;
    after?: string;
    status?: string;
    mandate?: string;
    subscription?: string;
    chargeDate?: { gte?: string; lte?: string };
    createdAt?: { gte?: string; lte?: string };
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<GCListResult<GCPayment>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.after) qs.set('after', params.after);
    if (params?.status) qs.set('status', params.status);
    if (params?.mandate) qs.set('mandate', params.mandate);
    if (params?.subscription) qs.set('subscription', params.subscription);
    if (params?.chargeDate?.gte) qs.set('charge_date[gte]', params.chargeDate.gte);
    if (params?.chargeDate?.lte) qs.set('charge_date[lte]', params.chargeDate.lte);
    if (params?.createdAt?.gte) qs.set('created_at[gte]', params.createdAt.gte);
    if (params?.createdAt?.lte) qs.set('created_at[lte]', params.createdAt.lte);
    if (params?.sortField) qs.set('sort_field', params.sortField);
    if (params?.sortDirection) qs.set('sort_direction', params.sortDirection);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await this.request<any>('GET', `/payments${query}`);
    return {
      items: (data.payments || []).map((p: any) => this.mapPayment(p)),
      meta: data.meta || { cursors: { before: null, after: null }, limit: 50 },
    };
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      await this.request<any>('POST', `/payments/${paymentId}/actions/cancel`, { data: {} });
      logger.info(`[GC] Payment cancelled: ${paymentId}`);
      return true;
    } catch (error) {
      logger.error(`Error cancelling payment ${paymentId}:`, error);
      return false;
    }
  }

  async retryPayment(paymentId: string): Promise<boolean> {
    try {
      await this.request<any>('POST', `/payments/${paymentId}/actions/retry`, { data: {} });
      logger.info(`[GC] Payment retry: ${paymentId}`);
      return true;
    } catch (error) {
      logger.error(`Error retrying payment ${paymentId}:`, error);
      return false;
    }
  }

  private mapPayment(p: any): GCPayment {
    return {
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      description: p.description,
      chargeDate: p.charge_date,
      reference: p.reference,
      status: p.status,
      amountRefunded: p.amount_refunded,
      metadata: p.metadata,
      mandateId: p.links?.mandate,
      links: p.links,
      createdAt: p.created_at,
    };
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  async createSubscription(subscription: GCSubscription): Promise<GCSubscription> {
    const data = await this.request<any>('POST', '/subscriptions', {
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
        links: { mandate: subscription.mandateId },
      },
    });
    const s = data.subscriptions;
    logger.info(`[GC] Subscription created: ${s.id}`);
    return this.mapSubscription(s);
  }

  async getSubscription(subscriptionId: string): Promise<GCSubscription> {
    const data = await this.request<any>('GET', `/subscriptions/${subscriptionId}`);
    return this.mapSubscription(data.subscriptions);
  }

  async listSubscriptions(params?: {
    limit?: number;
    after?: string;
    mandate?: string;
    status?: string;
    customer?: string;
  }): Promise<GCListResult<GCSubscription>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.after) qs.set('after', params.after);
    if (params?.mandate) qs.set('mandate', params.mandate);
    if (params?.status) qs.set('status', params.status);
    if (params?.customer) qs.set('customer', params.customer);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await this.request<any>('GET', `/subscriptions${query}`);
    return {
      items: (data.subscriptions || []).map((s: any) => this.mapSubscription(s)),
      meta: data.meta || { cursors: { before: null, after: null }, limit: 50 },
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.request<any>('POST', `/subscriptions/${subscriptionId}/actions/cancel`, { data: {} });
      logger.info(`[GC] Subscription cancelled: ${subscriptionId}`);
      return true;
    } catch (error) {
      logger.error(`Error cancelling subscription ${subscriptionId}:`, error);
      return false;
    }
  }

  async pauseSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.request<any>('POST', `/subscriptions/${subscriptionId}/actions/pause`, { data: {} });
      logger.info(`[GC] Subscription paused: ${subscriptionId}`);
      return true;
    } catch (error) {
      logger.error(`Error pausing subscription ${subscriptionId}:`, error);
      return false;
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.request<any>('POST', `/subscriptions/${subscriptionId}/actions/resume`, { data: {} });
      logger.info(`[GC] Subscription resumed: ${subscriptionId}`);
      return true;
    } catch (error) {
      logger.error(`Error resuming subscription ${subscriptionId}:`, error);
      return false;
    }
  }

  private mapSubscription(s: any): GCSubscription {
    return {
      id: s.id,
      amount: s.amount,
      currency: s.currency,
      name: s.name,
      interval: s.interval,
      intervalUnit: s.interval_unit,
      dayOfMonth: s.day_of_month,
      month: s.month,
      startDate: s.start_date,
      endDate: s.end_date,
      status: s.status,
      metadata: s.metadata,
      mandateId: s.links?.mandate,
      upcomingPayments: s.upcoming_payments?.map((up: any) => ({
        chargeDate: up.charge_date,
        amount: up.amount,
      })),
    };
  }

  // =========================================================================
  // REFUNDS
  // =========================================================================

  async createRefund(refund: GCRefund): Promise<GCRefund> {
    const data = await this.request<any>('POST', '/refunds', {
      refunds: {
        amount: refund.amount,
        reference: refund.reference,
        metadata: refund.metadata,
        links: { payment: refund.paymentId },
      },
    });
    logger.info(`[GC] Refund created: ${data.refunds.id}`);
    return { ...refund, id: data.refunds.id };
  }

  // =========================================================================
  // PAYOUTS
  // =========================================================================

  async getPayout(payoutId: string): Promise<GCPayout> {
    const data = await this.request<any>('GET', `/payouts/${payoutId}`);
    return this.mapPayout(data.payouts);
  }

  async listPayouts(params?: {
    limit?: number;
    after?: string;
    status?: string;
    createdAt?: { gte?: string; lte?: string };
  }): Promise<GCListResult<GCPayout>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.after) qs.set('after', params.after);
    if (params?.status) qs.set('status', params.status);
    if (params?.createdAt?.gte) qs.set('created_at[gte]', params.createdAt.gte);
    if (params?.createdAt?.lte) qs.set('created_at[lte]', params.createdAt.lte);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await this.request<any>('GET', `/payouts${query}`);
    return {
      items: (data.payouts || []).map((p: any) => this.mapPayout(p)),
      meta: data.meta || { cursors: { before: null, after: null }, limit: 50 },
    };
  }

  async listPayoutItems(payoutId: string, params?: {
    limit?: number;
    after?: string;
  }): Promise<GCListResult<GCPayoutItem>> {
    const qs = new URLSearchParams();
    qs.set('payout', payoutId);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.after) qs.set('after', params.after);

    const data = await this.request<any>('GET', `/payout_items?${qs.toString()}`);
    return {
      items: (data.payout_items || []).map((pi: any) => ({
        amount: pi.amount,
        type: pi.type,
        links: pi.links || {},
      })),
      meta: data.meta || { cursors: { before: null, after: null }, limit: 50 },
    };
  }

  private mapPayout(p: any): GCPayout {
    return {
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      arrivalDate: p.arrival_date,
      status: p.status,
      reference: p.reference,
      debitReference: p.debit_reference,
      createdAt: p.created_at,
    };
  }

  // =========================================================================
  // REDIRECT FLOWS (for mandate setup)
  // =========================================================================

  async createRedirectFlow(params: {
    description: string;
    sessionToken: string;
    successRedirectUrl: string;
    scheme?: string;
    customerId?: string;
  }): Promise<{ id: string; redirectUrl: string }> {
    const payload: any = {
      redirect_flows: {
        description: params.description,
        session_token: params.sessionToken,
        success_redirect_url: params.successRedirectUrl,
        scheme: params.scheme || 'sepa_core',
      },
    };
    if (params.customerId) {
      payload.redirect_flows.links = { customer: params.customerId };
    }

    const data = await this.request<any>('POST', '/redirect_flows', payload);
    return {
      id: data.redirect_flows.id,
      redirectUrl: data.redirect_flows.redirect_url,
    };
  }

  async completeRedirectFlow(redirectFlowId: string, sessionToken: string): Promise<{
    mandateId: string;
    customerId: string;
    customerBankAccountId: string;
  }> {
    const data = await this.request<any>(
      'POST',
      `/redirect_flows/${redirectFlowId}/actions/complete`,
      { data: { session_token: sessionToken } }
    );
    const links = data.redirect_flows?.links || {};
    return {
      mandateId: links.mandate,
      customerId: links.customer,
      customerBankAccountId: links.customer_bank_account,
    };
  }

  // =========================================================================
  // EVENTS (for polling instead of webhooks)
  // =========================================================================

  async listEvents(params?: {
    limit?: number;
    after?: string;
    resourceType?: string;
    action?: string;
    createdAt?: { gte?: string; lte?: string };
  }): Promise<GCListResult<any>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.after) qs.set('after', params.after);
    if (params?.resourceType) qs.set('resource_type', params.resourceType);
    if (params?.action) qs.set('action', params.action);
    if (params?.createdAt?.gte) qs.set('created_at[gte]', params.createdAt.gte);
    if (params?.createdAt?.lte) qs.set('created_at[lte]', params.createdAt.lte);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await this.request<any>('GET', `/events${query}`);
    return {
      items: data.events || [],
      meta: data.meta || { cursors: { before: null, after: null }, limit: 50 },
    };
  }

  // =========================================================================
  // WEBHOOK SIGNATURE VERIFICATION
  // =========================================================================

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

let _gcClient: GoCardlessClient | null = null;

/**
 * Get singleton GoCardless client from environment variables
 */
export function getGCClient(): GoCardlessClient | null {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN;
  if (!token) return null;

  if (!_gcClient) {
    const env = (process.env.GOCARDLESS_ENVIRONMENT || 'live') as 'sandbox' | 'live';
    _gcClient = new GoCardlessClient({ accessToken: token, environment: env, enabled: true });
  }
  return _gcClient;
}

export function isGoCardlessConfigured(config?: GoCardlessConfig | null): boolean {
  if (!config) return false;
  return !!(config.accessToken && config.enabled);
}

export function getGoCardlessClient(config?: GoCardlessConfig): GoCardlessClient | null {
  if (!config || !isGoCardlessConfigured(config)) return null;
  return new GoCardlessClient(config);
}

/**
 * Determinar el scheme adecuado según el país
 */
export function getSupportedScheme(countryCode: string): GCMandate['scheme'] | null {
  const schemeMap: Record<string, GCMandate['scheme']> = {
    'AT': 'sepa_core', 'BE': 'sepa_core', 'CY': 'sepa_core', 'EE': 'sepa_core',
    'FI': 'sepa_core', 'FR': 'sepa_core', 'DE': 'sepa_core', 'GR': 'sepa_core',
    'IE': 'sepa_core', 'IT': 'sepa_core', 'LV': 'sepa_core', 'LT': 'sepa_core',
    'LU': 'sepa_core', 'MT': 'sepa_core', 'NL': 'sepa_core', 'PT': 'sepa_core',
    'SK': 'sepa_core', 'SI': 'sepa_core', 'ES': 'sepa_core',
    'GB': 'bacs',
    'US': 'ach',
    'SE': 'autogiro',
    'AU': 'becs',
    'CA': 'pad',
    'DK': 'betalingsservice',
  };
  return schemeMap[countryCode] || null;
}

/**
 * Convertir cantidad en euros a centimos
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convertir centimos a euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}
