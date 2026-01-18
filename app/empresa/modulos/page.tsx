'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Home,
  ArrowLeft,
  Package,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  Star,
  CreditCard,
  Lock,
  ShoppingCart,
  Crown,
  Info,
  ChevronRight,
  Sparkles,
  Check,
  X,
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
import {
  MODULE_DESCRIPTIONS,
  CATEGORY_INFO,
  type ModuleDescription,
} from '@/lib/modules-descriptions';

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
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; modulo: ModuleDescription | null }>({
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

      const catalogRes = await fetch('/api/modules/catalog');
      if (catalogRes.ok) {
        const catalogData = await catalogRes.json();
        setModulos(catalogData.modulos || []);
      }

      const companyRes = await fetch('/api/modules/company');
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompanyModules(companyData.modules || []);
      }

      const planRes = await fetch('/api/modules/current-plan');
      if (planRes.ok) {
        const planData = await planRes.json();
        setCurrentPlan(planData.currentPlan);
      }

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

      toast.success(activo ? 'Módulo activado' : 'Módulo desactivado');
      await loadData();
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

  function isAddOnPurchased(codigo: string): boolean {
    return addOnsPurchased.some(a => a.codigo === codigo);
  }

  function canActivateModule(modulo: ModuloDefinicion): { canActivate: boolean; reason: string; addonPrice?: number } {
    if (modulo.esCore) {
      return { canActivate: false, reason: 'Módulo esencial siempre activo' };
    }

    const planTier = (currentPlan?.tier?.toLowerCase() || 'starter') as PlanTier;
    if (planTier === 'owner') {
      return { canActivate: true, reason: 'Plan Owner - Todo incluido' };
    }

    if (hasTotalAccess()) {
      return { canActivate: true, reason: 'Incluido en tu plan' };
    }

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
          reason: `Disponible como add-on`,
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

  function getModuleDetails(codigo: string): ModuleDescription | undefined {
    return MODULE_DESCRIPTIONS[codigo];
  }

  // Agrupar módulos por categoría
  const categorias = [...new Set(modulos.map(m => m.categoria))];

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
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
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
            <h1 className="text-3xl font-bold mt-2 flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Gestión de Módulos
            </h1>
            <p className="text-muted-foreground mt-1">
              Activa los módulos que necesitas. Haz clic en cada módulo para ver una descripción detallada.
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
                      <Sparkles className="h-4 w-4" />
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
                    Ver planes y add-ons
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => router.push('/empresa/facturas')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver facturas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información sobre cómo funciona */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">¿Cómo funcionan los módulos?</p>
                <ul className="mt-2 text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    <strong>Activo:</strong> El módulo aparece en el menú y puedes usarlo
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-3 w-3 text-gray-400" />
                    <strong>Inactivo:</strong> Se oculta del menú pero no pierdes datos
                  </li>
                  <li className="flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3 text-amber-600" />
                    <strong>Add-on:</strong> Puedes comprarlo para añadirlo a tu plan
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-red-500" />
                    <strong>Bloqueado:</strong> Necesitas upgrade de plan
                  </li>
                </ul>
                <p className="mt-2 text-blue-600">
                  <strong>Tip:</strong> Haz clic en cualquier módulo para ver una descripción detallada de para qué sirve.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Módulos por categoría */}
        <Accordion type="multiple" defaultValue={categorias} className="space-y-4">
          {categorias.map((categoria) => {
            const modulosCategoria = getModulosByCategoria(categoria);
            if (modulosCategoria.length === 0) return null;

            const categoryInfo = CATEGORY_INFO[categoria] || {
              nombre: categoria,
              descripcion: '',
              color: 'bg-gray-100 text-gray-800',
            };

            return (
              <AccordionItem key={categoria} value={categoria} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge className={categoryInfo.color}>
                      {categoryInfo.nombre}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {modulosCategoria.length} módulos
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                  {categoryInfo.descripcion && (
                    <p className="text-sm text-muted-foreground mb-4">{categoryInfo.descripcion}</p>
                  )}
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
                      const moduleDetails = getModuleDetails(modulo.codigo);

                      return (
                        <div
                          key={modulo.codigo}
                          className={`p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                            activo
                              ? 'bg-green-50 border-green-200'
                              : needsPurchase
                                ? 'bg-amber-50 border-amber-200'
                                : isUnavailable
                                  ? 'bg-gray-50 border-gray-200 opacity-60'
                                  : canActivate
                                    ? 'bg-white border-gray-200 hover:border-blue-300'
                                    : 'bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => moduleDetails && setDetailDialog({ open: true, modulo: moduleDetails })}
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
                                  <Badge className="text-xs bg-green-600">Activo</Badge>
                                )}
                                {moduleStatus === 'included' && !activo && planTier !== 'owner' && (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                    Incluido
                                  </Badge>
                                )}
                                {needsPurchase && displayPrice && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                    €{displayPrice}/mes
                                  </Badge>
                                )}
                                {isUnavailable && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Upgrade
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {moduleDetails?.descripcionCorta || modulo.descripcion}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-primary">
                                <Info className="h-3 w-3" />
                                <span>Ver más detalles</span>
                                <ChevronRight className="h-3 w-3" />
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                  <ShoppingCart className="h-4 w-4 mr-1" />
                                  Comprar
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Dialog de detalles del módulo */}
        <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, modulo: detailDialog.modulo })}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {detailDialog.modulo && (
                  <>
                    <detailDialog.modulo.icon className="h-6 w-6 text-primary" />
                    {detailDialog.modulo.nombre}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {detailDialog.modulo?.descripcionCorta}
              </DialogDescription>
            </DialogHeader>
            
            {detailDialog.modulo && (
              <div className="space-y-6">
                {/* Descripción larga */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    ¿Qué es?
                  </h4>
                  <p className="text-muted-foreground">{detailDialog.modulo.descripcionLarga}</p>
                </div>

                {/* Funcionalidades */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Funcionalidades incluidas
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {detailDialog.modulo.funcionalidades.map((func, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{func}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Casos de uso */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Casos de uso
                  </h4>
                  <ul className="space-y-2">
                    {detailDialog.modulo.casosDeUso.map((caso, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm bg-gray-50 p-2 rounded">
                        <span className="text-primary font-medium">{idx + 1}.</span>
                        <span>{caso}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Beneficios */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Beneficios clave
                  </h4>
                  <ul className="space-y-2">
                    {detailDialog.modulo.beneficios.map((beneficio, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          ✓
                        </Badge>
                        <span>{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Precio si es add-on */}
                {MODULE_ADDON_PRICES[detailDialog.modulo.codigo] && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-amber-800">Disponible como Add-on</p>
                          <p className="text-sm text-amber-700">
                            Se añade a tu factura mensual
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-600">
                            €{MODULE_ADDON_PRICES[detailDialog.modulo.codigo].monthlyPrice}/mes
                          </p>
                          <p className="text-xs text-amber-600">
                            o €{MODULE_ADDON_PRICES[detailDialog.modulo.codigo].annualPrice}/año
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailDialog({ open: false, modulo: null })}>
                Cerrar
              </Button>
              {detailDialog.modulo && MODULE_ADDON_PRICES[detailDialog.modulo.codigo] && !isAddOnPurchased(detailDialog.modulo.codigo) && (
                <Button 
                  onClick={() => {
                    const modulo = modulos.find(m => m.codigo === detailDialog.modulo?.codigo);
                    if (modulo) {
                      setDetailDialog({ open: false, modulo: null });
                      setPurchaseDialog({ 
                        open: true, 
                        modulo: { 
                          ...modulo, 
                          precioAddOn: MODULE_ADDON_PRICES[modulo.codigo]?.monthlyPrice 
                        } 
                      });
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comprar Add-on
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    <p className="text-sm text-muted-foreground mb-4">
                      {MODULE_DESCRIPTIONS[purchaseDialog.modulo.codigo]?.descripcionLarga || purchaseDialog.modulo.descripcion}
                    </p>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-muted-foreground">Precio mensual:</span>
                      <span className="text-2xl font-bold">€{purchaseDialog.modulo.precioAddOn}/mes</span>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 space-y-1">
                  <p>✓ Se añadirá a tu factura mensual automáticamente</p>
                  <p>✓ Puedes cancelar en cualquier momento</p>
                  <p>✓ El módulo se activará inmediatamente tras el pago</p>
                  <p>✓ Recibirás factura por email</p>
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
                className="bg-amber-600 hover:bg-amber-700"
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
