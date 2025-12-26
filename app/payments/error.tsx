/**
 * Error Boundary para Pagos
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
    logger.error('Error en página de pagos:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[400px] items-center justify-center p-6">
      <ErrorDisplay
        title="Error al cargar pagos"
        message="No se pudieron cargar los pagos. Verifica tu conexión e inténtalo de nuevo."
        retry={reset}
        returnUrl="/dashboard"
        showHomeButton
      />
    </div>
  );
}
