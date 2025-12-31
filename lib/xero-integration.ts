/**
 * XERO INTEGRATION SERVICE
 * Contabilidad y facturación para empresas
 * Popular en UK, Australia y Nueva Zelanda
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tenantId?: string;
  enabled: boolean;
}

export interface XeroContact {
  contactID?: string;
  contactStatus?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  phones?: XeroPhone[];
  addresses?: XeroAddress[];
  taxNumber?: string;
  isCustomer?: boolean;
  isSupplier?: boolean;
}

export interface XeroPhone {
  phoneType: 'DEFAULT' | 'DDI' | 'MOBILE' | 'FAX';
  phoneNumber: string;
  phoneAreaCode?: string;
  phoneCountryCode?: string;
}

export interface XeroAddress {
  addressType: 'POBOX' | 'STREET';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface XeroInvoice {
  invoiceID?: string;
  invoiceNumber?: string;
  type: 'ACCPAY' | 'ACCREC'; // ACCREC = sales invoice, ACCPAY = bill
  contact: { contactID: string };
  date: Date;
  dueDate?: Date;
  lineItems: XeroLineItem[];
  status?: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' | 'PAID' | 'VOIDED';
  total?: number;
  amountDue?: number;
  amountPaid?: number;
  currencyCode?: string;
  reference?: string;
}

export interface XeroLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode?: string;
  taxType?: string;
  lineAmount?: number;
}

export interface XeroPayment {
  paymentID?: string;
  invoice: { invoiceID: string };
  account: { accountID: string };
  date: Date;
  amount: number;
  reference?: string;
}

// ============================================================================
// XERO CLIENT
// ============================================================================

export class XeroClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private refreshToken?: string;
  private tenantId?: string;
  private baseUrl: string = 'https://api.xero.com/api.xro/2.0';

  constructor(config: XeroConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tenantId = config.tenantId;
  }

  /**
   * Refrescar access token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      logger.info('Xero access token refreshed');

      return data.access_token;
    } catch (error) {
      logger.error('Error refreshing Xero token:', error);
      throw error;
    }
  }

  /**
   * Headers de autenticación
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    if (!this.accessToken || !this.tenantId) {
      throw new Error('No access token or tenant ID available');
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'xero-tenant-id': this.tenantId,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Crear contacto
   */
  async createContact(contact: XeroContact): Promise<XeroContact> {
    try {
      const headers = await this.getAuthHeaders();

      const payload = {
        Contacts: [contact],
      };

      const response = await fetch(`${this.baseUrl}/Contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.createContact(contact); // Retry
        }
        throw new Error(`Failed to create contact: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Xero contact created: ${data.Contacts[0].ContactID}`);

      return {
        ...contact,
        contactID: data.Contacts[0].ContactID,
      };
    } catch (error) {
      logger.error('Error creating Xero contact:', error);
      throw error;
    }
  }

  /**
   * Obtener contactos
   */
  async getContacts(): Promise<XeroContact[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/Contacts`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getContacts(); // Retry
        }
        throw new Error(`Failed to get contacts: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.Contacts?.length || 0} Xero contacts`);

      return data.Contacts || [];
    } catch (error) {
      logger.error('Error getting Xero contacts:', error);
      return [];
    }
  }

  /**
   * Crear factura
   */
  async createInvoice(invoice: XeroInvoice): Promise<XeroInvoice> {
    try {
      const headers = await this.getAuthHeaders();

      const payload = {
        Invoices: [{
          Type: invoice.type,
          Contact: invoice.contact,
          Date: invoice.date.toISOString().split('T')[0],
          DueDate: invoice.dueDate?.toISOString().split('T')[0],
          LineItems: invoice.lineItems.map(item => ({
            Description: item.description,
            Quantity: item.quantity,
            UnitAmount: item.unitAmount,
            AccountCode: item.accountCode || '200', // Default sales account
            TaxType: item.taxType || 'OUTPUT2', // Default tax type (EU VAT)
          })),
          Status: invoice.status || 'DRAFT',
          Reference: invoice.reference,
          CurrencyCode: invoice.currencyCode || 'EUR',
        }],
      };

      const response = await fetch(`${this.baseUrl}/Invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.createInvoice(invoice); // Retry
        }
        const error = await response.json();
        throw new Error(`Failed to create invoice: ${error.Message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Xero invoice created: ${data.Invoices[0].InvoiceID}`);

      return {
        ...invoice,
        invoiceID: data.Invoices[0].InvoiceID,
        invoiceNumber: data.Invoices[0].InvoiceNumber,
        status: data.Invoices[0].Status,
      };
    } catch (error) {
      logger.error('Error creating Xero invoice:', error);
      throw error;
    }
  }

  /**
   * Obtener facturas
   */
  async getInvoices(params?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<XeroInvoice[]> {
    try {
      const headers = await this.getAuthHeaders();

      let url = `${this.baseUrl}/Invoices`;
      const queryParams: string[] = [];

      if (params?.status) {
        queryParams.push(`Status="${params.status}"`);
      }
      if (params?.fromDate) {
        queryParams.push(`Date>=${params.fromDate.toISOString().split('T')[0]}`);
      }

      if (queryParams.length > 0) {
        url += `?where=${encodeURIComponent(queryParams.join(' AND '))}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getInvoices(params); // Retry
        }
        throw new Error(`Failed to get invoices: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.Invoices?.length || 0} Xero invoices`);

      return (data.Invoices || []).map((inv: any) => this.mapInvoice(inv));
    } catch (error) {
      logger.error('Error getting Xero invoices:', error);
      return [];
    }
  }

  /**
   * Mapear factura de Xero
   */
  private mapInvoice(xeroInvoice: any): XeroInvoice {
    return {
      invoiceID: xeroInvoice.InvoiceID,
      invoiceNumber: xeroInvoice.InvoiceNumber,
      type: xeroInvoice.Type,
      contact: { contactID: xeroInvoice.Contact.ContactID },
      date: new Date(xeroInvoice.Date),
      dueDate: xeroInvoice.DueDate ? new Date(xeroInvoice.DueDate) : undefined,
      status: xeroInvoice.Status,
      total: xeroInvoice.Total,
      amountDue: xeroInvoice.AmountDue,
      amountPaid: xeroInvoice.AmountPaid,
      currencyCode: xeroInvoice.CurrencyCode,
      reference: xeroInvoice.Reference,
      lineItems: (xeroInvoice.LineItems || []).map((item: any) => ({
        description: item.Description,
        quantity: item.Quantity,
        unitAmount: item.UnitAmount,
        accountCode: item.AccountCode,
        taxType: item.TaxType,
        lineAmount: item.LineAmount,
      })),
    };
  }

  /**
   * Registrar pago
   */
  async createPayment(payment: XeroPayment): Promise<XeroPayment> {
    try {
      const headers = await this.getAuthHeaders();

      const payload = {
        Payments: [{
          Invoice: payment.invoice,
          Account: payment.account,
          Date: payment.date.toISOString().split('T')[0],
          Amount: payment.amount,
          Reference: payment.reference,
        }],
      };

      const response = await fetch(`${this.baseUrl}/Payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.createPayment(payment); // Retry
        }
        throw new Error(`Failed to create payment: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Xero payment created: ${data.Payments[0].PaymentID}`);

      return {
        ...payment,
        paymentID: data.Payments[0].PaymentID,
      };
    } catch (error) {
      logger.error('Error creating Xero payment:', error);
      throw error;
    }
  }

  /**
   * Obtener cuentas bancarias
   */
  async getBankAccounts(): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/Accounts?where=Type=="BANK"`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get bank accounts: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.Accounts?.length || 0} Xero bank accounts`);

      return data.Accounts || [];
    } catch (error) {
      logger.error('Error getting Xero bank accounts:', error);
      return [];
    }
  }

  /**
   * Obtener organizaciones (tenants)
   */
  async getOrganisations(): Promise<any[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://api.xero.com/connections', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get organisations: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.length || 0} Xero organisations`);

      return data;
    } catch (error) {
      logger.error('Error getting Xero organisations:', error);
      return [];
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isXeroConfigured(config?: XeroConfig | null): boolean {
  if (!config) return false;
  return !!(
    config.clientId &&
    config.clientSecret &&
    config.enabled
  );
}

export function getXeroClient(config?: XeroConfig): XeroClient | null {
  if (!config || !isXeroConfigured(config)) {
    return null;
  }

  return new XeroClient(config);
}

/**
 * Generar URL de autorización OAuth
 */
export function getXeroAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email accounting.transactions accounting.contacts accounting.settings offline_access',
    state,
  });

  return `https://login.xero.com/identity/connect/authorize?${params}`;
}
