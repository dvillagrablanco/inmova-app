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
      <h2 className="text-xl font-semibold">No hay contratos de gestión todavía</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Aún no has creado ningún contrato de gestión. Puedes empezar creando tu primer contrato con un propietario.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => (window.location.href = '/contratos-gestion/nuevo')} variant="default">
          Nuevo contrato de gestión
        </Button>
        <Button onClick={reset} variant="outline">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
