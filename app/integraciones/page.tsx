'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Check,
  X,
  ExternalLink,
  Search,
  CreditCard,
  Mail,
  MessageSquare,
  FileSignature,
  BarChart3,
  Building2,
  Globe,
  Plug,
  RefreshCw,
  Shield,
  Wallet,
  FileText,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  connected: boolean;
  status: 'active' | 'inactive' | 'error';
  configUrl?: string;
  docsUrl?: string;
  features: string[];
}

const integrationCategories = [
  { id: 'all', label: 'Todas' },
  { id: 'payments', label: 'Pagos' },
  { id: 'accounting', label: 'Contabilidad' },
  { id: 'banking', label: 'Banca' },
  { id: 'signature', label: 'Firma Digital' },
  { id: 'communication', label: 'Comunicación' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'social', label: 'Redes Sociales' },
];

const allIntegrations: Integration[] = [
  // Pagos
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Procesa pagos con tarjeta de crédito y débito',
    category: 'payments',
    icon: '💳',
    connected: false,
    status: 'inactive',
    configUrl: '/pagos/configuracion',
    docsUrl: 'https://stripe.com/docs',
    features: ['Pagos con tarjeta', 'Suscripciones', 'Facturación automática', 'Links de pago'],
  },
  {
    id: 'gocardless',
    name: 'GoCardless',
    description: 'Domiciliación bancaria SEPA para pagos recurrentes',
    category: 'payments',
    icon: '🏦',
    connected: false,
    status: 'inactive',
    docsUrl: 'https://gocardless.com/es/',
    features: ['Débito directo SEPA', 'Pagos recurrentes', 'Conciliación automática', 'Bajo coste'],
  },
  {
    id: 'redsys',
    name: 'Redsys',
    description: 'Pasarela de pagos española para TPV virtual',
    category: 'payments',
    icon: '🔒',
    connected: false,
    status: 'inactive',
    features: ['TPV Virtual', 'PSD2/SCA', 'Bizum', 'Multidivisa'],
  },
  // Contabilidad
  {
    id: 'contasimple',
    name: 'Contasimple',
    description: 'Software de contabilidad y facturación española',
    category: 'accounting',
    icon: '📊',
    connected: false,
    status: 'inactive',
    configUrl: '/contabilidad/integraciones',
    features: ['Facturación', 'Modelo 303/390', 'Libros contables', 'SII'],
  },
  {
    id: 'holded',
    name: 'Holded',
    description: 'ERP y contabilidad en la nube',
    category: 'accounting',
    icon: '📈',
    connected: false,
    status: 'inactive',
    features: ['Facturación', 'Contabilidad', 'CRM', 'Proyectos'],
  },
  {
    id: 'a3erp',
    name: 'a3ERP',
    description: 'Software de gestión empresarial de Wolters Kluwer',
    category: 'accounting',
    icon: '🏢',
    connected: false,
    status: 'inactive',
    features: ['Contabilidad', 'Facturación', 'Nóminas', 'Impuestos'],
  },
  // Banca
  {
    id: 'openbanking',
    name: 'Open Banking (PSD2)',
    description: 'Conexión con bancos españoles vía API',
    category: 'banking',
    icon: '🔐',
    connected: false,
    status: 'inactive',
    configUrl: '/open-banking',
    features: ['Saldos en tiempo real', 'Movimientos', 'Conciliación', 'Pagos iniciados'],
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Conexión bancaria internacional',
    category: 'banking',
    icon: '🌐',
    connected: false,
    status: 'inactive',
    features: ['Multi-banco', 'Verificación de cuentas', 'Historial financiero'],
  },
  // Firma Digital
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Firma electrónica avanzada para contratos',
    category: 'signature',
    icon: '✍️',
    connected: false,
    status: 'inactive',
    configUrl: '/firma-digital/configuracion',
    features: ['Firma avanzada', 'Plantillas', 'Flujos de aprobación', 'Auditoría'],
  },
  {
    id: 'signaturit',
    name: 'Signaturit',
    description: 'Firma electrónica certificada conforme eIDAS',
    category: 'signature',
    icon: '📝',
    connected: false,
    status: 'inactive',
    features: ['Firma cualificada', 'Certificado digital', 'Validez legal UE'],
  },
  // Comunicación
  {
    id: 'crisp',
    name: 'Crisp',
    description: 'Chat en vivo y soporte al cliente',
    category: 'communication',
    icon: '💬',
    connected: false,
    status: 'inactive',
    features: ['Chat en vivo', 'Chatbot', 'Base de conocimiento', 'CRM integrado'],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Envío de SMS y WhatsApp',
    category: 'communication',
    icon: '📱',
    connected: false,
    status: 'inactive',
    features: ['SMS', 'WhatsApp', 'Llamadas', 'Verificación 2FA'],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Envío masivo de emails transaccionales',
    category: 'communication',
    icon: '📧',
    connected: false,
    status: 'inactive',
    features: ['Emails transaccionales', 'Marketing', 'Templates', 'Analytics'],
  },
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Análisis de tráfico web y comportamiento',
    category: 'analytics',
    icon: '📉',
    connected: false,
    status: 'inactive',
    features: ['Tráfico web', 'Conversiones', 'Audiencias', 'Informes'],
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Mapas de calor y grabaciones de sesiones',
    category: 'analytics',
    icon: '🔥',
    connected: false,
    status: 'inactive',
    features: ['Mapas de calor', 'Grabaciones', 'Encuestas', 'Feedback'],
  },
  // Redes Sociales
  {
    id: 'facebook',
    name: 'Facebook / Meta',
    description: 'Publicación automática de anuncios inmobiliarios',
    category: 'social',
    icon: '📘',
    connected: false,
    status: 'inactive',
    features: ['Facebook Marketplace', 'Instagram', 'Publicación automática'],
  },
  {
    id: 'idealista-api',
    name: 'Idealista',
    description: 'Publicación de inmuebles en Idealista',
    category: 'social',
    icon: '🏠',
    connected: false,
    status: 'inactive',
    features: ['Sincronización de anuncios', 'Leads automáticos', 'Estadísticas'],
  },
  {
    id: 'fotocasa-api',
    name: 'Fotocasa',
    description: 'Publicación de inmuebles en Fotocasa',
    category: 'social',
    icon: '📷',
    connected: false,
    status: 'inactive',
    features: ['Sincronización de anuncios', 'Leads automáticos'],
  },
];

