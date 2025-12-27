'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home, FileText, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import logger, { logError } from '@/lib/logger';

/**
 * Offline Page - Enhanced fallback when no connection
 * PWA Enhancement for INMOVA
 */
export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Get last sync time from localStorage
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime).toLocaleString('es-ES'));
    }
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      logger.error('Still offline');
    } finally {
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main offline card */}
        <Card className="border-2 border-yellow-500">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-100 rounded-full">
                <WifiOff className="h-12 w-12 text-yellow-600" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-2xl">Sin conexi\u00f3n a internet</CardTitle>
            <CardDescription>
              No se puede conectar con el servidor. Algunas funciones est\u00e1n limitadas en modo
              offline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastSync && (
              <div className="text-center text-sm text-muted-foreground">
                \u00daltima sincronizaci\u00f3n: {lastSync}
              </div>
            )}

            <Button onClick={handleRetry} disabled={isRetrying} className="w-full" size="lg">
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar conexi\u00f3n
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Available offline features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funciones disponibles offline</CardTitle>
            <CardDescription>
              Puedes acceder a estas secciones con datos en cach\u00e9
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/dashboard" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Home className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Dashboard</div>
                    <div className="text-sm text-muted-foreground">
                      Ver datos guardados localmente
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/edificios" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Edificios</div>
                    <div className="text-sm text-muted-foreground">
                      Consultar propiedades en cach\u00e9
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/inquilinos" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Inquilinos</div>
                    <div className="text-sm text-muted-foreground">Ver listado de inquilinos</div>
                  </div>
                </div>
              </Link>

              <Link href="/documentos" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Documentos</div>
                    <div className="text-sm text-muted-foreground">
                      Acceder a documentos descargados
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-blue-600">💡</span>
              Consejos para trabajar offline
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Los cambios que realices se sincronizarán automáticamente cuando vuelva la
                conexión
              </li>
              <li>• Puedes consultar datos previamente visitados</li>
              <li>• Algunas acciones como crear o editar registros requerirán conexión</li>
              <li>• Verifica tu conexión WiFi o datos móviles</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
