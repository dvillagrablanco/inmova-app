'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EdificioErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error en página de edificio:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/edificios')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Edificios
          </Button>
        </div>

        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-16 w-16 text-destructive mb-4" />
              <h2 className="text-2xl font-bold text-destructive mb-2">
                Error al cargar el edificio
              </h2>
              <p className="text-muted-foreground mb-2">
                Ha ocurrido un error inesperado al cargar los detalles del edificio.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {error.message || 'Error desconocido'}
              </p>
              <div className="flex gap-3">
                <Button onClick={() => reset()} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
                <Button onClick={() => router.push('/edificios')}>
                  Volver al listado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
