/**
 * Error Suppression Configuration
 * 
 * Define qué errores de consola no son críticos y pueden ser ignorados.
 * Útil para errores conocidos de librerías de terceros que no afectan funcionalidad.
 */

// Lista de patrones de error que se pueden ignorar de forma segura
export const IGNORABLE_ERROR_PATTERNS = [
  // Errores de hidratación conocidos (React 18 SSR)
  'Hydration failed because',
  'There was an error while hydrating',
  'Text content does not match server-rendered HTML',
  'Minified React error',
  'did not match',
  'Expected server HTML',
  
  // Errores de ResizeObserver (no críticos)
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  
  // Errores de extensiones del navegador
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  
  // Errores de third-party scripts
  'crisp.chat',
  'googletagmanager',
  'hotjar',
  'clarity',
  'gtag',
  'analytics',
  'facebook',
  'fbevents',
  'stripe',
  'intercom',
  'drift',
  'hubspot',
  
  // Errores de CSS durante SSR (bug conocido de Next.js)
  'Invalid or unexpected token',
  'Unexpected token',
  
  // Errores de WebSocket en development
  'WebSocket connection to',
  'WebSocket is already',
  
  // Errores de Service Worker
  'Service Worker registration failed',
  'ServiceWorker',
  
  // Errores de Network
  'net::ERR_',
  'NetworkError',
  'Failed to fetch',
  'Load failed',
  'Network request failed',
  
  // Errores de Next.js internos
  'NEXT_REDIRECT',
  'next-action-id',
  '_next/static',
  
  // Errores de mapas y geolocalización
  'mapbox',
  'google.maps',
  'geolocation',
  
  // Errores de cookies/storage
  'localStorage',
  'sessionStorage',
  'CookieStore',
  'QuotaExceededError',
];

// Lista de warnings que se pueden ignorar
export const IGNORABLE_WARNING_PATTERNS = [
  'Warning: Each child in a list should have a unique "key" prop',
  'Warning: validateDOMNesting',
  'Warning: Cannot update a component',
  'Warning: React does not recognize',
  'DevTools failed to load source map',
];

/**
 * Verifica si un mensaje de error puede ser ignorado
 */
export function shouldIgnoreError(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  
  return IGNORABLE_ERROR_PATTERNS.some(pattern => 
    message.includes(pattern)
  );
}

/**
 * Verifica si un warning puede ser ignorado
 */
export function shouldIgnoreWarning(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  
  return IGNORABLE_WARNING_PATTERNS.some(pattern => 
    message.includes(pattern)
  );
}

/**
 * Inicializa la supresión de errores en el cliente
 * Solo se activa en producción para evitar ocultar errores reales durante desarrollo
 */
export function initErrorSuppression(): void {
  if (typeof window === 'undefined') return;
  
  // Solo en producción
  if (process.env.NODE_ENV !== 'production') return;
  
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function (...args: any[]) {
    const message = args.map(a => String(a)).join(' ');
    if (!shouldIgnoreError(message)) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = function (...args: any[]) {
    const message = args.map(a => String(a)).join(' ');
    if (!shouldIgnoreWarning(message)) {
      originalWarn.apply(console, args);
    }
  };
}
