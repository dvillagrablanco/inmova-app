'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Check,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Unlink,
  Building,
  Lock,
  TrendingUp,
  CreditCard,
  Shield,
  Wallet,
  ArrowRightLeft,
  FileText,
  Home,
  ArrowLeft,
  Globe,
  Zap,
  BarChart3,
  Clock,
  Euro,
  PiggyBank,
} from 'lucide-react';
import { toast } from 'sonner';

interface BankIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'pending';
  features: string[];
  banks?: string[];
  region: string;
  configFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
  }>;
  docsUrl?: string;
  pricing?: string;
}

const bankIntegrations: BankIntegration[] = [
  {
    id: 'openbanking-psd2',
    name: 'Open Banking (PSD2)',
    description: 'Conexión directa con bancos españoles y europeos mediante APIs reguladas bajo la normativa PSD2.',
    icon: <Building className="h-8 w-8 text-blue-600" />,
    status: 'disconnected',
    region: 'Europa',
    features: [
      'Saldos en tiempo real',
      'Historial de movimientos (90 días)',
      'Conciliación automática de pagos',
      'Iniciación de pagos (PIS)',
      'Cumplimiento normativo PSD2',
    ],
    banks: ['Santander', 'BBVA', 'CaixaBank', 'Sabadell', 'Bankinter', 'ING', 'Openbank', 'Revolut'],
    configFields: [
      { name: 'OB_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: 'Tu Client ID', required: true },
      { name: 'OB_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'Tu Client Secret', required: true },
      { name: 'OB_REDIRECT_URI', label: 'Redirect URI', type: 'text', placeholder: 'https://tuapp.com/callback', required: true },
    ],
    docsUrl: 'https://www.berlin-group.org/',
    pricing: 'Gratis (API directa con bancos)',
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Agregador bancario internacional líder. Conecta con más de 11.000 instituciones financieras.',
    icon: <Globe className="h-8 w-8 text-green-600" />,
    status: 'disconnected',
    region: 'Global',
    features: [
      'Multi-banco internacional',
      'Verificación de cuentas',
      'Historial financiero completo',
      'Categorización automática IA',
      'Verificación de identidad',
    ],
    banks: ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One', '+11.000 más'],
    configFields: [
      { name: 'PLAID_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: 'Tu Client ID de Plaid', required: true },
      { name: 'PLAID_SECRET', label: 'Secret', type: 'password', placeholder: 'Tu Secret de Plaid', required: true },
      { name: 'PLAID_ENV', label: 'Entorno', type: 'text', placeholder: 'sandbox, development, production', required: true },
    ],
    docsUrl: 'https://plaid.com/docs/',
    pricing: 'Desde $500/mes',
  },
  {
    id: 'tink',
    name: 'Tink',
    description: 'Plataforma de Open Banking europea. Propiedad de Visa, conexión con 3.400+ bancos en Europa.',
    icon: <Zap className="h-8 w-8 text-purple-600" />,
    status: 'disconnected',
    region: 'Europa',
    features: [
      'Cobertura europea amplia',
      'Agregación de cuentas',
      'Iniciación de pagos',
      'Verificación de ingresos',
      'Análisis financiero',
    ],
    banks: ['Bancos europeos principales'],
    configFields: [
      { name: 'TINK_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: 'Tu Client ID', required: true },
      { name: 'TINK_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'Tu Client Secret', required: true },
    ],
    docsUrl: 'https://docs.tink.com/',
    pricing: 'Contactar para pricing',
  },
  {
    id: 'salt-edge',
    name: 'Salt Edge',
    description: 'Solución de Open Banking con cobertura en 50+ países y 5.000+ conexiones bancarias.',
    icon: <ArrowRightLeft className="h-8 w-8 text-orange-600" />,
    status: 'disconnected',
    region: 'Global',
    features: [
      'Cobertura global',
      'API unificada',
      'Widget de conexión',
      'Sincronización automática',
      'Compliance multi-jurisdicción',
    ],
    configFields: [
      { name: 'SALTEDGE_APP_ID', label: 'App ID', type: 'text', placeholder: 'Tu App ID', required: true },
      { name: 'SALTEDGE_SECRET', label: 'Secret', type: 'password', placeholder: 'Tu Secret', required: true },
    ],
    docsUrl: 'https://docs.saltedge.com/',
    pricing: 'Desde €300/mes',
  },
  {
    id: 'afterbanks',
    name: 'Afterbanks',
    description: 'Especializado en el mercado español y LATAM. Conexión con todos los bancos españoles.',
    icon: <Euro className="h-8 w-8 text-indigo-600" />,
    status: 'disconnected',
    region: 'España/LATAM',
    features: [
      'Especializado en España',
      'Cobertura LATAM',
      'Soporte en español',
      'API sencilla',
      'Documentación en español',
    ],
    banks: ['Todos los bancos españoles', 'Bancos LATAM principales'],
    configFields: [
      { name: 'AFTERBANKS_SERVICE_KEY', label: 'Service Key', type: 'password', placeholder: 'Tu Service Key', required: true },
    ],
    docsUrl: 'https://www.afterbanks.com/docs',
    pricing: 'Desde €100/mes',
  },
];

// Estadísticas simuladas
const stats = {
  cuentasConectadas: 0,
  transaccionesSincronizadas: 0,
  ultimaSincronizacion: null as Date | null,
  conciliacionesPendientes: 0,
};

export default function OpenBankingPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [selectedIntegration, setSelectedIntegration] = useState<BankIntegration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [connectedBanks, setConnectedBanks] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSaveConfig = async () => {
    toast.success('Configuración guardada correctamente.');
    setSelectedIntegration(null);
    setConfigValues({});
  };

  const handleConnectBank = () => {
    toast.info('Iniciando conexión bancaria...');
    // OAuth flow simulation
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Sincronización completada');
    }, 2000);
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/finanzas')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Finanzas
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Open Banking</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building className="h-8 w-8 text-primary" />
              Open Banking
            </h1>
            <p className="text-muted-foreground mt-2">
              Conecta tus cuentas bancarias para automatizar pagos, conciliaciones y análisis financiero
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push('/banco/importar')}>
              <FileText className="mr-2 h-4 w-4" />
              Importar Norma 43
            </Button>
            <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            <Button variant="outline" onClick={() => router.push('/finanzas/conciliacion')}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Conciliación
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/integraciones-banca')}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </div>
        </div>

        {/* Security Alert */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Conexión segura PSD2:</strong> Usamos protocolos bancarios regulados por la Unión Europea. 
            Nunca almacenamos tus credenciales bancarias. La conexión se realiza directamente con tu banco mediante OAuth.
          </AlertDescription>
        </Alert>

        {/* Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuentas Conectadas</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cuentasConectadas}</div>
              <p className="text-xs text-muted-foreground">De múltiples bancos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transacciones Sync</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transaccionesSincronizadas}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliaciones</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conciliacionesPendientes}</div>
              <p className="text-xs text-muted-foreground">Pendientes de revisar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Conecta una cuenta</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="integraciones" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
            <TabsTrigger value="cuentas">Cuentas Conectadas</TabsTrigger>
            <TabsTrigger value="funcionalidades">Funcionalidades</TabsTrigger>
          </TabsList>

          <TabsContent value="integraciones" className="space-y-4 mt-4">
            {selectedIntegration ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedIntegration.icon}
                      <div>
                        <CardTitle>{selectedIntegration.name}</CardTitle>
                        <CardDescription>{selectedIntegration.description}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedIntegration(null)}>
                      Cerrar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Características</h4>
                      <ul className="space-y-2">
                        {selectedIntegration.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {selectedIntegration.banks && (
                      <div>
                        <h4 className="font-semibold mb-2">Bancos Soportados</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedIntegration.banks.map((bank, i) => (
                            <Badge key={i} variant="secondary">{bank}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Configuración</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedIntegration.configFields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={configValues[field.name] || ''}
                            onChange={(e) => setConfigValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      {selectedIntegration.docsUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
                            Documentación
                          </a>
                        </Button>
                      )}
                      {selectedIntegration.pricing && (
                        <Badge variant="outline">{selectedIntegration.pricing}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveConfig}>
                        <Check className="mr-2 h-4 w-4" />
                        Guardar Configuración
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bankIntegrations.map((integration) => (
                  <Card key={integration.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        {integration.icon}
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status === 'connected' ? 'Conectado' : 'No configurado'}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{integration.name}</CardTitle>
                      <CardDescription className="text-sm">{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Globe className="h-4 w-4" />
                        {integration.region}
                      </div>
                      <ul className="space-y-1 text-sm">
                        {integration.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                        {integration.features.length > 3 && (
                          <li className="text-muted-foreground">
                            +{integration.features.length - 3} más...
                          </li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        {integration.status === 'connected' ? (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar
                          </>
                        ) : (
                          <>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Conectar
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cuentas" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cuentas Bancarias Conectadas</CardTitle>
                <CardDescription>
                  Gestiona las cuentas bancarias vinculadas a tu plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectedBanks.length === 0 ? (
                  <div className="text-center py-12">
                    <PiggyBank className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay cuentas conectadas</h3>
                    <p className="text-muted-foreground mb-4">
                      Conecta tu primera cuenta bancaria para empezar a sincronizar transacciones
                    </p>
                    <Button onClick={() => setSelectedIntegration(bankIntegrations[0])}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Conectar cuenta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lista de cuentas conectadas */}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funcionalidades" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                    Conciliación Automática
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Concilia automáticamente los pagos recibidos con las facturas y alquileres pendientes.
                    El sistema identifica pagos por importe, referencia y fecha.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Matching automático de pagos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Alertas de pagos no conciliados
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Historial de conciliaciones
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-green-600" />
                    Pagos SEPA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Emite y gestiona domiciliaciones SEPA para el cobro automático de alquileres.
                    Compatible con la normativa europea de pagos.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Domiciliación de recibos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Gestión de mandatos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Notificación de devoluciones
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Análisis Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Obtén insights sobre tu flujo de caja, morosidad y proyecciones
                    basadas en datos bancarios reales.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Dashboard de flujo de caja
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Análisis de morosidad
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Proyecciones de ingresos
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Verificación de Inquilinos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Verifica la solvencia de potenciales inquilinos analizando su historial
                    bancario (con su consentimiento).
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Verificación de ingresos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Análisis de gastos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Score de solvencia
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">¿Necesitas ayuda con la integración?</h3>
                <p className="text-muted-foreground">
                  Nuestro equipo técnico puede ayudarte a configurar la conexión bancaria
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  Ver documentación
                </Button>
                <Button>
                  Contactar soporte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
