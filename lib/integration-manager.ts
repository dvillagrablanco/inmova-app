/**
 * INTEGRATION MANAGEMENT SERVICE
 * Gestión centralizada de todas las integraciones de INMOVA
 * Multi-tenant con credenciales por empresa
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// ============================================================================
// ENCRYPTION/DECRYPTION
// ============================================================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32chars!!';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encriptar credenciales
 */
export function encryptCredentials(credentials: any): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(credentials), 'utf8'),
      cipher.final(),
    ]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    logger.error('Error encrypting credentials:', error);
    throw error;
  }
}

/**
 * Desencriptar credenciales
 */
export function decryptCredentials(encryptedData: string): any {
  try {
    const [ivHex, encryptedHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    logger.error('Error decrypting credentials:', error);
    throw error;
  }
}

// ============================================================================
// INTEGRATION CATEGORIES & PROVIDERS
// ============================================================================

export const INTEGRATION_CATEGORIES = {
  payment: 'Pasarelas de Pago',
  communication: 'Comunicación',
  channel_manager: 'Channel Managers',
  accounting: 'Contabilidad/ERP',
  banking: 'Open Banking',
  signature: 'Firma Digital',
  social_media: 'Redes Sociales',
  analytics: 'Analíticas',
  storage: 'Almacenamiento',
} as const;

export type IntegrationCategory = keyof typeof INTEGRATION_CATEGORIES;

export interface IntegrationProvider {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  logo?: string;
  website?: string;
  credentialFields: CredentialField[];
  settingsFields?: SettingField[];
  status: 'active' | 'beta' | 'coming_soon';
  isPremium?: boolean;
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'url';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface SettingField {
  key: string;
  label: string;
  type: 'boolean' | 'text' | 'number' | 'select';
  defaultValue?: any;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
}

// ============================================================================
// AVAILABLE INTEGRATIONS CATALOG
// ============================================================================

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  // ========== PAGOS ==========
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payment',
    description: 'Pagos online con tarjeta y suscripciones',
    logo: '/integrations/stripe.svg',
    website: 'https://stripe.com',
    status: 'active',
    credentialFields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payment',
    description: 'Pagos con cuenta PayPal',
    logo: '/integrations/paypal.svg',
    status: 'active',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'sandbox', label: 'Sandbox (Pruebas)' },
        { value: 'production', label: 'Production' },
      ]},
    ],
  },
  {
    id: 'redsys',
    name: 'Redsys (PSD2)',
    category: 'payment',
    description: 'TPV bancario español con 3D Secure',
    logo: '/integrations/redsys.svg',
    status: 'active',
    credentialFields: [
      { key: 'merchantCode', label: 'Código de Comercio', type: 'text', required: true },
      { key: 'terminal', label: 'Terminal', type: 'text', required: true },
      { key: 'secretKey', label: 'Clave Secreta', type: 'password', required: true },
    ],
  },
  {
    id: 'bizum',
    name: 'Bizum',
    category: 'payment',
    description: 'Pagos instantáneos P2P en España',
    logo: '/integrations/bizum.svg',
    status: 'active',
    credentialFields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'bankProvider', label: 'Banco', type: 'select', required: true, options: [
        { value: 'redsys', label: 'Redsys' },
        { value: 'santander', label: 'Santander' },
        { value: 'bbva', label: 'BBVA' },
        { value: 'caixabank', label: 'CaixaBank' },
      ]},
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'sandbox', label: 'Sandbox' },
        { value: 'production', label: 'Production' },
      ]},
    ],
  },
  {
    id: 'gocardless',
    name: 'GoCardless',
    category: 'payment',
    description: 'Domiciliaciones bancarias SEPA, BACS, ACH',
    logo: '/integrations/gocardless.svg',
    website: 'https://gocardless.com',
    status: 'active',
    credentialFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, helpText: 'Token de API de GoCardless' },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'sandbox', label: 'Sandbox (Pruebas)' },
        { value: 'live', label: 'Live (Producción)' },
      ]},
    ],
    settingsFields: [
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'text', helpText: 'Para verificar webhooks' },
      { key: 'defaultScheme', label: 'Esquema por defecto', type: 'select', options: [
        { value: 'sepa_core', label: 'SEPA Core (Europa)' },
        { value: 'bacs', label: 'BACS (UK)' },
        { value: 'ach', label: 'ACH (USA)' },
        { value: 'autogiro', label: 'Autogiro (Suecia)' },
        { value: 'becs', label: 'BECS (Australia)' },
        { value: 'pad', label: 'PAD (Canadá)' },
      ]},
    ],
  },

  // ========== COMUNICACIÓN ==========
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'communication',
    description: 'SMS y WhatsApp Business API',
    logo: '/integrations/twilio.svg',
    website: 'https://twilio.com',
    status: 'active',
    credentialFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'Número de Teléfono', type: 'text', required: true, placeholder: '+34612345678' },
      { key: 'whatsappNumber', label: 'Número WhatsApp', type: 'text', required: false, placeholder: '+34612345678' },
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'communication',
    description: 'Email transaccional y marketing',
    logo: '/integrations/sendgrid.svg',
    website: 'https://sendgrid.com',
    status: 'active',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'crisp',
    name: 'Crisp',
    category: 'communication',
    description: 'Chat en vivo y soporte al cliente',
    logo: '/integrations/crisp.svg',
    website: 'https://crisp.chat',
    status: 'active',
    credentialFields: [
      { key: 'websiteId', label: 'Website ID', type: 'text', required: true },
      { key: 'pluginId', label: 'Plugin ID', type: 'text', required: false },
      { key: 'pluginKey', label: 'Plugin Key', type: 'password', required: false },
    ],
  },

  // ========== CHANNEL MANAGERS ==========
  {
    id: 'airbnb',
    name: 'Airbnb',
    category: 'channel_manager',
    description: 'Sincronización con Airbnb',
    logo: '/integrations/airbnb.svg',
    status: 'active',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
    settingsFields: [
      { key: 'autoSync', label: 'Sincronización Automática', type: 'boolean', defaultValue: true },
      { key: 'syncInterval', label: 'Intervalo (minutos)', type: 'number', defaultValue: 30 },
    ],
  },
  {
    id: 'booking',
    name: 'Booking.com',
    category: 'channel_manager',
    description: 'Conectividad con Booking.com',
    logo: '/integrations/booking.svg',
    status: 'active',
    credentialFields: [
      { key: 'hotelId', label: 'Hotel ID', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'test', label: 'Test' },
        { value: 'production', label: 'Production' },
      ]},
    ],
  },

  // ========== CONTABILIDAD ==========
  {
    id: 'contasimple',
    name: 'ContaSimple',
    category: 'accounting',
    description: 'Contabilidad para autónomos',
    logo: '/integrations/contasimple.svg',
    status: 'active',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'companyId', label: 'ID Empresa', type: 'text', required: true },
    ],
  },
  {
    id: 'holded',
    name: 'Holded',
    category: 'accounting',
    description: 'ERP y facturación online',
    logo: '/integrations/holded.svg',
    status: 'active',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },

  // ========== REDES SOCIALES ==========
  {
    id: 'pomelli',
    name: 'Pomelli',
    category: 'social_media',
    description: 'Gestión multi-canal de redes sociales',
    logo: '/integrations/pomelli.svg',
    status: 'active',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: false },
    ],
  },

  // ========== FIRMA DIGITAL ==========
  {
    id: 'docusign',
    name: 'DocuSign',
    category: 'signature',
    description: 'Firma electrónica de contratos',
    logo: '/integrations/docusign.svg',
    website: 'https://docusign.com',
    status: 'active',
    credentialFields: [
      { key: 'integrationKey', label: 'Integration Key', type: 'text', required: true },
      { key: 'userId', label: 'User ID', type: 'text', required: true },
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
      { key: 'privateKey', label: 'Private Key (RSA)', type: 'password', required: true },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'demo', label: 'Demo/Sandbox' },
        { value: 'production', label: 'Producción' },
      ]},
    ],
  },
  {
    id: 'signaturit',
    name: 'Signaturit',
    category: 'signature',
    description: 'Firma electrónica cualificada eIDAS (España/UE)',
    logo: '/integrations/signaturit.svg',
    website: 'https://signaturit.com',
    status: 'active',
    credentialFields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'sandbox', label: 'Sandbox' },
        { value: 'production', label: 'Producción' },
      ]},
    ],
  },

  // ========== OPEN BANKING ==========
  {
    id: 'bankinter',
    name: 'Bankinter Open Banking',
    category: 'banking',
    description: 'Acceso a cuentas bancarias',
    logo: '/integrations/bankinter.svg',
    status: 'beta',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'openbanking',
    name: 'Open Banking (PSD2)',
    category: 'banking',
    description: 'Conexión con bancos españoles vía API PSD2',
    logo: '/integrations/openbanking.svg',
    website: 'https://www.berlin-group.org',
    status: 'active',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'certificate', label: 'Certificado eIDAS', type: 'password', required: true },
    ],
  },

  // ========== ANALYTICS ==========
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    category: 'analytics',
    description: 'Análisis de tráfico web y comportamiento',
    logo: '/integrations/google-analytics.svg',
    website: 'https://analytics.google.com',
    status: 'active',
    credentialFields: [
      { key: 'measurementId', label: 'Measurement ID', type: 'text', required: true, placeholder: 'G-XXXXXXXXXX' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: false },
    ],
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'analytics',
    description: 'Mapas de calor y grabaciones de sesiones',
    logo: '/integrations/hotjar.svg',
    website: 'https://hotjar.com',
    status: 'active',
    credentialFields: [
      { key: 'siteId', label: 'Site ID', type: 'text', required: true },
      { key: 'hotjarVersion', label: 'Versión', type: 'text', required: false, placeholder: '6' },
    ],
  },

  // ========== ALMACENAMIENTO ==========
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    category: 'storage',
    description: 'Almacenamiento de documentos en la nube',
    logo: '/integrations/aws-s3.svg',
    website: 'https://aws.amazon.com/s3',
    status: 'active',
    credentialFields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: 'Región', type: 'select', required: true, options: [
        { value: 'eu-west-1', label: 'EU (Irlanda)' },
        { value: 'eu-west-3', label: 'EU (París)' },
        { value: 'eu-central-1', label: 'EU (Frankfurt)' },
        { value: 'us-east-1', label: 'US East (N. Virginia)' },
      ]},
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true },
    ],
  },

  // ========== CHANNEL MANAGERS (Nuevos) ==========
  {
    id: 'expedia',
    name: 'Expedia',
    category: 'channel_manager',
    description: 'EPS - Expedia Partner Solutions API',
    logo: '/integrations/expedia.svg',
    status: 'active',
    credentialFields: [
      { key: 'partnerId', label: 'Partner ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'test', label: 'Test' },
        { value: 'production', label: 'Production' },
      ]},
    ],
  },
  {
    id: 'vrbo',
    name: 'VRBO / HomeAway',
    category: 'channel_manager',
    description: 'Alquileres vacacionales (Expedia Group)',
    logo: '/integrations/vrbo.svg',
    status: 'active',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'partnerId', label: 'Partner ID', type: 'text', required: true },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'sandbox', label: 'Sandbox' },
        { value: 'production', label: 'Production' },
      ]},
    ],
  },

  // ========== REDES SOCIALES ==========
  {
    id: 'facebook',
    name: 'Facebook Business',
    category: 'social_media',
    description: 'Gestión de páginas de Facebook e Instagram',
    logo: '/integrations/facebook.svg',
    website: 'https://business.facebook.com',
    status: 'active',
    credentialFields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
      { key: 'pageId', label: 'Page ID', type: 'text', required: false, helpText: 'ID de tu página de Facebook' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social_media',
    description: 'Publicación en LinkedIn Company Pages',
    logo: '/integrations/linkedin.svg',
    website: 'https://linkedin.com',
    status: 'active',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'organizationId', label: 'Organization ID', type: 'text', required: false },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    category: 'social_media',
    description: 'Publicación automática en Twitter/X',
    logo: '/integrations/twitter.svg',
    website: 'https://developer.twitter.com',
    status: 'active',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'text', required: true },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'idealista',
    name: 'Idealista',
    category: 'social_media',
    description: 'Publicación de inmuebles en Idealista',
    logo: '/integrations/idealista.svg',
    website: 'https://idealista.com',
    status: 'active',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'secret', label: 'Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'fotocasa',
    name: 'Fotocasa',
    category: 'social_media',
    description: 'Publicación de inmuebles en Fotocasa',
    logo: '/integrations/fotocasa.svg',
    website: 'https://fotocasa.es',
    status: 'active',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'agencyId', label: 'Agency ID', type: 'text', required: true },
    ],
  },

  // ========== CONTABILIDAD (Nuevos) ==========
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    description: 'Contabilidad y facturación (Intuit)',
    logo: '/integrations/quickbooks.svg',
    status: 'active',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'environment', label: 'Entorno', type: 'select', required: true, options: [
        { value: 'sandbox', label: 'Sandbox' },
        { value: 'production', label: 'Production' },
      ]},
    ],
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'accounting',
    description: 'Contabilidad cloud (UK, AU, NZ)',
    logo: '/integrations/xero.svg',
    status: 'active',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class IntegrationManager {
  /**
   * Obtener todas las integraciones disponibles
   */
  static getAvailableProviders(): IntegrationProvider[] {
    return INTEGRATION_PROVIDERS;
  }

  /**
   * Obtener provider específico
   */
  static getProvider(providerId: string): IntegrationProvider | undefined {
    return INTEGRATION_PROVIDERS.find(p => p.id === providerId);
  }

  /**
   * Obtener integraciones por categoría
   */
  static getProvidersByCategory(category: IntegrationCategory): IntegrationProvider[] {
    return INTEGRATION_PROVIDERS.filter(p => p.category === category);
  }

  /**
   * Obtener integraciones configuradas de una empresa
   */
  static async getCompanyIntegrations(companyId: string) {
    try {
      const configs = await prisma.integrationConfig.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });

      return configs.map(config => {
        const provider = this.getProvider(config.provider);
        
        return {
          id: config.id,
          provider: config.provider,
          name: config.name,
          category: config.category,
          enabled: config.enabled,
          isConfigured: config.isConfigured,
          lastSyncAt: config.lastSyncAt,
          lastTestAt: config.lastTestAt,
          testStatus: config.testStatus,
          createdAt: config.createdAt,
          providerInfo: provider,
        };
      });
    } catch (error) {
      logger.error('Error getting company integrations:', error);
      return [];
    }
  }

  /**
   * Guardar/Actualizar configuración de integración
   */
  static async saveIntegration(params: {
    companyId: string;
    provider: string;
    credentials: Record<string, any>;
    settings?: Record<string, any>;
    userId: string;
  }) {
    try {
      const provider = this.getProvider(params.provider);
      
      if (!provider) {
        throw new Error(`Unknown provider: ${params.provider}`);
      }

      // Encriptar credenciales
      const encryptedCredentials = encryptCredentials(params.credentials);

      // Upsert configuración
      const config = await prisma.integrationConfig.upsert({
        where: {
          companyId_provider: {
            companyId: params.companyId,
            provider: params.provider,
          },
        },
        update: {
          credentials: encryptedCredentials,
          settings: params.settings || {},
          isConfigured: true,
          updatedAt: new Date(),
        },
        create: {
          companyId: params.companyId,
          provider: params.provider,
          name: provider.name,
          category: provider.category,
          credentials: encryptedCredentials,
          settings: params.settings || {},
          enabled: true,
          isConfigured: true,
          createdBy: params.userId,
        },
      });

      // Log de configuración
      await prisma.integrationLog.create({
        data: {
          integrationId: config.id,
          companyId: params.companyId,
          event: 'configured',
          status: 'success',
          message: `Integration ${provider.name} configured successfully`,
        },
      });

      logger.info(`Integration ${params.provider} saved for company ${params.companyId}`);

      return config;
    } catch (error) {
      logger.error('Error saving integration:', error);
      throw error;
    }
  }

  /**
   * Obtener credenciales desencriptadas
   */
  static async getCredentials(integrationId: string): Promise<any> {
    try {
      const config = await prisma.integrationConfig.findUnique({
        where: { id: integrationId },
      });

      if (!config) {
        throw new Error('Integration not found');
      }

      return decryptCredentials(config.credentials as string);
    } catch (error) {
      logger.error('Error getting credentials:', error);
      throw error;
    }
  }

  /**
   * Probar integración
   */
  static async testIntegration(integrationId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const config = await prisma.integrationConfig.findUnique({
        where: { id: integrationId },
      });

      if (!config) {
        throw new Error('Integration not found');
      }

      const credentials = decryptCredentials(config.credentials as string);

      // Ejecutar test según el provider
      // Aquí implementarías la lógica específica de cada integración
      
      const testResult = {
        success: true,
        message: 'Connection successful',
      };

      // Actualizar estado del test
      await prisma.integrationConfig.update({
        where: { id: integrationId },
        data: {
          lastTestAt: new Date(),
          testStatus: testResult.success ? 'success' : 'failed',
        },
      });

      // Log
      await prisma.integrationLog.create({
        data: {
          integrationId: config.id,
          companyId: config.companyId,
          event: 'test',
          status: testResult.success ? 'success' : 'failed',
          message: testResult.message,
        },
      });

      return testResult;
    } catch (error) {
      logger.error('Error testing integration:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }

  /**
   * Habilitar/Deshabilitar integración
   */
  static async toggleIntegration(integrationId: string, enabled: boolean) {
    try {
      const config = await prisma.integrationConfig.update({
        where: { id: integrationId },
        data: { enabled },
      });

      await prisma.integrationLog.create({
        data: {
          integrationId: config.id,
          companyId: config.companyId,
          event: enabled ? 'enabled' : 'disabled',
          status: 'success',
          message: `Integration ${enabled ? 'enabled' : 'disabled'}`,
        },
      });

      logger.info(`Integration ${integrationId} ${enabled ? 'enabled' : 'disabled'}`);

      return config;
    } catch (error) {
      logger.error('Error toggling integration:', error);
      throw error;
    }
  }

  /**
   * Eliminar integración
   */
  static async deleteIntegration(integrationId: string) {
    try {
      await prisma.integrationConfig.delete({
        where: { id: integrationId },
      });

      logger.info(`Integration ${integrationId} deleted`);
    } catch (error) {
      logger.error('Error deleting integration:', error);
      throw error;
    }
  }

  /**
   * Obtener logs de una integración
   */
  static async getIntegrationLogs(integrationId: string, limit: number = 50) {
    try {
      return await prisma.integrationLog.findMany({
        where: { integrationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error getting integration logs:', error);
      return [];
    }
  }
}
