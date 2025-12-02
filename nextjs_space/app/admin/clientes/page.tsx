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
  Check, X, Settings, CreditCard
} from 'lucide-react';

import { InfoTooltip } from '@/components/ui/info-tooltip';
import { BackButton } from '@/components/ui/back-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingState } from '@/components/ui/loading-state';
import { ChangePlanDialog } from '@/components/admin/ChangePlanDialog';

interface CompanyData {
  id: string;
  nombre: string;
  activo: boolean;
  estadoCliente: string;
  dominioPersonalizado: string | null;
  contactoPrincipal: string | null;
  emailContacto: string | null;
  parentCompanyId?: string | null;
  category?: string | null;
  subscriptionPlan: {
    id: string;
    nombre: string;
    tier: string;
    precioMensual: number;
  } | null;
  parentCompany?: {
    id: string;
    nombre: string;
  } | null;
  childCompanies?: {
    id: string;
    nombre: string;
    estadoCliente: string;
  }[];
  createdAt: string;
  _count: {
    users: number;
    buildings: number;
    tenants: number;
    childCompanies?: number;
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
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyData[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Nuevos estados para filtros y selección múltiple
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'cards'>('cards');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Estado para diálogo de cambio de plan
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [selectedCompanyForPlanChange, setSelectedCompanyForPlanChange] = useState<CompanyData | null>(null);
  
  const [newCompany, setNewCompany] = useState({
    nombre: '',
    email: '',
    contactoPrincipal: '',
    emailContacto: '',
    telefonoContacto: '',
    dominioPersonalizado: '',
    subscriptionPlanId: '',
    estadoCliente: 'activo',
    parentCompanyId: '', // Para grupos de empresas
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

    // Aplicar filtro de categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
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
  }, [searchQuery, companies, statusFilter, planFilter, categoryFilter, sortBy, sortOrder]);

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
      
      // Preparar datos, quitando campos vacíos
      const companyData = {
        ...newCompany,
        subscriptionPlanId: newCompany.subscriptionPlanId || undefined,
        parentCompanyId: newCompany.parentCompanyId || undefined,
        dominioPersonalizado: newCompany.dominioPersonalizado || undefined,
        contactoPrincipal: newCompany.contactoPrincipal || undefined,
        telefonoContacto: newCompany.telefonoContacto || undefined,
      };
      
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
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
          parentCompanyId: '',
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

  const getCategoryBadge = (category: string | null | undefined) => {
    if (!category) return null;
    
    const categoryConfig: Record<string, { icon: string; label: string; className: string }> = {
      enterprise: { icon: '🏢', label: 'Enterprise', className: 'bg-purple-100 text-purple-800 border-purple-300' },
      pyme: { icon: '🏪', label: 'PYME', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      startup: { icon: '🚀', label: 'Startup', className: 'bg-green-100 text-green-800 border-green-300' },
      trial: { icon: '⏱️', label: 'Trial', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      premium: { icon: '⭐', label: 'Premium', className: 'bg-orange-100 text-orange-800 border-orange-300' },
      standard: { icon: '📦', label: 'Standard', className: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    
    const config = categoryConfig[category] || { icon: '📦', label: category, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const handleChangeCategory = async (companyId: string, newCategory: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/category`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: newCategory }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar la categoría');
      }

      toast.success('Categoría actualizada correctamente');
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al cambiar la categoría', {
        description: error.message,
      });
    }
  };

  // Función para abrir el diálogo de cambio de plan
  const handleOpenChangePlan = (company: CompanyData) => {
    setSelectedCompanyForPlanChange(company);
    setShowChangePlanDialog(true);
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
      Creada: new Date(c.createdAt).toLocaleDateString('es-ES'),
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    link.download = `empresas_${dateStr}.csv`;
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
    return <LoadingState message="Cargando datos de empresas..." fullScreen />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4">
                <BackButton fallbackUrl="/dashboard" />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
                  <p className="text-muted-foreground mt-1">
                    Administra todas las empresas y sus configuraciones
                  </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-5 h-5" />
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
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                            <InfoTooltip content="Nombre comercial o razón social de la empresa cliente que aparecerá en toda la plataforma." />
                          </div>
                          <Input
                            id="nombre"
                            value={newCompany.nombre}
                            onChange={e => setNewCompany({ ...newCompany, nombre: e.target.value })}
                            placeholder="Ej: Inmobiliaria XYZ"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="email">Email Corporativo</Label>
                            <InfoTooltip content="Email principal de la empresa. Se usará para comunicaciones oficiales y facturación." />
                          </div>
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
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="dominioPersonalizado">Dominio Personalizado</Label>
                            <InfoTooltip content="URL personalizada para el portal de la empresa. Ejemplo: miempresa.inmova.com. Debe ser único." />
                          </div>
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
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="plan">Plan de Suscripción</Label>
                            <InfoTooltip content="Define los módulos y funcionalidades disponibles para la empresa. Puedes cambiarlo más adelante." />
                          </div>
                          <Select
                            value={newCompany.subscriptionPlanId || "none"}
                            onValueChange={value => setNewCompany({ ...newCompany, subscriptionPlanId: value === "none" ? "" : value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin plan</SelectItem>
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

                      {/* Grupo de Empresas */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label htmlFor="parentCompany">Empresa Matriz (Opcional)</Label>
                          <InfoTooltip content="Crea grupos empresariales vinculando empresas. Útil para cadenas hoteleras, franquicias o grupos inmobiliarios. Las empresas vinculadas pueden compartir recursos y reportes consolidados." />
                        </div>
                        <Select
                          value={newCompany.parentCompanyId || "none"}
                          onValueChange={value => setNewCompany({ ...newCompany, parentCompanyId: value === "none" ? "" : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sin empresa matriz (independiente)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Independiente</SelectItem>
                            {companies.filter(c => !c.parentCompanyId).map(company => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.nombre}
                                {company._count?.childCompanies ? ` (${company._count.childCompanies} empresas en el grupo)` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          💡 Deja en "Independiente" para empresas sin relación jerárquica. Selecciona una empresa matriz para crear o unirse a un grupo empresarial.
                        </p>
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
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, contacto o dominio..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros y Vista */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-base">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros y Vista
                    </CardTitle>
                    {/* Seleccionar todos */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="select-all"
                          checked={filteredCompanies.length > 0 && selectedCompanies.size === filteredCompanies.length}
                          onCheckedChange={toggleSelectAll}
                        />
                        <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                          Seleccionar todas ({filteredCompanies.length})
                        </Label>
                      </div>
                      {selectedCompanies.size > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedCompanies.size} seleccionada{selectedCompanies.size > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-sm">Estado</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="activo">✅ Activos</SelectItem>
                          <SelectItem value="suspendido">⏸️ Suspendidos</SelectItem>
                          <SelectItem value="prueba">🔬 En Prueba</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Categoría</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="enterprise">🏢 Enterprise</SelectItem>
                          <SelectItem value="pyme">🏪 PYME</SelectItem>
                          <SelectItem value="startup">🚀 Startup</SelectItem>
                          <SelectItem value="trial">⏱️ Trial</SelectItem>
                          <SelectItem value="premium">⭐ Premium</SelectItem>
                          <SelectItem value="standard">📦 Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Plan</Label>
                      <Select value={planFilter} onValueChange={setPlanFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {plans.map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Ordenar por</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nombre">Nombre</SelectItem>
                          <SelectItem value="createdAt">Fecha creación</SelectItem>
                          <SelectItem value="usuarios">Nº Usuarios</SelectItem>
                          <SelectItem value="edificios">Nº Edificios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Vista</Label>
                      <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cards">📋 Tarjetas</SelectItem>
                          <SelectItem value="grid">🔲 Cuadrícula</SelectItem>
                          <SelectItem value="table">📊 Lista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Menú de Bulk Actions */}
            {selectedCompanies.size > 0 && (
              <Card className="mb-6 border-primary shadow-lg">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">
                        {selectedCompanies.size} empresa{selectedCompanies.size > 1 ? 's' : ''} seleccionada{selectedCompanies.size > 1 ? 's' : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCompanies(new Set())}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Limpiar selección
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('activate')}
                        disabled={bulkActionLoading}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        Activar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={bulkActionLoading}
                      >
                        <PowerOff className="w-4 h-4 mr-2" />
                        Desactivar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Más acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleBulkAction('changePlan')}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Cambiar plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleBulkAction('delete')}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Empresas */}
            {filteredCompanies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No se encontraron empresas' : 'No hay empresas registradas'}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              /* Vista de Tabla */
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-3 text-left">
                            <Checkbox 
                              checked={filteredCompanies.length > 0 && selectedCompanies.size === filteredCompanies.length}
                              onCheckedChange={toggleSelectAll}
                            />
                          </th>
                          <th className="p-3 text-left font-semibold">Empresa</th>
                          <th className="p-3 text-left font-semibold">Estado</th>
                          <th className="p-3 text-left font-semibold">Categoría</th>
                          <th className="p-3 text-left font-semibold">Plan</th>
                          <th className="p-3 text-left font-semibold">Usuarios</th>
                          <th className="p-3 text-left font-semibold">Edificios</th>
                          <th className="p-3 text-left font-semibold">Inquilinos</th>
                          <th className="p-3 text-right font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompanies.map(company => (
                          <tr 
                            key={company.id} 
                            className={`border-b hover:bg-muted/30 transition-colors ${
                              selectedCompanies.has(company.id) ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="p-3">
                              <Checkbox 
                                checked={selectedCompanies.has(company.id)}
                                onCheckedChange={() => toggleCompanySelection(company.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{company.nombre}</div>
                                {company.emailContacto && (
                                  <div className="text-sm text-muted-foreground">{company.emailContacto}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {getEstadoBadge(company.estadoCliente)}
                            </td>
                            <td className="p-3">
                              {getCategoryBadge(company.category)}
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                {company.subscriptionPlan ? (
                                  <>
                                    <div className="font-medium">{company.subscriptionPlan.nombre}</div>
                                    <div className="text-muted-foreground">
                                      {company.subscriptionPlan.precioMensual}€/mes
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">Sin plan</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{company._count.users}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span>{company._count.buildings}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{company._count.tenants}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleImpersonate(company.id, company.nombre)}
                                  title="Login como empresa"
                                >
                                  <LogIn className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/admin/clientes/${company.id}`)}
                                  title="Ver detalles"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleCopyId(company.id)}>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copiar ID
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenChangePlan(company)}>
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Cambiar Plan
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleToggleActive(company.id, company.activo)}
                                      className={company.activo ? 'text-yellow-600' : 'text-green-600'}
                                    >
                                      {company.activo ? (
                                        <>
                                          <PowerOff className="w-4 h-4 mr-2" />
                                          Desactivar
                                        </>
                                      ) : (
                                        <>
                                          <Power className="w-4 h-4 mr-2" />
                                          Activar
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteCompany(company.id, company.nombre)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Vista de Tarjetas */
              <div className="grid gap-4">
                {filteredCompanies.map(company => (
                  <Card 
                    key={company.id} 
                    className={`hover:shadow-lg transition-all ${
                      selectedCompanies.has(company.id) ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {/* Checkbox de selección */}
                        <div className="pt-1">
                          <Checkbox 
                            id={`select-${company.id}`}
                            checked={selectedCompanies.has(company.id)}
                            onCheckedChange={() => toggleCompanySelection(company.id)}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <CardTitle className="text-xl">{company.nombre}</CardTitle>
                            {getEstadoBadge(company.estadoCliente)}
                            {getCategoryBadge(company.category)}
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/clientes/${company.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver y Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyId(company.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar ID
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleImpersonate(company.id, company.nombre)}>
                                <LogIn className="w-4 h-4 mr-2" />
                                Login como...
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenChangePlan(company)}>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Cambiar Plan
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {/* Submenu para cambiar categoría */}
                              <div className="px-2 py-1.5 text-sm font-semibold">Cambiar Categoría</div>
                              <DropdownMenuItem onClick={() => handleChangeCategory(company.id, 'enterprise')}>
                                <span className="mr-2">🏢</span>Enterprise
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeCategory(company.id, 'pyme')}>
                                <span className="mr-2">🏪</span>PYME
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeCategory(company.id, 'startup')}>
                                <span className="mr-2">🚀</span>Startup
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeCategory(company.id, 'trial')}>
                                <span className="mr-2">⏱️</span>Trial
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeCategory(company.id, 'premium')}>
                                <span className="mr-2">⭐</span>Premium
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeCategory(company.id, 'standard')}>
                                <span className="mr-2">📦</span>Standard
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleQuickToggleActive(company.id, company.activo, company.nombre)}
                                className={company.activo ? 'text-yellow-600' : 'text-green-600'}
                              >
                                {company.activo ? (
                                  <>
                                    <PowerOff className="w-4 h-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Power className="w-4 h-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteCompany(company.id, company.nombre)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/admin/clientes/${company.id}`)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Jerarquía de Grupo */}
                        {(company.parentCompany || (company._count?.childCompanies && company._count.childCompanies > 0)) && (
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                            <Building2 className="w-4 h-4 text-primary" />
                            {company.parentCompany ? (
                              <span className="text-sm">
                                <span className="text-muted-foreground">Parte del grupo:</span>{' '}
                                <span className="font-medium">{company.parentCompany.nombre}</span>
                              </span>
                            ) : (
                              <span className="text-sm">
                                <span className="font-medium">Empresa Matriz</span> - {company._count.childCompanies} empresas en el grupo
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Estadísticas */}
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
                            Creada: {new Date(company.createdAt).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>

                        {/* Empresas Hijas - Lista expandible */}
                        {company.childCompanies && company.childCompanies.length > 0 && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-md">
                            <div className="text-sm font-medium mb-2">Empresas del Grupo:</div>
                            <div className="flex flex-wrap gap-2">
                              {company.childCompanies.map(child => (
                                <Badge key={child.id} variant="outline" className="flex items-center gap-1">
                                  {child.nombre}
                                  {child.estadoCliente === 'activo' ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Change Plan Dialog */}
      {selectedCompanyForPlanChange && (
        <ChangePlanDialog
          open={showChangePlanDialog}
          onOpenChange={setShowChangePlanDialog}
          company={selectedCompanyForPlanChange}
          onSuccess={loadData}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}