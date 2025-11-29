'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Users, TrendingUp, Plus, Search, Eye, Edit, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Company {
  id: string;
  nombre: string;
  estadoCliente: string;
  dominioPersonalizado: string | null;
  contactoPrincipal: string | null;
  emailContacto: string | null;
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
  };
}

interface SubscriptionPlan {
  id: string;
  nombre: string;
  tier: string;
  precioMensual: number;
}

export default function ClientesAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newCompany, setNewCompany] = useState({
    nombre: '',
    email: '',
    contactoPrincipal: '',
    emailContacto: '',
    telefonoContacto: '',
    dominioPersonalizado: '',
    subscriptionPlanId: '',
    estadoCliente: 'activo',
  });

  // Redirect si no está autenticado o no es super_admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
      toast.error('Acceso denegado. Se requiere rol de Super Administrador');
    }
  }, [status, session, router]);

  // Cargar empresas y planes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'super_admin') {
      loadData();
    }
  }, [status, session]);

  // Filtrar empresas por búsqueda
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = companies.filter(
        c =>
          c.nombre.toLowerCase().includes(query) ||
          c.emailContacto?.toLowerCase().includes(query) ||
          c.contactoPrincipal?.toLowerCase().includes(query) ||
          c.dominioPersonalizado?.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchQuery, companies]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar empresas
      const companiesRes = await fetch('/api/admin/companies');
      if (companiesRes.ok) {
        const data = await companiesRes.json();
        setCompanies(data);
        setFilteredCompanies(data);
      }
      
      // Cargar planes de suscripción
      const plansRes = await fetch('/api/admin/subscription-plans');
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.nombre || !newCompany.emailContacto) {
      toast.error('Nombre y email de contacto son requeridos');
      return;
    }

    try {
      setCreating(true);
      
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      });

      if (response.ok) {
        toast.success('Empresa creada exitosamente');
        setShowCreateDialog(false);
        setNewCompany({
          nombre: '',
          email: '',
          contactoPrincipal: '',
          emailContacto: '',
          telefonoContacto: '',
          dominioPersonalizado: '',
          subscriptionPlanId: '',
          estadoCliente: 'activo',
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear empresa');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Error al crear empresa');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCompany = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la empresa "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/companies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Empresa eliminada exitosamente');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar empresa');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Error al eliminar empresa');
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'suspendido':
        return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" />Suspendido</Badge>;
      case 'prueba':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Prueba</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basico':
        return 'text-blue-600';
      case 'profesional':
        return 'text-purple-600';
      case 'empresarial':
        return 'text-orange-600';
      case 'personalizado':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
                  <p className="text-muted-foreground mt-1">
                    Administra todas las empresas y sus configuraciones
                  </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Nueva Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Empresa</DialogTitle>
                      <DialogDescription>
                        Configura la nueva empresa y asigna un plan de suscripción
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                          <Input
                            id="nombre"
                            value={newCompany.nombre}
                            onChange={e => setNewCompany({ ...newCompany, nombre: e.target.value })}
                            placeholder="Ej: Inmobiliaria XYZ"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Corporativo</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCompany.email}
                            onChange={e => setNewCompany({ ...newCompany, email: e.target.value })}
                            placeholder="info@empresa.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactoPrincipal">Contacto Principal</Label>
                          <Input
                            id="contactoPrincipal"
                            value={newCompany.contactoPrincipal}
                            onChange={e => setNewCompany({ ...newCompany, contactoPrincipal: e.target.value })}
                            placeholder="Juan Pérez"
                          />
                        </div>
                        <div>
                          <Label htmlFor="emailContacto">Email de Contacto *</Label>
                          <Input
                            id="emailContacto"
                            type="email"
                            value={newCompany.emailContacto}
                            onChange={e => setNewCompany({ ...newCompany, emailContacto: e.target.value })}
                            placeholder="contacto@empresa.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="telefonoContacto">Teléfono</Label>
                          <Input
                            id="telefonoContacto"
                            value={newCompany.telefonoContacto}
                            onChange={e => setNewCompany({ ...newCompany, telefonoContacto: e.target.value })}
                            placeholder="+34 600 000 000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dominioPersonalizado">Dominio Personalizado</Label>
                          <Input
                            id="dominioPersonalizado"
                            value={newCompany.dominioPersonalizado}
                            onChange={e => setNewCompany({ ...newCompany, dominioPersonalizado: e.target.value })}
                            placeholder="cliente.inmova.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="plan">Plan de Suscripción</Label>
                          <Select
                            value={newCompany.subscriptionPlanId}
                            onValueChange={value => setNewCompany({ ...newCompany, subscriptionPlanId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sin plan</SelectItem>
                              {plans.map(plan => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.nombre} - {plan.precioMensual}€/mes
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="estadoCliente">Estado</Label>
                          <Select
                            value={newCompany.estadoCliente}
                            onValueChange={value => setNewCompany({ ...newCompany, estadoCliente: value })}
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
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateCompany} disabled={creating}>
                        {creating ? 'Creando...' : 'Crear Empresa'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* KPIs */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companies.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {companies.filter(c => c.estadoCliente === 'activo').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {companies.reduce((sum, c) => sum + c._count.users, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, contacto o dominio..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Lista de Empresas */}
            <div className="grid gap-4">
              {filteredCompanies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No se encontraron empresas' : 'No hay empresas registradas'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCompanies.map(company => (
                  <Card key={company.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{company.nombre}</CardTitle>
                            {getEstadoBadge(company.estadoCliente)}
                          </div>
                          <CardDescription>
                            <div className="grid gap-1 text-sm">
                              {company.contactoPrincipal && (
                                <div>
                                  <span className="font-medium">Contacto:</span> {company.contactoPrincipal}
                                </div>
                              )}
                              {company.emailContacto && (
                                <div>
                                  <span className="font-medium">Email:</span> {company.emailContacto}
                                </div>
                              )}
                              {company.dominioPersonalizado && (
                                <div>
                                  <span className="font-medium">Dominio:</span> {company.dominioPersonalizado}
                                </div>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/clientes/${company.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id, company.nombre)}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{company._count.users} usuarios</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{company._count.buildings} edificios</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span>{company._count.tenants} inquilinos</span>
                        </div>
                        {company.subscriptionPlan && (
                          <div className="ml-auto">
                            <span className="text-muted-foreground">Plan: </span>
                            <span className={`font-semibold ${getTierColor(company.subscriptionPlan.tier)}`}>
                              {company.subscriptionPlan.nombre}
                            </span>
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Creada: {format(new Date(company.createdAt), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}