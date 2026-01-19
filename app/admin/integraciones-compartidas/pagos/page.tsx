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
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  mode: 'live' | 'test';
  stats: {
    transactions: number;
    volume: string;
    fee: string;
  };
}

interface PaymentSummary {
  totalTransactions: number;
  totalVolume: number;
  totalCommissions: number;
  successRate: number;
}

interface CompanyPayments {
  name: string;
  methods: string[];
  transactions: number;
}

const PROVIDER_ICONS: Record<string, any> = {
  stripe: CreditCard,
  gocardless: Building2,
  redsys: Smartphone,
};

const PROVIDER_COLORS: Record<string, string> = {
  stripe: 'from-purple-500 to-indigo-600',
  gocardless: 'from-cyan-500 to-blue-600',
  redsys: 'from-red-500 to-orange-500',
};

export default function PagosCompartidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [companiesWithPayments, setCompaniesWithPayments] = useState<CompanyPayments[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, session, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/integrations/payments/status');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
        setSummary(data.summary || null);
        setCompaniesWithPayments(data.companiesWithPayments || []);
      } else {
        setProviders([]);
        setSummary(null);
        setCompaniesWithPayments([]);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      setProviders([]);
      setSummary(null);
      setCompaniesWithPayments([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-compartidas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Compartidas
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pasarelas de Pago</h1>
              <p className="text-muted-foreground">Stripe, GoCardless y Redsys - Configuración centralizada de Inmova</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
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
          {loading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Transacciones Totales</p>
                <p className="text-2xl font-bold">{summary?.totalTransactions?.toLocaleString('es-ES') || 0}</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Volumen Total</p>
                <p className="text-2xl font-bold text-green-600">
                  €{summary?.totalVolume?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0,00'}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold text-red-500">
                  €{summary?.totalCommissions?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0,00'}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                <p className="text-2xl font-bold">{summary?.successRate || 0}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pasarelas */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay pasarelas de pago configuradas</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={providers[0]?.id || 'stripe'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {providers.map((provider) => (
              <TabsTrigger key={provider.id} value={provider.id}>
                {provider.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {providers.map((provider) => {
            const Icon = PROVIDER_ICONS[provider.id] || CreditCard;
            const color = PROVIDER_COLORS[provider.id] || 'from-gray-500 to-gray-600';
            
            return (
              <TabsContent key={provider.id} value={provider.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle>{provider.name}</CardTitle>
                          <CardDescription>{provider.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{provider.mode === 'live' ? '🟢 Live' : '🟡 Test'}</Badge>
                        <Badge variant={provider.status === 'connected' ? 'default' : 'secondary'}>
                          {provider.status === 'connected' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Desconectado</>
                          )}
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
                            <Input placeholder="pk_live_xxxx" type="password" />
                          </div>
                          <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <Input type="password" placeholder="sk_live_xxxx" />
                          </div>
                          <div className="space-y-2">
                            <Label>Webhook Secret</Label>
                            <Input type="password" placeholder="whsec_xxxx" />
                          </div>
                        </>
                      )}
                      {provider.id === 'gocardless' && (
                        <>
                          <div className="space-y-2">
                            <Label>Access Token</Label>
                            <Input type="password" placeholder="live_xxxx" />
                          </div>
                          <div className="space-y-2">
                            <Label>Webhook Secret</Label>
                            <Input type="password" placeholder="Webhook Secret" />
                          </div>
                        </>
                      )}
                      {provider.id === 'redsys' && (
                        <>
                          <div className="space-y-2">
                            <Label>Código de Comercio (FUC)</Label>
                            <Input placeholder="999008881" />
                          </div>
                          <div className="space-y-2">
                            <Label>Clave de Encriptación</Label>
                            <Input type="password" placeholder="Clave de encriptación" />
                          </div>
                          <div className="space-y-2">
                            <Label>Terminal</Label>
                            <Input placeholder="001" />
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Modo Live</p>
                          <p className="text-sm text-muted-foreground">Procesar pagos reales</p>
                        </div>
                        <Switch defaultChecked={provider.mode === 'live'} />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => toast.success('Conexión verificada')}>
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
            );
          })}
        </Tabs>
      )}

      {/* Empresas que usan pagos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Empresas con Pagos Activos</CardTitle>
          <CardDescription>Clientes de Inmova que usan estas pasarelas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : companiesWithPayments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay empresas con pagos activos este mes
            </p>
          ) : (
            <div className="space-y-3">
              {companiesWithPayments.map((company, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.methods.length > 0 ? company.methods.join(', ') : 'Sin método asignado'}
                    </p>
                  </div>
                  <Badge variant="outline">{company.transactions} transacciones</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
