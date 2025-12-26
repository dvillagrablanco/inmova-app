/**
 * Web Vitals - Monitoreo de Core Web Vitals
 *
 * Captura y reporta métricas de performance críticas:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 600ms
 */

// Definir tipo Metric localmente para evitar dependencia directa
export interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
}

interface VitalReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Thresholds para clasificación
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Función para enviar métricas al servidor
async function sendToAnalytics(metric: VitalReport) {
  try {
    // En producción, enviar a tu endpoint de analytics
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vital] ${metric.name}:`, {
        value: `${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`,
        rating: metric.rating,
        id: metric.id,
      });
    }
  } catch (error) {
    console.error('Error sending web vitals:', error);
  }
}

// Función principal de reporte
export function reportWebVitals(metric: Metric) {
  const report: VitalReport = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // Enviar a analytics
  sendToAnalytics(report);

  // Almacenar en performance buffer
  if (typeof window !== 'undefined') {
    window.webVitalsBuffer = window.webVitalsBuffer || [];
    window.webVitalsBuffer.push(report);
  }
}

// Hook personalizado para obtener métricas
export function getWebVitals(): VitalReport[] {
  if (typeof window === 'undefined') return [];
  return window.webVitalsBuffer || [];
}

// Función para inicializar el monitoreo
export async function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    // Intentar importar web-vitals dinámicamente
    // Si no está disponible, fallar silenciosamente
    const webVitals = await import('web-vitals').catch(() => null);

    if (!webVitals) {
      // Web vitals no disponible, continuar sin él
      return;
    }

    const { onCLS, onFCP, onLCP, onTTFB, onINP } = webVitals;

    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);

    // INP (Interaction to Next Paint) - reemplaza FID en web-vitals v3+
    if (onINP) {
      onINP(reportWebVitals);
    }
  } catch (error) {
    // Error silencioso - web vitals es opcional
    if (process.env.NODE_ENV === 'development') {
      console.warn('Web vitals not available:', error);
    }
  }
}

// Agregar tipos globales
declare global {
  interface Window {
    webVitalsBuffer?: VitalReport[];
  }
}
