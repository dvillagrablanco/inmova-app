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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  Euro,
  MessageSquare,
  Phone,
  Mail,
  BarChart3,
  MousePointer2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Cloud,
  Database,
  Brain,
  Bug,
  CreditCard,
  FileSignature,
  Building2,
  Smartphone,
  Shield,
  Users,
  Zap,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface IntegrationStatus {
  configured: boolean;
  [key: string]: any;
}

interface IntegrationsData {
  plataforma: {
    contabilidad: { contasimple: IntegrationStatus };
    comunicacion: { crisp: IntegrationStatus; twilio: IntegrationStatus; sendgrid: IntegrationStatus; gmail: IntegrationStatus };
    analytics: { ga4: IntegrationStatus; hotjar: IntegrationStatus };
    social: { facebook: IntegrationStatus; instagram: IntegrationStatus; linkedin: IntegrationStatus; twitter: IntegrationStatus };
    infraestructura: { aws: IntegrationStatus; postgresql: IntegrationStatus };
    ia: { claude: IntegrationStatus };
    monitoreo: { sentry: IntegrationStatus };
  };
  compartidas: {
    pagos: { stripe: IntegrationStatus; gocardless: IntegrationStatus; redsys: IntegrationStatus };
    firma: { docusign: IntegrationStatus; signaturit: IntegrationStatus };
  };
  resumen: {
    plataforma: { configured: number; total: number };
    compartidas: { configured: number; total: number };
    total: { configured: number; total: number };
  };
}

