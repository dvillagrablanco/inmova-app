/**
 * Error Boundary para Contratos
 * 
 * Captura y muestra errores que ocurren en la página de contratos.
 * Proporciona opciones de recuperación para el usuario.
 * 
 * @since Semana 2, Tarea 2.5
 */

'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/ui/error-display';
import logger from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para monitoreo
    logger.error('Error en página de contratos:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[400px] items-center justify-center p-6">
      <ErrorDisplay
        title="Error al cargar contratos"
        message="No se pudieron cargar los contratos. Por favor, inténtalo de nuevo o contacta con soporte si el problema persiste."
        retry={reset}
        returnUrl="/dashboard"
        showHomeButton
      />
    </div>
  );
}
