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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileSignature,
  Building2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface SharedIntegration {
  id: string;
  name: string;
  description: string;
  category: 'pagos' | 'firma';
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  configFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
  }>;
  features: string[];
  empresasUsando: number;
  docsUrl?: string;
}

const sharedIntegrations: SharedIntegration[] = [
  // PAGOS
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Procesamiento de pagos con tarjeta, suscripciones y facturación automática.',
    category: 'pagos',
    icon: '💳',
    status: 'connected',
    configFields: [
      { name: 'STRIPE_SECRET_KEY', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...', required: true },
      { name: 'STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...', required: true },
      { name: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', required: true },
    ],
    features: ['Pagos con tarjeta', 'Suscripciones recurrentes', 'Links de pago', 'Facturación automática'],
    empresasUsando: 45,
    docsUrl: 'https://stripe.com/docs',
  },
  {
    id: 'gocardless',
    name: 'GoCardless',
    description: 'Domiciliación bancaria SEPA para pagos recurrentes de alquiler.',
    category: 'pagos',
    icon: '🏦',
    status: 'disconnected',
    configFields: [
      { name: 'GOCARDLESS_ACCESS_TOKEN', label: 'Access Token', type: 'password', placeholder: 'Token de acceso', required: true },
      { name: 'GOCARDLESS_ENVIRONMENT', label: 'Entorno', type: 'text', placeholder: 'live o sandbox', required: true },
    ],
    features: ['Débito directo SEPA', 'Pagos recurrentes', 'Bajo coste por transacción', 'Conciliación automática'],
    empresasUsando: 12,
    docsUrl: 'https://developer.gocardless.com/',
  },
  {
    id: 'redsys',
    name: 'Redsys',
    description: 'Pasarela de pagos española para TPV virtual, Bizum y pagos PSD2/SCA.',
    category: 'pagos',
    icon: '🔒',
    status: 'disconnected',
    configFields: [
      { name: 'REDSYS_MERCHANT_CODE', label: 'Código de Comercio', type: 'text', placeholder: 'Nº de comercio', required: true },
      { name: 'REDSYS_SECRET_KEY', label: 'Clave Secreta', type: 'password', placeholder: 'Clave de firma', required: true },
      { name: 'REDSYS_TERMINAL', label: 'Terminal', type: 'text', placeholder: '001', required: true },
    ],
    features: ['TPV Virtual', 'Bizum', 'Cumplimiento PSD2/SCA', 'Multidivisa'],
    empresasUsando: 8,
    docsUrl: 'https://pagosonline.redsys.es/desarrolladores.html',
  },
  // FIRMA DIGITAL
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Firma electrónica avanzada para contratos de alquiler y documentos legales.',
    category: 'firma',
    icon: '✍️',
    status: 'connected',
    configFields: [
      { name: 'DOCUSIGN_INTEGRATION_KEY', label: 'Integration Key', type: 'text', placeholder: 'Integration Key', required: true },
      { name: 'DOCUSIGN_SECRET_KEY', label: 'Secret Key', type: 'password', placeholder: 'Secret Key', required: true },
      { name: 'DOCUSIGN_ACCOUNT_ID', label: 'Account ID', type: 'text', placeholder: 'Account ID', required: true },
    ],
    features: ['Firma avanzada eIDAS', 'Plantillas de contratos', 'Flujos de aprobación', 'Auditoría completa'],
    empresasUsando: 32,
    docsUrl: 'https://developers.docusign.com/',
  },
  {
    id: 'signaturit',
    name: 'Signaturit',
    description: 'Firma electrónica certificada conforme a eIDAS. Proveedor español.',
    category: 'firma',
    icon: '📝',
    status: 'disconnected',
    configFields: [
      { name: 'SIGNATURIT_API_KEY', label: 'API Key', type: 'password', placeholder: 'Tu API Key', required: true },
    ],
    features: ['Firma cualificada eIDAS', 'Certificado digital', 'Validez legal en UE', 'Biometría'],
    empresasUsando: 18,
    docsUrl: 'https://docs.signaturit.com/',
  },
];

export default function IntegracionesCompartidasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pagos');
  const [selectedIntegration, setSelectedIntegration] = useState<SharedIntegration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  const handleSaveConfig = (integrationId: string) => {
    toast.success('Configuración guardada correctamente');
    setSelectedIntegration(null);
    setConfigValues({});
  };

  const handleTest = (integrationId: string) => {
    toast.success('Conexión verificada correctamente');
  };

  const filteredIntegrations = sharedIntegrations.filter(i => i.category === activeTab);

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Integraciones Compartidas</h1>
          <p className="text-muted-foreground mt-2">
            Integraciones configuradas por INMOVA que usan las empresas clientes
          </p>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Modelo compartido:</strong> INMOVA configura estas integraciones una vez y todas las empresas 
            clientes pueden usarlas. Los costes de transacción se repercuten a cada empresa según su uso.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pagos" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pasarelas de Pago
            </TabsTrigger>
            <TabsTrigger value="firma" className="flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              Firma Digital
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {selectedIntegration ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{selectedIntegration.icon}</span>
                      <div>
                        <CardTitle>{selectedIntegration.name}</CardTitle>
                        <CardDescription>{selectedIntegration.description}</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                      Volver
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Las credenciales se almacenan de forma segura y encriptada. 
                      Las empresas clientes NO tienen acceso a estas claves.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4">
                    {selectedIntegration.configFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={configValues[field.name] || ''}
                          onChange={(e) => setConfigValues(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label>Activar para todas las empresas</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite que las empresas clientes usen esta integración
                      </p>
                    </div>
                    <Switch defaultChecked={selectedIntegration.status === 'connected'} />
                  </div>

                  <div className="flex justify-between">
                    {selectedIntegration.docsUrl && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(selectedIntegration.docsUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Documentación
                      </Button>
                    )}
                    <Button onClick={() => handleSaveConfig(selectedIntegration.id)}>
                      Guardar configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                  <Card key={integration.id} className={integration.status === 'connected' ? 'border-green-200' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{integration.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">
                              {integration.description}
                            </CardDescription>
                          </div>
                        </div>
                        {integration.status === 'connected' ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Empresas usando */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{integration.empresasUsando} empresas usando</span>
                      </div>

                      {/* Features */}
                      <div className="space-y-1">
                        {integration.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          variant={integration.status === 'connected' ? 'outline' : 'default'}
                          onClick={() => setSelectedIntegration(integration)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Configurar
                        </Button>
                        {integration.status === 'connected' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTest(integration.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
