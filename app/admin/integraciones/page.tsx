'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  HardDrive,
  Brain,
  Bug,
  CreditCard,
  FileSignature,
  Building2,
  Smartphone,
  Shield,
  Users,
  Zap
} from 'lucide-react';

export default function IntegracionesUnificadasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('plataforma');

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

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // ============================================
  // INTEGRACIONES DE PLATAFORMA (solo Inmova)
  // ============================================
  const plataformaIntegrations = {
    contabilidad: [
      { 
        id: 'contasimple', 
        name: 'Contasimple', 
        description: 'Contabilidad de Inmova',
        icon: Euro, 
        color: 'from-blue-500 to-blue-600',
        status: 'connected',
        config: { apiKey: 'cs_live_••••••••', companyId: 'inmova-2024' }
      },
    ],
    comunicacion: [
      { 
        id: 'crisp', 
        name: 'Crisp', 
        description: 'Chat en vivo y soporte',
        icon: MessageSquare, 
        color: 'from-purple-500 to-purple-600',
        status: 'connected',
      },
      { 
        id: 'twilio', 
        name: 'Twilio', 
        description: 'SMS y llamadas',
        icon: Phone, 
        color: 'from-red-500 to-red-600',
        status: 'connected',
      },
      { 
        id: 'sendgrid', 
        name: 'SendGrid', 
        description: 'Email transaccional',
        icon: Mail, 
        color: 'from-blue-400 to-blue-500',
        status: 'connected',
      },
      { 
        id: 'gmail', 
        name: 'Gmail SMTP', 
        description: 'Email de respaldo',
        icon: Mail, 
        color: 'from-red-400 to-red-500',
        status: 'connected',
      },
    ],
    analytics: [
      { 
        id: 'ga4', 
        name: 'Google Analytics 4', 
        description: 'Análisis de tráfico',
        icon: BarChart3, 
        color: 'from-orange-500 to-yellow-500',
        status: 'connected',
      },
      { 
        id: 'hotjar', 
        name: 'Hotjar', 
        description: 'Mapas de calor',
        icon: MousePointer2, 
        color: 'from-red-500 to-pink-500',
        status: 'connected',
      },
    ],
    social: [
      { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700', status: 'connected' },
      { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600', status: 'connected' },
      { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-800', status: 'connected' },
      { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'from-gray-700 to-black', status: 'disconnected' },
    ],
    infraestructura: [
      { 
        id: 'aws', 
        name: 'AWS S3', 
        description: 'Almacenamiento de archivos',
        icon: Cloud, 
        color: 'from-orange-500 to-amber-500',
        status: 'connected',
        stats: { files: '12,456', storage: '45.2 GB' }
      },
      { 
        id: 'postgresql', 
        name: 'PostgreSQL', 
        description: 'Base de datos principal',
        icon: Database, 
        color: 'from-blue-600 to-blue-700',
        status: 'connected',
        stats: { tables: 47, records: '1.2M' }
      },
    ],
    ia: [
      { 
        id: 'claude', 
        name: 'Anthropic Claude', 
        description: 'IA para valoraciones y asistente',
        icon: Brain, 
        color: 'from-purple-500 to-pink-500',
        status: 'connected',
        stats: { queries: 234, cost: '€45.20' }
      },
    ],
    monitoreo: [
      { 
        id: 'sentry', 
        name: 'Sentry', 
        description: 'Tracking de errores',
        icon: Bug, 
        color: 'from-violet-500 to-purple-600',
        status: 'connected',
        stats: { errors: 7, crashFree: '99.8%' }
      },
    ],
  };

  // ============================================
  // INTEGRACIONES COMPARTIDAS (config Inmova + uso empresas)
  // ============================================
  const compartidaIntegrations = {
    pagos: [
      { 
        id: 'stripe', 
        name: 'Stripe', 
        description: 'Tarjetas de crédito/débito',
        icon: CreditCard, 
        color: 'from-purple-500 to-indigo-600',
        status: 'connected',
        mode: 'live',
        inmovaConfig: { publishableKey: 'pk_live_••••', secretKey: 'sk_live_••••', webhookSecret: 'whsec_••••' },
        empresasUsando: 45,
        stats: { transactions: 1234, volume: '€45,230' }
      },
      { 
        id: 'gocardless', 
        name: 'GoCardless', 
        description: 'Domiciliación SEPA',
        icon: Building2, 
        color: 'from-cyan-500 to-blue-600',
        status: 'connected',
        mode: 'live',
        inmovaConfig: { accessToken: 'live_••••', webhookSecret: '••••' },
        empresasUsando: 28,
        stats: { transactions: 456, volume: '€89,340' }
      },
      { 
        id: 'redsys', 
        name: 'Redsys', 
        description: 'TPV Virtual y Bizum',
        icon: Smartphone, 
        color: 'from-red-500 to-orange-500',
        status: 'connected',
        mode: 'live',
        inmovaConfig: { merchantCode: '999008881', terminal: '001', encryptionKey: '••••' },
        empresasUsando: 32,
        stats: { transactions: 890, volume: '€34,560' }
      },
    ],
    firma: [
      { 
        id: 'docusign', 
        name: 'DocuSign', 
        description: 'Firma electrónica avanzada',
        icon: FileSignature, 
        color: 'from-yellow-500 to-amber-600',
        status: 'connected',
        compliance: ['eIDAS', 'ESIGN'],
        inmovaConfig: { integrationKey: 'xxxx-xxxx', accountId: 'xxxx-xxxx' },
        empresasUsando: 38,
        stats: { envelopes: 567, signed: 523 }
      },
      { 
        id: 'signaturit', 
        name: 'Signaturit', 
        description: 'Firma cualificada España/UE',
        icon: Shield, 
        color: 'from-blue-500 to-blue-600',
        status: 'connected',
        compliance: ['eIDAS QES', 'LOPD'],
        inmovaConfig: { apiToken: '••••' },
        empresasUsando: 22,
        stats: { envelopes: 234, signed: 210 }
      },
    ],
  };

  const IntegrationCard = ({ integration, showEmpresasUsando = false }: { integration: any; showEmpresasUsando?: boolean }) => (
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
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Activo</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
            )}
          </Badge>
        </div>
        
        {integration.stats && (
          <div className="mt-3 flex gap-4 text-sm">
            {Object.entries(integration.stats).map(([key, value]) => (
              <div key={key}>
                <span className="text-muted-foreground capitalize">{key}: </span>
                <span className="font-medium">{value as string}</span>
              </div>
            ))}
          </div>
        )}

        {showEmpresasUsando && integration.empresasUsando && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{integration.empresasUsando} empresas usando</span>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
          <Button size="sm" variant="ghost">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Integraciones de Plataforma</h1>
            <p className="text-muted-foreground">Gestión centralizada de todas las integraciones de Inmova</p>
          </div>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="plataforma">🏢 Solo Inmova</TabsTrigger>
          <TabsTrigger value="compartidas">🤝 Compartidas</TabsTrigger>
        </TabsList>

        {/* ========================================== */}
        {/* TAB: INTEGRACIONES DE PLATAFORMA (INMOVA) */}
        {/* ========================================== */}
        <TabsContent value="plataforma" className="space-y-8">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>ℹ️ Integraciones de Plataforma:</strong> Son usadas exclusivamente por Inmova para operar la plataforma SaaS. 
                Las empresas clientes no tienen acceso a estas configuraciones.
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

        {/* ========================================== */}
        {/* TAB: INTEGRACIONES COMPARTIDAS */}
        {/* ========================================== */}
        <TabsContent value="compartidas" className="space-y-8">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>ℹ️ Integraciones Compartidas:</strong> Configuradas por Inmova a nivel de plataforma, pero usadas por las empresas clientes. 
                Aquí gestionas las credenciales maestras. Las empresas activan/desactivan desde su panel.
              </p>
            </CardContent>
          </Card>

          {/* Pagos */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Pasarelas de Pago
            </h2>
            <p className="text-muted-foreground mb-4">
              Las empresas usan estas pasarelas para cobrar a sus inquilinos. La configuración es de Inmova.
            </p>

            <div className="space-y-6">
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
                        <Badge variant="outline">{integration.mode === 'live' ? '🟢 Live' : '🟡 Test'}</Badge>
                        <Badge><CheckCircle2 className="h-3 w-3 mr-1" /> Activo</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Config de Inmova */}
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-medium flex items-center gap-2">
                          <Settings className="h-4 w-4" /> Configuración de Inmova
                        </h4>
                        {Object.entries(integration.inmovaConfig).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                            <Input type="password" defaultValue={value as string} className="h-8 text-sm" />
                          </div>
                        ))}
                        <Button size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" /> Probar
                        </Button>
                      </div>

                      {/* Stats y empresas */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(integration.stats).map(([key, value]) => (
                            <div key={key} className="p-3 border rounded-lg">
                              <p className="text-xs text-muted-foreground capitalize">{key}</p>
                              <p className="text-lg font-bold">{value as string}</p>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Empresas usando</span>
                          </div>
                          <Badge variant="secondary">{integration.empresasUsando}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
            <p className="text-muted-foreground mb-4">
              Las empresas envían documentos a firmar usando las credenciales de Inmova. Ideal para contratos de arrendamiento.
            </p>

            <div className="space-y-6">
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
                        {integration.compliance.map(c => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                        <Badge><CheckCircle2 className="h-3 w-3 mr-1" /> Activo</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Config de Inmova */}
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-medium flex items-center gap-2">
                          <Settings className="h-4 w-4" /> Configuración de Inmova
                        </h4>
                        {Object.entries(integration.inmovaConfig).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                            <Input type="password" defaultValue={value as string} className="h-8 text-sm" />
                          </div>
                        ))}
                        <Button size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" /> Probar
                        </Button>
                      </div>

                      {/* Stats y empresas */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(integration.stats).map(([key, value]) => (
                            <div key={key} className="p-3 border rounded-lg">
                              <p className="text-xs text-muted-foreground capitalize">{key}</p>
                              <p className="text-lg font-bold">{value as string}</p>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Empresas usando</span>
                          </div>
                          <Badge variant="secondary">{integration.empresasUsando}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
