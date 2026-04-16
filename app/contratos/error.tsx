'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Contratos] Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <FileText className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">No hay contratos asociados</h2>
      <p className="text-muted-foreground text-center max-w-md">
        No hay contratos asociados a este inmueble o inquilino. Puedes crear un nuevo contrato
        para empezar.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => (window.location.href = '/contratos/nuevo')} variant="default">
          Crear contrato
        </Button>
        <Button onClick={reset} variant="outline">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
