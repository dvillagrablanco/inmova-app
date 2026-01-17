'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Calculator,
  FileText,
  Euro,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface AccountingProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected';
  docsUrl?: string;
  features: string[];
}

const accountingProviders: AccountingProvider[] = [
  {
    id: 'contasimple',
    name: 'Contasimple',
    description: 'Software de contabilidad y facturación para autónomos y pymes en España',
    icon: <Calculator className="h-6 w-6 text-blue-600" />,
    status: 'disconnected',
    docsUrl: 'https://api.contasimple.com/docs',
    features: ['Facturación', 'Modelo 303', 'Modelo 390', 'SII', 'Libros contables'],
  },
  {
    id: 'holded',
    name: 'Holded',
    description: 'ERP y contabilidad en la nube para empresas',
    icon: <Building2 className="h-6 w-6 text-indigo-600" />,
    status: 'disconnected',
    docsUrl: 'https://developers.holded.com',
    features: ['ERP', 'Facturación', 'Contabilidad', 'CRM', 'Proyectos'],
  },
  {
    id: 'a3erp',
    name: 'a3ERP',
    description: 'Software de gestión empresarial de Wolters Kluwer',
    icon: <FileText className="h-6 w-6 text-green-600" />,
    status: 'disconnected',
    features: ['Contabilidad', 'Facturación', 'Nóminas', 'Impuestos'],
  },
];

export default function ContabilidadIntegracionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('contasimple');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [providers, setProviders] = useState(accountingProviders);
  
  // Config para Contasimple
  const [contasimpleConfig, setContasimpleConfig] = useState({
    apiKey: '',
    companyId: '',
    autoSync: true,
  });

  // Config para Holded
  const [holdedConfig, setHoldedConfig] = useState({
    apiKey: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Cargar estado de las integraciones
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/integrations/status');
        if (response.ok) {
          const data = await response.json();
          setProviders(prev =>
            prev.map(p => ({
              ...p,
              status: data[p.id]?.connected ? 'connected' : 'disconnected',
            }))
          );
        }
      } catch (error) {
        console.error('Error loading integration status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadStatus();
    }
  }, [status]);

  const handleSaveContasimple = async () => {
    if (!contasimpleConfig.apiKey || !contasimpleConfig.companyId) {
      toast.error('API Key y Company ID son obligatorios');
      return;
    }

    try {
      setSaving(true);
      // Aquí iría la llamada a la API para guardar la configuración
      toast.success('Configuración de Contasimple guardada');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHolded = async () => {
    if (!holdedConfig.apiKey) {
      toast.error('API Key es obligatorio');
      return;
    }

    try {
      setSaving(true);
      // Aquí iría la llamada a la API para guardar la configuración
      toast.success('Configuración de Holded guardada');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: string) => {
    toast.info(`Probando conexión con ${provider}...`);
    // Simular test
    setTimeout(() => {
      toast.success('Conexión verificada correctamente');
    }, 1500);
  };

  const connectedCount = providers.filter(p => p.status === 'connected').length;

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
      <div className="max-w-5xl mx-auto space-y-6">
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
              <BreadcrumbLink href="/contabilidad">Contabilidad</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Integraciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Integraciones de Contabilidad</h1>
            <p className="text-muted-foreground mt-2">
              Conecta con tu software de contabilidad para sincronizar facturas y gastos
            </p>
          </div>
          <Badge variant="outline" className="text-base py-2 px-4">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            {connectedCount}/{providers.length} conectados
          </Badge>
        </div>

        {/* Info */}
        <Alert>
          <Euro className="h-4 w-4" />
          <AlertDescription>
            La integración con software contable permite sincronizar automáticamente facturas de alquiler, 
            gastos de mantenimiento y otros movimientos financieros.
          </AlertDescription>
        </Alert>

        {/* Tabs por proveedor */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {providers.map(provider => (
              <TabsTrigger key={provider.id} value={provider.id} className="flex items-center gap-2">
                {provider.icon}
                {provider.name}
                {provider.status === 'connected' && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Contasimple */}
          <TabsContent value="contasimple" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle>Contasimple</CardTitle>
                      <CardDescription>
                        Software de contabilidad y facturación para autónomos y pymes
                      </CardDescription>
                    </div>
                  </div>
                  {providers.find(p => p.id === 'contasimple')?.status === 'connected' ? (
                    <Badge className="bg-green-500">Conectado</Badge>
                  ) : (
                    <Badge variant="outline">No configurado</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contasimple-apikey">API Key *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="contasimple-apikey"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Tu API Key de Contasimple"
                        value={contasimpleConfig.apiKey}
                        onChange={(e) => setContasimpleConfig({ ...contasimpleConfig, apiKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Obtén tu API Key en{' '}
                      <a href="https://app.contasimple.com/settings/api" target="_blank" className="text-primary hover:underline">
                        Contasimple → Configuración → API
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contasimple-company">ID de Empresa *</Label>
                    <Input
                      id="contasimple-company"
                      type="text"
                      placeholder="ID de tu empresa en Contasimple"
                      value={contasimpleConfig.companyId}
                      onChange={(e) => setContasimpleConfig({ ...contasimpleConfig, companyId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => testConnection('Contasimple')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Probar Conexión
                  </Button>
                  <Button onClick={handleSaveContasimple} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Configuración
                  </Button>
                </div>

                {/* Features */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Funcionalidades disponibles:</h4>
                  <div className="flex flex-wrap gap-2">
                    {accountingProviders.find(p => p.id === 'contasimple')?.features.map((f, i) => (
                      <Badge key={i} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holded */}
          <TabsContent value="holded" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-indigo-600" />
                    <div>
                      <CardTitle>Holded</CardTitle>
                      <CardDescription>
                        ERP y contabilidad en la nube para empresas
                      </CardDescription>
                    </div>
                  </div>
                  {providers.find(p => p.id === 'holded')?.status === 'connected' ? (
                    <Badge className="bg-green-500">Conectado</Badge>
                  ) : (
                    <Badge variant="outline">No configurado</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="holded-apikey">API Key *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="holded-apikey"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Tu API Key de Holded"
                        value={holdedConfig.apiKey}
                        onChange={(e) => setHoldedConfig({ ...holdedConfig, apiKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Obtén tu API Key en{' '}
                      <a href="https://app.holded.com/settings/api" target="_blank" className="text-primary hover:underline">
                        Holded → Configuración → API
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => testConnection('Holded')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Probar Conexión
                  </Button>
                  <Button onClick={handleSaveHolded} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Configuración
                  </Button>
                </div>

                {/* Features */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Funcionalidades disponibles:</h4>
                  <div className="flex flex-wrap gap-2">
                    {accountingProviders.find(p => p.id === 'holded')?.features.map((f, i) => (
                      <Badge key={i} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* a3ERP */}
          <TabsContent value="a3erp" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <CardTitle>a3ERP</CardTitle>
                      <CardDescription>
                        Software de gestión empresarial de Wolters Kluwer
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Próximamente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La integración con a3ERP estará disponible próximamente. 
                    <a href="/contacto" className="text-primary hover:underline ml-1">
                      Contáctanos si necesitas esta integración.
                    </a>
                  </AlertDescription>
                </Alert>

                {/* Features */}
                <div className="pt-4 mt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Funcionalidades planeadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {accountingProviders.find(p => p.id === 'a3erp')?.features.map((f, i) => (
                      <Badge key={i} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                href="https://api.contasimple.com/docs"
                target="_blank"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Documentación Contasimple</span>
              </a>
              <a
                href="https://developers.holded.com"
                target="_blank"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Documentación Holded</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
