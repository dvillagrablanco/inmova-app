'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BrandingConfigData, generateCSSVariables } from '@/lib/branding-utils';
import logger from '@/lib/logger';

interface BrandingContextType {
  branding: BrandingConfigData | null;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  isLoading: true,
  refreshBranding: async () => {}
});

export const useBranding = () => useContext(BrandingContext);

interface BrandingProviderProps {
  children: React.ReactNode;
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = useState<BrandingConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  const loadBranding = async () => {
    try {
      if (session?.user?.companyId) {
        const response = await fetch('/api/branding');
        
        if (response.ok) {
          const data = await response.json();
          setBranding(data);
          applyBrandingToDOM(data);
        }
      }
    } catch (error) {
      logger.error('[BrandingProvider] Error loading branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadBranding();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session?.user?.companyId, status]);

  const refreshBranding = async () => {
    await loadBranding();
  };

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Aplica la configuración de branding al DOM
 */
function applyBrandingToDOM(config: BrandingConfigData) {
  if (typeof document === 'undefined') return;

  // 1. Aplicar CSS Variables
  const style = document.getElementById('dynamic-branding') || document.createElement('style');
  style.id = 'dynamic-branding';
  style.innerHTML = generateCSSVariables(config);
  
  if (!document.getElementById('dynamic-branding')) {
    document.head.appendChild(style);
  }

  // 2. Actualizar Favicon
  if (config.faviconUrl) {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    link.href = config.faviconUrl;
  }

  // 3. Actualizar Título
  if (config.metaTitle) {
    document.title = config.metaTitle;
  } else if (config.appName) {
    document.title = config.appName;
  }

  // 4. Actualizar Meta Description
  if (config.metaDescription) {
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    
    meta.content = config.metaDescription;
  }

  // 5. Actualizar OG Image
  if (config.ogImageUrl) {
    let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    
    ogImage.content = config.ogImageUrl;
  }

  // 6. Aplicar Tema
  if (config.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
