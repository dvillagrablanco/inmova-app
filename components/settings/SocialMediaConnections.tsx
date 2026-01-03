'use client';

/**
 * Componente para Gestión de Conexiones de Redes Sociales
 * 
 * Permite conectar/desconectar cuentas de Instagram, Facebook, LinkedIn, Twitter
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, RefreshCcw, Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

interface SocialConnection {
  platform: string;
  connected: boolean;
  accountName?: string;
  accountHandle?: string;
  connectedAt?: string;
  expiresAt?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function SocialMediaConnections() {
  const [connections, setConnections] = useState<SocialConnection[]>([
    { platform: 'FACEBOOK', connected: false },
    { platform: 'INSTAGRAM', connected: false },
    { platform: 'LINKEDIN', connected: false },
    { platform: 'TWITTER', connected: false },
  ]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar estado actual
  useEffect(() => {
    loadConnections();
    checkUrlParams();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/auth/oauth/status');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || connections);
      }
    } catch (err) {
      console.error('Error loading connections:', err);
    }
  };

  // Verificar parámetros de URL (success/error de callback)
  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get('success');
    const errorParam = params.get('error');

    if (successParam) {
      setSuccess(`${successParam.replace('_connected', '')} conectado exitosamente`);
      loadConnections();
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleConnect = (platform: string) => {
    setLoading(platform);
    setError(null);
    setSuccess(null);

    // Redirigir a OAuth flow
    window.location.href = `/api/auth/oauth/connect/${platform.toLowerCase()}?redirectTo=${encodeURIComponent(
      window.location.pathname
    )}`;
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`¿Seguro que quieres desconectar ${platform}?`)) {
      return;
    }

    setLoading(platform);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/auth/oauth/disconnect/${platform.toLowerCase()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconectando cuenta');
      }

      setSuccess(`${platform} desconectado exitosamente`);
      await loadConnections();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return <Facebook className="h-5 w-5" />;
      case 'INSTAGRAM':
        return <Instagram className="h-5 w-5" />;
      case 'LINKEDIN':
        return <Linkedin className="h-5 w-5" />;
      case 'TWITTER':
        return <Twitter className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'INSTAGRAM':
        return 'bg-pink-600 hover:bg-pink-700';
      case 'LINKEDIN':
        return 'bg-blue-700 hover:bg-blue-800';
      case 'TWITTER':
        return 'bg-sky-500 hover:bg-sky-600';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conexiones de Redes Sociales</CardTitle>
          <CardDescription>
            Conecta tus cuentas de redes sociales para publicar automáticamente nuevas propiedades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alertas */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Lista de Plataformas */}
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.platform}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg text-white ${getPlatformColor(connection.platform)}`}>
                    {getPlatformIcon(connection.platform)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{connection.platform}</h3>
                      {connection.connected && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Conectado
                        </Badge>
                      )}
                    </div>
                    
                    {connection.connected && connection.accountName && (
                      <p className="text-sm text-gray-600">
                        {connection.accountName}
                        {connection.accountHandle && ` (@${connection.accountHandle})`}
                      </p>
                    )}
                    
                    {connection.connected && connection.expiresAt && (
                      <p className="text-xs text-gray-500">
                        Expira: {new Date(connection.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {connection.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(connection.platform)}
                        disabled={loading === connection.platform}
                      >
                        {loading === connection.platform ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4" />
                        )}
                        <span className="ml-2">Renovar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(connection.platform)}
                        disabled={loading === connection.platform}
                      >
                        {loading === connection.platform ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Desconectar'
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className={getPlatformColor(connection.platform)}
                      size="sm"
                      onClick={() => handleConnect(connection.platform)}
                      disabled={loading === connection.platform}
                    >
                      {loading === connection.platform ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        'Conectar'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Información Adicional */}
          <Alert>
            <AlertDescription>
              <strong>Nota:</strong> Para conectar tus cuentas necesitarás:
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Facebook/Instagram: Una página de Facebook</li>
                <li>LinkedIn: Una página de empresa</li>
                <li>Twitter: Cuenta verificada (para API v2)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Card de Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <strong>Conecta tu cuenta</strong> - Haz clic en "Conectar" y autoriza el acceso
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <strong>Publica automáticamente</strong> - Nuevas propiedades se publicarán automáticamente
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <strong>Monitorea resultados</strong> - Ve analytics de cada publicación en el dashboard
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SocialMediaConnections;
