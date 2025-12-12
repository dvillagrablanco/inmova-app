'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log el error a un servicio de monitoreo
    logger.error('Error capturado por error.tsx', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-6 h-6" />
            <CardTitle>Error en la aplicación</CardTitle>
          </div>
          <CardDescription>
            Se ha producido un error inesperado. Por favor, intenta nuevamente o contacta al soporte técnico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Intentar nuevamente
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/dashboard')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Button>
          </div>
          
          {error.digest && (
            <p className="text-xs text-center text-muted-foreground">
              Si el problema persiste, proporciona este ID al soporte: <code className="font-mono">{error.digest}</code>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