export default function IntegracionesUnificadasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('plataforma');
  const [data, setData] = useState<IntegrationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  // Cargar datos reales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/integraciones/status');
        if (!res.ok) throw new Error('Error al cargar datos');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integraciones/status');
      if (!res.ok) throw new Error('Error al cargar datos');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>Error: {error}</p>
              </div>
              <Button onClick={refreshData} className="mt-4" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Configuración de integraciones con datos reales
  const plataformaIntegrations = {
    contabilidad: [
      { 
        id: 'contasimple', 
        name: 'Contasimple', 
        description: 'Contabilidad de Inmova',
        icon: Euro, 
        color: 'from-blue-500 to-blue-600',
        status: data?.plataforma?.contabilidad?.contasimple?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.contabilidad?.contasimple,
      },
    ],
    comunicacion: [
      { 
        id: 'crisp', 
        name: 'Crisp', 
        description: 'Chat en vivo y soporte',
        icon: MessageSquare, 
        color: 'from-purple-500 to-purple-600',
        status: data?.plataforma?.comunicacion?.crisp?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.comunicacion?.crisp,
      },
      { 
        id: 'twilio', 
        name: 'Twilio', 
        description: 'SMS y llamadas',
        icon: Phone, 
        color: 'from-red-500 to-red-600',
        status: data?.plataforma?.comunicacion?.twilio?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.comunicacion?.twilio,
      },
      { 
        id: 'sendgrid', 
        name: 'SendGrid', 
        description: 'Email transaccional',
        icon: Mail, 
        color: 'from-blue-400 to-blue-500',
        status: data?.plataforma?.comunicacion?.sendgrid?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.comunicacion?.sendgrid,
      },
      { 
        id: 'gmail', 
        name: 'Gmail SMTP', 
        description: 'Email de respaldo',
        icon: Mail, 
        color: 'from-red-400 to-red-500',
        status: data?.plataforma?.comunicacion?.gmail?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.comunicacion?.gmail,
      },
    ],
    analytics: [
      { 
        id: 'ga4', 
        name: 'Google Analytics 4', 
        description: 'Análisis de tráfico',
        icon: BarChart3, 
        color: 'from-orange-500 to-yellow-500',
        status: data?.plataforma?.analytics?.ga4?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.analytics?.ga4,
      },
      { 
        id: 'hotjar', 
        name: 'Hotjar', 
        description: 'Mapas de calor',
        icon: MousePointer2, 
        color: 'from-red-500 to-pink-500',
        status: data?.plataforma?.analytics?.hotjar?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.analytics?.hotjar,
      },
    ],
    social: [
      { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700', status: data?.plataforma?.social?.facebook?.configured ? 'connected' : 'disconnected' },
      { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600', status: data?.plataforma?.social?.instagram?.configured ? 'connected' : 'disconnected' },
      { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-800', status: data?.plataforma?.social?.linkedin?.configured ? 'connected' : 'disconnected' },
      { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'from-gray-700 to-black', status: data?.plataforma?.social?.twitter?.configured ? 'connected' : 'disconnected' },
    ],
    infraestructura: [
      { 
        id: 'aws', 
        name: 'AWS S3', 
        description: 'Almacenamiento de archivos',
        icon: Cloud, 
        color: 'from-orange-500 to-amber-500',
        status: data?.plataforma?.infraestructura?.aws?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.infraestructura?.aws,
      },
      { 
        id: 'postgresql', 
        name: 'PostgreSQL', 
        description: 'Base de datos principal',
        icon: Database, 
        color: 'from-blue-600 to-blue-700',
        status: data?.plataforma?.infraestructura?.postgresql?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.infraestructura?.postgresql,
      },
    ],
    ia: [
      { 
        id: 'claude', 
        name: 'Anthropic Claude', 
        description: 'IA para valoraciones y asistente',
        icon: Brain, 
        color: 'from-purple-500 to-pink-500',
        status: data?.plataforma?.ia?.claude?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.ia?.claude,
      },
    ],
    monitoreo: [
      { 
        id: 'sentry', 
        name: 'Sentry', 
        description: 'Tracking de errores',
        icon: Bug, 
        color: 'from-violet-500 to-purple-600',
        status: data?.plataforma?.monitoreo?.sentry?.configured ? 'connected' : 'disconnected',
        details: data?.plataforma?.monitoreo?.sentry,
      },
    ],
  };

  const compartidaIntegrations = {
    pagos: [
      { 
        id: 'stripe', 
        name: 'Stripe', 
        description: 'Tarjetas de crédito/débito',
        icon: CreditCard, 
        color: 'from-purple-500 to-indigo-600',
        status: data?.compartidas?.pagos?.stripe?.configured ? 'connected' : 'disconnected',
        mode: data?.compartidas?.pagos?.stripe?.mode || 'test',
        details: data?.compartidas?.pagos?.stripe,
      },
      { 
        id: 'gocardless', 
        name: 'GoCardless', 
        description: 'Domiciliación SEPA',
        icon: Building2, 
        color: 'from-cyan-500 to-blue-600',
        status: data?.compartidas?.pagos?.gocardless?.configured ? 'connected' : 'disconnected',
        mode: data?.compartidas?.pagos?.gocardless?.mode || 'sandbox',
        details: data?.compartidas?.pagos?.gocardless,
      },
      { 
        id: 'redsys', 
        name: 'Redsys', 
        description: 'TPV Virtual y Bizum',
        icon: Smartphone, 
        color: 'from-red-500 to-orange-500',
        status: data?.compartidas?.pagos?.redsys?.configured ? 'connected' : 'disconnected',
        mode: data?.compartidas?.pagos?.redsys?.mode || 'test',
        details: data?.compartidas?.pagos?.redsys,
      },
    ],
    firma: [
      { 
        id: 'docusign', 
        name: 'DocuSign', 
        description: 'Firma electrónica avanzada',
        icon: FileSignature, 
        color: 'from-yellow-500 to-amber-600',
        status: data?.compartidas?.firma?.docusign?.configured ? 'connected' : 'disconnected',
        compliance: ['eIDAS', 'ESIGN'],
        details: data?.compartidas?.firma?.docusign,
      },
      { 
        id: 'signaturit', 
        name: 'Signaturit', 
        description: 'Firma cualificada España/UE',
        icon: Shield, 
        color: 'from-blue-500 to-blue-600',
        status: data?.compartidas?.firma?.signaturit?.configured ? 'connected' : 'disconnected',
        compliance: ['eIDAS QES', 'LOPD'],
        details: data?.compartidas?.firma?.signaturit,
      },
    ],
  };

  const IntegrationCard = ({ integration }: { integration: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
              <integration.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium">{integration.name}</h4>
              {integration.description && (
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              )}
            </div>
          </div>
          <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
            {integration.status === 'connected' ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Configurado</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> No configurado</>
            )}
          </Badge>
        </div>
        
        {integration.details && integration.status === 'connected' && (
          <div className="mt-3 text-sm space-y-1">
            {Object.entries(integration.details).map(([key, value]) => {
              if (key === 'configured' || !value) return null;
              return (
                <div key={key} className="flex justify-between text-muted-foreground">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-mono text-xs">{String(value)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Integraciones de Plataforma</h1>
                <p className="text-muted-foreground">Gestión centralizada de todas las integraciones de Inmova</p>
              </div>
            </div>
            <Button onClick={refreshData} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Actualizar
            </Button>
          </div>

        {/* Resumen */}
        {data?.resumen && (
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Plataforma</p>
                    <p className="text-2xl font-bold">{data.resumen.plataforma.configured}/{data.resumen.plataforma.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Compartidas</p>
                    <p className="text-2xl font-bold">{data.resumen.compartidas.configured}/{data.resumen.compartidas.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-green-600">{data.resumen.total.configured}/{data.resumen.total.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="plataforma">🏢 Solo Inmova</TabsTrigger>
          <TabsTrigger value="compartidas">🤝 Compartidas</TabsTrigger>
        </TabsList>

        {/* TAB: INTEGRACIONES DE PLATAFORMA */}
        <TabsContent value="plataforma" className="space-y-8">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>ℹ️ Integraciones de Plataforma:</strong> Son usadas exclusivamente por Inmova para operar la plataforma SaaS.
              </p>
            </CardContent>
          </Card>

          {/* Contabilidad */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Euro className="h-5 w-5" /> Contabilidad
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plataformaIntegrations.contabilidad.map(i => <IntegrationCard key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Comunicación */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Comunicación
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plataformaIntegrations.comunicacion.map(i => <IntegrationCard key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Analytics */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Analytics
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plataformaIntegrations.analytics.map(i => <IntegrationCard key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Redes Sociales */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Instagram className="h-5 w-5" /> Redes Sociales
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plataformaIntegrations.social.map(i => <IntegrationCard key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Infraestructura */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Cloud className="h-5 w-5" /> Infraestructura
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plataformaIntegrations.infraestructura.map(i => <IntegrationCard key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* IA */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" /> Inteligencia Artificial
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plataformaIntegrations.ia.map(i => <IntegrationCard key={i.id} integration={i} />)}
            </div>
          </section>

          <Separator />

          {/* Monitoreo */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bug className="h-5 w-5" /> Monitoreo
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plataformaIntegrations.monitoreo.map(i => <IntegrationCard key={i.id} integration={i} />)}
            </div>
          </section>
        </TabsContent>

        {/* TAB: INTEGRACIONES COMPARTIDAS */}
        <TabsContent value="compartidas" className="space-y-8">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>ℹ️ Integraciones Compartidas:</strong> Configuradas por Inmova a nivel de plataforma, pero usadas por las empresas clientes.
              </p>
            </CardContent>
          </Card>

          {/* Pagos */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Pasarelas de Pago
            </h2>
            <div className="space-y-4">
              {compartidaIntegrations.pagos.map(integration => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
                          <integration.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle>{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {integration.mode === 'live' ? '🟢 Live' : '🟡 Test'}
                        </Badge>
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status === 'connected' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Configurado</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> No configurado</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {integration.details && integration.status === 'connected' && (
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-3">
                        {Object.entries(integration.details).map(([key, value]) => {
                          if (key === 'configured' || !value) return null;
                          return (
                            <div key={key} className="p-3 border rounded-lg">
                              <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="font-mono text-sm truncate">{String(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* Firma Digital */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileSignature className="h-5 w-5" /> Firma Digital
            </h2>
            <div className="space-y-4">
              {compartidaIntegrations.firma.map(integration => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
                          <integration.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle>{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.compliance?.map((c: string) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status === 'connected' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Configurado</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> No configurado</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {integration.details && integration.status === 'connected' && (
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-3">
                        {Object.entries(integration.details).map(([key, value]) => {
                          if (key === 'configured' || !value) return null;
                          return (
                            <div key={key} className="p-3 border rounded-lg">
                              <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="font-mono text-sm truncate">{String(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
