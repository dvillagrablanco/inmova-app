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

interface CompanyIntegration {
  id: string;
  provider: string;
  category: string;
  enabled: boolean;
  isConfigured: boolean;
  testStatus?: string;
  lastSyncAt?: string;
}

interface PlatformStatusData {
  plataforma?: any;
  compartidas?: any;
}

export default function HerramientasEmpresaPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('propias');
  const [companyIntegrations, setCompanyIntegrations] = useState<CompanyIntegration[]>([]);
  const [platformStatus, setPlatformStatus] = useState<PlatformStatusData>({});
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar integraciones reales de la empresa y estado de plataforma
  useEffect(() => {
    if (status !== 'authenticated') return;

    async function loadIntegrationStatus() {
      setLoadingIntegrations(true);
      try {
        // Cargar integraciones de la empresa (BD)
        const companyRes = await fetch('/api/integrations');
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompanyIntegrations(companyData.data || []);
        }

        // Cargar estado de plataforma (env vars)
        const platformRes = await fetch('/api/admin/integraciones/status');
        if (platformRes.ok) {
          const platformData = await platformRes.json();
          setPlatformStatus(platformData);
        }
      } catch (error) {
        console.error('Error loading integration status:', error);
      } finally {
        setLoadingIntegrations(false);
      }
    }

    loadIntegrationStatus();
  }, [status]);

  // Determinar estado real de una integración propia
  const getProviderStatus = (providerId: string): 'connected' | 'disconnected' => {
    // Buscar en integraciones de la empresa (BD)
    const companyInteg = companyIntegrations.find(
      (i) => i.provider === providerId || i.provider.toLowerCase() === providerId.toLowerCase()
    );
    if (companyInteg && companyInteg.isConfigured && companyInteg.enabled) {
      return 'connected';
    }

    // Buscar en status de plataforma (env vars) para integraciones que se configuran a nivel servidor
    const platformContab = platformStatus?.plataforma?.contabilidad?.[providerId];
    if (platformContab?.configured) {
      return 'connected';
    }

    return 'disconnected';
  };

  // Determinar estado real de una integración compartida
  const getSharedProviderStatus = (providerId: string, type: 'pagos' | 'firma'): boolean => {
    const shared = platformStatus?.compartidas?.[type]?.[providerId];
    if (shared?.configured) return true;

    // Fallback a integraciones de empresa
    const companyInteg = companyIntegrations.find(
      (i) => i.provider === providerId
    );
    return !!(companyInteg?.isConfigured && companyInteg?.enabled);
  };

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
        get status() { return getProviderStatus('contasimple'); },
        config: { apiKey: '', companyId: '' }
      },
      { 
        id: 'holded', 
        name: 'Holded', 
        description: 'ERP y contabilidad',
        icon: Euro, 
        color: 'from-purple-500 to-purple-600',
        get status() { return getProviderStatus('holded'); },
      },
      { 
        id: 'a3', 
        name: 'A3 Software', 
        description: 'Contabilidad profesional',
        icon: Euro, 
        color: 'from-green-500 to-green-600',
        get status() { return getProviderStatus('a3'); },
      },
      { 
        id: 'sage', 
        name: 'Sage', 
        description: 'Gestión empresarial',
        icon: Euro, 
        color: 'from-teal-500 to-teal-600',
        get status() { return getProviderStatus('sage'); },
      },
      { 
        id: 'alegra', 
        name: 'Alegra', 
        description: 'Facturación y contabilidad',
        icon: Euro, 
        color: 'from-orange-500 to-orange-600',
        get status() { return getProviderStatus('alegra'); },
      },
      { 
        id: 'zucchetti', 
        name: 'Zucchetti', 
        description: 'Software de gestión',
        icon: Euro, 
        color: 'from-red-500 to-red-600',
        get status() { return getProviderStatus('zucchetti'); },
      },
    ],
    banca: [
      { 
        id: 'openbanking', 
        name: 'Open Banking', 
        description: 'Conexión bancaria PSD2',
        icon: Building, 
        color: 'from-blue-600 to-indigo-600',
        get status() { return getProviderStatus('openbanking'); },
      },
      { 
        id: 'plaid', 
        name: 'Plaid', 
        description: 'Agregador bancario',
        icon: Link2, 
        color: 'from-black to-gray-700',
        get status() { return getProviderStatus('plaid'); },
      },
    ],
    portales: [
      { 
        id: 'idealista', 
        name: 'Idealista', 
        description: 'Portal líder en España',
        icon: Globe, 
        color: 'from-green-500 to-green-600',
        get status() { return getProviderStatus('idealista'); },
      },
      { 
        id: 'fotocasa', 
        name: 'Fotocasa', 
        description: 'Portal inmobiliario',
        icon: Globe, 
        color: 'from-red-500 to-red-600',
        get status() { return getProviderStatus('fotocasa'); },
      },
      { 
        id: 'habitaclia', 
        name: 'Habitaclia', 
        description: 'Portal de Cataluña',
        icon: Globe, 
        color: 'from-blue-500 to-blue-600',
        get status() { return getProviderStatus('habitaclia'); },
      },
      { 
        id: 'pisos', 
        name: 'Pisos.com', 
        description: 'Buscador de pisos',
        icon: Globe, 
        color: 'from-orange-500 to-orange-600',
        get status() { return getProviderStatus('pisos'); },
      },
      { 
        id: 'yaencontre', 
        name: 'yaencontré', 
        description: 'Portal inmobiliario',
        icon: Globe, 
        color: 'from-purple-500 to-purple-600',
        get status() { return getProviderStatus('yaencontre'); },
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
        get enabled() { return getSharedProviderStatus('stripe', 'pagos'); },
        fee: '1.4% + €0.25',
        configuredByInmova: true,
      },
      { 
        id: 'gocardless', 
        name: 'Domiciliación SEPA (GoCardless)', 
        description: 'Cobro por domiciliación bancaria',
        icon: Building2, 
        color: 'from-cyan-500 to-blue-600',
        get enabled() { return getSharedProviderStatus('gocardless', 'pagos'); },
        fee: '1% + €0.20',
        configuredByInmova: true,
      },
      { 
        id: 'bizum', 
        name: 'Bizum (Redsys)', 
        description: 'Pagos instantáneos con móvil',
        icon: Smartphone, 
        color: 'from-green-500 to-teal-600',
        get enabled() { return getSharedProviderStatus('redsys', 'pagos'); },
        fee: '0.5%',
        configuredByInmova: true,
      },
      { 
        id: 'tpv', 
        name: 'TPV Virtual (Redsys)', 
        description: 'Terminal punto de venta',
        icon: CreditCard, 
        color: 'from-red-500 to-orange-500',
        get enabled() { return getSharedProviderStatus('redsys', 'pagos'); },
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
        get enabled() { return getSharedProviderStatus('docusign', 'firma'); },
        compliance: ['eIDAS', 'ESIGN'],
        configuredByInmova: true,
        usage: { sent: 45, signed: 42 },
      },
      { 
        id: 'signaturit', 
        name: 'Signaturit', 
        description: 'Firma cualificada España',
        icon: Shield, 
        color: 'from-blue-500 to-blue-600',
        get enabled() { return getSharedProviderStatus('signaturit', 'firma'); },
        compliance: ['eIDAS QES'],
        configuredByInmova: true,
        usage: { sent: 0, signed: 0 },
      },
    ],
  };

  // Mapeo de rutas de configuración para integraciones propias
  const getConfigUrl = (integrationId: string, category: string): string => {
    const routes: Record<string, string> = {
      // Contabilidad
      'contasimple': '/contabilidad/integraciones',
      'holded': '/contabilidad/integraciones',
      'a3': '/contabilidad/integraciones',
      'sage': '/contabilidad/integraciones',
      'alegra': '/contabilidad/integraciones',
      'zucchetti': '/contabilidad/integraciones',
      // Banca
      'openbanking': '/admin/integraciones-banca',
      'plaid': '/admin/integraciones-banca',
      // Portales
      'idealista': '/dashboard/integrations/idealista',
      'fotocasa': '/dashboard/integrations/fotocasa',
      'habitaclia': '/dashboard/integrations/habitaclia',
      'pisos': '/dashboard/integrations/pisos',
      'yaencontre': '/dashboard/integrations/yaencontre',
    };
    return routes[integrationId] || `/dashboard/integrations/${integrationId}`;
  };

  const IntegrationCardPropia = ({ integration, category }: { integration: any; category: string }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
              <integration.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium">{integration.name}</h4>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </div>
          <Badge variant={integration.status === 'connected' ? 'default' : 'outline'} className={integration.status === 'connected' ? 'bg-green-500' : 'text-amber-600 border-amber-400'}>
            {integration.status === 'connected' ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Integrado</>
            ) : (
              <><AlertCircle className="h-3 w-3 mr-1" /> Pendiente</>
            )}
          </Badge>
        </div>
        
        <Button 
          size="sm" 
          className="w-full" 
          variant={integration.status === 'connected' ? 'outline' : 'default'}
          onClick={() => router.push(getConfigUrl(integration.id, category))}
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

  // Mapeo de rutas para integraciones compartidas
  const getSharedConfigUrl = (integrationId: string, type: 'pagos' | 'firma'): string => {
    const routes: Record<string, string> = {
      // Pagos
      'stripe': '/configuracion/integraciones/stripe',
      'gocardless': '/configuracion/integraciones/gocardless',
      'bizum': '/configuracion/integraciones/redsys',
      'tpv': '/configuracion/integraciones/redsys',
      // Firma
      'docusign': '/firma-digital/configuracion',
      'signaturit': '/firma-digital/configuracion',
    };
    return routes[integrationId] || (type === 'pagos' ? '/pagos/configuracion' : '/firma-digital/configuracion');
  };

  const IntegrationCardCompartida = ({ integration, type }: { integration: any; type: 'pagos' | 'firma' }) => (
    <Card className={`hover:shadow-md transition-shadow ${integration.enabled ? '' : 'opacity-60'}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
              <integration.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium">{integration.name}</h4>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </div>
          <Switch checked={integration.enabled} />
        </div>

        {type === 'pagos' && integration.fee && (
          <div className="text-sm text-muted-foreground mb-2">
            Comisión: <span className="font-medium">{integration.fee}</span>
          </div>
        )}

        {type === 'firma' && integration.usage && (
          <div className="flex gap-4 text-sm mb-2">
            <span>Enviados: <strong>{integration.usage.sent}</strong></span>
            <span>Firmados: <strong>{integration.usage.signed}</strong></span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {integration.configuredByInmova && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Configurado por Inmova
            </div>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => router.push(getSharedConfigUrl(integration.id, type))}
          >
            <Settings className="h-4 w-4 mr-1" />
            Ver Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
              {integracionesPropias.contabilidad.map(i => <IntegrationCardPropia key={i.id} integration={i} category="contabilidad" />)}
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
              {integracionesPropias.banca.map(i => <IntegrationCardPropia key={i.id} integration={i} category="banca" />)}
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
              {integracionesPropias.portales.map(i => <IntegrationCardPropia key={i.id} integration={i} category="portales" />)}
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

            {/* Estadísticas de uso */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Tu uso de Firma Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">45</p>
                    <p className="text-sm text-muted-foreground">Documentos enviados</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">42</p>
                    <p className="text-sm text-muted-foreground">Firmados</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">93%</p>
                    <p className="text-sm text-muted-foreground">Tasa de firma</p>
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
