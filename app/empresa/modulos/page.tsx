'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  ArrowLeft,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Shield,
  Users,
  Zap,
  RefreshCw,
  Star,
  CreditCard,
  Lock,
  ShoppingCart,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import {
  MODULES_BY_PLAN,
  MODULE_ADDON_PRICES,
  PLAN_INFO,
  getModuleStatus,
  type PlanTier,
} from '@/lib/modules-pricing-config';

interface ModuloDefinicion {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono?: string;
  ruta: string;
  requiereModulos: string[];
  tiersIncluido: string[];
  esCore: boolean;
  orden: number;
  esAddOn?: boolean;
  precioAddOn?: number;
}

interface CompanyModule {
  id: string;
  moduloCodigo: string;
  activo: boolean;
  nombre: string;
  descripcion: string;
  categoria: string;
  esCore: boolean;
}

interface CurrentPlan {
  id: string;
  nombre: string;
  tier: string;
  precioMensual: number;
  maxUsuarios: number;
  maxPropiedades: number;
  modulosIncluidos: string[];
}

interface AddOnPurchased {
  codigo: string;
  fechaCompra: string;
}

const CATEGORIAS: Record<string, { nombre: string; icono: React.ComponentType<any>; color: string }> = {
  core: { nombre: 'Módulos Esenciales', icono: Package, color: 'bg-blue-100 text-blue-800' },
  gestion: { nombre: 'Gestión Básica', icono: Building2, color: 'bg-green-100 text-green-800' },
  financiero: { nombre: 'Financiero', icono: DollarSign, color: 'bg-purple-100 text-purple-800' },
  comunicacion: { nombre: 'Comunicación', icono: MessageSquare, color: 'bg-orange-100 text-orange-800' },
  avanzado: { nombre: 'Avanzado', icono: TrendingUp, color: 'bg-red-100 text-red-800' },
  comunidad: { nombre: 'Comunidad', icono: Users, color: 'bg-teal-100 text-teal-800' },
  portales: { nombre: 'Portales', icono: Zap, color: 'bg-indigo-100 text-indigo-800' },
  admin: { nombre: 'Administración', icono: Shield, color: 'bg-gray-100 text-gray-800' },
};

