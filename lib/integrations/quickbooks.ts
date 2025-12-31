import axios, { AxiosInstance } from 'axios';
import { prisma } from '@/lib/db';

interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

interface QuickBooksTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  realmId: string;
}

export class QuickBooksService {
  private config: QuickBooksConfig;
  private client: AxiosInstance;
  private baseURL: string;

  constructor(config: QuickBooksConfig) {
    this.config = config;
    this.baseURL =
      config.environment === 'sandbox'
        ? 'https://sandbox-quickbooks.api.intuit.com/v3'
        : 'https://quickbooks.api.intuit.com/v3';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  // OAuth 2.0 Flow
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      state,
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<QuickBooksTokens> {
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
          ).toString('base64')}`,
        },
      }
    );

    return response.data;
  }

  async refreshAccessToken(refreshToken: string): Promise<QuickBooksTokens> {
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
          ).toString('base64')}`,
        },
      }
    );

    return response.data;
  }

  // Create Invoice from Contract
  async createInvoice(data: {
    realmId: string;
    accessToken: string;
    customerName: string;
    amount: number;
    description: string;
    dueDate: string;
  }) {
    // 1. Find or create customer
    const customerId = await this.findOrCreateCustomer(
      data.realmId,
      data.accessToken,
      data.customerName
    );

    // 2. Create invoice
    const invoice = {
      Line: [
        {
          Amount: data.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1', // Services item (create this in QuickBooks first)
              name: 'Services',
            },
          },
          Description: data.description,
        },
      ],
      CustomerRef: {
        value: customerId,
      },
      DueDate: data.dueDate,
    };

    const response = await this.client.post(`/${data.realmId}/invoice`, invoice, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });

    return response.data.Invoice;
  }

  // Create Payment
  async recordPayment(data: {
    realmId: string;
    accessToken: string;
    invoiceId: string;
    amount: number;
    paymentDate: string;
    method: 'CHECK' | 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER';
  }) {
    const payment = {
      TotalAmt: data.amount,
      CustomerRef: {
        value: '1', // Get from invoice
      },
      Line: [
        {
          Amount: data.amount,
          LinkedTxn: [
            {
              TxnId: data.invoiceId,
              TxnType: 'Invoice',
            },
          ],
        },
      ],
      PaymentMethodRef: {
        value: data.method === 'CASH' ? '1' : '2',
      },
      TxnDate: data.paymentDate,
    };

    const response = await this.client.post(`/${data.realmId}/payment`, payment, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });

    return response.data.Payment;
  }

  // Sync Properties as Items
  async syncPropertyAsItem(data: {
    realmId: string;
    accessToken: string;
    propertyName: string;
    monthlyRent: number;
  }) {
    const item = {
      Name: propertyName,
      Type: 'Service',
      IncomeAccountRef: {
        value: '79', // Rental Income account
      },
      UnitPrice: data.monthlyRent,
      TrackQtyOnHand: false,
    };

    const response = await this.client.post(`/${data.realmId}/item`, item, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });

    return response.data.Item;
  }

  // Helper: Find or Create Customer
  private async findOrCreateCustomer(
    realmId: string,
    accessToken: string,
    name: string
  ): Promise<string> {
    // Search for existing customer
    const searchResponse = await this.client.get(`/${realmId}/query`, {
      params: {
        query: `SELECT * FROM Customer WHERE DisplayName = '${name}'`,
        minorversion: '65',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (searchResponse.data.QueryResponse.Customer?.length > 0) {
      return searchResponse.data.QueryResponse.Customer[0].Id;
    }

    // Create new customer
    const customer = { DisplayName: name };
    const createResponse = await this.client.post(`/${realmId}/customer`, customer, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return createResponse.data.Customer.Id;
  }

  // Auto-sync on Contract Signed
  static async onContractSigned(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: true,
        tenant: true,
        company: true,
      },
    });

    if (!contract) return;

    // Get QuickBooks integration settings
    const integration = await prisma.integrationTemplate.findFirst({
      where: {
        companyId: contract.companyId,
        slug: 'quickbooks',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const qb = new QuickBooksService({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      environment: config.environment,
    });

    // Create invoice
    const invoice = await qb.createInvoice({
      realmId: config.realmId,
      accessToken: config.accessToken,
      customerName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
      amount: contract.monthlyRent,
      description: `Monthly rent - ${contract.property.address}`,
      dueDate: new Date(contract.startDate).toISOString().split('T')[0],
    });

    // Save invoice reference
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        metadata: {
          ...(contract.metadata as any),
          quickbooksInvoiceId: invoice.Id,
        },
      },
    });

    console.log(`[QuickBooks] Invoice created: ${invoice.Id}`);
  }

  // Auto-sync on Payment Received
  static async onPaymentReceived(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!payment || !payment.contract) return;

    const integration = await prisma.integrationTemplate.findFirst({
      where: {
        companyId: payment.contract.companyId,
        slug: 'quickbooks',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const contractMetadata = payment.contract.metadata as any;
    const invoiceId = contractMetadata?.quickbooksInvoiceId;

    if (!invoiceId) return;

    const qb = new QuickBooksService({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      environment: config.environment,
    });

    // Record payment in QuickBooks
    const qbPayment = await qb.recordPayment({
      realmId: config.realmId,
      accessToken: config.accessToken,
      invoiceId,
      amount: payment.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'BANK_TRANSFER',
    });

    console.log(`[QuickBooks] Payment recorded: ${qbPayment.Id}`);
  }
}

export default QuickBooksService;
