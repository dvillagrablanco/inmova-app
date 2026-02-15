'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  ArrowLeft,
  CreditCard,
  FileSignature,
  Calculator,
  Building2,
  BarChart3,
  MessageSquare,
  Share2,
  Cloud,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Plug,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'pending';
  configUrl: string;
  logo?: string;
}

const integrations: Integration[] = [
  // Pagos
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pagos con tarjeta y suscripciones',
    category: 'Pagos',
    icon: <CreditCard className="h-5 w-5" />,
    status: 'connected',
    configUrl: '/configuracion/integraciones/stripe',
  },
  {
    id: 'gocardless',
    name: 'GoCardless',
    description: 'Domiciliación bancaria SEPA',
    category: 'Pagos',
    icon: <Building2 className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/configuracion/integraciones/gocardless',
  },
  {
    id: 'redsys',
    name: 'Redsys',
    description: 'TPV Virtual y Bizum',
    category: 'Pagos',
    icon: <CreditCard className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/configuracion/integraciones/redsys',
  },
  // Firma Digital
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Firma electrónica avanzada',
    category: 'Firma Digital',
    icon: <FileSignature className="h-5 w-5" />,
    status: 'connected',
    configUrl: '/firma-digital/configuracion',
  },
  {
    id: 'signaturit',
    name: 'Signaturit',
    description: 'Firma cualificada eIDAS',
    category: 'Firma Digital',
    icon: <FileSignature className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/firma-digital/configuracion',
  },
  // Contabilidad
  {
    id: 'contasimple',
    name: 'Contasimple',
    description: 'Contabilidad para autónomos y pymes',
    category: 'Contabilidad',
    icon: <Calculator className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/contabilidad/integraciones',
  },
  {
    id: 'holded',
    name: 'Holded',
    description: 'ERP y facturación en la nube',
    category: 'Contabilidad',
    icon: <Calculator className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/contabilidad/integraciones',
  },
  // Banca
  {
    id: 'openbanking',
    name: 'Open Banking (PSD2)',
    description: 'Conexión directa con bancos',
    category: 'Banca',
    icon: <Building2 className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/admin/integraciones-banca',
  },
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Análisis de tráfico web',
    category: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/dashboard/integrations/google-analytics',
  },
  // Comunicación
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS y WhatsApp Business',
    category: 'Comunicación',
    icon: <MessageSquare className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/dashboard/integrations/twilio',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email transaccional',
    category: 'Comunicación',
    icon: <MessageSquare className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/dashboard/integrations/sendgrid',
  },
  // Redes Sociales
  {
    id: 'facebook',
    name: 'Facebook & Instagram',
    description: 'Publicación automática',
    category: 'Redes Sociales',
    icon: <Share2 className="h-5 w-5" />,
    status: 'disconnected',
    configUrl: '/dashboard/integrations/facebook',
  },
  // Almacenamiento
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    description: 'Almacenamiento de documentos',
    category: 'Almacenamiento',
    icon: <Cloud className="h-5 w-5" />,
    status: 'connected',
    configUrl: '/dashboard/integrations/aws-s3',
  },
];

export default function IntegracionesConfigPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Obtener categorías únicas
  const categories = Array.from(new Set(integrations.map(i => i.category)));

  // Filtrar integraciones
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Agrupar por categoría
  const groupedIntegrations = filteredIntegrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6 px-4">
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
              <BreadcrumbPage>Integraciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/configuracion')}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Integraciones</h1>
            <p className="text-muted-foreground mt-1">
              Conecta con servicios externos para potenciar tu negocio
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Plug className="h-4 w-4 mr-1" />
            {connectedCount} conectadas
          </Badge>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar integración..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por categoría (mobile-friendly) */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Lista de integraciones agrupadas */}
        {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-muted-foreground">{category}</h2>
            <div className="grid gap-3">
              {categoryIntegrations.map((integration) => (
                <Card
                  key={integration.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(integration.configUrl)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          integration.status === 'connected' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {integration.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{integration.name}</h3>
                            {integration.status === 'connected' && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Sin resultados */}
        {Object.keys(groupedIntegrations).length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No se encontraron integraciones</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CTA para solicitar integraciones */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">¿Necesitas otra integración?</p>
                <p className="text-xs text-muted-foreground">
                  Solicita nuevas conexiones con tu software favorito
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/soporte?tipo=integracion')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Solicitar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
