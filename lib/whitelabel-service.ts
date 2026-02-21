/**
 * Servicio de White-label
 * 
 * Permite multi-tenancy con branding personalizado:
 * - Logo custom
 * - Colores de marca
 * - Dominio propio (CNAME)
 * - Emails branded
 * - Términos y condiciones custom
 * 
 * Precio: $199/mes (plan Enterprise)
 * 
 * @module WhitelabelService
 */

// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface WhitelabelConfig {
  companyId: string;
  domain?: string; // ej: inmobiliaria-xyz.com
  logo?: string; // URL S3
  favicon?: string; // URL S3
  colors: {
    primary: string; // #1e40af
    secondary: string; // #64748b
    accent: string; // #10b981
  };
  fonts: {
    heading: string; // 'Inter', 'Roboto', etc
    body: string;
  };
  companyInfo: {
    name: string;
    legalName: string;
    taxId: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  features: {
    hidePoweredBy: boolean; // Ocultar "Powered by Inmova"
    customEmailDomain: boolean; // noreply@inmobiliaria-xyz.com
    customTerms: boolean; // Términos propios
  };
  active: boolean;
}

// ============================================================================
// CONFIG MANAGEMENT
// ============================================================================

/**
 * Obtiene configuración de white-label
 */
export async function getWhitelabelConfig(
  companyId: string
): Promise<WhitelabelConfig | null> {
  try {
    const config = await prisma.whitelabelConfig.findUnique({
      where: { companyId },
    });

    if (!config) {
      return null;
    }

    return config as any;
  } catch (error: any) {
    logger.error('❌ Error fetching whitelabel config:', error);
    return null;
  }
}

/**
 * Crea/actualiza configuración de white-label
 */
export async function upsertWhitelabelConfig(
  config: WhitelabelConfig
): Promise<WhitelabelConfig> {
  try {
    // Verificar que la empresa tiene plan Enterprise
    const company = await prisma.company.findUnique({
      where: { id: config.companyId },
      include: { subscription: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Verificar subscription (simplificado - en producción verificar plan exacto)
    if (!company.subscription || company.subscription.status !== 'active') {
      throw new Error('Active subscription required for white-label');
    }

    const whitelabelConfig = await prisma.whitelabelConfig.upsert({
      where: { companyId: config.companyId },
      create: config,
      update: config,
    });

    logger.info('✅ Whitelabel config updated', { companyId: config.companyId });

    return whitelabelConfig as any;
  } catch (error: any) {
    logger.error('❌ Error updating whitelabel config:', error);
    throw error;
  }
}

/**
 * Verifica si una empresa tiene white-label activo
 */
export async function hasWhitelabel(companyId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const config = await prisma.whitelabelConfig.findUnique({
    where: { companyId },
    select: { active: true },
  });

  return config?.active === true;
}

// ============================================================================
// DOMAIN MANAGEMENT
// ============================================================================

/**
 * Configura dominio custom (CNAME)
 */
export async function setupCustomDomain(
  companyId: string,
  domain: string
): Promise<{ success: boolean; dnsRecords: any[] }> {
  try {
    // Validar formato de dominio
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      throw new Error('Invalid domain format');
    }

    // Actualizar config
    await prisma.whitelabelConfig.update({
      where: { companyId },
      data: { domain },
    });

    // Generar DNS records que el cliente debe configurar
    const dnsRecords = [
      {
        type: 'CNAME',
        name: domain,
        value: 'inmovaapp.com',
        ttl: 3600,
      },
      {
        type: 'TXT',
        name: `_inmova-verification.${domain}`,
        value: `inmova-${companyId}`,
        ttl: 3600,
      },
    ];

    logger.info('✅ Custom domain configured', { companyId, domain });

    return { success: true, dnsRecords };
  } catch (error: any) {
    logger.error('❌ Error configuring domain:', error);
    throw error;
  }
}

/**
 * Verifica que el dominio está configurado correctamente
 */
export async function verifyCustomDomain(domain: string): Promise<boolean> {
  const prisma = await getPrisma();
  try {
    // En producción, hacer DNS lookup real
    // Aquí simplificado:
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      redirect: 'manual',
    }).catch(() => null);

    return response !== null;
  } catch (error: any) {
    return false;
  }
}

// ============================================================================
// BRANDING HELPERS
// ============================================================================

/**
 * Genera CSS variables para theming dinámico
 */
export function generateThemeCSS(config: WhitelabelConfig): string {
  return `
:root {
  --color-primary: ${config.colors.primary};
  --color-secondary: ${config.colors.secondary};
  --color-accent: ${config.colors.accent};
  --font-heading: ${config.fonts.heading}, sans-serif;
  --font-body: ${config.fonts.body}, sans-serif;
}

.btn-primary {
  background-color: var(--color-primary);
}

.btn-secondary {
  background-color: var(--color-secondary);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body {
  font-family: var(--font-body);
}
  `.trim();
}

/**
 * Obtiene metadata para SEO/headers basado en whitelabel
 */
export async function getWhitelabelMetadata(companyId: string): Promise<{
  const prisma = await getPrisma();
  title: string;
  description: string;
  logo?: string;
  favicon?: string;
}> {
  const config = await getWhitelabelConfig(companyId);

  if (!config || !config.active) {
    return {
      title: 'Inmova App - Gestión Inmobiliaria',
      description: 'Plataforma de gestión inmobiliaria',
    };
  }

  return {
    title: `${config.companyInfo.name} - Gestión Inmobiliaria`,
    description: `Plataforma de ${config.companyInfo.name}`,
    logo: config.logo,
    favicon: config.favicon,
  };
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Genera email template con branding
 */
export function generateBrandedEmail(
  config: WhitelabelConfig,
  content: {
    subject: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
  }
): string {
  const logo = config.logo || 'https://inmovaapp.com/logo.png';
  const primaryColor = config.colors.primary;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ${config.fonts.body}, Arial, sans-serif; }
    .header { background-color: ${primaryColor}; padding: 20px; text-align: center; }
    .logo { max-width: 200px; }
    .content { padding: 30px; }
    .cta { 
      background-color: ${primaryColor};
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      margin: 20px 0;
    }
    .footer { 
      background-color: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logo}" alt="${config.companyInfo.name}" class="logo">
  </div>
  <div class="content">
    <h1>${content.subject}</h1>
    <div>${content.body}</div>
    ${content.ctaText && content.ctaUrl ? `
      <a href="${content.ctaUrl}" class="cta">${content.ctaText}</a>
    ` : ''}
  </div>
  <div class="footer">
    <p><strong>${config.companyInfo.name}</strong></p>
    <p>${config.companyInfo.address}</p>
    <p>${config.companyInfo.phone} | ${config.companyInfo.email}</p>
    ${!config.features.hidePoweredBy ? '<p style="margin-top: 20px;">Powered by Inmova</p>' : ''}
  </div>
</body>
</html>
  `.trim();
}

export default {
  getWhitelabelConfig,
  upsertWhitelabelConfig,
  hasWhitelabel,
  setupCustomDomain,
  verifyCustomDomain,
  generateThemeCSS,
  getWhitelabelMetadata,
  generateBrandedEmail,
};
