'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  CreditCard,
  Home,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/ui/back-button';
import logger from '@/lib/logger';

export default function StripeConfigurationPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [config, setConfig] = useState({
    secretKey: '',
    publishableKey: '',
    webhookSecret: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadConfiguration();
    }
  }, [session]);

  const loadConfiguration = () => {
    // Cargar configuración actual desde variables de entorno
    // Nota: En producción, esto debería venir de una API segura
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    setConfig((prev) => ({
      ...prev,
      publishableKey,
      // No mostramos las claves secretas por seguridad
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validaciones
      if (!config.secretKey || !config.publishableKey) {
        toast.error('Las claves Secret Key y Publishable Key son obligatorias');
        return;
      }

      if (!config.secretKey.startsWith('sk_')) {
        toast.error('La Secret Key debe comenzar con sk_test_ o sk_live_');
        return;
      }

      if (!config.publishableKey.startsWith('pk_')) {
        toast.error('La Publishable Key debe comenzar con pk_test_ o pk_live_');
        return;
      }

      if (config.webhookSecret && !config.webhookSecret.startsWith('whsec_')) {
        toast.error('El Webhook Secret debe comenzar con whsec_');
        return;
      }

      // En un escenario real, esto debería guardarse en la base de datos de forma segura
      // y actualizar las variables de entorno del servidor
      toast.info('Para aplicar los cambios, debes actualizar el archivo .env del servidor');
      toast.success('Configuración validada correctamente');
    } catch (error) {
      logger.error('Error saving Stripe configuration:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // Intentar hacer una llamada de prueba a Stripe
      const response = await fetch('/api/stripe/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: config.secretKey,
          publishableKey: config.publishableKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Conexión exitosa. Cuenta: ${data.accountName || 'N/A'}`,
        });
        toast.success('Conexión con Stripe verificada');
      } else {
        const error = await response.json();
        setTestResult({
          success: false,
          message: error.error || 'Error al conectar con Stripe',
        });
        toast.error('Error al verificar la conexión');
      }
    } catch (error) {
      logger.error('Error testing Stripe connection:', error);
      setTestResult({
        success: false,
        message: 'Error de red al conectar con Stripe',
      });
      toast.error('Error de conexión');
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiada al portapapeles`);
  };

  const isTestMode = config.secretKey.includes('test') || config.publishableKey.includes('test');

  if (status === 'loading') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-bg p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/configuracion">Configuración</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/configuracion/integraciones">
                    Integraciones
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Stripe</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="space-y-4">
              <BackButton href="/configuracion/integraciones" label="Volver a Integraciones" />
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight gradient-text">
                      Configuración de Stripe
                    </h1>
                    {isTestMode && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Modo Test
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Configura tu integración con Stripe para procesar pagos
                  </p>
                </div>
              </div>
            </div>

            {/* Alert de Documentación */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Consulta la{' '}
                <a
                  href="/GUIA_CONFIGURACION_STRIPE.md"
                  target="_blank"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  Guía de Configuración de Stripe
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                para obtener instrucciones detalladas.
              </AlertDescription>
            </Alert>

            {/* Test Result */}
            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            {/* Formulario de Configuración */}
            <Card>
              <CardHeader>
                <CardTitle>Credenciales de Stripe</CardTitle>
                <CardDescription>
                  Introduce tus claves de API de Stripe. Puedes obtenerlas en{' '}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Stripe Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Publishable Key */}
                <div className="space-y-2">
                  <Label htmlFor="publishableKey">Publishable Key *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="publishableKey"
                      type="text"
                      placeholder="pk_test_..."
                      value={config.publishableKey}
                      onChange={(e) =>
                        setConfig({ ...config, publishableKey: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.publishableKey, 'Publishable Key')}
                      disabled={!config.publishableKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clave pública segura para el frontend (comienza con pk_test_ o pk_live_)
                  </p>
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secretKey"
                      type={showSecretKey ? 'text' : 'password'}
                      placeholder="sk_test_..."
                      value={config.secretKey}
                      onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.secretKey, 'Secret Key')}
                      disabled={!config.secretKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clave secreta solo para el backend (comienza con sk_test_ o sk_live_)
                  </p>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhookSecret"
                      type={showWebhookSecret ? 'text' : 'password'}
                      placeholder="whsec_..."
                      value={config.webhookSecret}
                      onChange={(e) =>
                        setConfig({ ...config, webhookSecret: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    >
                      {showWebhookSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.webhookSecret, 'Webhook Secret')}
                      disabled={!config.webhookSecret}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secreto para validar webhooks (comienza con whsec_). Configura el endpoint en:
                    <code className="ml-1 text-xs bg-muted px-1 rounded">
                      https://www.inmova.app/api/stripe/webhook
                    </code>
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-4">
                  <Button onClick={testConnection} disabled={testing || !config.secretKey} variant="outline">
                    {testing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Probando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Probar Conexión
                      </>
                    )}
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Validar Configuración
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tarjetas de Prueba */}
            <Card>
              <CardHeader>
                <CardTitle>Tarjetas de Prueba</CardTitle>
                <CardDescription>
                  Usa estas tarjetas en modo test para simular diferentes escenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div>
                      <p className="font-mono text-sm font-medium">4242 4242 4242 4242</p>
                      <p className="text-xs text-muted-foreground">Pago exitoso</p>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Éxito
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div>
                      <p className="font-mono text-sm font-medium">4000 0000 0000 0002</p>
                      <p className="text-xs text-muted-foreground">Tarjeta declinada</p>
                    </div>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div>
                      <p className="font-mono text-sm font-medium">4000 0025 0000 3155</p>
                      <p className="text-xs text-muted-foreground">Requiere autenticación 3D Secure</p>
                    </div>
                    <Badge variant="secondary">3D Secure</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    CVC: Cualquier 3 dígitos | Fecha: Cualquier fecha futura | ZIP: Cualquier código
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recursos */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos Útiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Stripe Dashboard</span>
                  </a>
                  <a
                    href="https://docs.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Documentación Oficial</span>
                  </a>
                  <a
                    href="https://dashboard.stripe.com/test/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Configurar Webhooks</span>
                  </a>
                  <a
                    href="https://docs.stripe.com/testing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Guía de Testing</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
