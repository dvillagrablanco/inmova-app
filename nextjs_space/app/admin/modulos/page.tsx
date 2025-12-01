'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
  Home, ArrowLeft, Package, CheckCircle, XCircle, AlertCircle,
  Building2, DollarSign, MessageSquare, TrendingUp, Shield, Users,
  Zap, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

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

const CATEGORIAS = {
  core: { nombre: 'Módulos Esenciales', icono: Package, color: 'bg-blue-100 text-blue-800' },
  gestion: { nombre: 'Gestión Básica', icono: Building2, color: 'bg-green-100 text-green-800' },
  financiero: { nombre: 'Financiero', icono: DollarSign, color: 'bg-purple-100 text-purple-800' },
  comunicacion: { nombre: 'Comunicación', icono: MessageSquare, color: 'bg-orange-100 text-orange-800' },
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
    } catch (error: any) {
      console.error('Error loading modules:', error);
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
        body: JSON.stringify({ moduloCodigo, activo })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al modificar módulo');
      }

      toast.success(activo ? 'Módulo activado' : 'Módulo desactivado');
      await loadData();
    } catch (error: any) {
      console.error('Error toggling module:', error);
      toast.error(error.message || 'Error al modificar módulo');
    } finally {
      setUpdating(null);
    }
  }

  function isModuleActive(codigo: string): boolean {
    const modulo = modulos.find(m => m.codigo === codigo);
    if (modulo?.esCore) return true; // Core siempre activo
    
    const companyModule = companyModules.find(cm => cm.moduloCodigo === codigo);
    return companyModule?.activo || false;
  }

  function getModulosByCategoria(categoria: string) {
    return modulos.filter(m => m.categoria === categoria);
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
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
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/configuracion')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="modulos" className="space-y-6">
            <TabsList>
              <TabsTrigger value="modulos">Módulos Disponibles</TabsTrigger>
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
                        {modulosCategoria.map(modulo => {
                          const activo = isModuleActive(modulo.codigo);
                          const isDisabled = modulo.esCore || updating === modulo.codigo;

                          return (
                            <div
                              key={modulo.codigo}
                              className={`p-4 border rounded-lg transition-all ${
                                activo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
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
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {modulo.descripcion}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <code className="bg-gray-100 px-2 py-1 rounded">{modulo.ruta}</code>
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
                                <div className="ml-4">
                                  <Switch
                                    checked={activo}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) => toggleModule(modulo.codigo, checked)}
                                  />
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

            {/* Tab de Packs */}
            <TabsContent value="packs" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packs.map(pack => (
                  <Card key={pack.tier} className="relative overflow-hidden">
                    <div className={`h-2 ${
                      pack.tier === 'basico' ? 'bg-blue-500' :
                      pack.tier === 'profesional' ? 'bg-purple-500' :
                      'bg-gradient-to-r from-orange-500 to-red-500'
                    }`} />
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
                            {pack.maxPropiedades === -1 ? 'Ilimitadas' : `Hasta ${pack.maxPropiedades}`}
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
                    • Los <strong>módulos esenciales</strong> (Core) están siempre activos en todos los planes.
                  </p>
                  <p>
                    • Puedes activar/desactivar módulos individualmente según las necesidades de tu empresa.
                  </p>
                  <p>
                    • Los módulos desactivados no aparecerán en el menú de navegación.
                  </p>
                  <p>
                    • Algunos módulos tienen <strong>prerequisitos</strong> que deben estar activos para funcionar correctamente.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