export default function EmpresaModulosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modulos, setModulos] = useState<ModuloDefinicion[]>([]);
  const [companyModules, setCompanyModules] = useState<CompanyModule[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [addOnsPurchased, setAddOnsPurchased] = useState<AddOnPurchased[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [purchaseDialog, setPurchaseDialog] = useState<{ open: boolean; modulo: ModuloDefinicion | null }>({
    open: false,
    modulo: null,
  });
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      // Solo administradores de empresa pueden gestionar módulos
      if (!['administrador', 'super_admin', 'propietario'].includes(userRole)) {
        router.push('/dashboard');
        toast.error('Solo el administrador de la empresa puede gestionar módulos');
        return;
      }
      loadData();
    }
  }, [status, session, router]);

  async function loadData() {
    try {
      setLoading(true);

      // Cargar catálogo de módulos
      const catalogRes = await fetch('/api/modules/catalog');
      if (catalogRes.ok) {
        const catalogData = await catalogRes.json();
        setModulos(catalogData.modulos || []);
      }

      // Cargar módulos de la empresa
      const companyRes = await fetch('/api/modules/company');
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompanyModules(companyData.modules || []);
      }

      // Cargar plan actual
      const planRes = await fetch('/api/modules/current-plan');
      if (planRes.ok) {
        const planData = await planRes.json();
        setCurrentPlan(planData.currentPlan);
      }

      // Cargar add-ons comprados
      const addOnsRes = await fetch('/api/addons/purchased');
      if (addOnsRes.ok) {
        const addOnsData = await addOnsRes.json();
        setAddOnsPurchased(addOnsData.addOns || []);
      }
    } catch (error: any) {
      logger.error('Error loading modules:', error);
      toast.error('Error al cargar módulos');
    } finally {
      setLoading(false);
    }
  }

  async function toggleModule(moduloCodigo: string, activo: boolean) {
    try {
      setUpdating(moduloCodigo);

      const res = await fetch('/api/modules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloCodigo, activo }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al modificar módulo');
      }

      toast.success(activo ? 'Módulo activado - Actualiza la página para ver los cambios en el menú' : 'Módulo desactivado');
      
      // Recargar datos para actualizar el estado
      await loadData();
      
      // Disparar evento para que el sidebar se actualice
      window.dispatchEvent(new CustomEvent('modules-updated'));
    } catch (error: any) {
      logger.error('Error toggling module:', error);
      toast.error(error.message || 'Error al modificar módulo');
    } finally {
      setUpdating(null);
    }
  }

  async function purchaseAddOn(modulo: ModuloDefinicion) {
    try {
      setPurchasing(true);

      const res = await fetch('/api/addons/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          addOnCodigo: modulo.codigo,
          precio: modulo.precioAddOn 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al procesar la compra');
      }

      const data = await res.json();
      
      if (data.requiresPayment && data.checkoutUrl) {
        // Redirigir a Stripe Checkout
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.success('Add-on adquirido correctamente');
      setPurchaseDialog({ open: false, modulo: null });
      await loadData();
    } catch (error: any) {
      logger.error('Error purchasing add-on:', error);
      toast.error(error.message || 'Error al procesar la compra');
    } finally {
      setPurchasing(false);
    }
  }

  function isModuleActive(codigo: string): boolean {
    const modulo = modulos.find((m) => m.codigo === codigo);
    if (modulo?.esCore) return true;
    const companyModule = companyModules.find((cm) => cm.moduloCodigo === codigo);
    return companyModule?.activo || false;
  }

  function hasTotalAccess(): boolean {
    if (!currentPlan) return false;
    const tier = currentPlan.tier?.toLowerCase();
    return ['empresarial', 'enterprise', 'premium', 'personalizado', 'business'].includes(tier) ||
      currentPlan.modulosIncluidos?.includes('*');
  }

  function isModuleIncludedInPlan(codigo: string): boolean {
    if (!currentPlan) return false;
    if (hasTotalAccess()) return true;
    return currentPlan.modulosIncluidos?.includes(codigo) || false;
  }

  function isAddOnPurchased(codigo: string): boolean {
    return addOnsPurchased.some(a => a.codigo === codigo);
  }

  function canActivateModule(modulo: ModuloDefinicion): { canActivate: boolean; reason: string; addonPrice?: number } {
    if (modulo.esCore) {
      return { canActivate: false, reason: 'Los módulos esenciales siempre están activos' };
    }

    // Plan Owner tiene acceso total
    const planTier = (currentPlan?.tier?.toLowerCase() || 'starter') as PlanTier;
    if (planTier === 'owner') {
      return { canActivate: true, reason: 'Plan Owner - Todo incluido' };
    }

    if (hasTotalAccess()) {
      return { canActivate: true, reason: 'Incluido en tu plan' };
    }

    // Usar la nueva configuración de módulos por plan
    const moduleStatus = getModuleStatus(modulo.codigo, planTier);
    
    switch (moduleStatus) {
      case 'core':
        return { canActivate: false, reason: 'Módulo esencial siempre activo' };
      case 'included':
        return { canActivate: true, reason: 'Incluido en tu plan' };
      case 'addon':
        if (isAddOnPurchased(modulo.codigo)) {
          return { canActivate: true, reason: 'Add-on comprado' };
        }
        const addonInfo = MODULE_ADDON_PRICES[modulo.codigo];
        const price = addonInfo?.monthlyPrice || modulo.precioAddOn || 0;
        return { 
          canActivate: false, 
          reason: `Requiere add-on (€${price}/mes)`,
          addonPrice: price
        };
      case 'unavailable':
      default:
        return { canActivate: false, reason: 'Requiere upgrade de plan' };
    }
  }

  function getModulosByCategoria(categoria: string) {
    return modulos.filter((m) => m.categoria === categoria);
  }

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/empresa/configuracion">Mi Empresa</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Gestión de Módulos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-3xl font-bold mt-2">Gestión de Módulos</h1>
            <p className="text-muted-foreground mt-1">
              Activa o desactiva módulos según las necesidades de tu empresa. Los cambios se reflejarán en el menú de navegación.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/empresa/configuracion')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refrescar
            </Button>
          </div>
        </div>

        {/* Plan Actual */}
        {currentPlan && (
          <Card className={`border-2 ${
            currentPlan.tier?.toLowerCase() === 'owner' 
              ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50'
              : 'border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {currentPlan.tier?.toLowerCase() === 'owner' ? (
                      <Crown className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Star className="h-5 w-5 text-yellow-500" />
                    )}
                    <CardTitle className="text-xl">Tu Plan: {currentPlan.nombre}</CardTitle>
                    {currentPlan.tier?.toLowerCase() === 'owner' && (
                      <Badge className="bg-purple-600">OWNER</Badge>
                    )}
                  </div>
                  {currentPlan.tier?.toLowerCase() === 'owner' ? (
                    <p className="text-sm text-purple-600 flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      Acceso total a todos los módulos sin límites
                    </p>
                  ) : hasTotalAccess() ? (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Tu plan incluye acceso a todos los módulos
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  {currentPlan.tier?.toLowerCase() === 'owner' ? (
                    <>
                      <p className="text-2xl font-bold text-purple-600">Ilimitado</p>
                      <p className="text-sm text-muted-foreground">Todo incluido</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">€{currentPlan.precioMensual}/mes</p>
                      <p className="text-sm text-muted-foreground">{currentPlan.modulosIncluidos.length} módulos incluidos</p>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentPlan.tier?.toLowerCase() !== 'owner' && (
                  <Button variant="outline" size="sm" onClick={() => router.push('/landing/precios')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver planes disponibles
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => router.push('/contacto')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contactar soporte
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información importante */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Información sobre módulos</p>
                <ul className="mt-1 text-amber-700 space-y-1">
                  <li>• Los módulos <strong>activos</strong> aparecerán en el menú de navegación</li>
                  <li>• Los módulos <strong>desactivados</strong> se ocultarán del menú pero no se perderán datos</li>
                  <li>• Algunos módulos requieren <strong>add-ons de pago</strong> para activarse</li>
                  <li>• Puedes cambiar la configuración en cualquier momento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Módulos por categoría */}
        <div className="space-y-6">
          {Object.entries(CATEGORIAS).map(([key, cat]) => {
            const modulosCategoria = getModulosByCategoria(key);
            if (modulosCategoria.length === 0) return null;

            const CatIcon = cat.icono;

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CatIcon className="h-5 w-5" />
                    {cat.nombre}
                    <Badge variant="outline" className="ml-2">
                      {modulosCategoria.length} módulos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {modulosCategoria.map((modulo) => {
                      const activo = isModuleActive(modulo.codigo);
                      const { canActivate, reason, addonPrice } = canActivateModule(modulo);
                      const isDisabled = modulo.esCore || updating === modulo.codigo;
                      const planTier = (currentPlan?.tier?.toLowerCase() || 'starter') as PlanTier;
                      const moduleStatus = planTier === 'owner' ? 'included' : getModuleStatus(modulo.codigo, planTier);
                      const needsPurchase = moduleStatus === 'addon' && !isAddOnPurchased(modulo.codigo);
                      const isUnavailable = moduleStatus === 'unavailable';
                      const displayPrice = addonPrice || MODULE_ADDON_PRICES[modulo.codigo]?.monthlyPrice || modulo.precioAddOn;

                      return (
                        <div
                          key={modulo.codigo}
                          className={`p-4 border rounded-lg transition-all ${
                            activo
                              ? 'bg-green-50 border-green-200'
                              : needsPurchase
                                ? 'bg-amber-50 border-amber-200'
                                : isUnavailable
                                  ? 'bg-red-50 border-red-200 opacity-75'
                                  : canActivate
                                    ? 'bg-gray-50 border-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-semibold">{modulo.nombre}</h4>
                                {modulo.esCore && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Esencial
                                  </Badge>
                                )}
                                {planTier === 'owner' && !modulo.esCore && (
                                  <Badge className="text-xs bg-purple-600">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Owner
                                  </Badge>
                                )}
                                {activo && !modulo.esCore && planTier !== 'owner' && (
                                  <Badge className="text-xs bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Activo
                                  </Badge>
                                )}
                                {moduleStatus === 'included' && !activo && planTier !== 'owner' && (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                    <Star className="h-3 w-3 mr-1" />
                                    Incluido
                                  </Badge>
                                )}
                                {needsPurchase && displayPrice && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Add-on €{displayPrice}/mes
                                  </Badge>
                                )}
                                {isUnavailable && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Requiere upgrade
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{modulo.descripcion}</p>
                              <p className="text-xs text-muted-foreground">{reason}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              {needsPurchase && displayPrice ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                  onClick={() => setPurchaseDialog({ 
                                    open: true, 
                                    modulo: { ...modulo, precioAddOn: displayPrice } 
                                  })}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  €{displayPrice}/mes
                                </Button>
                              ) : isUnavailable ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300"
                                  onClick={() => router.push('/landing/precios')}
                                >
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                  Upgrade
                                </Button>
                              ) : (
                                <>
                                  <Switch
                                    checked={activo}
                                    disabled={isDisabled || !canActivate}
                                    onCheckedChange={(checked) => toggleModule(modulo.codigo, checked)}
                                    className="data-[state=checked]:bg-green-600"
                                  />
                                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {activo ? 'Activo' : canActivate ? 'Inactivo' : 'Bloqueado'}
                                  </span>
                                </>
                              )}
                            </div>
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

        {/* Dialog de compra de Add-on */}
        <Dialog open={purchaseDialog.open} onOpenChange={(open) => setPurchaseDialog({ open, modulo: purchaseDialog.modulo })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Comprar Add-on
              </DialogTitle>
              <DialogDescription>
                {purchaseDialog.modulo && (
                  <>
                    Estás a punto de adquirir el módulo <strong>{purchaseDialog.modulo.nombre}</strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {purchaseDialog.modulo && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{purchaseDialog.modulo.nombre}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{purchaseDialog.modulo.descripcion}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Precio mensual:</span>
                      <span className="text-2xl font-bold">€{purchaseDialog.modulo.precioAddOn}/mes</span>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <p>• Se añadirá a tu factura mensual</p>
                  <p>• Puedes cancelar en cualquier momento</p>
                  <p>• El módulo se activará inmediatamente</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setPurchaseDialog({ open: false, modulo: null })}>
                Cancelar
              </Button>
              <Button 
                onClick={() => purchaseDialog.modulo && purchaseAddOn(purchaseDialog.modulo)}
                disabled={purchasing}
              >
                {purchasing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Confirmar compra
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
