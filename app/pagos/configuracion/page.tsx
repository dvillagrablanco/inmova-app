'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  CreditCard,
  Home,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Building2,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'pending';
  configUrl: string;
  docsUrl?: string;
  features: string[];
}

const paymentProviders: PaymentProvider[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pagos con tarjeta de crédito, débito y suscripciones recurrentes',
    icon: <CreditCard className="h-6 w-6 text-purple-600" />,
    status: 'disconnected',
    configUrl: '/configuracion/integraciones/stripe',
    docsUrl: 'https://stripe.com/docs',
    features: ['Tarjetas', 'Apple Pay', 'Google Pay', 'SEPA', 'Suscripciones'],
  },
  {
    id: 'gocardless',
    name: 'GoCardless',
    description: 'Domiciliación bancaria SEPA para cobros recurrentes',
    icon: <Building2 className="h-6 w-6 text-cyan-600" />,
    status: 'disconnected',
    configUrl: '/configuracion/integraciones/gocardless',
    docsUrl: 'https://gocardless.com/es/',
    features: ['Débito SEPA', 'Cobros recurrentes', 'Conciliación automática'],
  },
  {
    id: 'redsys',
    name: 'Redsys',
    description: 'TPV virtual español con soporte para Bizum y 3D Secure',
    icon: <Smartphone className="h-6 w-6 text-red-600" />,
    status: 'disconnected',
    configUrl: '/configuracion/integraciones/redsys',
    docsUrl: 'https://redsys.es',
    features: ['TPV Virtual', 'Bizum', '3D Secure', 'PSD2'],
  },
];

export default function PagosConfiguracionPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState(paymentProviders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Cargar estado de las integraciones
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/integrations/status');
        if (response.ok) {
          const data = await response.json();
          setProviders(prev =>
            prev.map(p => ({
              ...p,
              status: data[p.id]?.connected ? 'connected' : 'disconnected',
            }))
          );
        }
      } catch (error) {
        console.error('Error loading integration status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadStatus();
    }
  }, [status]);

  const handleConfigure = (provider: PaymentProvider) => {
    router.push(provider.configUrl);
  };

  const connectedCount = providers.filter(p => p.status === 'connected').length;

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
      <div className="max-w-5xl mx-auto space-y-6">
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
              <BreadcrumbLink href="/pagos">Pagos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Configuración</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Pagos</h1>
            <p className="text-muted-foreground mt-2">
              Configura las pasarelas de pago para cobrar a tus inquilinos
            </p>
          </div>
          <Badge variant="outline" className="text-base py-2 px-4">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            {connectedCount}/{providers.length} conectados
          </Badge>
        </div>

        {/* Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configura al menos una pasarela de pago para poder cobrar alquileres, cuotas y otros conceptos a tus inquilinos.
          </AlertDescription>
        </Alert>

        {/* Payment Providers */}
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className={provider.status === 'connected' ? 'border-green-200' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {provider.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{provider.name}</h3>
                        {provider.status === 'connected' ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        ) : (
                          <Badge variant="outline">No configurado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provider.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.docsUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(provider.docsUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button onClick={() => handleConfigure(provider)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¿Necesitas ayuda?</CardTitle>
            <CardDescription>
              Recursos para configurar tus pasarelas de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                href="/docs/guia-stripe"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Guía de Stripe</span>
              </a>
              <a
                href="/docs/guia-pagos"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Guía de Pagos</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
