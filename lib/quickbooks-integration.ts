/**
 * QUICKBOOKS INTEGRATION SERVICE
 * Contabilidad y facturación para empresas
 * Sincronización bidireccional de facturas, gastos y clientes
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  realmId?: string; // Company ID
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

export interface QBCustomer {
  id?: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  billingAddress?: QBAddress;
  taxId?: string;
}

export interface QBAddress {
  line1: string;
  city: string;
  countrySubDivisionCode?: string;
  postalCode: string;
  country?: string;
}

export interface QBInvoice {
  id?: string;
  docNumber?: string;
  customerId: string;
  customerName?: string;
  txnDate: Date;
  dueDate?: Date;
  lineItems: QBLineItem[];
  totalAmount: number;
  balance: number;
  currency?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface QBLineItem {
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  taxable?: boolean;
}

export interface QBExpense {
  id?: string;
  txnDate: Date;
  amount: number;
  paymentType: string;
  accountRef: string;
  categoryRef?: string;
  vendorName?: string;
  description?: string;
}

// ============================================================================
// QUICKBOOKS CLIENT
// ============================================================================

export class QuickBooksClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private refreshToken?: string;
  private realmId?: string;
  private baseUrl: string;

  constructor(config: QuickBooksConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.realmId = config.realmId;
    
    this.baseUrl = config.environment === 'production'
      ? 'https://quickbooks.api.intuit.com/v3'
      : 'https://sandbox-quickbooks.api.intuit.com/v3';
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

      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
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

      logger.info('QuickBooks access token refreshed');

      return data.access_token;
    } catch (error) {
      logger.error('Error refreshing QuickBooks token:', error);
      throw error;
    }
  }

  /**
   * Headers de autenticación
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Crear cliente
   */
  async createCustomer(customer: QBCustomer): Promise<QBCustomer> {
    try {
      if (!this.realmId) {
        throw new Error('No realm ID available');
      }

      const headers = await this.getAuthHeaders();

      const payload = {
        DisplayName: customer.displayName,
        GivenName: customer.givenName,
        FamilyName: customer.familyName,
        CompanyName: customer.companyName,
        PrimaryEmailAddr: customer.email ? { Address: customer.email } : undefined,
        PrimaryPhone: customer.phone ? { FreeFormNumber: customer.phone } : undefined,
        BillAddr: customer.billingAddress ? {
          Line1: customer.billingAddress.line1,
          City: customer.billingAddress.city,
          CountrySubDivisionCode: customer.billingAddress.countrySubDivisionCode,
          PostalCode: customer.billingAddress.postalCode,
          Country: customer.billingAddress.country,
        } : undefined,
      };

      const response = await fetch(
        `${this.baseUrl}/company/${this.realmId}/customer`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.createCustomer(customer); // Retry
        }
        throw new Error(`Failed to create customer: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`QuickBooks customer created: ${data.Customer.Id}`);

      return {
        id: data.Customer.Id,
        displayName: data.Customer.DisplayName,
        ...customer,
      };
    } catch (error) {
      logger.error('Error creating QuickBooks customer:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes
   */
  async getCustomers(): Promise<QBCustomer[]> {
    try {
      if (!this.realmId) {
        throw new Error('No realm ID available');
      }

      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/company/${this.realmId}/query?query=SELECT * FROM Customer MAXRESULTS 100`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getCustomers(); // Retry
        }
        throw new Error(`Failed to get customers: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.QueryResponse?.Customer?.length || 0} QuickBooks customers`);

      return (data.QueryResponse?.Customer || []).map((c: any) => this.mapCustomer(c));
    } catch (error) {
      logger.error('Error getting QuickBooks customers:', error);
      return [];
    }
  }

  /**
   * Mapear cliente de QuickBooks
   */
  private mapCustomer(qbCustomer: any): QBCustomer {
    return {
      id: qbCustomer.Id,
      displayName: qbCustomer.DisplayName,
      givenName: qbCustomer.GivenName,
      familyName: qbCustomer.FamilyName,
      companyName: qbCustomer.CompanyName,
      email: qbCustomer.PrimaryEmailAddr?.Address,
      phone: qbCustomer.PrimaryPhone?.FreeFormNumber,
      billingAddress: qbCustomer.BillAddr ? {
        line1: qbCustomer.BillAddr.Line1,
        city: qbCustomer.BillAddr.City,
        countrySubDivisionCode: qbCustomer.BillAddr.CountrySubDivisionCode,
        postalCode: qbCustomer.BillAddr.PostalCode,
        country: qbCustomer.BillAddr.Country,
      } : undefined,
    };
  }

  /**
   * Crear factura
   */
  async createInvoice(invoice: QBInvoice): Promise<QBInvoice> {
    try {
      if (!this.realmId) {
        throw new Error('No realm ID available');
      }

      const headers = await this.getAuthHeaders();

      const payload = {
        CustomerRef: { value: invoice.customerId },
        TxnDate: invoice.txnDate.toISOString().split('T')[0],
        DueDate: invoice.dueDate?.toISOString().split('T')[0],
        Line: invoice.lineItems.map((item, index) => ({
          Id: (index + 1).toString(),
          LineNum: index + 1,
          Description: item.description,
          Amount: item.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            Qty: item.quantity || 1,
            UnitPrice: item.unitPrice || item.amount,
          },
        })),
        CustomerMemo: invoice.notes ? { value: invoice.notes } : undefined,
      };

      const response = await fetch(
        `${this.baseUrl}/company/${this.realmId}/invoice`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.createInvoice(invoice); // Retry
        }
        throw new Error(`Failed to create invoice: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`QuickBooks invoice created: ${data.Invoice.Id}`);

      return {
        ...invoice,
        id: data.Invoice.Id,
        docNumber: data.Invoice.DocNumber,
      };
    } catch (error) {
      logger.error('Error creating QuickBooks invoice:', error);
      throw error;
    }
  }

  /**
   * Obtener facturas
   */
  async getInvoices(params?: { startDate?: Date; endDate?: Date }): Promise<QBInvoice[]> {
    try {
      if (!this.realmId) {
        throw new Error('No realm ID available');
      }

      const headers = await this.getAuthHeaders();

      let query = 'SELECT * FROM Invoice';
      
      if (params?.startDate) {
        const startStr = params.startDate.toISOString().split('T')[0];
        query += ` WHERE TxnDate >= '${startStr}'`;
      }
      
      query += ' MAXRESULTS 100';

      const response = await fetch(
        `${this.baseUrl}/company/${this.realmId}/query?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getInvoices(params); // Retry
        }
        throw new Error(`Failed to get invoices: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.QueryResponse?.Invoice?.length || 0} QuickBooks invoices`);

      return (data.QueryResponse?.Invoice || []).map((inv: any) => this.mapInvoice(inv));
    } catch (error) {
      logger.error('Error getting QuickBooks invoices:', error);
      return [];
    }
  }

  /**
   * Mapear factura de QuickBooks
   */
  private mapInvoice(qbInvoice: any): QBInvoice {
    return {
      id: qbInvoice.Id,
      docNumber: qbInvoice.DocNumber,
      customerId: qbInvoice.CustomerRef.value,
      customerName: qbInvoice.CustomerRef.name,
      txnDate: new Date(qbInvoice.TxnDate),
      dueDate: qbInvoice.DueDate ? new Date(qbInvoice.DueDate) : undefined,
      totalAmount: qbInvoice.TotalAmt,
      balance: qbInvoice.Balance,
      currency: qbInvoice.CurrencyRef?.value,
      status: this.mapInvoiceStatus(qbInvoice.Balance, qbInvoice.DueDate),
      lineItems: (qbInvoice.Line || [])
        .filter((l: any) => l.DetailType === 'SalesItemLineDetail')
        .map((l: any) => ({
          description: l.Description,
          amount: l.Amount,
          quantity: l.SalesItemLineDetail?.Qty,
          unitPrice: l.SalesItemLineDetail?.UnitPrice,
        })),
    };
  }

  /**
   * Mapear estado de factura
   */
  private mapInvoiceStatus(balance: number, dueDate?: string): QBInvoice['status'] {
    if (balance === 0) return 'paid';
    if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
    return 'sent';
  }

  /**
   * Crear gasto
   */
  async createExpense(expense: QBExpense): Promise<QBExpense> {
    try {
      if (!this.realmId) {
        throw new Error('No realm ID available');
      }

      const headers = await this.getAuthHeaders();

      const payload = {
        TxnDate: expense.txnDate.toISOString().split('T')[0],
        PaymentType: expense.paymentType,
        AccountRef: { value: expense.accountRef },
        EntityRef: expense.vendorName ? { name: expense.vendorName } : undefined,
        Line: [{
          Amount: expense.amount,
          DetailType: 'AccountBasedExpenseLineDetail',
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: expense.categoryRef || expense.accountRef },
          },
        }],
        PrivateNote: expense.description,
      };

      const response = await fetch(
        `${this.baseUrl}/company/${this.realmId}/purchase`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.createExpense(expense); // Retry
        }
        throw new Error(`Failed to create expense: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`QuickBooks expense created: ${data.Purchase.Id}`);

      return {
        ...expense,
        id: data.Purchase.Id,
      };
    } catch (error) {
      logger.error('Error creating QuickBooks expense:', error);
      throw error;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isQuickBooksConfigured(config?: QuickBooksConfig | null): boolean {
  if (!config) return false;
  return !!(
    config.clientId &&
    config.clientSecret &&
    config.enabled
  );
}

export function getQuickBooksClient(config?: QuickBooksConfig): QuickBooksClient | null {
  if (!config || !isQuickBooksConfigured(config)) {
    return null;
  }

  return new QuickBooksClient(config);
}

/**
 * Generar URL de autorización OAuth
 */
export function getQuickBooksAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state,
  });

  return `https://appcenter.intuit.com/connect/oauth2?${params}`;
}