export default function IntegracionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>(allIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Cargar estado de integraciones desde la API
    const loadIntegrationStatus = async () => {
      try {
        const response = await fetch('/api/integrations/status');
        if (response.ok) {
          const data = await response.json();
          // Actualizar estado de integraciones basado en la respuesta
          setIntegrations((prev) =>
            prev.map((int) => ({
              ...int,
              connected: data[int.id]?.connected || false,
              status: data[int.id]?.status || 'inactive',
            }))
          );
        }
      } catch (error) {
        console.error('Error loading integration status:', error);
      }
    };

    if (status === 'authenticated') {
      loadIntegrationStatus();
    }
  }, [status]);

  const filteredIntegrations = integrations.filter((int) => {
    const matchesCategory = activeCategory === 'all' || int.category === activeCategory;
    const matchesSearch =
      int.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      int.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = async (integration: Integration) => {
    if (integration.configUrl) {
      router.push(integration.configUrl);
    } else {
      setSelectedIntegration(integration);
      setConfigDialogOpen(true);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/disconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Integración desconectada');
        setIntegrations((prev) =>
          prev.map((int) =>
            int.id === integrationId ? { ...int, connected: false, status: 'inactive' } : int
          )
        );
      }
    } catch (error) {
      toast.error('Error al desconectar');
    }
  };

  const connectedCount = integrations.filter((i) => i.connected).length;
  const availableCount = integrations.length;

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
              <BreadcrumbPage>Integraciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Centro de Integraciones</h1>
            <p className="text-muted-foreground">
              Conecta con servicios externos para ampliar las funcionalidades
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-base py-1 px-3">
              <Plug className="h-4 w-4 mr-2" />
              {connectedCount}/{availableCount} conectadas
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrations.filter((i) => i.category === 'payments' && i.connected).length}/
                {integrations.filter((i) => i.category === 'payments').length}
              </div>
              <p className="text-xs text-muted-foreground">Integraciones activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrations.filter((i) => i.category === 'accounting' && i.connected).length}/
                {integrations.filter((i) => i.category === 'accounting').length}
              </div>
              <p className="text-xs text-muted-foreground">Integraciones activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Firma Digital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrations.filter((i) => i.category === 'signature' && i.connected).length}/
                {integrations.filter((i) => i.category === 'signature').length}
              </div>
              <p className="text-xs text-muted-foreground">Integraciones activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comunicación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrations.filter((i) => i.category === 'communication' && i.connected).length}/
                {integrations.filter((i) => i.category === 'communication').length}
              </div>
              <p className="text-xs text-muted-foreground">Integraciones activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar integraciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {integrationCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{integration.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  {integration.connected ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="outline">No conectado</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {integration.features.slice(0, 3).map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {integration.features.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{integration.features.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {integration.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleConnect(integration)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="flex-1" onClick={() => handleConnect(integration)}>
                      <Plug className="h-4 w-4 mr-1" />
                      Conectar
                    </Button>
                  )}
                  {integration.docsUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(integration.docsUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron integraciones</p>
          </div>
        )}

        {/* Config Dialog */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedIntegration?.icon}</span>
                Configurar {selectedIntegration?.name}
              </DialogTitle>
              <DialogDescription>{selectedIntegration?.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>API Key</Label>
                <Input placeholder="Introduce tu API Key" />
              </div>
              {selectedIntegration?.id === 'stripe' && (
                <div>
                  <Label>Secret Key</Label>
                  <Input type="password" placeholder="sk_live_..." />
                </div>
              )}
              {selectedIntegration?.id === 'twilio' && (
                <>
                  <div>
                    <Label>Account SID</Label>
                    <Input placeholder="ACxxxxxx" />
                  </div>
                  <div>
                    <Label>Auth Token</Label>
                    <Input type="password" placeholder="Auth token" />
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <Label>Activar integración</Label>
                <Switch />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    toast.success('Integración configurada');
                    setConfigDialogOpen(false);
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
