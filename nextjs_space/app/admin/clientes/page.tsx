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
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Building2, Users, TrendingUp, Plus, Search, Eye, Trash2, AlertCircle, CheckCircle2,
  LogIn, Copy, ExternalLink, MoreVertical, Filter, Download, RefreshCw, Power, PowerOff,
  Check, X, Settings
} from 'lucide-react';
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
  
  // Nuevos estados para filtros y selección múltiple
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
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

  // Filtrar, ordenar y buscar empresas
  useEffect(() => {
    let filtered = [...companies];

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.nombre.toLowerCase().includes(query) ||
          c.emailContacto?.toLowerCase().includes(query) ||
          c.contactoPrincipal?.toLowerCase().includes(query) ||
          c.dominioPersonalizado?.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.estadoCliente === statusFilter);
    }

    // Aplicar filtro de plan
    if (planFilter !== 'all') {
      filtered = filtered.filter(c => c.subscriptionPlan?.id === planFilter);
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'usuarios':
          comparison = a._count.users - b._count.users;
          break;
        case 'edificios':
          comparison = a._count.buildings - b._count.buildings;
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCompanies(filtered);
  }, [searchQuery, companies, statusFilter, planFilter, sortBy, sortOrder]);

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

  // Función para "Login como" empresa
  const handleImpersonate = async (companyId: string, companyName: string) => {
    if (!confirm(`¿Deseas acceder al dashboard de "${companyName}"?\n\nEstarás navegando como esta empresa.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        // Redirigir al dashboard con el contexto de la empresa
        // Nota: En un sistema real, aquí se actualizaría la sesión
        router.push(`/dashboard?impersonating=${companyId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al iniciar impersonation');
      }
    } catch (error) {
      console.error('Error impersonating:', error);
      toast.error('Error al iniciar impersonation');
    }
  };

  // Función para copiar ID de empresa
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('ID copiado al portapapeles');
  };

  // Función para alternar selección de empresa
  const toggleCompanySelection = (companyId: string) => {
    const newSelection = new Set(selectedCompanies);
    if (newSelection.has(companyId)) {
      newSelection.delete(companyId);
    } else {
      newSelection.add(companyId);
    }
    setSelectedCompanies(newSelection);
  };

  // Función para seleccionar/deseleccionar todas
  const toggleSelectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map(c => c.id)));
    }
  };

  // Función para operaciones en lote
  const handleBulkAction = async (action: string, params?: any) => {
    if (selectedCompanies.size === 0) {
      toast.error('No hay empresas seleccionadas');
      return;
    }

    const companyIds = Array.from(selectedCompanies);
    
    if (!confirm(`¿Estás seguro de aplicar esta acción a ${companyIds.length} empresa(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      
      const response = await fetch('/api/admin/companies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          companyIds,
          ...params,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedCompanies(new Set());
        setShowBulkActions(false);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error en operación en lote');
      }
    } catch (error) {
      console.error('Error en bulk action:', error);
      toast.error('Error en operación en lote');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Función para exportar datos
  const handleExport = () => {
    const csvData = filteredCompanies.map(c => ({
      ID: c.id,
      Nombre: c.nombre,
      Estado: c.estadoCliente,
      Contacto: c.contactoPrincipal || '',
      Email: c.emailContacto || '',
      Usuarios: c._count.users,
      Edificios: c._count.buildings,
      Inquilinos: c._count.tenants,
      Plan: c.subscriptionPlan?.nombre || 'Sin plan',
      Creada: format(new Date(c.createdAt), 'dd/MM/yyyy'),
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `empresas_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    
    toast.success('Datos exportados correctamente');
  };

  // Función para toggle rápido de activación
  const handleQuickToggleActive = async (companyId: string, currentState: boolean, nombre: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !currentState }),
      });

      if (response.ok) {
        toast.success(`Empresa "${nombre}" ${!currentState ? 'activada' : 'desactivada'}`);
        loadData();
      } else {
        toast.error('Error al cambiar estado');
      }
    } catch (error) {
      toast.error('Error al cambiar estado');
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