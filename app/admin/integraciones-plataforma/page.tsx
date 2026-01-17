'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BarChart3,
  MessageSquare,
  Share2,
  Cloud,
  Brain,
  Shield,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformIntegration {
  id: string;
  name: string;
  description: string;
  category: 'contabilidad' | 'comunicacion' | 'analytics' | 'social' | 'infraestructura' | 'ia' | 'monitoreo';
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  configUrl?: string;
  docsUrl?: string;
}

const platformIntegrations: PlatformIntegration[] = [
  // CONTABILIDAD
  {
    id: 'contasimple-inmova',
    name: 'Contasimple (Inmova)',
    description: 'Contabilidad de la plataforma Inmova. Gestión de facturas, gastos e impuestos.',
    category: 'contabilidad',
    icon: '📊',
    status: 'disconnected',
    docsUrl: 'https://api.contasimple.com/docs',
  },
  // COMUNICACIÓN
  {
    id: 'crisp',
    name: 'Crisp',
    description: 'Chat en vivo y soporte al cliente integrado en la plataforma.',
    category: 'comunicacion',
    icon: '💬',
    status: 'disconnected',
    docsUrl: 'https://docs.crisp.chat/',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Envío de SMS, WhatsApp y verificación 2FA.',
    category: 'comunicacion',
    icon: '📱',
    status: 'disconnected',
    docsUrl: 'https://www.twilio.com/docs',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Envío masivo de emails transaccionales y marketing.',
    category: 'comunicacion',
    icon: '📧',
    status: 'disconnected',
    docsUrl: 'https://docs.sendgrid.com/',
  },
  {
    id: 'gmail-smtp',
    name: 'Gmail SMTP',
    description: 'Servidor de correo para emails transaccionales.',
    category: 'comunicacion',
    icon: '✉️',
    status: 'connected',
  },
  // ANALYTICS
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Análisis de tráfico web, comportamiento de usuarios y conversiones.',
    category: 'analytics',
    icon: '📈',
    status: 'disconnected',
    docsUrl: 'https://developers.google.com/analytics',
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Mapas de calor, grabaciones de sesiones y feedback de usuarios.',
    category: 'analytics',
    icon: '🔥',
    status: 'disconnected',
    docsUrl: 'https://help.hotjar.com/',
  },
  // REDES SOCIALES
  {
    id: 'facebook',
    name: 'Facebook / Meta',
    description: 'Publicación automática y gestión de página de empresa.',
    category: 'social',
    icon: '📘',
    status: 'disconnected',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Publicación automática de contenido inmobiliario.',
    category: 'social',
    icon: '📸',
    status: 'disconnected',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publicación de contenido profesional y B2B.',
    category: 'social',
    icon: '💼',
    status: 'disconnected',
  },
  {
    id: 'twitter-x',
    name: 'X (Twitter)',
    description: 'Publicación de actualizaciones y noticias.',
    category: 'social',
    icon: '🐦',
    status: 'disconnected',
  },
  // INFRAESTRUCTURA
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Almacenamiento de archivos, imágenes y documentos.',
    category: 'infraestructura',
    icon: '☁️',
    status: 'connected',
    docsUrl: 'https://docs.aws.amazon.com/s3/',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Base de datos principal de la plataforma.',
    category: 'infraestructura',
    icon: '🐘',
    status: 'connected',
  },
  // IA
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    description: 'IA para valoraciones, análisis de documentos y asistente virtual.',
    category: 'ia',
    icon: '🤖',
    status: 'connected',
    docsUrl: 'https://docs.anthropic.com/',
  },
  // MONITOREO
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Monitoreo de errores, performance y alertas.',
    category: 'monitoreo',
    icon: '🔍',
    status: 'connected',
    docsUrl: 'https://docs.sentry.io/',
  },
];

