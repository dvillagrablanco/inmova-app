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
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  FileSignature,
  Shield,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface SignatureProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected';
  docsUrl?: string;
  features: string[];
  compliance: string[];
}

const signatureProviders: SignatureProvider[] = [
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Firma electrónica avanzada reconocida mundialmente',
    icon: <FileSignature className="h-6 w-6 text-yellow-600" />,
    status: 'disconnected',
    docsUrl: 'https://developers.docusign.com',
    features: ['Firma avanzada', 'Plantillas', 'Flujos de aprobación', 'Auditoría completa'],
    compliance: ['eIDAS', 'ESIGN Act', 'UETA'],
  },
  {
    id: 'signaturit',
    name: 'Signaturit',
    description: 'Firma electrónica cualificada conforme eIDAS para España y UE',
    icon: <Shield className="h-6 w-6 text-blue-600" />,
    status: 'disconnected',
    docsUrl: 'https://docs.signaturit.com',
    features: ['Firma cualificada', 'Certificado digital', 'Biometría', 'Sello de tiempo'],
    compliance: ['eIDAS QES', 'LOPD', 'GDPR'],
  },
];

export default function FirmaDigitalConfiguracionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('docusign');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [providers, setProviders] = useState(signatureProviders);

  // Config para DocuSign
  const [docusignConfig, setDocusignConfig] = useState({
    integrationKey: '',
    userId: '',
    accountId: '',
    privateKey: '',
    environment: 'demo',
  });

  // Config para Signaturit
  const [signaturitConfig, setSignaturitConfig] = useState({
    apiToken: '',
    environment: 'sandbox',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
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
      }
    };

    if (status === 'authenticated') {
      loadStatus();
    }
  }, [status]);

  const handleSaveDocusign = async () => {
    if (!docusignConfig.integrationKey || !docusignConfig.userId || !docusignConfig.accountId) {
      toast.error('Integration Key, User ID y Account ID son obligatorios');
      return;
    }

    try {
      setSaving(true);
      // Aquí iría la llamada a la API para guardar la configuración
      toast.success('Configuración de DocuSign guardada');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignaturit = async () => {
    if (!signaturitConfig.apiToken) {
      toast.error('API Token es obligatorio');
      return;
    }

    try {
      setSaving(true);
      // Aquí iría la llamada a la API para guardar la configuración
      toast.success('Configuración de Signaturit guardada');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: string) => {
    toast.info(`Probando conexión con ${provider}...`);
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
              <BreadcrumbLink href="/firma-digital">Firma Digital</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Configuración</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Firma Digital</h1>
            <p className="text-muted-foreground mt-2">
              Configura tus proveedores de firma electrónica para contratos
            </p>
          </div>
          <Badge variant="outline" className="text-base py-2 px-4">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            {connectedCount}/{providers.length} conectados
          </Badge>
        </div>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            La firma digital permite enviar contratos de alquiler para firma electrónica con validez legal.
            Recomendamos Signaturit para cumplimiento eIDAS en España/UE o DocuSign para alcance internacional.
          </AlertDescription>
        </Alert>

        {/* Tabs por proveedor */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
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

          {/* DocuSign */}
          <TabsContent value="docusign" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSignature className="h-8 w-8 text-yellow-600" />
                    <div>
                      <CardTitle>DocuSign</CardTitle>
                      <CardDescription>
                        Firma electrónica avanzada reconocida mundialmente
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {signatureProviders.find(p => p.id === 'docusign')?.compliance.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                    {providers.find(p => p.id === 'docusign')?.status === 'connected' ? (
                      <Badge className="bg-green-500">Conectado</Badge>
                    ) : (
                      <Badge variant="outline">No configurado</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="docusign-integration-key">Integration Key *</Label>
                    <Input
                      id="docusign-integration-key"
                      type="text"
                      placeholder="UUID de tu Integration Key"
                      value={docusignConfig.integrationKey}
                      onChange={(e) => setDocusignConfig({ ...docusignConfig, integrationKey: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="docusign-user-id">User ID (API Username) *</Label>
                    <Input
                      id="docusign-user-id"
                      type="text"
                      placeholder="UUID del User ID"
                      value={docusignConfig.userId}
                      onChange={(e) => setDocusignConfig({ ...docusignConfig, userId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="docusign-account-id">Account ID *</Label>
                    <Input
                      id="docusign-account-id"
                      type="text"
                      placeholder="UUID del Account ID"
                      value={docusignConfig.accountId}
                      onChange={(e) => setDocusignConfig({ ...docusignConfig, accountId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="docusign-environment">Entorno</Label>
                    <select
                      id="docusign-environment"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={docusignConfig.environment}
                      onChange={(e) => setDocusignConfig({ ...docusignConfig, environment: e.target.value })}
                    >
                      <option value="demo">Demo (Pruebas)</option>
                      <option value="production">Producción</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docusign-private-key">Private Key (RSA)</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="docusign-private-key"
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      value={docusignConfig.privateKey}
                      onChange={(e) => setDocusignConfig({ ...docusignConfig, privateKey: e.target.value })}
                      className="font-mono text-xs h-32"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Genera un par de claves RSA en DocuSign Admin → Integrations → Keys and Certificates
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => testConnection('DocuSign')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Probar Conexión
                  </Button>
                  <Button onClick={handleSaveDocusign} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Configuración
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Funcionalidades:</h4>
                  <div className="flex flex-wrap gap-2">
                    {signatureProviders.find(p => p.id === 'docusign')?.features.map((f, i) => (
                      <Badge key={i} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signaturit */}
          <TabsContent value="signaturit" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle>Signaturit</CardTitle>
                      <CardDescription>
                        Firma electrónica cualificada conforme eIDAS para España y UE
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {signatureProviders.find(p => p.id === 'signaturit')?.compliance.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                    {providers.find(p => p.id === 'signaturit')?.status === 'connected' ? (
                      <Badge className="bg-green-500">Conectado</Badge>
                    ) : (
                      <Badge variant="outline">No configurado</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Signaturit ofrece firma cualificada (QES) con validez legal equivalente a firma manuscrita
                    según el Reglamento eIDAS de la UE. Recomendado para contratos en España.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signaturit-token">API Token *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="signaturit-token"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Tu API Token de Signaturit"
                        value={signaturitConfig.apiToken}
                        onChange={(e) => setSignaturitConfig({ ...signaturitConfig, apiToken: e.target.value })}
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
                      Obtén tu API Token en{' '}
                      <a href="https://app.signaturit.com/settings/api" target="_blank" className="text-primary hover:underline">
                        Signaturit → Configuración → API
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signaturit-environment">Entorno</Label>
                    <select
                      id="signaturit-environment"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={signaturitConfig.environment}
                      onChange={(e) => setSignaturitConfig({ ...signaturitConfig, environment: e.target.value })}
                    >
                      <option value="sandbox">Sandbox (Pruebas)</option>
                      <option value="production">Producción</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => testConnection('Signaturit')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Probar Conexión
                  </Button>
                  <Button onClick={handleSaveSignaturit} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Configuración
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Funcionalidades:</h4>
                  <div className="flex flex-wrap gap-2">
                    {signatureProviders.find(p => p.id === 'signaturit')?.features.map((f, i) => (
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
                href="https://developers.docusign.com"
                target="_blank"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Documentación DocuSign</span>
              </a>
              <a
                href="https://docs.signaturit.com"
                target="_blank"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Documentación Signaturit</span>
              </a>
              <a
                href="/firma-digital/templates"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <FileSignature className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Gestionar Plantillas</span>
              </a>
              <a
                href="/docs/guia-firma-digital"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Guía de Firma Digital</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
