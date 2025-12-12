'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/lazy-tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Users,
  TrendingUp,
  Save,
  AlertCircle,
  CheckCircle2,
  Palette,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';


interface CompanyDetail {
  id: string;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estadoCliente: string;
  dominioPersonalizado: string | null;
  contactoPrincipal: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  notasAdmin: string | null;
  maxUsuarios: number | null;
  maxPropiedades: number | null;
  maxEdificios: number | null;
  activo: boolean;
  subscriptionPlanId: string | null;
  subscriptionPlan: {
    id: string;
    nombre: string;
    tier: string;
  } | null;
  createdAt: string;
  _count: {
    users: number;
    buildings: number;
    tenants: number;
    contracts: number;
  };
  companyModules: {
    id: string;
    moduloCodigo: string;
    activo: boolean;
  }[];
}

interface SubscriptionPlan {
  id: string;
  nombre: string;
  tier: string;
  precioMensual: number;
  modulosIncluidos: string[];
}

interface Stats {
  contadores: {
    usuarios: number;
    edificios: number;
    unidades: number;
    inquilinos: number;
    contratos: number;
    contratosActivos: number;
  };
  pagos: {
    ingresosMesActual: number;
    pagosPendientesMes: number;
  };
  ocupacion: {
    tasaOcupacion: number;
  };
  limites: {
    usuarios: { actual: number; maximo: number; porcentaje: number };
    propiedades: { actual: number; maximo: number; porcentaje: number };
    edificios: { actual: number; maximo: number; porcentaje: number };
  };
}

