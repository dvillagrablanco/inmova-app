'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  Euro,
  Building,
  CreditCard,
  FileSignature,
  Share2,
  Wrench,
  Link2,
  Shield,
  Smartphone,
  Building2,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function HerramientasEmpresaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('propias');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">Cargando...</div>
      </AuthenticatedLayout>
    );
  }

  // ============================================
  // INTEGRACIONES PROPIAS DE LA EMPRESA
  // ============================================
  const integracionesPropias = {
    contabilidad: [
      { 
        id: 'contasimple', 
        name: 'Contasimple', 
        description: 'Contabilidad simplificada',
        icon: Euro, 
        color: 'from-blue-500 to-blue-600',
        status: 'disconnected',
        config: { apiKey: '', companyId: '' }
      },
      { 
        id: 'holded', 
        name: 'Holded', 
        description: 'ERP y contabilidad',
        icon: Euro, 
        color: 'from-purple-500 to-purple-600',
        status: 'disconnected',
      },
      { 
        id: 'a3', 
        name: 'A3 Software', 
        description: 'Contabilidad profesional',
        icon: Euro, 
        color: 'from-green-500 to-green-600',
        status: 'disconnected',
      },
      { 
        id: 'sage', 
        name: 'Sage', 
        description: 'Gestión empresarial',
        icon: Euro, 
        color: 'from-teal-500 to-teal-600',
        status: 'disconnected',
      },
      { 
        id: 'alegra', 
        name: 'Alegra', 
        description: 'Facturación y contabilidad',
        icon: Euro, 
        color: 'from-orange-500 to-orange-600',
        status: 'disconnected',
      },
      { 
        id: 'zucchetti', 
        name: 'Zucchetti', 
        description: 'Software de gestión',
        icon: Euro, 
        color: 'from-red-500 to-red-600',
        status: 'disconnected',
      },
    ],
    banca: [
      { 
        id: 'openbanking', 
        name: 'Open Banking', 
        description: 'Conexión bancaria PSD2',
        icon: Building, 
        color: 'from-blue-600 to-indigo-600',
        status: 'disconnected',
      },
      { 
        id: 'plaid', 
        name: 'Plaid', 
        description: 'Agregador bancario',
        icon: Link2, 
        color: 'from-black to-gray-700',
        status: 'disconnected',
      },
    ],
    portales: [
      { 
        id: 'idealista', 
        name: 'Idealista', 
        description: 'Portal líder en España',
        icon: Globe, 
        color: 'from-green-500 to-green-600',
        status: 'disconnected',
      },
      { 
        id: 'fotocasa', 
        name: 'Fotocasa', 
        description: 'Portal inmobiliario',
        icon: Globe, 
        color: 'from-red-500 to-red-600',
        status: 'disconnected',
      },
      { 
        id: 'habitaclia', 
        name: 'Habitaclia', 
        description: 'Portal de Cataluña',
        icon: Globe, 
        color: 'from-blue-500 to-blue-600',
        status: 'disconnected',
      },
      { 
        id: 'pisos', 
        name: 'Pisos.com', 
        description: 'Buscador de pisos',
        icon: Globe, 
        color: 'from-orange-500 to-orange-600',
        status: 'disconnected',
      },
      { 
        id: 'yaencontre', 
        name: 'yaencontré', 
        description: 'Portal inmobiliario',
        icon: Globe, 
        color: 'from-purple-500 to-purple-600',
        status: 'disconnected',
      },
    ],
    // Plataformas de Media Estancia - Más utilizadas en España
    mediaEstancia: [
      { 
        id: 'spotahome', 
        name: 'Spotahome', 
        description: 'Líder en alquiler media estancia',
        icon: Globe, 
        color: 'from-teal-500 to-teal-600',
        status: 'disconnected',
        url: 'https://www.spotahome.com',
      },
      { 
        id: 'housinganywhere', 
        name: 'HousingAnywhere', 
        description: 'Plataforma internacional de estancias',
        icon: Globe, 
        color: 'from-blue-400 to-blue-500',
        status: 'disconnected',
        url: 'https://housinganywhere.com',
      },
      { 
        id: 'uniplaces', 
        name: 'Uniplaces', 
        description: 'Especializado en estudiantes',
        icon: Globe, 
        color: 'from-green-400 to-green-500',
        status: 'disconnected',
        url: 'https://www.uniplaces.com',
      },
      { 
        id: 'habitoom', 
        name: 'Habitoom', 
        description: 'Habitaciones para profesionales',
        icon: Globe, 
        color: 'from-purple-400 to-purple-500',
        status: 'disconnected',
        url: 'https://www.habitoom.com',
      },
      { 
        id: 'badi', 
        name: 'Badi', 
        description: 'Habitaciones y coliving España',
        icon: Globe, 
        color: 'from-pink-500 to-pink-600',
        status: 'disconnected',
        url: 'https://badi.com',
      },
      { 
        id: 'ukio', 
        name: 'Ukio', 
        description: 'Alquiler flexible premium',
        icon: Globe, 
        color: 'from-gray-700 to-gray-800',
        status: 'disconnected',
        url: 'https://www.stayukio.com',
      },
    ],
  };

  // ============================================
  // INTEGRACIONES COMPARTIDAS (config de empresa)
  // ============================================
  const integracionesCompartidas = {
    pagos: [
      { 
        id: 'stripe', 
        name: 'Tarjetas (Stripe)', 
        description: 'Acepta tarjetas de crédito/débito',
        icon: CreditCard, 
        color: 'from-purple-500 to-indigo-600',
        enabled: true,
        fee: '1.4% + €0.25',
        configuredByInmova: true,
      },
      { 
        id: 'gocardless', 
        name: 'Domiciliación SEPA (GoCardless)', 
        description: 'Cobro por domiciliación bancaria',
        icon: Building2, 
        color: 'from-cyan-500 to-blue-600',
        enabled: true,
        fee: '1% + €0.20',
        configuredByInmova: true,
      },
      { 
        id: 'bizum', 
        name: 'Bizum (Redsys)', 
        description: 'Pagos instantáneos con móvil',
        icon: Smartphone, 
        color: 'from-green-500 to-teal-600',
        enabled: false,
        fee: '0.5%',
        configuredByInmova: true,
      },
      { 
        id: 'tpv', 
        name: 'TPV Virtual (Redsys)', 
        description: 'Terminal punto de venta',
        icon: CreditCard, 
        color: 'from-red-500 to-orange-500',
        enabled: false,
        fee: '0.5% - 1.5%',
        configuredByInmova: true,
      },
    ],
    firma: [
      { 
        id: 'docusign', 
        name: 'DocuSign', 
        description: 'Firma electrónica avanzada',
        icon: FileSignature, 
        color: 'from-yellow-500 to-amber-600',
        enabled: true,
        compliance: ['eIDAS', 'ESIGN'],
        configuredByInmova: true,
      },
      { 
        id: 'signaturit', 
        name: 'Signaturit', 
        description: 'Firma cualificada España',
        icon: Shield, 
        color: 'from-blue-500 to-blue-600',
        enabled: false,
        compliance: ['eIDAS QES'],
        configuredByInmova: true,
      },
    ],
  };

  const handleConnect = (integration: any) => {
    toast.info(`Configurando ${integration.name}...`, {
      description: integration.url 
        ? `Se abrirá la página de ${integration.name} para conectar tu cuenta`
        : 'Completa la configuración en el siguiente paso'
    });
    
    // Si tiene URL, abrir en nueva ventana
    if (integration.url) {
      window.open(integration.url, '_blank');
    }
  };

  const IntegrationCardPropia = ({ integration }: { integration: any }) => (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardContent className="pt-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3 flex-1">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center flex-shrink-0`}>
              <integration.icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium truncate">{integration.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{integration.description}</p>
            </div>
          </div>
          <Badge variant={integration.status === 'connected' ? 'default' : 'outline'} className={`flex-shrink-0 ml-2 ${integration.status === 'connected' ? 'bg-green-500' : 'text-amber-600 border-amber-400'}`}>
            {integration.status === 'connected' ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Integrado</>
            ) : (
              <><AlertCircle className="h-3 w-3 mr-1" /> Pendiente</>
            )}
          </Badge>
        </div>
        
        <Button 
          size="sm" 
          className="w-full mt-auto" 
          variant={integration.status === 'connected' ? 'outline' : 'default'}
          onClick={() => handleConnect(integration)}
        >
          {integration.status === 'connected' ? (
            <><Settings className="h-4 w-4 mr-2" /> Configurar</>
          ) : (
            <><Link2 className="h-4 w-4 mr-2" /> Conectar</>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const [enabledServices, setEnabledServices] = useState<Record<string, boolean>>({
    stripe: true,
    gocardless: true,
    bizum: false,
    tpv: false,
    docusign: true,
    signaturit: false,
  });

  const handleToggleService = (serviceId: string, enabled: boolean) => {
    setEnabledServices(prev => ({ ...prev, [serviceId]: enabled }));
    
    if (enabled) {
      toast.success(`Servicio activado`, {
        description: `El servicio se ha habilitado correctamente`
      });
    } else {
      toast.info(`Servicio desactivado`, {
        description: `El servicio ya no estará disponible para tus usuarios`
      });
    }
  };

  const IntegrationCardCompartida = ({ integration, type }: { integration: any; type: 'pagos' | 'firma' }) => {
    const isEnabled = enabledServices[integration.id] ?? integration.enabled;
    
    return (
      <Card className={`hover:shadow-md transition-shadow h-full flex flex-col ${isEnabled ? '' : 'opacity-70'}`}>
        <CardContent className="pt-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center flex-shrink-0`}>
                <integration.icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium truncate">{integration.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{integration.description}</p>
              </div>
            </div>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={(checked) => handleToggleService(integration.id, checked)}
              className="flex-shrink-0 ml-2"
            />
          </div>

          {type === 'pagos' && integration.fee && (
            <div className="text-sm text-muted-foreground mb-2 p-2 bg-gray-50 rounded">
              💰 Comisión: <span className="font-medium">{integration.fee}</span>
            </div>
          )}

          {type === 'firma' && integration.usage && (
            <div className="flex gap-4 text-sm mb-2 p-2 bg-gray-50 rounded">
              <span>📤 Enviados: <strong>{integration.usage.sent}</strong></span>
              <span>✅ Firmados: <strong>{integration.usage.signed}</strong></span>
            </div>
          )}

          <div className="mt-auto pt-3 space-y-2">
            {integration.configuredByInmova && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Configurado por Inmova
              </div>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => toast.info(`Ver configuración de ${integration.name}`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ver detalles
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Herramientas e Integraciones</h1>
              <p className="text-muted-foreground">Conecta tus herramientas de terceros y activa servicios compartidos</p>
            </div>
          </div>
        </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="propias">🔧 Mis Integraciones</TabsTrigger>
          <TabsTrigger value="compartidas">🤝 Servicios Inmova</TabsTrigger>
        </TabsList>

        {/* ========================================== */}
        {/* TAB: INTEGRACIONES PROPIAS DE LA EMPRESA */}
        {/* ========================================== */}
        <TabsContent value="propias" className="space-y-8">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>🔧 Mis Integraciones:</strong> Conecta tus propias cuentas de servicios de terceros. 
                Tú gestionas las credenciales y la configuración.
              </p>
            </CardContent>
          </Card>

          {/* Contabilidad */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Euro className="h-5 w-5" /> Contabilidad
            </h2>
            <p className="text-muted-foreground mb-4">
              Conecta tu software de contabilidad para sincronizar facturas y gastos automáticamente.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integracionesPropias.contabilidad.map(i => <IntegrationCardPropia key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Banca */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building className="h-5 w-5" /> Conexión Bancaria
            </h2>
            <p className="text-muted-foreground mb-4">
              Conecta tus cuentas bancarias para conciliación automática de pagos.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integracionesPropias.banca.map(i => <IntegrationCardPropia key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Portales Inmobiliarios */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Share2 className="h-5 w-5" /> Portales Inmobiliarios
            </h2>
            <p className="text-muted-foreground mb-4">
              Publica tus propiedades automáticamente en los principales portales.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integracionesPropias.portales.map(i => <IntegrationCardPropia key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Plataformas de Media Estancia */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Plataformas de Media Estancia
            </h2>
            <p className="text-muted-foreground mb-4">
              Conecta con las plataformas de alquiler temporal más populares en España (1-11 meses).
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integracionesPropias.mediaEstancia.map(i => <IntegrationCardPropia key={i.id} integration={i} />)}
            </div>
          </section>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB: SERVICIOS COMPARTIDOS DE INMOVA */}
        {/* ========================================== */}
        <TabsContent value="compartidas" className="space-y-8">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>🤝 Servicios Inmova:</strong> Estos servicios están configurados por Inmova a nivel de plataforma. 
                Tú solo activas/desactivas los que quieras usar. Sin configuración adicional.
              </p>
            </CardContent>
          </Card>

          {/* Pagos */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Métodos de Pago
            </h2>
            <p className="text-muted-foreground mb-4">
              Activa los métodos de pago que quieras ofrecer a tus inquilinos. Las comisiones se descuentan automáticamente.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {integracionesCompartidas.pagos.map(i => <IntegrationCardCompartida key={i.id} integration={i} type="pagos" />)}
            </div>
          </section>

          <Separator />

          {/* Firma Digital */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileSignature className="h-5 w-5" /> Firma Digital
            </h2>
            <p className="text-muted-foreground mb-4">
              Envía contratos y documentos a firmar electrónicamente. Legalmente válido.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {integracionesCompartidas.firma.map(i => <IntegrationCardCompartida key={i.id} integration={i} type="firma" />)}
            </div>

            {/* Aviso sobre estadísticas */}
            <Card className="mt-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Estadísticas de Firma Digital</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Las estadísticas de uso se mostrarán aquí una vez que comiences a enviar documentos para firmar.
                      Activa un servicio de firma y envía tu primer documento para ver las métricas.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => window.location.href = '/admin/firma-digital'}
                    >
                      <FileSignature className="h-4 w-4 mr-2" />
                      Ir a Firma Digital
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
