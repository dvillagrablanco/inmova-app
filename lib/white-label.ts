// @ts-nocheck
/**
 * White-Label Configuration Service
 *
 * Allows Enterprise plan customers to customize branding:
 * - Logo
 * - Primary/secondary colors
 * - App name
 * - Custom domain
 * - Email sender name
 *
 * Configuration stored in Company model fields.
 */

import logger from '@/lib/logger';

export interface WhiteLabelConfig {
  appName: string;
  logo: string | null;
  logoLight: string | null; // For dark backgrounds
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string | null;
  emailSenderName: string;
  emailSenderEmail: string | null;
  favicon: string | null;
  footerText: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  appName: 'Inmova',
  logo: '/logo.svg',
  logoLight: '/logo-light.svg',
  primaryColor: '#7c3aed', // Purple (Inmova brand)
  secondaryColor: '#1e40af', // Blue
  accentColor: '#10b981', // Green
  customDomain: null,
  emailSenderName: 'Inmova App',
  emailSenderEmail: null,
  favicon: '/favicon.ico',
  footerText: null,
  supportEmail: 'soporte@inmovaapp.com',
  supportPhone: null,
};

// Cache per company
const configCache = new Map<string, { config: WhiteLabelConfig; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get white-label config for a company
 * Falls back to Inmova defaults for non-Enterprise companies
 */
export async function getWhiteLabelConfig(companyId: string): Promise<WhiteLabelConfig> {
  // Check cache
  const cached = configCache.get(companyId);
  if (cached && cached.expires > Date.now()) {
    return cached.config;
  }

  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        nombre: true,
        logo: true,
        primaryColor: true,
        customDomain: true,
        plan: true,
      },
    });

    if (!company) return DEFAULT_CONFIG;

    // Only Enterprise plan gets white-label
    const isEnterprise = company.plan === 'enterprise' || company.plan === 'ENTERPRISE';

    const config: WhiteLabelConfig = {
      ...DEFAULT_CONFIG,
      appName: isEnterprise && company.nombre ? company.nombre : DEFAULT_CONFIG.appName,
      logo: isEnterprise && company.logo ? company.logo : DEFAULT_CONFIG.logo,
      primaryColor:
        isEnterprise && company.primaryColor ? company.primaryColor : DEFAULT_CONFIG.primaryColor,
      customDomain: isEnterprise && company.customDomain ? company.customDomain : null,
      emailSenderName: isEnterprise
        ? company.nombre || DEFAULT_CONFIG.emailSenderName
        : DEFAULT_CONFIG.emailSenderName,
    };

    // Cache
    configCache.set(companyId, { config, expires: Date.now() + CACHE_TTL });

    return config;
  } catch (err: any) {
    logger.warn('[WhiteLabel] Error loading config:', err.message);
    return DEFAULT_CONFIG;
  }
}

/**
 * Get CSS variables for white-label theming
 */
export function getThemeCSSVariables(config: WhiteLabelConfig): Record<string, string> {
  return {
    '--primary': config.primaryColor,
    '--secondary': config.secondaryColor,
    '--accent': config.accentColor,
  };
}

/**
 * Check if a company has white-label enabled
 */
export async function isWhiteLabelEnabled(companyId: string): Promise<boolean> {
  const config = await getWhiteLabelConfig(companyId);
  return config.appName !== DEFAULT_CONFIG.appName;
}
