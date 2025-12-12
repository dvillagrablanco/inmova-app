import type { BrandingConfig } from '@prisma/client';
import logger from '@/lib/logger';

/**
 * Utilidades de Branding - Pueden usarse en cliente y servidor
 * NO importa Prisma ni código de servidor
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
 * Sanitiza valores CSS para prevenir XSS e inyección de código
 * OWASP A03:2021 – Injection
 */
function sanitizeCSSValue(value: string | null | undefined): string {
  if (!value) return '';
  
  // Convertir a string y limpiar
  const str = String(value).trim();
  
  // Bloquear caracteres y patrones peligrosos
  const sanitized = str
    .replace(/[<>"'`]/g, '') // Eliminar caracteres HTML peligrosos
    .replace(/javascript:/gi, '') // Bloquear javascript: URLs
    .replace(/data:/gi, '') // Bloquear data: URLs
    .replace(/on\w+=/gi, '') // Bloquear event handlers
    .replace(/expression\(/gi, '') // Bloquear CSS expressions (IE)
    .replace(/import\s/gi, '') // Bloquear @import
    .replace(/;.*}/g, '') // Prevenir cierre prematuro de bloques
    .replace(/\/\*/g, '') // Eliminar comentarios CSS inicio
    .replace(/\*\//g, ''); // Eliminar comentarios CSS fin
  
  // Validar que el valor resultante sea seguro
  // Solo permitir caracteres alfanuméricos, #, -, %, espacios, y paréntesis
  const safePattern = /^[a-zA-Z0-9\s#\-_%(),.']+$/;
  
  if (!safePattern.test(sanitized)) {
    logger.warn('[Branding] Valor CSS potencialmente peligroso bloqueado:', value);
    return '';
  }
  
  return sanitized;
}

/**
 * Valida que un color sea un formato hex válido
 */
function isValidHexColor(color: string | null | undefined): boolean {
  if (!color) return false;
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(color);
}

/**
 * Genera las variables CSS para aplicar el branding
 * CON SANITIZACIÓN para prevenir XSS (OWASP A03:2021)
 */
export function generateCSSVariables(config: BrandingConfig): string {
  // Sanitizar TODOS los valores antes de generar CSS
  const primary = isValidHexColor(config.primaryColor) 
    ? config.primaryColor 
    : '#000000';
    
  const secondary = isValidHexColor(config.secondaryColor) 
    ? config.secondaryColor 
    : '#FFFFFF';
    
  const accent = isValidHexColor(config.accentColor) 
    ? config.accentColor 
    : '#4F46E5';
    
  const background = isValidHexColor(config.backgroundColor) 
    ? config.backgroundColor 
    : '#FFFFFF';
    
  const foreground = isValidHexColor(config.textColor) 
    ? config.textColor 
    : '#000000';
    
  const success = isValidHexColor(config.successColor) 
    ? config.successColor 
    : '#22C55E';
    
  const warning = isValidHexColor(config.warningColor) 
    ? config.warningColor 
    : '#F59E0B';
    
  const error = isValidHexColor(config.errorColor) 
    ? config.errorColor 
    : '#EF4444';
  
  // Sanitizar fuentes y border radius
  const fontSans = sanitizeCSSValue(config.fontFamily) || 'Inter, system-ui, sans-serif';
  const fontHeading = sanitizeCSSValue(config.headingFont || config.fontFamily) || fontSans;
  const radius = sanitizeCSSValue(config.borderRadius) || '0.5rem';
  
  return `
    :root {
      --primary: ${primary};
      --secondary: ${secondary};
      --accent: ${accent};
      --background: ${background};
      --foreground: ${foreground};
      --success: ${success};
      --warning: ${warning};
      --error: ${error};
      --font-sans: ${fontSans};
      --font-heading: ${fontHeading};
      --radius: ${radius};
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
