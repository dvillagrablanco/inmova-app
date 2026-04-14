'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ContratosGestionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Contratos Gestión error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <h2 className="text-xl font-semibold">Error al cargar Contratos de Gestión</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Hubo un problema al cargar esta página. Puede que el módulo no esté configurado todavía.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Reintentar
        </Button>
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
          Ir al Dashboard
        </Button>
      </div>
    </div>
  );
}
