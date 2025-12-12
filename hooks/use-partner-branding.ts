/**
 * Hook para obtener y aplicar el branding de un partner
 */

import { useEffect, useState } from 'react';

export interface PartnerBranding {
  nombre: string;
  logo?: string;
  logoHeader?: string;
  logoFooter?: string;
  coloresPrimarios?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  mensajeBienvenida?: string;
  dominioPersonalizado?: string;
}

export function usePartnerBranding() {
  const [branding, setBranding] = useState<PartnerBranding | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerCode, setPartnerCode] = useState<string | null>(null);

  // Get partner code from URL on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setPartnerCode(params.get('partner'));
    }
  }, []);

  useEffect(() => {
    if (!partnerCode) {
      setBranding(null);
      return;
    }

    const fetchBranding = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/partners/branding?code=${partnerCode}`);
        
        if (!response.ok) {
          throw new Error('No se pudo obtener el branding del partner');
        }

        const data = await response.json();
        setBranding(data.branding);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('partnerCode', partnerCode);
        }
      } catch (err) {
        console.error('Error al cargar branding de partner:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setBranding(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [partnerCode]);

  useEffect(() => {
    if (branding?.coloresPrimarios && typeof document !== 'undefined') {
      const root = document.documentElement;
      
      if (branding.coloresPrimarios.primary) {
        root.style.setProperty('--partner-primary', branding.coloresPrimarios.primary);
      }
      if (branding.coloresPrimarios.secondary) {
        root.style.setProperty('--partner-secondary', branding.coloresPrimarios.secondary);
      }
      if (branding.coloresPrimarios.accent) {
        root.style.setProperty('--partner-accent', branding.coloresPrimarios.accent);
      }
    }

    return () => {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.removeProperty('--partner-primary');
        root.style.removeProperty('--partner-secondary');
        root.style.removeProperty('--partner-accent');
      }
    };
  }, [branding]);

  return {
    branding,
    isLoading,
    error,
    hasPartner: !!partnerCode,
    partnerCode,
  };
}

export function useStoredPartnerCode(): string | null {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('partnerCode');
      setCode(stored);
    }
  }, []);

  return code;
}
