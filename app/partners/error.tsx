'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PartnersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Partners Error]:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Error en Partners</h2>
          <p className="text-sm text-gray-600">No se pudo cargar el portal de partners.</p>
          {error.digest && <p className="text-xs text-gray-400">Ref: {error.digest}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
          <Button onClick={() => (window.location.href = '/partners')} variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
