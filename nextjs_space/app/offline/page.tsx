'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Sin Conexión</CardTitle>
          <CardDescription>
            No se puede conectar al servidor. Verifica tu conexión a internet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p className="mb-2">
              Algunas funciones pueden estar limitadas mientras estés sin conexión.
            </p>
            <p>
              Los datos cacheados estarán disponibles para consulta.
            </p>
          </div>
          <Button onClick={handleRefresh} className="w-full" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar Conexión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
