'use client';

import { useEffect } from 'react';
import { useWhiteScreenDetector } from '@/lib/white-screen-detector';

/**
 * Componente de Monitoreo de Pantalla Blanca
 * 
 * Se monta automáticamente en el árbol de componentes para
 * detectar y prevenir pantallas blancas causadas por errores.
 * 
 * Features:
 * - Detección automática cada 5 segundos
 * - Recuperación automática cuando es posible
 * - UI de emergencia si la app crashea completamente
 * 
 * @example
 * <Providers>
 *   <WhiteScreenMonitor />
 *   {children}
 * </Providers>
 */
export function WhiteScreenMonitor() {
  const { start, stop } = useWhiteScreenDetector();

  useEffect(() => {
    // Solo en cliente
    if (typeof window === 'undefined') return;

    // Solo en producción (en desarrollo es molesto)
    const isProduction = process.env.NODE_ENV === 'production';
    
    // O forzar en desarrollo con flag
    const forceMonitoring = process.env.NEXT_PUBLIC_FORCE_WHITE_SCREEN_MONITOR === 'true';

    if (isProduction || forceMonitoring) {
      // Iniciar monitoreo
      start((details) => {
        console.error('🔴 [WhiteScreenMonitor] Pantalla blanca detectada:', details);

        // Aquí podrías enviar a un servicio de monitoreo
        // Por ejemplo: Sentry, Datadog, etc.
        try {
          // Ejemplo con fetch (si tienes un endpoint de logging)
          fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'WHITE_SCREEN_DETECTED',
              details,
              userAgent: navigator.userAgent,
              url: window.location.href,
              timestamp: new Date().toISOString(),
            }),
          }).catch(e => console.error('Failed to log white screen:', e));
        } catch (e) {
          // Silencioso
        }
      });

      // Cleanup
      return () => {
        stop();
      };
    }
  }, [start, stop]);

  // Este componente no renderiza nada visible
  return null;
}
