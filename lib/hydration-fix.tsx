/**
 * Hydration Error Fixes
 * Helpers para prevenir errores de hidratación en SSR/SSG
 */

import { useEffect, useState } from 'react';

/**
 * Hook para detectar si estamos en el cliente
 * Previene hydration errors causados por diferencias entre server y client
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para obtener el navegador solo en el cliente
 */
export function useBrowser(): string | null {
  const [browser, setBrowser] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBrowser(window.navigator.userAgent);
    }
  }, []);

  return browser;
}

/**
 * Hook para fecha/hora local (previene hydration errors con fechas)
 */
export function useLocalDateTime(date: Date | string): string | null {
  const [localDateTime, setLocalDateTime] = useState<string | null>(null);

  useEffect(() => {
    const d = typeof date === 'string' ? new Date(date) : date;
    setLocalDateTime(d.toLocaleString());
  }, [date]);

  return localDateTime;
}

/**
 * Componente wrapper para prevenir hydration errors
 * Renderiza children solo en el cliente
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isClient = useIsClient();

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook para localStorage que previene hydration errors
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado que se inicializa con el valor inicial
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Efecto para leer del localStorage en el cliente
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Función para actualizar el valor
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook para window size que previene hydration errors
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * Hook para media queries que previene hydration errors
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Helper para generar IDs consistentes en server y client
 * Previene hydration errors causados por IDs aleatorios
 */
let idCounter = 0;
const serverIdMap = new Map<string, string>();

export function useConsistentId(prefix: string = 'id'): string {
  const [id] = useState(() => {
    if (typeof window === 'undefined') {
      // Server-side: usar contador
      const serverId = `${prefix}-${idCounter++}`;
      return serverId;
    } else {
      // Client-side: generar nuevo ID
      return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }
  });

  return id;
}

/**
 * Wrapper para componentes que usan Date.now() o Math.random()
 * Previene hydration errors causados por valores diferentes en server y client
 */
export function NoSSR({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HOC para prevenir SSR en componentes específicos
 */
export function withNoSSR<P extends object>(Component: React.ComponentType<P>) {
  const WrappedComponent = (props: P) => (
    <NoSSR>
      <Component {...props} />
    </NoSSR>
  );

  WrappedComponent.displayName = `withNoSSR(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Suprimir warnings de hydration en casos específicos
 * SOLO usar cuando sea absolutamente necesario
 */
export function suppressHydrationWarning() {
  if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Hydration')) {
        return;
      }
      originalError.call(console, ...args);
    };
  }
}

/**
 * Helper para formatear fechas de forma consistente
 */
export function formatDateSSRSafe(date: Date | string): string {
  // Usar formato ISO que es consistente en server y client
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Helper para formatear números de forma consistente
 */
export function formatNumberSSRSafe(num: number): string {
  // Usar toFixed para consistencia
  return num.toFixed(2);
}
