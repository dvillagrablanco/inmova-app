/**
 * Componente para mostrar errores de Rate Limit de forma amigable
 */

'use client';

import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState } from 'react';

interface RateLimitErrorProps {
  retryAfter: number; // Segundos hasta que se puede reintentar
  onRetryReady?: () => void;
}

export function RateLimitError({
  retryAfter: initialRetryAfter,
  onRetryReady,
}: RateLimitErrorProps) {
  const [retryAfter, setRetryAfter] = useState(initialRetryAfter);

  useEffect(() => {
    if (retryAfter <= 0) {
      onRetryReady?.();
      return;
    }

    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          onRetryReady?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter, onRetryReady]);

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Demasiados intentos</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>Por seguridad, debes esperar antes de intentar nuevamente.</p>
        {retryAfter > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold text-lg">
              {Math.floor(retryAfter / 60)}:{String(retryAfter % 60).padStart(2, '0')}
            </span>
          </div>
        )}
        {retryAfter <= 0 && (
          <p className="text-green-600 dark:text-green-400 font-semibold">
            ✓ Ya puedes intentar de nuevo
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook para detectar errores de rate limit
 */
export function isRateLimitError(error: any): { isRateLimit: boolean; retryAfter: number } {
  if (!error) {
    return { isRateLimit: false, retryAfter: 0 };
  }

  // Detectar error de rate limit desde respuesta JSON
  if (error.retryAfter !== undefined) {
    return {
      isRateLimit: true,
      retryAfter: error.retryAfter,
    };
  }

  // Detectar desde mensaje de error
  if (typeof error === 'string' && error.toLowerCase().includes('rate limit')) {
    // Intentar extraer el número de segundos del mensaje
    const match = error.match(/(\d+)\s*second/i);
    return {
      isRateLimit: true,
      retryAfter: match ? parseInt(match[1]) : 60,
    };
  }

  // Detectar desde status code 429
  if (error.status === 429 || error.statusCode === 429) {
    return {
      isRateLimit: true,
      retryAfter: error.retryAfter || 60,
    };
  }

  return { isRateLimit: false, retryAfter: 0 };
}
