'use client';

import { useEffect } from 'react';
import { initErrorSuppression } from '@/lib/error-suppression';

/**
 * Componente cliente que inicializa la supresión de errores
 * Solo activo en producción para no ocultar errores de desarrollo
 */
export function ErrorSuppressionInitializer() {
  useEffect(() => {
    initErrorSuppression();
  }, []);

  return null;
}