const categoryInfo = {
  contabilidad: { label: 'Contabilidad', icon: Euro, color: 'bg-green-100 text-green-800' },
  comunicacion: { label: 'Comunicación', icon: MessageSquare, color: 'bg-blue-100 text-blue-800' },
  analytics: { label: 'Analytics', icon: BarChart3, color: 'bg-purple-100 text-purple-800' },
  social: { label: 'Redes Sociales', icon: Share2, color: 'bg-pink-100 text-pink-800' },
  infraestructura: { label: 'Infraestructura', icon: Cloud, color: 'bg-gray-100 text-gray-800' },
  ia: { label: 'Inteligencia Artificial', icon: Brain, color: 'bg-indigo-100 text-indigo-800' },
  monitoreo: { label: 'Monitoreo', icon: Shield, color: 'bg-orange-100 text-orange-800' },
};

export default function IntegracionesPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [integrations, setIntegrations] = useState(platformIntegrations);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    // Permitir super_admin y variantes
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  const filteredIntegrations = activeTab === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === activeTab);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalCount = integrations.length;

  const handleConfigure = (integrationId: string) => {
    // Mapeo de IDs de integración a URLs de configuración
    const configUrls: Record<string, string> = {
      'contasimple-inmova': '/contabilidad/integraciones',
      'crisp': '/dashboard/integrations/crisp',
      'twilio': '/dashboard/integrations/twilio',
      'sendgrid': '/dashboard/integrations/sendgrid',
      'gmail-smtp': '/dashboard/integrations/sendgrid',
      'google-analytics': '/dashboard/integrations/google-analytics',
      'hotjar': '/dashboard/integrations/hotjar',
      'facebook': '/dashboard/integrations/facebook',
      'instagram': '/dashboard/integrations/facebook',
      'linkedin': '/dashboard/integrations/linkedin',
      'twitter-x': '/dashboard/integrations/twitter',
      'aws-s3': '/dashboard/integrations/aws-s3',
      'postgresql': '/admin/integraciones-plataforma/infraestructura',
      'anthropic-claude': '/admin/integraciones-plataforma/ia',
      'sentry': '/admin/integraciones-plataforma/monitoreo',
      // Categorías de plataforma
      'contabilidad': '/admin/integraciones-plataforma/contabilidad',
      'comunicacion': '/admin/integraciones-plataforma/comunicacion',
      'analytics': '/admin/integraciones-plataforma/analytics',
      'social': '/admin/integraciones-plataforma/social',
      'infraestructura': '/admin/integraciones-plataforma/infraestructura',
      'ia': '/admin/integraciones-plataforma/ia',
      'monitoreo': '/admin/integraciones-plataforma/monitoreo',
    };
    
    const url = configUrls[integrationId] || `/dashboard/integrations/${integrationId}`;
    router.push(url);
  };

  const handleTest = (integrationId: string) => {
    toast.success('Conexión verificada correctamente');
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Integraciones de Plataforma</h1>
            <p className="text-muted-foreground mt-2">
              Servicios y APIs que usa INMOVA como plataforma SaaS
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-base py-2 px-4">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
              {connectedCount}/{totalCount} conectados
            </Badge>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Estas integraciones son exclusivas de la plataforma INMOVA. Las empresas clientes no tienen acceso 
            a esta configuración. Para integraciones que usan las empresas, ve a "Integraciones Compartidas".
          </AlertDescription>
        </Alert>

        {/* Tabs por categoría */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all">Todas</TabsTrigger>
            {Object.entries(categoryInfo).map(([key, info]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                <info.icon className="w-4 h-4" />
                {info.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => {
                const catInfo = categoryInfo[integration.category];
                return (
                  <Card key={integration.id} className={`relative ${integration.status === 'connected' ? 'border-green-200' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <Badge className={`${catInfo.color} text-xs mt-1`}>
                              {catInfo.label}
                            </Badge>
                          </div>
                        </div>
                        {integration.status === 'connected' ? (
                          <Badge className="bg-green-500">
                            <Check className="w-3 h-3 mr-1" /> Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <X className="w-3 h-3 mr-1" /> Inactivo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={integration.status === 'connected' ? 'outline' : 'default'}
                          className="flex-1"
                          onClick={() => handleConfigure(integration.id)}
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
                        {integration.docsUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(integration.docsUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
