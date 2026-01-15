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
  'Hydration mismatch',
  'hydration mismatch',
  'Warning: Prop',
  'Warning: Extra attributes',
  'client rendered output',
  'server rendered output',
  'An error occurred during hydration',
  
  // Errores de ResizeObserver (no críticos)
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'ResizeObserver',
  
  // Errores de extensiones del navegador
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'extension://',
  
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
  'zendesk',
  'tawk.to',
  'livechat',
  'freshdesk',
  'sentry',
  'segment',
  'mixpanel',
  'amplitude',
  'heap',
  'fullstory',
  'logrocket',
  'smartlook',
  'mouseflow',
  'recaptcha',
  'grecaptcha',
  'hcaptcha',
  
  // Errores de CSS durante SSR (bug conocido de Next.js)
  'Invalid or unexpected token',
  'Unexpected token',
  'SyntaxError:',
  
  // Errores de WebSocket en development
  'WebSocket connection to',
  'WebSocket is already',
  'WebSocket closed',
  
  // Errores de Service Worker
  'Service Worker registration failed',
  'ServiceWorker',
  'sw.js',
  
  // Errores de Network (muy comunes en móvil)
  'net::ERR_',
  'NetworkError',
  'Failed to fetch',
  'Load failed',
  'Network request failed',
  'ERR_NETWORK',
  'ERR_INTERNET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'AbortError',
  'The operation was aborted',
  'AbortController',
  'Request aborted',
  'Aborted',
  'cancelled',
  'timeout',
  
  // Errores de Next.js internos
  'NEXT_REDIRECT',
  'next-action-id',
  '_next/static',
  '_next/image',
  'NEXT_NOT_FOUND',
  'notFound()',
  'redirect()',
  
  // Errores de React internos
  'act(...)',
  'ReactDOM.render',
  'Rendering suspended',
  'Suspense boundary',
  'Caught an error',
  'The above error occurred',
  
  // Errores de mapas y geolocalización
  'mapbox',
  'google.maps',
  'geolocation',
  'Maps API',
  
  // Errores de cookies/storage
  'localStorage',
  'sessionStorage',
  'CookieStore',
  'QuotaExceededError',
  'SecurityError',
  'Access denied',
  'cross-origin',
  
  // Errores de imagen
  'Image failed to load',
  'Failed to load image',
  'Image load error',
  'decoding-failed',
  
  // Errores de audio/video
  'The play() request was interrupted',
  'NotAllowedError',
  'NotSupportedError',
  
  // Errores de fonts
  'Font loading',
  'Failed to decode',
  
  // Errores de scroll/navigation
  'scrollRestoration',
  'scroll-behavior',
  'popstate',
];

// Lista de warnings que se pueden ignorar
export const IGNORABLE_WARNING_PATTERNS = [
  'Warning: Each child in a list should have a unique "key" prop',
  'Warning: validateDOMNesting',
  'Warning: Cannot update a component',
  'Warning: React does not recognize',
  'DevTools failed to load source map',
  'Warning: A component is changing',
  'Warning: Function components cannot be given refs',
  'Warning: forwardRef render functions',
  'Warning: useLayoutEffect',
  'Warning: Encountered two children',
  'Warning: Can\'t perform a React state update',
  'Warning: Maximum update depth exceeded',
  'act() not wrapped in a test',
  'ReactDOMTestUtils.act',
  'deprecated',
  'DEPRECATED',
  'experimental',
  'will be removed',
  'Sourcemap',
  'source map',
  'sourceMap',
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
