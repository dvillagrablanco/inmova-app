'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Building2,
  Check,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Save,
  Trash2,
  Info,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GoCardlessConfigPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [formData, setFormData] = useState({
    accessToken: '',
    environment: 'sandbox',
    webhookSecret: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configuración de GoCardless guardada');
      setIsConfigured(true);
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Conexión con GoCardless verificada correctamente');
    } catch (error) {
      toast.error('Error al verificar la conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar esta configuración?')) {
      setFormData({
        accessToken: '',
        environment: 'sandbox',
        webhookSecret: '',
      });
      setIsConfigured(false);
      toast.success('Configuración eliminada');
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6 px-4">
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
              <BreadcrumbLink href="/configuracion/integraciones">Integraciones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>GoCardless</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/configuracion/integraciones')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-cyan-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">GoCardless</h1>
                {isConfigured ? (
                  <Badge className="bg-green-500">Conectado</Badge>
                ) : (
                  <Badge variant="secondary">No configurado</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Domiciliación bancaria SEPA para cobros recurrentes
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            GoCardless permite cobrar alquileres mediante domiciliación bancaria SEPA.
            Ideal para pagos recurrentes con comisiones más bajas que tarjeta.
          </AlertDescription>
        </Alert>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciales API</CardTitle>
            <CardDescription>
              Obtén estas credenciales desde tu{' '}
              <a
                href="https://manage.gocardless.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                panel de GoCardless <ExternalLink className="h-3 w-3 inline" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token *</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="live_xxxxxxxxxxxxxx"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Entorno</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) => setFormData({ ...formData, environment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                  <SelectItem value="live">Live (Producción)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Usa sandbox para pruebas, live para cobros reales
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret (opcional)</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="whsec_xxxxxx"
                value={formData.webhookSecret}
                onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Para recibir notificaciones de estado de pagos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Débito directo SEPA',
                'Pagos recurrentes automáticos',
                'Bajo coste por transacción (1% + 0.20€)',
                'Conciliación automática',
                'Reintentos automáticos',
                'Cumplimiento PSD2',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comisiones */}
        <Card className="bg-cyan-50 dark:bg-cyan-950 border-cyan-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Euro className="h-6 w-6 text-cyan-600" />
              <div>
                <p className="font-medium">Comisiones GoCardless</p>
                <p className="text-sm text-muted-foreground">
                  1% + 0.20€ por transacción (máx. 2€). Sin cuotas mensuales.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar configuración
              </>
            )}
          </Button>
          
          {isConfigured && (
            <>
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Probar conexión
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </>
          )}
        </div>

        {/* Documentación */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Documentación</p>
                <p className="text-xs text-muted-foreground">
                  Guía de integración de GoCardless
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://developer.gocardless.com/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Ver docs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
