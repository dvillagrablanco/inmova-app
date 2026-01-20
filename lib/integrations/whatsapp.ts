import axios, { AxiosInstance } from 'axios';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

interface SendMessageData {
  to: string;
  message: string;
  type?: 'text' | 'template' | 'media';
}

interface SendTemplateData {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters?: string[];
}

export class WhatsAppService {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private accessToken: string;

  constructor(config: WhatsAppConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;

    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  // Send Text Message
  async sendMessage(data: SendMessageData) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: data.to,
      type: 'text',
      text: {
        body: data.message,
      },
    });

    return response.data;
  }

  // Send Template Message
  async sendTemplate(data: SendTemplateData) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: data.to,
      type: 'template',
      template: {
        name: data.templateName,
        language: {
          code: data.languageCode || 'es',
        },
        components: data.parameters
          ? [
              {
                type: 'body',
                parameters: data.parameters.map((param) => ({
                  type: 'text',
                  text: param,
                })),
              },
            ]
          : [],
      },
    });

    return response.data;
  }

  // Send Image
  async sendImage(data: { to: string; imageUrl: string; caption?: string }) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: data.to,
      type: 'image',
      image: {
        link: data.imageUrl,
        caption: data.caption,
      },
    });

    return response.data;
  }

  // Send Document
  async sendDocument(data: { to: string; documentUrl: string; filename: string }) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: data.to,
      type: 'document',
      document: {
        link: data.documentUrl,
        filename: data.filename,
      },
    });

    return response.data;
  }

  // Send Location
  async sendLocation(data: {
    to: string;
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  }) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: data.to,
      type: 'location',
      location: {
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        name: data.name,
        address: data.address,
      },
    });

    return response.data;
  }

  // Mark Message as Read
  async markAsRead(messageId: string) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });

    return response.data;
  }

  // Get Message Templates
  async getTemplates(businessAccountId: string) {
    const response = await this.client.get(`/${businessAccountId}/message_templates`);
    return response.data.data;
  }

  // Webhook Verification (for initial setup)
  static verifyWebhook(mode: string, token: string, challenge: string, verifyToken: string) {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    throw new Error('Webhook verification failed');
  }

  // Process Webhook Event
  static async processWebhook(body: any) {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field === 'messages') {
          const messages = change.value.messages || [];

          for (const message of messages) {
            await this.handleIncomingMessage({
              from: message.from,
              messageId: message.id,
              timestamp: message.timestamp,
              type: message.type,
              text: message.text?.body,
            });
          }
        }
      }
    }
  }

  // Handle Incoming Message
  private static async handleIncomingMessage(data: {
    from: string;
    messageId: string;
    timestamp: string;
    type: string;
    text?: string;
  }) {
    console.log('[WhatsApp] Incoming message:', data);

    // Find tenant by phone
    const tenant = await prisma.tenant.findFirst({
      where: {
        phone: data.from,
      },
      include: {
        company: true,
      },
    });

    if (!tenant) {
      console.log('[WhatsApp] Tenant not found for phone:', data.from);
      return;
    }

    // Save message to database
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        companyId: tenant.companyId,
        content: data.text || '',
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        externalId: data.messageId,
        status: 'RECEIVED',
      },
    });

    // Auto-reply based on keywords
    if (data.text) {
      const lowerText = data.text.toLowerCase();

      if (lowerText.includes('pago') || lowerText.includes('payment')) {
        // Send payment info
        const integration = await prisma.integrationTemplate.findFirst({
          where: {
            companyId: tenant.companyId,
            slug: 'whatsapp',
            active: true,
          },
        });

        if (integration) {
          const config = integration.config as any;
          const whatsapp = new WhatsAppService(config);

          await whatsapp.sendTemplate({
            to: data.from,
            templateName: 'payment_info',
            parameters: [tenant.firstName],
          });
        }
      }
    }
  }

  // Send Payment Reminder
  static async sendPaymentReminder(paymentId: string) {
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
        slug: 'whatsapp',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const whatsapp = new WhatsAppService(config);

    const tenant = payment.contract.tenant;

    if (!tenant.phone) {
      logger.warn('[WhatsApp] Tenant has no phone number');
      return;
    }

    // Send payment reminder template
    await whatsapp.sendTemplate({
      to: tenant.phone,
      templateName: 'payment_reminder',
      parameters: [
        tenant.firstName,
        payment.amount.toString(),
        new Date(payment.dueDate).toLocaleDateString('es-ES'),
      ],
    });

    console.log(`[WhatsApp] Payment reminder sent to ${tenant.phone}`);
  }

  // Send Contract for Review
  static async sendContractForReview(contractId: string) {
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
        slug: 'whatsapp',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const whatsapp = new WhatsAppService(config);

    if (!contract.tenant.phone) return;

    // Send contract document
    const contractUrl = `https://inmovaapp.com/contracts/${contractId}/download`;

    await whatsapp.sendDocument({
      to: contract.tenant.phone,
      documentUrl: contractUrl,
      filename: `Contrato_${contract.property.address}.pdf`,
    });

    // Send location of property
    if (contract.property.latitude && contract.property.longitude) {
      await whatsapp.sendLocation({
        to: contract.tenant.phone,
        latitude: contract.property.latitude,
        longitude: contract.property.longitude,
        name: contract.property.address,
        address: `${contract.property.address}, ${contract.property.city}`,
      });
    }

    console.log(`[WhatsApp] Contract sent to ${contract.tenant.phone}`);
  }

  // Send Visit Confirmation
  static async sendVisitConfirmation(visitId: string) {
    const visit = await prisma.propertyVisit.findUnique({
      where: { id: visitId },
      include: {
        property: true,
        lead: true,
        company: true,
      },
    });

    if (!visit) return;

    const integration = await prisma.integrationTemplate.findFirst({
      where: {
        companyId: visit.companyId,
        slug: 'whatsapp',
        active: true,
      },
    });

    if (!integration) return;

    const config = integration.config as any;
    const whatsapp = new WhatsAppService(config);

    if (!visit.lead.phone) return;

    // Send visit confirmation
    await whatsapp.sendTemplate({
      to: visit.lead.phone,
      templateName: 'visit_confirmation',
      parameters: [
        visit.lead.firstName,
        visit.property.address,
        new Date(visit.scheduledAt).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ],
    });

    console.log(`[WhatsApp] Visit confirmation sent to ${visit.lead.phone}`);
  }
}

export default WhatsAppService;
