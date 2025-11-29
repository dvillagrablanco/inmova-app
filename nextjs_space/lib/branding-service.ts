import { prisma } from './db';
import { BrandingConfig } from '@prisma/client';

/**
 * Servicio de gestión de personalización White Label
 * Permite a cada empresa/cliente configurar su propia identidad visual
 */

export interface BrandingConfigData {
  appName?: string;
  appDescription?: string;
  tagline?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  fontFamily?: string;
  headingFont?: string;
  borderRadius?: string;
  sidebarPosition?: string;
  theme?: string;
  footerText?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  activo?: boolean;
}

/**
 * Obtiene la configuración de branding para una empresa
 * Si no existe, retorna valores por defecto
 */
export async function getBrandingConfig(companyId: string): Promise<BrandingConfig | null> {
  try {
    const config = await prisma.brandingConfig.findUnique({
      where: { companyId }
    });
    
    if (!config) {
      return getDefaultBranding(companyId);
    }
    
    return config;
  } catch (error) {
    console.error('[Branding Service] Error getting config:', error);
    return getDefaultBranding(companyId);
  }
}

/**
 * Actualiza o crea la configuración de branding para una empresa
 */
export async function updateBrandingConfig(
  companyId: string,
  data: BrandingConfigData
): Promise<BrandingConfig> {
  try {
    const config = await prisma.brandingConfig.upsert({
      where: { companyId },
      create: {
        companyId,
        ...data
      },
      update: data
    });
    
    return config;
  } catch (error) {
    console.error('[Branding Service] Error updating config:', error);
    throw new Error('Error al actualizar la configuración de personalización');
  }
}

/**
 * Retorna la configuración por defecto de INMOVA
 */
export function getDefaultBranding(companyId: string): BrandingConfig {
  return {
    id: 'default',
    companyId,
    appName: 'INMOVA',
    appDescription: 'Innovación Inmobiliaria - Sistema de Gestión Integral',
    tagline: 'Tu socio en gestión inmobiliaria',
    logoUrl: null,
    logoSmallUrl: null,
    faviconUrl: null,
    ogImageUrl: null,
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#6366f1',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    fontFamily: 'Inter, sans-serif',
    headingFont: null,
    borderRadius: '0.5rem',
    sidebarPosition: 'left',
    theme: 'light',
    footerText: null,
    contactEmail: null,
    contactPhone: null,
    websiteUrl: null,
    metaTitle: null,
    metaDescription: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Genera las variables CSS dinámicas basadas en la configuración
 */
export function generateCSSVariables(config: BrandingConfig): string {
  return `
    :root {
      --primary: ${config.primaryColor};
      --secondary: ${config.secondaryColor};
      --accent: ${config.accentColor};
      --background: ${config.backgroundColor};
      --foreground: ${config.textColor};
      --success: ${config.successColor};
      --warning: ${config.warningColor};
      --error: ${config.errorColor};
      --font-sans: ${config.fontFamily};
      --font-heading: ${config.headingFont || config.fontFamily};
      --radius: ${config.borderRadius};
    }
  `.trim();
}

/**
 * Valida el contraste de colores para accesibilidad WCAG
 */
export function validateColorContrast(bgColor: string, fgColor: string): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
} {
  // Función simplificada de validación de contraste
  // En producción, usar una librería como 'color-contrast-checker'
  
  const getLuminance = (color: string): number => {
    // Convertir hex a RGB y calcular luminancia relativa
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(bgColor);
  const l2 = getLuminance(fgColor);
  
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7
  };
}

/**
 * Elimina la configuración de branding de una empresa
 */
export async function deleteBrandingConfig(companyId: string): Promise<void> {
  try {
    await prisma.brandingConfig.delete({
      where: { companyId }
    });
  } catch (error) {
    console.error('[Branding Service] Error deleting config:', error);
    throw new Error('Error al eliminar la configuración de personalización');
  }
}

/**
 * Clona la configuración de branding de una empresa a otra
 */
export async function cloneBrandingConfig(
  sourceCompanyId: string,
  targetCompanyId: string
): Promise<BrandingConfig> {
  try {
    const sourceConfig = await getBrandingConfig(sourceCompanyId);
    
    if (!sourceConfig) {
      throw new Error('No se encontró configuración de origen');
    }
    
    // Crear nueva configuración sin el ID y convertir null a undefined
    const { id, companyId, createdAt, updatedAt, ...rest } = sourceConfig;
    
    // Convertir todos los null a undefined para compatibilidad con BrandingConfigData
    const configData: BrandingConfigData = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, value === null ? undefined : value])
    ) as BrandingConfigData;
    
    return await updateBrandingConfig(targetCompanyId, configData);
  } catch (error) {
    console.error('[Branding Service] Error cloning config:', error);
    throw new Error('Error al clonar la configuración de personalización');
  }
}
