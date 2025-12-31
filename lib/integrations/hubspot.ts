import axios, { AxiosInstance } from 'axios';
import { prisma } from '@/lib/db';

interface HubSpotConfig {
  accessToken: string;
  portalId?: string;
}

export class HubSpotService {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(config: HubSpotConfig) {
    this.accessToken = config.accessToken;
    this.client = axios.create({
      baseURL: 'https://api.hubapi.com',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  // OAuth 2.0 Flow
  static getAuthorizationUrl(clientId: string, redirectUri: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  static async exchangeCodeForTokens(code: string, clientId: string, clientSecret: string) {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
    });

    return response.data;
  }

  // Create Contact from Tenant
  async createContact(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    lifecyclestage?: string;
  }) {
    const response = await this.client.post('/crm/v3/objects/contacts', {
      properties: {
        email: data.email,
        firstname: data.firstName,
        lastname: data.lastName,
        phone: data.phone,
        lifecyclestage: data.lifecyclestage || 'lead',
      },
    });

    return response.data;
  }

  // Update Contact
  async updateContact(contactId: string, properties: Record<string, any>) {
    const response = await this.client.patch(`/crm/v3/objects/contacts/${contactId}`, {
      properties,
    });

    return response.data;
  }

  // Create Deal from Contract
  async createDeal(data: { dealName: string; amount: number; stage: string; contactId: string }) {
    const response = await this.client.post('/crm/v3/objects/deals', {
      properties: {
        dealname: data.dealName,
        amount: data.amount,
        dealstage: data.stage,
        pipeline: 'default',
      },
      associations: [
        {
          to: { id: data.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 3, // Contact to Deal
            },
          ],
        },
      ],
    });

    return response.data;
  }

  // Update Deal Stage
  async updateDealStage(dealId: string, stage: string) {
    const response = await this.client.patch(`/crm/v3/objects/deals/${dealId}`, {
      properties: {
        dealstage: stage,
      },
    });

    return response.data;
  }

  // Create Note
  async createNote(data: { contactId: string; note: string }) {
    const response = await this.client.post('/crm/v3/objects/notes', {
      properties: {
        hs_note_body: data.note,
        hs_timestamp: new Date().toISOString(),
      },
      associations: [
        {
          to: { id: data.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 10, // Note to Contact
            },
          ],
        },
      ],
    });

    return response.data;
  }

  // Create Task
  async createTask(data: {
    contactId: string;
    subject: string;
    dueDate: string;
    priority?: string;
  }) {
    const response = await this.client.post('/crm/v3/objects/tasks', {
      properties: {
        hs_task_subject: data.subject,
        hs_task_status: 'NOT_STARTED',
        hs_task_priority: data.priority || 'MEDIUM',
        hs_timestamp: new Date(data.dueDate).toISOString(),
      },
      associations: [
        {
          to: { id: data.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 12, // Task to Contact
            },
          ],
        },
      ],
    });

    return response.data;
  }

  // Search Contacts
  async searchContacts(email: string) {
    const response = await this.client.post('/crm/v3/objects/contacts/search', {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            },
          ],
        },
      ],
    });

    return response.data.results;
  }

  // Get Contact by ID
  async getContact(contactId: string) {
    const response = await this.client.get(`/crm/v3/objects/contacts/${contactId}`);
    return response.data;
  }

  // Auto-sync on Tenant Created
  static async onTenantCreated(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { company: true },
    });

    if (!tenant) return;

    const integration = await prisma.integrationTemplate.findFirst({
      where: {
        companyId: tenant.companyId,
        slug: 'hubspot',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const hubspot = new HubSpotService({ accessToken: config.accessToken });

    // Create contact in HubSpot
    const contact = await hubspot.createContact({
      email: tenant.email,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      phone: tenant.phone || undefined,
      lifecyclestage: 'lead',
    });

    // Save HubSpot contact ID
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        metadata: {
          ...(tenant.metadata as any),
          hubspotContactId: contact.id,
        },
      },
    });

    console.log(`[HubSpot] Contact created: ${contact.id}`);
  }

  // Auto-sync on Contract Signed
  static async onContractSigned(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        tenant: true,
        property: true,
        company: true,
      },
    });

    if (!contract) return;

    const integration = await prisma.integrationTemplate.findFirst({
      where: {
        companyId: contract.companyId,
        slug: 'hubspot',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const hubspot = new HubSpotService({ accessToken: config.accessToken });

    // Get HubSpot contact ID
    const tenantMetadata = contract.tenant.metadata as any;
    const contactId = tenantMetadata?.hubspotContactId;

    if (!contactId) {
      console.warn('[HubSpot] Contact ID not found for tenant');
      return;
    }

    // Create deal
    const deal = await hubspot.createDeal({
      dealName: `${contract.property.address} - ${contract.tenant.firstName} ${contract.tenant.lastName}`,
      amount: contract.monthlyRent * 12, // Annual value
      stage: 'contractsent',
      contactId,
    });

    // Update contact lifecycle stage
    await hubspot.updateContact(contactId, {
      lifecyclestage: 'customer',
    });

    // Save deal ID
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        metadata: {
          ...(contract.metadata as any),
          hubspotDealId: deal.id,
        },
      },
    });

    console.log(`[HubSpot] Deal created: ${deal.id}`);
  }

  // Auto-sync on Payment Received
  static async onPaymentReceived(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            tenant: true,
            company: true,
          },
        },
      },
    });

    if (!payment || !payment.contract) return;

    const integration = await prisma.integrationTemplate.findFirst({
      where: {
        companyId: payment.contract.companyId,
        slug: 'hubspot',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const hubspot = new HubSpotService({ accessToken: config.accessToken });

    const tenantMetadata = payment.contract.tenant.metadata as any;
    const contactId = tenantMetadata?.hubspotContactId;

    if (!contactId) return;

    // Create note about payment
    await hubspot.createNote({
      contactId,
      note: `Payment received: €${payment.amount} for ${payment.concept}`,
    });

    console.log(`[HubSpot] Note created for payment ${paymentId}`);
  }
}

export default HubSpotService;
