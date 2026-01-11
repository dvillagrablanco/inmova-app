'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  ExternalLink,
  Settings,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Building,
  Info,
  Zap,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  enabled: boolean;
  features: string[];
  fees: string;
  processingTime: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'stripe-cards',
    name: 'Tarjetas (Stripe)',
    description: 'Acepta pagos con Visa, Mastercard, Amex y más.',
    icon: '💳',
    available: true,
    enabled: true,
    features: ['Visa, Mastercard, Amex', '3D Secure automático', 'Apple Pay / Google Pay'],
    fees: '1.4% + 0.25€ (EEE) / 2.9% + 0.25€ (Internacional)',
    processingTime: 'Instantáneo',
  },
  {
    id: 'gocardless-sepa',
    name: 'Domiciliación SEPA (GoCardless)',
    description: 'Cobro por domiciliación bancaria ideal para alquileres recurrentes.',
    icon: '🏦',
    available: false,
    enabled: false,
    features: ['Débito directo SEPA', 'Cobros recurrentes', 'Bajo coste'],
    fees: '1% + 0.20€ (máx. 2€ por transacción)',
    processingTime: '3-5 días hábiles',
  },
  {
    id: 'redsys-bizum',
    name: 'Bizum (Redsys)',
    description: 'Pagos instantáneos con Bizum, popular en España.',
    icon: '📱',
    available: false,
    enabled: false,
    features: ['Pago instantáneo', 'Sin tarjeta', 'Popular en España'],
    fees: '0.5% (negociable)',
    processingTime: 'Instantáneo',
  },
  {
    id: 'redsys-tpv',
    name: 'TPV Virtual (Redsys)',
    description: 'Pasarela bancaria española tradicional.',
    icon: '🔒',
    available: false,
    enabled: false,
    features: ['TPV Virtual tradicional', 'Todas las tarjetas', 'Bancos españoles'],
    fees: 'Según contrato bancario',
    processingTime: '1-2 días hábiles',
  },
];

export default function IntegracionesPagosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [methods, setMethods] = useState(paymentMethods);
  const [activeTab, setActiveTab] = useState('metodos');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const toggleMethod = (methodId: string) => {
    setMethods(prev => prev.map(m => 
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    ));
    toast.success('Configuración actualizada');
  };

  const enabledCount = methods.filter(m => m.enabled).length;
  const availableCount = methods.filter(m => m.available).length;

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
            <h1 className="text-3xl font-bold">Métodos de Pago</h1>
            <p className="text-muted-foreground mt-2">
              Configura cómo tus inquilinos pueden realizar los pagos de alquiler
            </p>
          </div>
          <Badge variant="outline" className="text-base py-2 px-4">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            {enabledCount} activos / {availableCount} disponibles
          </Badge>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Integración centralizada:</strong> Las pasarelas de pago están configuradas por INMOVA. 
            Tú eliges qué métodos ofrecer a tus inquilinos. Los costes de transacción se deducen automáticamente.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="metodos">
              <CreditCard className="w-4 h-4 mr-2" />
              Métodos de Pago
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="w-4 h-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metodos" className="mt-6 space-y-6">
            {/* Métodos de pago disponibles */}
            <div className="grid md:grid-cols-2 gap-6">
              {methods.map((method) => (
                <Card 
                  key={method.id} 
                  className={`relative ${method.enabled ? 'border-green-200 bg-green-50/30' : ''} ${!method.available ? 'opacity-60' : ''}`}
                >
                  {!method.available && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Próximamente
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{method.icon}</span>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                        <CardDescription>{method.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="space-y-1">
                      {method.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fees & Processing */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                      <div>
                        <div className="font-medium">Comisiones</div>
                        <div className="text-muted-foreground text-xs">{method.fees}</div>
                      </div>
                      <div>
                        <div className="font-medium">Tiempo</div>
                        <div className="text-muted-foreground text-xs">{method.processingTime}</div>
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Label className={method.available ? '' : 'text-muted-foreground'}>
                        {method.enabled ? 'Activado' : 'Desactivado'}
                      </Label>
                      <Switch
                        checked={method.enabled}
                        disabled={!method.available}
                        onCheckedChange={() => toggleMethod(method.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Beneficios */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-none">
              <CardContent className="py-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <Zap className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <h3 className="font-semibold">Cobro automático</h3>
                    <p className="text-sm text-muted-foreground">
                      Genera links de pago automáticamente cada mes
                    </p>
                  </div>
                  <div>
                    <Shield className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <h3 className="font-semibold">Seguridad PCI DSS</h3>
                    <p className="text-sm text-muted-foreground">
                      Cumplimiento con estándares de seguridad
                    </p>
                  </div>
                  <div>
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <h3 className="font-semibold">Conciliación instantánea</h3>
                    <p className="text-sm text-muted-foreground">
                      Pagos registrados automáticamente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Cobros</CardTitle>
                <CardDescription>
                  Personaliza cómo se generan y envían los cobros a tus inquilinos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Cobro automático mensual</Label>
                      <p className="text-sm text-muted-foreground">
                        Genera links de pago el día 1 de cada mes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Recordatorios de pago</Label>
                      <p className="text-sm text-muted-foreground">
                        Envía recordatorios automáticos si no se paga
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Recibos automáticos</Label>
                      <p className="text-sm text-muted-foreground">
                        Envía recibo por email tras cada pago
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Button onClick={() => toast.success('Configuración guardada')}>
                  Guardar configuración
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Volumen este mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€12,450</div>
                  <p className="text-sm text-green-600">+15% vs mes anterior</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Transacciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">47</div>
                  <p className="text-sm text-muted-foreground">Este mes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Comisiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€185</div>
                  <p className="text-sm text-muted-foreground">Este mes</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Desglose por método</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💳</span>
                      <span>Tarjetas (Stripe)</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€10,200</div>
                      <div className="text-sm text-muted-foreground">82% del total</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏦</span>
                      <span>Transferencia manual</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€2,250</div>
                      <div className="text-sm text-muted-foreground">18% del total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
