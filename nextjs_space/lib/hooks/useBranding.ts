'use client';

import { useContext } from 'react';
import { useBranding as useBrandingContext } from '@/components/BrandingProvider';

/**
 * Hook para acceder a la configuración de branding
 * 
 * @example
 * const { appName, logo, colors, isLoaded } = useBranding();
 */
export function useBranding() {
  const { branding, isLoading, refreshBranding } = useBrandingContext();

  return {
    // Identidad
    appName: branding?.appName || 'INMOVA',
    appDescription: branding?.appDescription || '',
    tagline: branding?.tagline || '',
    
    // Logos
    logo: branding?.logoUrl || '/vidaro-logo-icon.jpg',
    logoSmall: branding?.logoSmallUrl || '/vidaro-logo-icon.jpg',
    favicon: branding?.faviconUrl || '/favicon.svg',
    ogImage: branding?.ogImageUrl || '/og-image.png',
    
    // Colores
    colors: {
      primary: branding?.primaryColor || '#000000',
      secondary: branding?.secondaryColor || '#FFFFFF',
      accent: branding?.accentColor || '#6366f1',
      background: branding?.backgroundColor || '#FFFFFF',
      text: branding?.textColor || '#000000',
      success: branding?.successColor || '#22c55e',
      warning: branding?.warningColor || '#f59e0b',
      error: branding?.errorColor || '#ef4444',
    },
    
    // Tipografía
    fonts: {
      sans: branding?.fontFamily || 'Inter, sans-serif',
      heading: branding?.headingFont || 'Inter, sans-serif',
    },
    
    // UI
    ui: {
      borderRadius: branding?.borderRadius || '0.5rem',
      sidebarPosition: branding?.sidebarPosition || 'left',
      theme: branding?.theme || 'light',
    },
    
    // Contacto
    contact: {
      email: branding?.contactEmail || '',
      phone: branding?.contactPhone || '',
      website: branding?.websiteUrl || '',
      footerText: branding?.footerText || '',
    },
    
    // SEO
    seo: {
      metaTitle: branding?.metaTitle || '',
      metaDescription: branding?.metaDescription || '',
    },
    
    // Estado
    isLoaded: !isLoading,
    isLoading,
    
    // Configuración completa
    fullConfig: branding,
    
    // Métodos
    refresh: refreshBranding,
  };
}
