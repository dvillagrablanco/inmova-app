'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Página de diagnóstico para Valoración IA
 * Esta versión simplificada ayuda a identificar qué componente causa el error
 */
export default function ValoracionIATestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<Record<string, string>>({});

  // Marcar como montado
  useEffect(() => {
    setMounted(true);
    setDiagnostics(prev => ({ ...prev, mount: '✅ Montado correctamente' }));
  }, []);

  // Verificar sesión
  useEffect(() => {
    if (!mounted) return;
    
    if (status === 'loading') {
      setDiagnostics(prev => ({ ...prev, session: '⏳ Verificando sesión...' }));
    } else if (status === 'authenticated') {
      setDiagnostics(prev => ({ ...prev, session: '✅ Sesión activa: ' + session?.user?.email }));
    } else if (status === 'unauthenticated') {
      setDiagnostics(prev => ({ ...prev, session: '⚠️ No autenticado' }));
    }
  }, [mounted, status, session]);

  // Test de fetch
  useEffect(() => {
    if (!mounted || status !== 'authenticated') return;
    
    const testFetch = async () => {
      try {
        setDiagnostics(prev => ({ ...prev, api: '⏳ Probando API...' }));
        
        const response = await fetch('/api/health', { credentials: 'include' });
        const data = await response.json();
        
        setDiagnostics(prev => ({ 
          ...prev, 
          api: response.ok 
            ? '✅ API funcionando: ' + data.status 
            : '❌ API error: ' + response.status 
        }));
      } catch (err: any) {
        setDiagnostics(prev => ({ ...prev, api: '❌ Error de fetch: ' + err.message }));
        setError(err.message);
      }
    };
    
    testFetch();
  }, [mounted, status]);

  // Estado de carga inicial
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Preparando página de diagnóstico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {error ? (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
            Diagnóstico de Valoración IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Estado de componentes:</h3>
            <ul className="space-y-1 text-sm">
              {Object.entries(diagnostics).map(([key, value]) => (
                <li key={key} className="font-mono bg-gray-100 p-2 rounded">
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Error detectado:</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => router.push('/valoracion-ia')}
              className="w-full"
            >
              Ir a Valoración IA (página real)
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Recargar diagnóstico
            </Button>
            <Button 
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Volver al Dashboard
            </Button>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            <p>Build: {new Date().toISOString()}</p>
            <p>Status: {status}</p>
            <p>Mounted: {mounted ? 'Sí' : 'No'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
