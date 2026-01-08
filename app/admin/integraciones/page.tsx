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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Unlink,
  CreditCard,
  Mail,
  MessageSquare,
  Cloud,
  Database,
  FileSignature,
  Bot,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformIntegration {
  id: string;
  name: string;
  description: string;
  category: 'payments' | 'email' | 'sms' | 'storage' | 'database' | 'signature' | 'ai' | 'monitoring';
  status: 'connected' | 'disconnected' | 'error' | 'not_configured';
  icon: any;
  envVars: string[];
  docsUrl: string;
  required: boolean;
}

const PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  // Pagos
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Procesamiento de pagos y suscripciones para clientes de Inmova',
    category: 'payments',
    status: 'not_configured',
    icon: CreditCard,
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    docsUrl: 'https://stripe.com/docs',
    required: true,
  },
  // Email
  {
    id: 'smtp',
    name: 'SMTP (Gmail/SendGrid)',
    description: 'Envío de emails transaccionales desde la plataforma',
    category: 'email',
    status: 'not_configured',
    icon: Mail,
    envVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'],
    docsUrl: 'https://nodemailer.com/about/',
    required: true,
  },
  // SMS
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Envío de SMS y WhatsApp para notificaciones',
    category: 'sms',
    status: 'not_configured',
    icon: MessageSquare,
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    docsUrl: 'https://www.twilio.com/docs',
    required: false,
  },
  // Storage
  {
    id: 'aws_s3',
    name: 'AWS S3',
    description: 'Almacenamiento de archivos y documentos',
    category: 'storage',
    status: 'not_configured',
    icon: Cloud,
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET'],
    docsUrl: 'https://docs.aws.amazon.com/s3/',
    required: true,
  },
  // Database
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Base de datos principal de la plataforma',
    category: 'database',
    status: 'not_configured',
    icon: Database,
    envVars: ['DATABASE_URL'],
    docsUrl: 'https://www.prisma.io/docs',
    required: true,
  },
  // Firma Digital
  {
    id: 'signaturit',
    name: 'Signaturit',
    description: 'Firma digital de contratos con validez legal',
    category: 'signature',
    status: 'not_configured',
    icon: FileSignature,
    envVars: ['SIGNATURIT_API_KEY', 'SIGNATURIT_ENVIRONMENT'],
    docsUrl: 'https://docs.signaturit.com/',
    required: false,
  },
  // IA
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'IA para asistencia, valoraciones y análisis',
    category: 'ai',
    status: 'not_configured',
    icon: Bot,
    envVars: ['ANTHROPIC_API_KEY'],
    docsUrl: 'https://docs.anthropic.com/',
    required: false,
  },
  // Monitoring
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Monitoreo de errores y performance',
    category: 'monitoring',
    status: 'not_configured',
    icon: Shield,
    envVars: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN'],
    docsUrl: 'https://docs.sentry.io/',
    required: false,
  },
];

const categoryLabels: Record<string, string> = {
  payments: 'Pagos',
  email: 'Email',
  sms: 'SMS',
  storage: 'Almacenamiento',
  database: 'Base de Datos',
  signature: 'Firma Digital',
  ai: 'Inteligencia Artificial',
  monitoring: 'Monitoreo',
};

const categoryIcons: Record<string, any> = {
  payments: CreditCard,
  email: Mail,
  sms: MessageSquare,
  storage: Cloud,
  database: Database,
  signature: FileSignature,
  ai: Bot,
  monitoring: Shield,
};

export default function AdminIntegracionesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>(PLATFORM_INTEGRATIONS);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<PlatformIntegration | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  async function checkIntegrationStatus() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/integraciones/status');
      if (res.ok) {
        const data = await res.json();
        // Actualizar estado de integraciones basado en respuesta
        setIntegrations(prev => prev.map(integration => ({
          ...integration,
          status: data[integration.id]?.status || 'not_configured',
        })));
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'disconnected':
        return <Badge className="bg-yellow-100 text-yellow-800">Desconectado</Badge>;
      default:
        return <Badge variant="outline">No configurado</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <X className="h-5 w-5 text-gray-400" />;
    }
  };

  const openConfigDialog = (integration: PlatformIntegration) => {
    setSelectedIntegration(integration);
    setShowConfigDialog(true);
  };

  const toggleSecretVisibility = (varName: string) => {
    setShowSecrets(prev => ({ ...prev, [varName]: !prev[varName] }));
  };

  // Agrupar integraciones por categoría
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, PlatformIntegration[]>);

  // Estadísticas
  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    required: integrations.filter(i => i.required).length,
    requiredConnected: integrations.filter(i => i.required && i.status === 'connected').length,
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Integraciones de la Plataforma</h1>
            <p className="text-muted-foreground">
              Configuración de servicios externos conectados a Inmova
            </p>
          </div>
          <Button variant="outline" onClick={checkIntegrationStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar Estado
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <LinkIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conectadas</p>
                  <p className="text-2xl font-bold">{stats.connected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requeridas</p>
                  <p className="text-2xl font-bold">{stats.requiredConnected}/{stats.required}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.total - stats.connected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta si faltan integraciones requeridas */}
        {stats.requiredConnected < stats.required && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Hay {stats.required - stats.requiredConnected} integraciones requeridas sin configurar. 
              Configúralas para que la plataforma funcione correctamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Integraciones por categoría */}
        <div className="space-y-6">
          {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => {
            const CategoryIcon = categoryIcons[category] || Settings;
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5" />
                    {categoryLabels[category] || category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {categoryIntegrations.map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{integration.name}</h3>
                                {integration.required && (
                                  <Badge variant="outline" className="text-xs">Requerido</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{integration.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusIcon(integration.status)}
                            {getStatusBadge(integration.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openConfigDialog(integration)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(integration.docsUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dialog de configuración */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedIntegration && (
                  <>
                    <selectedIntegration.icon className="h-5 w-5" />
                    Configurar {selectedIntegration.name}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Variables de entorno requeridas para esta integración.
                Configúralas en el archivo .env.production del servidor.
              </DialogDescription>
            </DialogHeader>

            {selectedIntegration && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Estas variables deben configurarse directamente en el servidor.
                    Por seguridad, no se pueden editar desde aquí.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label>Variables de Entorno</Label>
                  {selectedIntegration.envVars.map((envVar) => (
                    <div key={envVar} className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-muted rounded font-mono text-sm">
                        {envVar}
                      </div>
                      <Badge variant={process.env[envVar] ? 'default' : 'outline'}>
                        {process.env[envVar] ? 'Configurada' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(selectedIntegration.docsUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Documentación
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cerrar
              </Button>
              <Button onClick={checkIntegrationStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