export default function ClienteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [formData, setFormData] = useState<Partial<CompanyDetail>>({});

  // Redirect si no está autenticado o no es super_admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
      toast.error('Acceso denegado');
    }
  }, [status, session, router]);

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'super_admin' && params?.id) {
      loadData();
    }
  }, [status, session, params?.id]);

  const loadData = async () => {
    if (!params?.id) return;

    try {
      setLoading(true);

      // Cargar empresa
      const companyRes = await fetch(`/api/admin/companies/${params.id}`);
      if (companyRes.ok) {
        const data = await companyRes.json();
        setCompany(data);
        setFormData(data);
      }

      // Cargar estadísticas
      const statsRes = await fetch(`/api/admin/companies/${params.id}/stats`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Cargar planes
      const plansRes = await fetch('/api/admin/subscription-plans');
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data);
      }
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!params?.id) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/companies/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Cambios guardados exitosamente');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar cambios');
      }
    } catch (error) {
      logger.error('Error saving:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const getLimiteBadge = (actual: number, maximo: number, porcentaje: number) => {
    if (porcentaje >= 90) {
      return <Badge className="bg-red-500">Crítico {porcentaje}%</Badge>;
    } else if (porcentaje >= 70) {
      return <Badge className="bg-yellow-500">Advertencia {porcentaje}%</Badge>;
    } else {
      return <Badge className="bg-green-500">OK {porcentaje}%</Badge>;
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Empresa no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/clientes')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Clientes
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">{company.nombre}</h1>
                    <Badge
                      className={
                        company.estadoCliente === 'activo' ? 'bg-green-500' : 'bg-yellow-500'
                      }
                    >
                      {company.estadoCliente}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Cliente desde{' '}
                    {format(new Date(company.createdAt), 'dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>

            {/* KPIs */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.contadores.usuarios}</div>
                    {stats.limites.usuarios.maximo > 0 && (
                      <div className="mt-2">
                        {getLimiteBadge(
                          stats.limites.usuarios.actual,
                          stats.limites.usuarios.maximo,
                          stats.limites.usuarios.porcentaje
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Edificios</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.contadores.edificios}</div>
                    {stats.limites.edificios.maximo > 0 && (
                      <div className="mt-2">
                        {getLimiteBadge(
                          stats.limites.edificios.actual,
                          stats.limites.edificios.maximo,
                          stats.limites.edificios.porcentaje
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inquilinos</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.contadores.inquilinos}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ocupación: {stats.ocupacion.tasaOcupacion}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.pagos.ingresosMesActual.toFixed(0)}€
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {stats.pagos.pagosPendientesMes} pagos pendientes
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información General</TabsTrigger>
                <TabsTrigger value="plan">Plan y Módulos</TabsTrigger>
                <TabsTrigger value="branding">Personalización</TabsTrigger>
              </TabsList>

              {/* Información General */}
              <TabsContent value="info" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Datos de la Empresa</CardTitle>
                    <CardDescription>Información básica y configuración</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre de la Empresa</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre || ''}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cif">CIF/NIF</Label>
                        <Input
                          id="cif"
                          value={formData.cif || ''}
                          onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Corporativo</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono || ''}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion || ''}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contacto Principal</CardTitle>
                    <CardDescription>Persona de contacto de la empresa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactoPrincipal">Nombre del Contacto</Label>
                        <Input
                          id="contactoPrincipal"
                          value={formData.contactoPrincipal || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, contactoPrincipal: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailContacto">Email de Contacto</Label>
                        <Input
                          id="emailContacto"
                          type="email"
                          value={formData.emailContacto || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, emailContacto: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="telefonoContacto">Teléfono de Contacto</Label>
                      <Input
                        id="telefonoContacto"
                        value={formData.telefonoContacto || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, telefonoContacto: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Cliente</CardTitle>
                    <CardDescription>Estado y dominio personalizado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estadoCliente">Estado del Cliente</Label>
                        <Select
                          value={formData.estadoCliente || 'activo'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, estadoCliente: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="prueba">Prueba</SelectItem>
                            <SelectItem value="suspendido">Suspendido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dominioPersonalizado">Dominio Personalizado</Label>
                        <Input
                          id="dominioPersonalizado"
                          value={formData.dominioPersonalizado || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, dominioPersonalizado: e.target.value })
                          }
                          placeholder="cliente.inmova.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notasAdmin">Notas del Administrador</Label>
                      <Textarea
                        id="notasAdmin"
                        value={formData.notasAdmin || ''}
                        onChange={(e) => setFormData({ ...formData, notasAdmin: e.target.value })}
                        placeholder="Notas internas sobre el cliente..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="activo"
                        checked={formData.activo !== undefined ? formData.activo : true}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                      />
                      <Label htmlFor="activo">Empresa Activa</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Plan y Módulos */}
              <TabsContent value="plan" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Plan de Suscripción</CardTitle>
                    <CardDescription>Asigna o cambia el plan del cliente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subscriptionPlanId">Plan Actual</Label>
                      <Select
                        value={formData.subscriptionPlanId || ''}
                        onValueChange={(value) =>
                          setFormData({ ...formData, subscriptionPlanId: value || null })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-plan">Sin plan</SelectItem>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.nombre} ({plan.tier}) - {plan.precioMensual}€/mes
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="maxUsuarios">Límite de Usuarios</Label>
                        <Input
                          id="maxUsuarios"
                          type="number"
                          value={formData.maxUsuarios || 5}
                          onChange={(e) =>
                            setFormData({ ...formData, maxUsuarios: parseInt(e.target.value) || 5 })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxPropiedades">Límite de Propiedades</Label>
                        <Input
                          id="maxPropiedades"
                          type="number"
                          value={formData.maxPropiedades || 10}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxPropiedades: parseInt(e.target.value) || 10,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxEdificios">Límite de Edificios</Label>
                        <Input
                          id="maxEdificios"
                          type="number"
                          value={formData.maxEdificios || 5}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxEdificios: parseInt(e.target.value) || 5,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Módulos Activos</CardTitle>
                    <CardDescription>
                      {company.companyModules.filter((m) => m.activo).length} módulos activos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {company.companyModules.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay módulos configurados</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {company.companyModules.map((module) => (
                            <Badge
                              key={module.id}
                              variant={module.activo ? 'default' : 'outline'}
                              className={module.activo ? 'bg-green-500' : ''}
                            >
                              {module.moduloCodigo}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personalización */}
              <TabsContent value="branding" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personalización de Marca</CardTitle>
                    <CardDescription>
                      Configura los colores, logo y aspecto de la aplicación para este cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-12 border-2 border-dashed rounded-lg">
                      <div className="text-center">
                        <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          La personalización de marca se gestiona en la sección
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => router.push('/admin/personalizacion')}
                        >
                          Ir a Personalización
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">
                          Allí podrás configurar colores, logos, tipografías y más
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
