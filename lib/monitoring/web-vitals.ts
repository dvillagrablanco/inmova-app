/**
 * Web Vitals Monitoring
 *
 * Captura métricas Core Web Vitals y las envía a analytics
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB, onINP, type Metric } from 'web-vitals';

// Types
interface WebVitalsData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface AnalyticsEndpoint {
  sendWebVitals: (data: WebVitalsData) => Promise<void>;
  sendError: (error: Error) => Promise<void>;
  sendEvent: (event: string, data: any) => Promise<void>;
}

// Configuración
const config = {
  debug: process.env.NODE_ENV === 'development',
  endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics/web-vitals',
  sampleRate: parseFloat(process.env.NEXT_PUBLIC_VITALS_SAMPLE_RATE || '1.0'), // 100% por defecto
};

// Helper para enviar datos
async function sendToAnalytics(data: WebVitalsData): Promise<void> {
  // Sample rate (para reducir volumen en producción)
  if (Math.random() > config.sampleRate) return;

  try {
    // Usar sendBeacon si está disponible (no bloquea navegación)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(config.endpoint, blob);
    } else {
      // Fallback a fetch
      fetch(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true, // No cancelar si se navega
      });
    }

    if (config.debug) {
      console.log('📊 Web Vitals:', data);
    }
  } catch (error) {
    // Silenciar errores de analytics (no debe romper la app)
    if (config.debug) {
      console.error('Analytics error:', error);
    }
  }
}

// Calcular rating según thresholds de Google
function calculateRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Callback para procesar métricas
function handleWebVital(metric: Metric): void {
  const data: WebVitalsData = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating as 'good' | 'needs-improvement' | 'poor',
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  sendToAnalytics(data);
}

// Inicializar tracking
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Core Web Vitals (CWV)
  getCLS(handleWebVital);
  getFID(handleWebVital);
  getLCP(handleWebVital);

  // Otras métricas útiles
  getFCP(handleWebVital);
  getTTFB(handleWebVital);

  // INP (reemplaza FID en Chrome 96+)
  onINP(handleWebVital);
}

// Export helper para usar en _app.tsx
export function reportWebVitals(metric: Metric): void {
  handleWebVital(metric);
}

// Tracking de errores de rendimiento
export function trackPerformanceIssue(issue: string, context: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  const data = {
    type: 'performance-issue',
    issue,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  };

  sendToAnalytics(data as any);
}

// Tracking de recursos lentos
export function trackSlowResource(resourceName: string, duration: number): void {
  if (duration < 1000) return; // Solo si tarda más de 1s

  trackPerformanceIssue('slow-resource', {
    resourceName,
    duration,
  });
}

// Tracking de componentes lentos
export function trackSlowComponent(componentName: string, renderTime: number): void {
  if (renderTime < 50) return; // Solo si render > 50ms

  trackPerformanceIssue('slow-component', {
    componentName,
    renderTime,
  });
}

// Hook para medir renders en componentes React
export function usePerformanceMonitoring(componentName: string) {
  if (typeof window === 'undefined') return;

  const start = performance.now();

  // En cleanup, medir duración
  return () => {
    const duration = performance.now() - start;
    if (duration > 50) {
      trackSlowComponent(componentName, duration);
    }
  };
}

// Tracking de interacciones de usuario
export function trackInteraction(action: string, target: string, duration?: number): void {
  const data = {
    type: 'user-interaction',
    action,
    target,
    duration,
    timestamp: Date.now(),
    url: window.location.href,
  };

  sendToAnalytics(data as any);
}

// Observador de long tasks (> 50ms en main thread)
export function observeLongTasks(): void {
  if (typeof window === 'undefined') return;
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          trackPerformanceIssue('long-task', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // PerformanceObserver no soportado en navegador
  }
}

// Observador de layout shifts (para CLS)
export function observeLayoutShifts(): void {
  if (typeof window === 'undefined') return;
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any;
        if (!layoutShift.hadRecentInput && layoutShift.value > 0.1) {
          trackPerformanceIssue('layout-shift', {
            value: layoutShift.value,
            sources: layoutShift.sources?.map((s: any) => ({
              node: s.node?.tagName,
              previousRect: s.previousRect,
              currentRect: s.currentRect,
            })),
          });
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    // No soportado
  }
}

// Inicializar todos los observadores
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  initWebVitals();
  observeLongTasks();
  observeLayoutShifts();

  if (config.debug) {
    console.log('✅ Performance monitoring initialized');
  }
}
