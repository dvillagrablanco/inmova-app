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
} from 'lucide-react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';
import { SECTION_TO_MODULES } from '@/components/layout/sidebar-data';

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
}

interface SubscriptionPack {
  tier: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  maxUsuarios: number;
  maxPropiedades: number;
  modulosIncluidos: string[];
  caracteristicas: string[];
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

const CATEGORIAS = {
  core: { nombre: 'Módulos Esenciales', icono: Package, color: 'bg-blue-100 text-blue-800' },
  gestion: { nombre: 'Gestión Básica', icono: Building2, color: 'bg-green-100 text-green-800' },
  financiero: { nombre: 'Financiero', icono: DollarSign, color: 'bg-purple-100 text-purple-800' },
  comunicacion: {
    nombre: 'Comunicación',
    icono: MessageSquare,
    color: 'bg-orange-100 text-orange-800',
  },
  avanzado: { nombre: 'Avanzado', icono: TrendingUp, color: 'bg-red-100 text-red-800' },
  comunidad: { nombre: 'Comunidad', icono: Users, color: 'bg-teal-100 text-teal-800' },
  portales: { nombre: 'Portales', icono: Zap, color: 'bg-indigo-100 text-indigo-800' },
  admin: { nombre: 'Administración', icono: Shield, color: 'bg-gray-100 text-gray-800' },
};

export default function ModulosAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modulos, setModulos] = useState<ModuloDefinicion[]>([]);
  const [companyModules, setCompanyModules] = useState<CompanyModule[]>([]);
  const [packs, setPacks] = useState<SubscriptionPack[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'administrador' && userRole !== 'super_admin') {
        router.push('/dashboard');
        toast.error('No tienes permisos para acceder a esta página');
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
        setPacks(catalogData.packs || []);
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
      window.dispatchEvent(new Event('modules-changed'));
      await loadData();
    } catch (error: any) {
      logger.error('Error toggling module:', error);
      toast.error(error.message || 'Error al modificar módulo');
    } finally {
      setUpdating(null);
    }
  }

  const [updatingSection, setUpdatingSection] = useState<string | null>(null);

  async function toggleSectionModules(sectionId: string, activo: boolean) {
    const sectionModules = SECTION_TO_MODULES[sectionId];
    if (!sectionModules || sectionModules.length === 0) return;

    try {
      setUpdatingSection(sectionId);
      const res = await fetch('/api/modules/toggle-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: sectionModules, activo }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al modificar módulos');
      }

      const result = await res.json();
      toast.success(
        activo
          ? `${result.toggled?.length || 0} módulos activados`
          : `${result.toggled?.length || 0} módulos desactivados`
      );
      window.dispatchEvent(new Event('modules-changed'));
      await loadData();
    } catch (error: any) {
      logger.error('Error toggling section:', error);
      toast.error(error.message || 'Error al modificar módulos');
    } finally {
      setUpdatingSection(null);
    }
  }

  function getSectionActiveCount(sectionId: string): { active: number; total: number } {
    const sectionModules = SECTION_TO_MODULES[sectionId];
    if (!sectionModules) return { active: 0, total: 0 };
    const active = sectionModules.filter((m) => isModuleActive(m)).length;
    return { active, total: sectionModules.length };
  }

  function isSectionFullyActive(sectionId: string): boolean {
    const { active, total } = getSectionActiveCount(sectionId);
    return active > total / 2;
  }

  function isModuleActive(codigo: string): boolean {
    // Si hay un registro explícito en CompanyModule, usar su valor
    const companyModule = companyModules.find((cm) => cm.moduloCodigo === codigo);
    if (companyModule) return companyModule.activo;

    // Si no hay registro, los core están activos por defecto
    const modulo = modulos.find((m) => m.codigo === codigo);
    if (modulo?.esCore) return true;

    return false;
  }

  // Verificar si el plan actual tiene acceso total a todos los módulos
  function hasTotalAccess(): boolean {
    if (!currentPlan) return false;
    const tier = currentPlan.tier?.toLowerCase();
    return ['empresarial', 'enterprise', 'premium', 'personalizado', 'business'].includes(tier) ||
      currentPlan.modulosIncluidos?.includes('*');
  }

  // Verificar si un módulo está incluido en el plan actual
  function isModuleIncludedInPlan(codigo: string): boolean {
    if (!currentPlan) return false;
    if (hasTotalAccess()) return true;
    return currentPlan.modulosIncluidos?.includes(codigo) || false;
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
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin/configuracion">Administración</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Gestión de Módulos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl font-bold mt-2">Gestión de Módulos</h1>
              <p className="text-muted-foreground mt-1">
                Activa o desactiva módulos según las necesidades de tu empresa
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/configuracion')}
              >
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
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-2xl">Plan Actual</CardTitle>
                    </div>
                    <CardDescription>
                      Información de tu suscripción y opciones de mejora
                    </CardDescription>
                    {hasTotalAccess() && (
                      <div className="mt-2 flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Tu plan incluye acceso a TODOS los módulos disponibles
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge
                    className={`text-lg px-4 py-2 ${
                      currentPlan.tier === 'basico'
                        ? 'bg-blue-500'
                        : currentPlan.tier === 'profesional'
                          ? 'bg-purple-500'
                          : currentPlan.tier === 'empresarial'
                            ? 'bg-orange-500'
                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                  >
                    {currentPlan.nombre}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Precio Mensual</p>
                    <p className="text-3xl font-bold text-primary">€{currentPlan.precioMensual}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Usuarios Máximos</p>
                    <p className="text-2xl font-semibold">
                      {currentPlan.maxUsuarios === -1 ? 'Ilimitados' : currentPlan.maxUsuarios}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Propiedades Máximas</p>
                    <p className="text-2xl font-semibold">
                      {currentPlan.maxPropiedades === -1
                        ? 'Ilimitadas'
                        : currentPlan.maxPropiedades}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Módulos Incluidos</p>
                    <p className="text-2xl font-semibold">{currentPlan.modulosIncluidos.length}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {currentPlan.tier !== 'premium' && currentPlan.tier !== 'empresarial' && (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      onClick={() => router.push('/admin/clientes')}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Mejorar Plan (Upgrade)
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/admin/clientes')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Cambiar Plan
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push('/contacto')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contactar Soporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!currentPlan && (
            <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  Sin Plan de Suscripción
                </CardTitle>
                <CardDescription className="text-orange-700">
                  No tienes un plan de suscripción asignado. Contacta con el administrador para
                  configurar tu plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/admin/clientes')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contactar Administrador
                </Button>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="modulos" className="space-y-6">
            <TabsList>
              <TabsTrigger value="modulos">Módulos Disponibles</TabsTrigger>
              <TabsTrigger value="verticales">Por Verticales / Módulos</TabsTrigger>
              <TabsTrigger value="packs">Packs de Suscripción</TabsTrigger>
            </TabsList>

            {/* Tab de Módulos */}
            <TabsContent value="modulos" className="space-y-6">
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
                          const incluidoEnPlan = isModuleIncludedInPlan(modulo.codigo);
                          const tieneAccesoTotal = hasTotalAccess();
                          const isDisabled = updating === modulo.codigo;
                          const canToggle = incluidoEnPlan || tieneAccesoTotal || modulo.esCore;

                          return (
                            <div
                              key={modulo.codigo}
                              className={`p-4 border rounded-lg transition-all ${
                                activo
                                  ? 'bg-green-50 border-green-200'
                                  : incluidoEnPlan || tieneAccesoTotal
                                    ? 'bg-gray-50 border-gray-200'
                                    : 'bg-orange-50 border-orange-200 opacity-75'
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
                                    {activo && !modulo.esCore && (
                                      <Badge variant="default" className="text-xs bg-green-600">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Activo
                                      </Badge>
                                    )}
                                    {!incluidoEnPlan && !tieneAccesoTotal && !modulo.esCore && (
                                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Requiere upgrade
                                      </Badge>
                                    )}
                                    {tieneAccesoTotal && !modulo.esCore && (
                                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                        <Star className="h-3 w-3 mr-1" />
                                        Incluido en tu plan
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {modulo.descripcion}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <code className="bg-gray-100 px-2 py-1 rounded">
                                      {modulo.ruta}
                                    </code>
                                    {modulo.requiereModulos.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Requiere: {modulo.requiereModulos.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      Disponible en: {modulo.tiersIncluido.join(', ')}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                  <Switch
                                    checked={activo}
                                    disabled={isDisabled || !canToggle}
                                    onCheckedChange={(checked) =>
                                      toggleModule(modulo.codigo, checked)
                                    }
                                    className="data-[state=checked]:bg-green-600"
                                  />
                                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {activo ? 'Activo' : canToggle ? 'Inactivo' : 'Bloqueado'}
                                  </span>
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
            </TabsContent>

            {/* Tab de Verticales / Módulos */}
            <TabsContent value="verticales" className="space-y-6">
              {/* Verticales de Negocio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Verticales de Negocio
                  </CardTitle>
                  <CardDescription>
                    Activa o desactiva módulos verticales completos de un solo clic
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: 'alquilerResidencial', label: '🏠 Living Residencial', desc: 'Alquiler tradicional, coliving, student housing' },
                    { id: 'str', label: '🏖️ Turístico y Hospitality', desc: 'Short-term rentals, channel manager, reviews' },
                    { id: 'hospitality', label: '🏨 Hospitality', desc: 'Apart-hotels, B&B, check-in/out, servicios' },
                    { id: 'coLiving', label: '🛏️ Coliving', desc: 'Habitaciones, comunidad, matching, eventos' },
                    { id: 'studentHousing', label: '🎓 Student Housing', desc: 'Residencias de estudiantes' },
                    { id: 'construccion', label: '🏗️ Construcción / Promoción', desc: 'Obra nueva, reformas, Gantt, licitaciones' },
                    { id: 'ewoorker', label: '🔧 eWoorker', desc: 'Marketplace de trabajadores B2B' },
                    { id: 'flipping', label: '📈 House Flipping', desc: 'Proyectos, timeline, calculadora ROI' },
                    { id: 'comercial', label: '🏢 Patrimonio Terciario', desc: 'Oficinas, locales, naves, garajes' },
                    { id: 'adminFincas', label: '🏘️ Comunidades', desc: 'Administración de fincas, propietarios, cuotas' },
                    { id: 'viviendaSocial', label: '🏛️ Vivienda Social', desc: 'Solicitudes, elegibilidad, compliance' },
                    { id: 'realEstateDeveloper', label: '🏗️ Promotoras', desc: 'Proyectos, ventas, marketing inmobiliario' },
                    { id: 'workspace', label: '💼 Workspace', desc: 'Coworking, reservas, miembros' },
                    { id: 'warehouse', label: '📦 Warehouse', desc: 'Inventario, ubicaciones, movimientos' },
                    { id: 'holdingGrupo', label: '🏛️ Holding / Grupo', desc: 'Consolidación societaria, inversiones, fiscal' },
                  ].map((section) => {
                    const { active, total } = getSectionActiveCount(section.id);
                    const isActive = isSectionFullyActive(section.id);
                    const isToggling = updatingSection === section.id;

                    return (
                      <div
                        key={section.id}
                        className={`p-4 border rounded-lg transition-all ${
                          isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{section.label}</h4>
                              <Badge variant="outline" className="text-xs">
                                {active}/{total} activos
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{section.desc}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <Switch
                              checked={isActive}
                              disabled={isToggling}
                              onCheckedChange={(checked) =>
                                toggleSectionModules(section.id, checked)
                              }
                              className="data-[state=checked]:bg-green-600"
                            />
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {isToggling ? 'Procesando...' : isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                        {/* Barra de progreso visual */}
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: total > 0 ? `${(active / total) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Herramientas Horizontales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Herramientas Horizontales
                  </CardTitle>
                  <CardDescription>
                    Herramientas transversales aplicables a todas las verticales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: 'finanzas', label: '💰 Finanzas', desc: 'Pagos, gastos, contabilidad, BI, presupuestos' },
                    { id: 'analytics', label: '📊 Analytics e IA', desc: 'Reportes, informes, asistente IA' },
                    { id: 'operaciones', label: '⚙️ Operaciones', desc: 'Mantenimiento, proveedores, tareas, calendario' },
                    { id: 'herramientasInversion', label: '🧮 Inversión', desc: 'Calculadoras de rentabilidad, hipotecas' },
                    { id: 'comunicaciones', label: '💬 Comunicaciones', desc: 'Chat, notificaciones, SMS, redes sociales' },
                    { id: 'documentosLegal', label: '📄 Documentos y Legal', desc: 'IA documental, firma digital, compliance' },
                    { id: 'crmMarketing', label: '📇 CRM Inmobiliario', desc: 'CRM, portal comercial, tours virtuales' },
                    { id: 'automatizacion', label: '⚡ Automatización', desc: 'Workflows, sincronización, recordatorios' },
                    { id: 'innovacion', label: '🚀 Innovación', desc: 'ESG, IoT, blockchain, economía circular' },
                    { id: 'soporte', label: '🎧 Soporte', desc: 'Centro de ayuda, base de conocimientos' },
                  ].map((section) => {
                    const { active, total } = getSectionActiveCount(section.id);
                    const isActive = isSectionFullyActive(section.id);
                    const isToggling = updatingSection === section.id;

                    return (
                      <div
                        key={section.id}
                        className={`p-4 border rounded-lg transition-all ${
                          isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{section.label}</h4>
                              <Badge variant="outline" className="text-xs">
                                {active}/{total} activos
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{section.desc}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <Switch
                              checked={isActive}
                              disabled={isToggling}
                              onCheckedChange={(checked) =>
                                toggleSectionModules(section.id, checked)
                              }
                              className="data-[state=checked]:bg-green-600"
                            />
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {isToggling ? 'Procesando...' : isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: total > 0 ? `${(active / total) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Información
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • Al <strong>activar</strong> un módulo completo, se activan todas las páginas asociadas.
                  </p>
                  <p>
                    • Al <strong>desactivar</strong>, se desactivan todas las páginas del módulo y desaparecen del sidebar.
                  </p>
                  <p>
                    • Puedes ajustar páginas individuales en la pestaña &quot;Módulos Disponibles&quot;.
                  </p>
                  <p>
                    • Los cambios se reflejan inmediatamente en el sidebar de navegación.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Packs */}
            <TabsContent value="packs" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packs.map((pack) => (
                  <Card key={pack.tier} className="relative overflow-hidden">
                    <div
                      className={`h-2 ${
                        pack.tier === 'basico'
                          ? 'bg-blue-500'
                          : pack.tier === 'profesional'
                            ? 'bg-purple-500'
                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                      }`}
                    />
                    <CardHeader>
                      <CardTitle className="text-xl">{pack.nombre}</CardTitle>
                      <CardDescription>{pack.descripcion}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">€{pack.precioMensual}</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Usuarios:</span>
                          <span className="font-semibold">
                            {pack.maxUsuarios === -1 ? 'Ilimitados' : `Hasta ${pack.maxUsuarios}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Propiedades:</span>
                          <span className="font-semibold">
                            {pack.maxPropiedades === -1
                              ? 'Ilimitadas'
                              : `Hasta ${pack.maxPropiedades}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Módulos:</span>
                          <span className="font-semibold">{pack.modulosIncluidos.length}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-2">Características:</h4>
                        <ul className="space-y-1">
                          {pack.caracteristicas.slice(0, 6).map((feat, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Información sobre Packs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • Los <strong>módulos esenciales</strong> (Core) están siempre activos en todos
                    los planes.
                  </p>
                  <p>
                    • Puedes activar/desactivar módulos individualmente según las necesidades de tu
                    empresa.
                  </p>
                  <p>• Los módulos desactivados no aparecerán en el menú de navegación.</p>
                  <p>
                    • Algunos módulos tienen <strong>prerequisitos</strong> que deben estar activos
                    para funcionar correctamente.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </AuthenticatedLayout>
  );
}
