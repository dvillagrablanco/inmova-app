'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  CreditCard,
  Crown,
  Package,
  TrendingUp,
  Building2,
  Users,
  FileText,
  Bot,
  ArrowUpRight,
  Check,
  Zap,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SubscriptionData {
  subscription: {
    plan: {
      id: string;
      nombre: string;
      tier: string;
      precioMensual: number;
      maxUsuarios: number | null;
      maxPropiedades: number | null;
      signaturesIncludedMonth: number | null;
      storageIncludedGB: number | null;
      aiTokensIncludedMonth: number | null;
    } | null;
    estado: string;
    stripeCustomerId: string | null;
  };
  usage: {
    propiedades: { used: number; limit: number };
    usuarios: { used: number; limit: number };
    inquilinos: { used: number; limit: number | null };
  };
  addons: Array<{
    id: string;
    addOnId: string;
    codigo: string;
    nombre: string;
    categoria: string;
    fechaActivacion: string;
    usoAcumulado: number;
  }>;
}

interface AvailablePlan {
  id: string;
  nombre: string;
  tier: string;
  precioMensual: number;
  precioAnual?: number;
  features: string[];
  recommended?: boolean;
}

export default function SuscripcionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Cargar datos de suscripción
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        const [subResponse, plansResponse] = await Promise.all([
          fetch('/api/subscription'),
          fetch('/api/public/subscription-plans'),
        ]);

        if (subResponse.ok) {
          const data = await subResponse.json();
          setSubscriptionData(data);
        }

        if (plansResponse.ok) {
          const plans = await plansResponse.json();
          setAvailablePlans(plans);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Error cargando datos de suscripción');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status]);

  // Cambiar de plan
  const handleChangePlan = async (planId: string) => {
    setIsChangingPlan(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval: 'monthly' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al cambiar de plan');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Cancelar suscripción
  const handleCancelSubscription = async (immediately: boolean = false) => {
    if (!confirm(`¿Estás seguro de cancelar tu suscripción${immediately ? ' inmediatamente' : ' al final del período de facturación'}?`)) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/subscription?immediately=${immediately}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        // Recargar datos
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al cancelar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsCancelling(false);
    }
  };

  // Calcular porcentaje de uso
  const getUsagePercent = (used: number, limit: number | null): number => {
    if (limit === null || limit <= 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  // Obtener color según uso
  const getUsageColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Obtener icono del tier
  const getTierIcon = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'ENTERPRISE':
        return <Crown className="h-6 w-6 text-purple-500" />;
      case 'BUSINESS':
        return <TrendingUp className="h-6 w-6 text-blue-500" />;
      case 'PROFESSIONAL':
        return <Zap className="h-6 w-6 text-orange-500" />;
      default:
        return <Package className="h-6 w-6 text-gray-500" />;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const currentPlan = subscriptionData?.subscription?.plan;
  const usage = subscriptionData?.usage;
  const addons = subscriptionData?.addons || [];

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mi Suscripción</h1>
              <p className="text-muted-foreground">
                Gestiona tu plan y facturación
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Plan Actual */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTierIcon(currentPlan?.tier || 'FREE')}
                <div>
                  <CardTitle className="text-xl">
                    {currentPlan?.nombre || 'Plan Gratuito'}
                  </CardTitle>
                  <CardDescription>
                    Plan actual • {subscriptionData?.subscription?.estado || 'Activo'}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  €{currentPlan?.precioMensual || 0}
                </p>
                <p className="text-sm text-muted-foreground">/mes</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              {/* Propiedades */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Propiedades
                </div>
                <Progress 
                  value={getUsagePercent(usage?.propiedades?.used || 0, usage?.propiedades?.limit || null)} 
                  className={`h-2 ${getUsageColor(getUsagePercent(usage?.propiedades?.used || 0, usage?.propiedades?.limit || null))}`}
                />
                <p className="text-sm text-muted-foreground">
                  {usage?.propiedades?.used || 0} / {usage?.propiedades?.limit || '∞'}
                </p>
              </div>

              {/* Usuarios */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Usuarios
                </div>
                <Progress 
                  value={getUsagePercent(usage?.usuarios?.used || 0, usage?.usuarios?.limit || null)} 
                  className={`h-2 ${getUsageColor(getUsagePercent(usage?.usuarios?.used || 0, usage?.usuarios?.limit || null))}`}
                />
                <p className="text-sm text-muted-foreground">
                  {usage?.usuarios?.used || 0} / {usage?.usuarios?.limit || '∞'}
                </p>
              </div>

              {/* Inquilinos */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Inquilinos
                </div>
                <Progress 
                  value={getUsagePercent(usage?.inquilinos?.used || 0, usage?.inquilinos?.limit || null)} 
                  className={`h-2 ${getUsageColor(getUsagePercent(usage?.inquilinos?.used || 0, usage?.inquilinos?.limit || null))}`}
                />
                <p className="text-sm text-muted-foreground">
                  {usage?.inquilinos?.used || 0} / {usage?.inquilinos?.limit || '∞'}
                </p>
              </div>

              {/* IA Tokens */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  Tokens IA
                </div>
                <Progress 
                  value={0} 
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground">
                  0 / {currentPlan?.aiTokensIncludedMonth || 0}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => router.push('/facturacion')}>
              <FileText className="h-4 w-4 mr-2" />
              Ver Facturas
            </Button>
            {currentPlan && (
              <Button 
                variant="destructive" 
                onClick={() => handleCancelSubscription(false)}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar Suscripción'}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Tabs para Planes y Add-ons */}
        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Cambiar de Plan</TabsTrigger>
            <TabsTrigger value="addons">Add-ons ({addons.length})</TabsTrigger>
          </TabsList>

          {/* Tab: Planes Disponibles */}
          <TabsContent value="plans" className="space-y-4">
            {subscriptionData?.subscription?.estado === 'cancelacion_pendiente' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cancelación pendiente</AlertTitle>
                <AlertDescription>
                  Tu suscripción está programada para cancelarse al final del período de facturación.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {availablePlans.map((plan) => {
                const isCurrentPlan = currentPlan?.id === plan.id;
                const isUpgrade = (currentPlan?.precioMensual || 0) < plan.precioMensual;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.recommended ? 'border-2 border-primary' : ''} ${isCurrentPlan ? 'bg-primary/5' : ''}`}
                  >
                    {plan.recommended && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                        Recomendado
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getTierIcon(plan.tier)}
                        {plan.nombre}
                        {isCurrentPlan && (
                          <Badge variant="secondary">Actual</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        <span className="text-2xl font-bold text-foreground">
                          €{plan.precioMensual}
                        </span>
                        /mes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.slice(0, 5).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? 'outline' : isUpgrade ? 'default' : 'secondary'}
                        disabled={isCurrentPlan || isChangingPlan}
                        onClick={() => handleChangePlan(plan.id)}
                      >
                        {isCurrentPlan ? (
                          'Plan Actual'
                        ) : isChangingPlan ? (
                          'Procesando...'
                        ) : isUpgrade ? (
                          <>
                            Actualizar
                            <ArrowUpRight className="h-4 w-4 ml-1" />
                          </>
                        ) : (
                          'Cambiar'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab: Add-ons */}
          <TabsContent value="addons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add-ons Activos</CardTitle>
                <CardDescription>
                  Funcionalidades adicionales activas en tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {addons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tienes add-ons activos</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/planes')}
                    >
                      Explorar Add-ons
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Add-on</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fecha Activación</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addons.map((addon) => (
                        <TableRow key={addon.id}>
                          <TableCell className="font-medium">{addon.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{addon.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(addon.fechaActivacion).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>{addon.usoAcumulado}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Gestionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Add-ons Disponibles */}
            <Card>
              <CardHeader>
                <CardTitle>Add-ons Disponibles</CardTitle>
                <CardDescription>
                  Mejora tu plan con funcionalidades adicionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Firmas Adicionales</h4>
                          <p className="text-sm text-muted-foreground">+10 firmas/mes</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Añade más firmas digitales a tu cuota mensual.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">€9.99/mes</span>
                        <Button size="sm" variant="outline">Añadir</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Bot className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Tokens IA Premium</h4>
                          <p className="text-sm text-muted-foreground">+50.000 tokens/mes</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Amplía tu capacidad de uso de IA para valoraciones y asistencia.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">€19.99/mes</span>
                        <Button size="sm" variant="outline">Añadir</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Propiedades Extra</h4>
                          <p className="text-sm text-muted-foreground">+10 propiedades</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Aumenta el límite de propiedades en tu cuenta.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">€14.99/mes</span>
                        <Button size="sm" variant="outline">Añadir</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Información de Facturación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información de Facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Próxima factura</p>
                <p className="font-semibold">
                  €{currentPlan?.precioMensual || 0} el próximo mes
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Método de pago</p>
                <p className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {subscriptionData?.subscription?.stripeCustomerId ? 'Configurado' : 'No configurado'}
                </p>
              </div>
              <div>
                <Button variant="outline" onClick={() => router.push('/facturacion')}>
                  Ver Historial de Facturas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
