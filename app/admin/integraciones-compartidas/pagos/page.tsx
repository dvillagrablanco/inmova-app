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
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Building2,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

export default function PagosCompartidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  const paymentProviders = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Tarjetas de crédito/débito internacionales',
      icon: CreditCard,
      color: 'from-purple-500 to-indigo-600',
      status: 'connected',
      mode: 'live',
      stats: {
        transactions: 1234,
        volume: '€45,230',
        fee: '1.4% + €0.25'
      }
    },
    {
      id: 'gocardless',
      name: 'GoCardless',
      description: 'Domiciliación bancaria SEPA',
      icon: Building2,
      color: 'from-cyan-500 to-blue-600',
      status: 'connected',
      mode: 'live',
      stats: {
        transactions: 456,
        volume: '€89,340',
        fee: '1% + €0.20'
      }
    },
    {
      id: 'redsys',
      name: 'Redsys',
      description: 'TPV Virtual y Bizum',
      icon: Smartphone,
      color: 'from-red-500 to-orange-500',
      status: 'connected',
      mode: 'live',
      stats: {
        transactions: 890,
        volume: '€34,560',
        fee: '0.5% - 1.5%'
      }
    },
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-compartidas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Compartidas
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Pasarelas de Pago</h1>
            <p className="text-muted-foreground">Stripe, GoCardless y Redsys - Configuración centralizada de Inmova</p>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ℹ️ Nota:</strong> Estas integraciones son configuradas por Inmova a nivel de plataforma. 
            Las empresas clientes pueden activar/desactivar los métodos de pago disponibles desde su panel, 
            pero la configuración de credenciales es centralizada.
          </p>
        </CardContent>
      </Card>

      {/* Resumen Global */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumen de Pagos (Plataforma)</CardTitle>
          <CardDescription>Totales agregados de todas las pasarelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Transacciones Totales</p>
              <p className="text-2xl font-bold">2,580</p>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Volumen Total</p>
              <p className="text-2xl font-bold text-green-600">€169,130</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Comisiones</p>
              <p className="text-2xl font-bold text-red-500">€2,340</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
              <p className="text-2xl font-bold">98.7%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pasarelas */}
      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="gocardless">GoCardless</TabsTrigger>
          <TabsTrigger value="redsys">Redsys</TabsTrigger>
        </TabsList>

        {paymentProviders.map((provider) => (
          <TabsContent key={provider.id} value={provider.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center`}>
                      <provider.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{provider.mode === 'live' ? '🟢 Live' : '🟡 Test'}</Badge>
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Transacciones</p>
                    <p className="text-2xl font-bold">{provider.stats.transactions}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Volumen</p>
                    <p className="text-2xl font-bold text-green-600">{provider.stats.volume}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Comisión</p>
                    <p className="text-2xl font-bold">{provider.stats.fee}</p>
                  </div>
                </div>

                {/* Configuración */}
                <div className="space-y-4">
                  {provider.id === 'stripe' && (
                    <>
                      <div className="space-y-2">
                        <Label>Publishable Key</Label>
                        <Input defaultValue="pk_live_••••••••••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <Input type="password" defaultValue="sk_live_••••••••••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input type="password" defaultValue="whsec_••••••••••••••••" />
                      </div>
                    </>
                  )}
                  {provider.id === 'gocardless' && (
                    <>
                      <div className="space-y-2">
                        <Label>Access Token</Label>
                        <Input type="password" defaultValue="live_••••••••••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input type="password" defaultValue="••••••••••••••••" />
                      </div>
                    </>
                  )}
                  {provider.id === 'redsys' && (
                    <>
                      <div className="space-y-2">
                        <Label>Código de Comercio (FUC)</Label>
                        <Input defaultValue="999008881" />
                      </div>
                      <div className="space-y-2">
                        <Label>Clave de Encriptación</Label>
                        <Input type="password" defaultValue="••••••••••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Terminal</Label>
                        <Input defaultValue="001" />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Modo Live</p>
                      <p className="text-sm text-muted-foreground">Procesar pagos reales</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex gap-2">
                    <Button>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Probar Conexión
                    </Button>
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Empresas que usan pagos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Empresas con Pagos Activos</CardTitle>
          <CardDescription>Clientes de Inmova que usan estas pasarelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Inmobiliaria García', methods: ['Stripe', 'GoCardless'], transactions: 234 },
              { name: 'Gestiones López', methods: ['Stripe'], transactions: 156 },
              { name: 'Alquileres Madrid', methods: ['Stripe', 'Redsys'], transactions: 89 },
            ].map((company, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {company.methods.join(', ')}
                  </p>
                </div>
                <Badge variant="outline">{company.transactions} transacciones</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
