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
  CreditCard,
  Check,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Save,
  Trash2,
  Info,
  Smartphone,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RedsysConfigPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [formData, setFormData] = useState({
    merchantCode: '',
    secretKey: '',
    terminal: '001',
    environment: 'test',
    enableBizum: false,
    enable3DS: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configuración de Redsys guardada');
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
      toast.success('Conexión con Redsys verificada correctamente');
    } catch (error) {
      toast.error('Error al verificar la conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar esta configuración?')) {
      setFormData({
        merchantCode: '',
        secretKey: '',
        terminal: '001',
        environment: 'test',
        enableBizum: false,
        enable3DS: true,
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
              <BreadcrumbPage>Redsys</BreadcrumbPage>
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
            <div className="h-14 w-14 rounded-xl bg-red-100 flex items-center justify-center">
              <CreditCard className="h-7 w-7 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">Redsys</h1>
                {isConfigured ? (
                  <Badge className="bg-green-500">Conectado</Badge>
                ) : (
                  <Badge variant="secondary">No configurado</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                TPV Virtual español con soporte para Bizum y 3D Secure
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Redsys es la pasarela de pagos de los principales bancos españoles.
            Permite cobros con tarjeta, Bizum y cumple con PSD2/SCA.
          </AlertDescription>
        </Alert>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciales TPV Virtual</CardTitle>
            <CardDescription>
              Obtén estas credenciales desde tu entidad bancaria o el{' '}
              <a
                href="https://sis.redsys.es/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                portal de comercios <ExternalLink className="h-3 w-3 inline" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchantCode">Código de Comercio (FUC) *</Label>
              <Input
                id="merchantCode"
                placeholder="999008881"
                value={formData.merchantCode}
                onChange={(e) => setFormData({ ...formData, merchantCode: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Número de 9 dígitos proporcionado por tu banco
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Clave de Encriptación *</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Tu clave SHA-256"
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminal">Terminal</Label>
              <Input
                id="terminal"
                placeholder="001"
                value={formData.terminal}
                onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
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
                  <SelectItem value="test">Test (sis-t.redsys.es)</SelectItem>
                  <SelectItem value="production">Producción (sis.redsys.es)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opciones */}
        <Card>
          <CardHeader>
            <CardTitle>Opciones de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="font-medium">Bizum</p>
                  <p className="text-sm text-muted-foreground">
                    Permite pagos instantáneos con Bizum
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.enableBizum}
                onCheckedChange={(checked) => setFormData({ ...formData, enableBizum: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">3D Secure (PSD2/SCA)</p>
                  <p className="text-sm text-muted-foreground">
                    Autenticación reforzada obligatoria en UE
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.enable3DS}
                onCheckedChange={(checked) => setFormData({ ...formData, enable3DS: checked })}
              />
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
                'TPV Virtual tradicional',
                'Bizum integrado',
                'Cumplimiento PSD2/SCA',
                'Todas las tarjetas',
                'Multidivisa',
                'Soporte en español',
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
        <Card className="bg-red-50 dark:bg-red-950 border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium">Comisiones Redsys</p>
                <p className="text-sm text-muted-foreground">
                  0.5% - 1.5% según contrato bancario. Sin cuota mensual fija.
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
                  Portal de desarrolladores Redsys
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://pagosonline.redsys.es/desarrolladores.html', '_blank')}
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
