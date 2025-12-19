'use client';

import { useEffect } from 'react';

/**
 * Componente para suprimir hydration warnings/errors en producción
 * Solo debe usarse después de verificar que no hay errores reales de hidratación
 */
export function HydrationErrorSuppressor() {
  useEffect(() => {
    // Solo suprimir en producción
    if (process.env.NODE_ENV === 'production') {
      // Suprimir warnings de hydration en consola
      const originalError = console.error;
      console.error = (...args: any[]) => {
        const errorMessage = args[0]?.toString() || '';
        
        // Filtrar mensajes específicos de hydration
        const hydrationPatterns = [
          'Hydration',
          'hydration',
          'did not match',
          'Warning: Expected server',
          'Warning: Text content',
        ];

        const isHydrationError = hydrationPatterns.some(pattern =>
          errorMessage.includes(pattern)
        );

        if (!isHydrationError) {
          originalError.apply(console, args);
        }
      };

      // Suprimir warnings de React
      const originalWarn = console.warn;
      console.warn = (...args: any[]) => {
        const warnMessage = args[0]?.toString() || '';
        
        const hydrationPatterns = [
          'Hydration',
          'hydration',
          'did not match',
        ];

        const isHydrationWarning = hydrationPatterns.some(pattern =>
          warnMessage.includes(pattern)
        );

        if (!isHydrationWarning) {
          originalWarn.apply(console, args);
        }
      };
    }
  }, []);

  return null;
}
