'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  Download,
  CheckSquare,
  Square,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  FlaskConical,
  Sparkles,
  Filter,
  Home,
  Briefcase,
  Plane,
  Store,
  UserCircle,
} from 'lucide-react';

import { BackButton } from '@/components/ui/back-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingState } from '@/components/ui/loading-state';
import { ChangePlanDialog } from '@/components/admin/ChangePlanDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Custom hooks
import { useCompanies } from '@/lib/hooks/admin/useCompanies';
import { useCompanyFilters } from '@/lib/hooks/admin/useCompanyFilters';

// Components
import { FilterBar } from '@/components/admin/clientes/FilterBar';
import { CompanyCard } from '@/components/admin/clientes/CompanyCard';

export default function ClientesAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Custom hooks
  const {
    companies,
    plans,
    loading,
    fetchCompanies,
    createCompany,
    deleteCompany,
    updateCategory,
  } = useCompanies();

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    categoryFilter,
    setCategoryFilter,
    demoFilter,
    setDemoFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredCompanies,
  } = useCompanyFilters(companies);

  // UI State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [selectedCompanyForPlanChange, setSelectedCompanyForPlanChange] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<{ id: string; nombre: string } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk operations state
  const [showBulkPlanDialog, setShowBulkPlanDialog] = useState(false);
  const [bulkPlanId, setBulkPlanId] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Form state
  const [newCompany, setNewCompany] = useState({
    nombre: '',
    emailContacto: '',
    contactoPrincipal: '',
    telefonoContacto: '',
    dominioPersonalizado: '',
    subscriptionPlanId: '',
    estadoCliente: 'activo',
    parentCompanyId: '',
    esEmpresaPrueba: false, // Empresa de demo
    generarDatosEjemplo: false, // Generar datos de ejemplo automáticamente
    escenarioDemo: 'gestor_residencial', // Escenario de demo por defecto
  });

  // Escenarios de demo disponibles
  const DEMO_SCENARIOS = [
    { 
      id: 'gestor_residencial', 
      nombre: 'Gestor de Alquileres', 
      descripcion: 'Gestores profesionales con múltiples edificios y contratos',
      icon: Building2,
      color: 'blue'
    },
    { 
      id: 'propietario_particular', 
      nombre: 'Propietario Particular', 
      descripcion: 'Propietarios con 1-5 propiedades',
      icon: Home,
      color: 'green'
    },
    { 
      id: 'agencia_inmobiliaria', 
      nombre: 'Agencia Inmobiliaria', 
      descripcion: 'Agencia con CRM, leads y cartera de propiedades',
      icon: Briefcase,
      color: 'purple'
    },
    { 
      id: 'coliving', 
      nombre: 'Operador Coliving', 
      descripcion: 'Espacios coliving con habitaciones y comunidad',
      icon: Users,
      color: 'pink'
    },
    { 
      id: 'alquiler_turistico', 
      nombre: 'Alquiler Turístico', 
      descripcion: 'Apartamentos turísticos con reservas y calendario',
      icon: Plane,
      color: 'orange'
    },
    { 
      id: 'comercial_oficinas', 
      nombre: 'Locales y Oficinas', 
      descripcion: 'Espacios comerciales y oficinas',
      icon: Store,
      color: 'slate'
    },
    { 
      id: 'comunidad_propietarios', 
      nombre: 'Comunidad de Propietarios', 
      descripcion: 'Administración de fincas y comunidades',
      icon: Building2,
      color: 'teal'
    },
    { 
      id: 'inversor_inmobiliario', 
      nombre: 'Inversor Inmobiliario', 
      descripcion: 'Portfolio diversificado con análisis de rentabilidad',
      icon: TrendingUp,
      color: 'emerald'
    },
    { 
      id: 'completo', 
      nombre: 'Demo Completa', 
      descripcion: 'Todos los módulos y tipos de propiedades',
      icon: Sparkles,
      color: 'indigo'
    },
  ];
  
  // Filter for demo companies
  const [showDemoOnly, setShowDemoOnly] = useState<boolean | null>(null); // null = all, true = demo only, false = real only

  // Authentication check
  if (status === 'loading') {
    return <LoadingState message="Cargando..." />;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Authorization check - Only super_admin can access this page
  const userRole = (session?.user as any)?.role;
  if (userRole !== 'super_admin') {
    router.push('/unauthorized');
    return null;
  }

  // Handlers
  const handleCreateCompany = async () => {
    if (!newCompany.nombre || !newCompany.emailContacto) {
      toast.error('Nombre y email de contacto son requeridos');
      return;
    }

    if (!newCompany.subscriptionPlanId) {
      toast.error('Debe seleccionar un plan de suscripción');
      return;
    }

    try {
      setCreating(true);
      const createdCompany = await createCompany(newCompany);
      
      // Si es empresa de demo y se solicitó generar datos de ejemplo
      if (newCompany.esEmpresaPrueba && newCompany.generarDatosEjemplo && createdCompany?.id) {
        const selectedScenario = DEMO_SCENARIOS.find(s => s.id === newCompany.escenarioDemo);
        toast.info(`Generando datos de ejemplo: ${selectedScenario?.nombre || 'Demo'}...`);
        try {
          const res = await fetch('/api/admin/companies/generate-demo-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              companyId: createdCompany.id,
              scenario: newCompany.escenarioDemo 
            }),
          });
          if (res.ok) {
            const result = await res.json();
            toast.success(`Escenario "${result.scenario?.nombre}" generado: ${result.summary?.buildings} edificios, ${result.summary?.units} unidades, ${result.summary?.tenants} inquilinos`);
            await fetchCompanies();
          } else {
            toast.warning('Empresa creada, pero hubo un error generando datos de ejemplo');
          }
        } catch (e) {
          toast.warning('Empresa creada, pero hubo un error generando datos de ejemplo');
        }
      }
      
      setShowCreateDialog(false);
      setNewCompany({
        nombre: '',
        emailContacto: '',
        contactoPrincipal: '',
        telefonoContacto: '',
        dominioPersonalizado: '',
        subscriptionPlanId: '',
        estadoCliente: 'activo',
        parentCompanyId: '',
        esEmpresaPrueba: false,
        generarDatosEjemplo: false,
        escenarioDemo: 'gestor_residencial',
      });
    } catch (error) {
      // Error ya manejado en el hook
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deletingCompany) return;

    try {
      setIsDeleting(true);
      await deleteCompany(deletingCompany.id);
      setShowDeleteDialog(false);
      setDeletingCompany(null);
    } catch (error) {
      // Error ya manejado en el hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectCompany = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCompanies);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCompanies(newSelected);
  };

  const handleLoginAsCompany = async (companyId: string) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });

      if (!res.ok) throw new Error('Error al iniciar sesión');

      const data = await res.json();
      toast.success(`Accediendo como ${data.companyName}...`);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error) {
      toast.error('Error al acceder como cliente');
    }
  };

  // Bulk operations
  const handleBulkActivate = async () => {
    if (selectedCompanies.size === 0) {
      toast.error('Selecciona al menos una empresa');
      return;
    }

    try {
      setIsBulkProcessing(true);
      const res = await fetch('/api/admin/companies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          companyIds: Array.from(selectedCompanies),
        }),
      });

      if (!res.ok) throw new Error('Error al activar empresas');

      toast.success(`${selectedCompanies.size} empresas activadas correctamente`);
      setSelectedCompanies(new Set());
      await fetchCompanies();
    } catch (error) {
      toast.error('Error al activar empresas');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCompanies.size === 0) {
      toast.error('Selecciona al menos una empresa');
      return;
    }

    try {
      setIsBulkProcessing(true);
      const res = await fetch('/api/admin/companies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          companyIds: Array.from(selectedCompanies),
        }),
      });

      if (!res.ok) throw new Error('Error al desactivar empresas');

      toast.success(`${selectedCompanies.size} empresas desactivadas correctamente`);
      setSelectedCompanies(new Set());
      await fetchCompanies();
    } catch (error) {
      toast.error('Error al desactivar empresas');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkChangePlan = async () => {
    if (selectedCompanies.size === 0) {
      toast.error('Selecciona al menos una empresa');
      return;
    }

    if (!bulkPlanId) {
      toast.error('Selecciona un plan');
      return;
    }

    try {
      setIsBulkProcessing(true);
      const res = await fetch('/api/admin/companies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePlan',
          companyIds: Array.from(selectedCompanies),
          subscriptionPlanId: bulkPlanId,
        }),
      });

      if (!res.ok) throw new Error('Error al cambiar planes');

      toast.success(`Plan actualizado para ${selectedCompanies.size} empresas`);
      setSelectedCompanies(new Set());
      setShowBulkPlanDialog(false);
      setBulkPlanId('');
      await fetchCompanies();
    } catch (error) {
      toast.error('Error al cambiar planes');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const headers = [
        'ID',
        'Nombre',
        'Email',
        'Contacto',
        'Plan',
        'Precio Mensual',
        'Estado',
        'Activo',
        'Categoría',
        'Edificios',
        'Usuarios',
        'Inquilinos',
        'Fecha Creación',
      ];

      const rows = filteredCompanies.map((c) => [
        c.id,
        c.nombre,
        c.emailContacto || '',
        c.contactoPrincipal || '',
        c.subscriptionPlan?.nombre || '',
        c.subscriptionPlan?.precioMensual || '',
        c.estadoCliente || '',
        c.activo ? 'Sí' : 'No',
        c.category || '',
        c._count?.buildings || 0,
        c._count?.users || 0,
        c._count?.tenants || 0,
        new Date(c.createdAt).toLocaleDateString('es-ES'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `inmova-clientes-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Datos exportados correctamente');
    } catch (error) {
      toast.error('Error al exportar datos');
    }
  };

  const handleSelectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map((c) => c.id)));
    }
  };

  return (
    <ErrorBoundary>
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <BackButton />
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1">
                Administra todas las empresas y sus suscripciones
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Empresa</DialogTitle>
                  <DialogDescription>
                    Complete los datos de la nueva empresa cliente
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                      <Input
                        id="nombre"
                        value={newCompany.nombre}
                        onChange={(e) => setNewCompany({ ...newCompany, nombre: e.target.value })}
                        placeholder="Ej: Gestora Inmobiliaria SA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailContacto">Email de Contacto *</Label>
                      <Input
                        id="emailContacto"
                        type="email"
                        value={newCompany.emailContacto}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, emailContacto: e.target.value })
                        }
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactoPrincipal">Contacto Principal</Label>
                      <Input
                        id="contactoPrincipal"
                        value={newCompany.contactoPrincipal}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, contactoPrincipal: e.target.value })
                        }
                        placeholder="Juan Pérez"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefonoContacto">Teléfono</Label>
                      <Input
                        id="telefonoContacto"
                        value={newCompany.telefonoContacto}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, telefonoContacto: e.target.value })
                        }
                        placeholder="+34 600 123 456"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlanId">Plan de Suscripción *</Label>
                    <Select
                      value={newCompany.subscriptionPlanId}
                      onValueChange={(value) =>
                        setNewCompany({ ...newCompany, subscriptionPlanId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.nombre} - €{plan.precioMensual}/mes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dominioPersonalizado">Dominio Personalizado</Label>
                    <Input
                      id="dominioPersonalizado"
                      value={newCompany.dominioPersonalizado}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, dominioPersonalizado: e.target.value })
                      }
                      placeholder="miempresa.inmovaapp.com"
                    />
                  </div>
                  
                  {/* Sección de Empresa Demo */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <FlaskConical className="h-5 w-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">Opciones de Demo</h4>
                    </div>
                    
                    <div className="space-y-4 bg-amber-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="esEmpresaPrueba" className="text-base">
                            Empresa de Demo
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Las empresas de demo no afectan a las estadísticas reales de la plataforma
                          </p>
                        </div>
                        <Switch
                          id="esEmpresaPrueba"
                          checked={newCompany.esEmpresaPrueba}
                          onCheckedChange={(checked) =>
                            setNewCompany({ ...newCompany, esEmpresaPrueba: checked })
                          }
                        />
                      </div>
                      
                      {newCompany.esEmpresaPrueba && (
                        <>
                          <div className="flex items-center justify-between border-t border-amber-200 pt-4">
                            <div className="space-y-0.5">
                              <Label htmlFor="generarDatosEjemplo" className="text-base flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-600" />
                                Generar Datos de Ejemplo
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Crea automáticamente edificios, unidades, inquilinos y contratos de ejemplo
                              </p>
                            </div>
                            <Switch
                              id="generarDatosEjemplo"
                              checked={newCompany.generarDatosEjemplo}
                              onCheckedChange={(checked) =>
                                setNewCompany({ ...newCompany, generarDatosEjemplo: checked })
                              }
                            />
                          </div>

                          {/* Selector de Escenario de Demo */}
                          {newCompany.generarDatosEjemplo && (
                            <div className="border-t border-amber-200 pt-4 mt-4">
                              <Label className="text-base font-medium mb-3 block">
                                Escenario de Demo
                              </Label>
                              <p className="text-sm text-muted-foreground mb-4">
                                Selecciona el tipo de cliente para generar datos específicos y relevantes
                              </p>
                              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                                {DEMO_SCENARIOS.map((scenario) => {
                                  const ScenarioIcon = scenario.icon;
                                  const isSelected = newCompany.escenarioDemo === scenario.id;
                                  
                                  const colorClasses: Record<string, string> = {
                                    blue: 'bg-blue-50 border-blue-300 ring-blue-500',
                                    green: 'bg-green-50 border-green-300 ring-green-500',
                                    purple: 'bg-purple-50 border-purple-300 ring-purple-500',
                                    pink: 'bg-pink-50 border-pink-300 ring-pink-500',
                                    orange: 'bg-orange-50 border-orange-300 ring-orange-500',
                                    slate: 'bg-slate-50 border-slate-300 ring-slate-500',
                                    teal: 'bg-teal-50 border-teal-300 ring-teal-500',
                                    emerald: 'bg-emerald-50 border-emerald-300 ring-emerald-500',
                                    indigo: 'bg-indigo-50 border-indigo-300 ring-indigo-500',
                                  };
                                  
                                  const iconColorClasses: Record<string, string> = {
                                    blue: 'text-blue-600',
                                    green: 'text-green-600',
                                    purple: 'text-purple-600',
                                    pink: 'text-pink-600',
                                    orange: 'text-orange-600',
                                    slate: 'text-slate-600',
                                    teal: 'text-teal-600',
                                    emerald: 'text-emerald-600',
                                    indigo: 'text-indigo-600',
                                  };

                                  return (
                                    <div
                                      key={scenario.id}
                                      onClick={() => setNewCompany({ ...newCompany, escenarioDemo: scenario.id })}
                                      className={`
                                        flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer
                                        transition-all duration-200 hover:shadow-md
                                        ${isSelected 
                                          ? `${colorClasses[scenario.color]} ring-2` 
                                          : 'bg-white border-gray-200 hover:border-gray-300'
                                        }
                                      `}
                                    >
                                      <div className={`p-2 rounded-lg ${isSelected ? colorClasses[scenario.color] : 'bg-gray-100'}`}>
                                        <ScenarioIcon className={`h-5 w-5 ${isSelected ? iconColorClasses[scenario.color] : 'text-gray-600'}`} />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{scenario.nombre}</div>
                                        <div className="text-xs text-gray-500">{scenario.descripcion}</div>
                                      </div>
                                      {isSelected && (
                                        <div className={`h-2 w-2 rounded-full ${iconColorClasses[scenario.color].replace('text-', 'bg-')}`} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCompany} disabled={creating}>
                    {creating ? 'Creando...' : 'Crear Empresa'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-indigo-600" />
                  <div>
                    <div className="text-3xl font-bold">{companies.length}</div>
                    <p className="text-xs text-gray-500">Empresas registradas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-3xl font-bold">
                      {companies.filter((c) => c.activo).length}
                    </div>
                    <p className="text-xs text-gray-500">Con suscripción activa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Propiedades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-3xl font-bold">
                      {companies.reduce((sum, c) => sum + (c._count?.buildings || 0), 0)}
                    </div>
                    <p className="text-xs text-gray-500">Inmuebles gestionados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            planFilter={planFilter}
            onPlanFilterChange={setPlanFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            demoFilter={demoFilter}
            onDemoFilterChange={setDemoFilter}
            plans={plans}
            onRefresh={fetchCompanies}
          />

          {/* Bulk Actions Bar */}
          {filteredCompanies.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleSelectAll} className="gap-2">
                      {selectedCompanies.size === filteredCompanies.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      Seleccionar Todo
                    </Button>

                    {selectedCompanies.size > 0 && (
                      <>
                        <span className="text-sm text-gray-600">
                          {selectedCompanies.size} seleccionada
                          {selectedCompanies.size !== 1 ? 's' : ''}
                        </span>

                        <div className="h-6 w-px bg-gray-300" />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkActivate}
                          disabled={isBulkProcessing}
                          className="gap-2"
                        >
                          <ToggleRight className="h-4 w-4 text-green-600" />
                          Activar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkDeactivate}
                          disabled={isBulkProcessing}
                          className="gap-2"
                        >
                          <ToggleLeft className="h-4 w-4 text-gray-600" />
                          Desactivar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkPlanDialog(true)}
                          disabled={isBulkProcessing}
                          className="gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Cambiar Plan
                        </Button>
                      </>
                    )}
                  </div>

                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Companies Grid */}
          {loading ? (
            <LoadingState message="Cargando clientes..." />
          ) : filteredCompanies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron clientes
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== 'all' || planFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza creando tu primera empresa cliente'}
                </p>
                {!searchQuery && statusFilter === 'all' && planFilter === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Empresa
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isSelected={selectedCompanies.has(company.id)}
                  onSelect={handleSelectCompany}
                  onView={(c) => router.push(`/admin/clientes/${c.id}`)}
                  onEdit={(c) => router.push(`/admin/clientes/${c.id}/editar`)}
                  onDelete={(c) => {
                    setDeletingCompany({ id: c.id, nombre: c.nombre });
                    setShowDeleteDialog(true);
                  }}
                  onChangePlan={(c) => {
                    setSelectedCompanyForPlanChange(c);
                    setShowChangePlanDialog(true);
                  }}
                  onLoginAs={handleLoginAsCompany}
                />
              ))}
            </div>
          )}
        </div>
      </AuthenticatedLayout>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteCompany}
        title="¿Eliminar empresa?"
        description={`¿Estás seguro de que deseas eliminar "${deletingCompany?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
        loading={isDeleting}
        variant="destructive"
      />

      {/* Change Plan Dialog */}
      {selectedCompanyForPlanChange && (
        <ChangePlanDialog
          open={showChangePlanDialog}
          onOpenChange={setShowChangePlanDialog}
          company={selectedCompanyForPlanChange}
          onSuccess={() => {
            fetchCompanies();
            setShowChangePlanDialog(false);
            setSelectedCompanyForPlanChange(null);
          }}
        />
      )}

      {/* Bulk Change Plan Dialog */}
      <Dialog open={showBulkPlanDialog} onOpenChange={setShowBulkPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Plan en Lote</DialogTitle>
            <DialogDescription>
              Cambiar el plan de suscripción para {selectedCompanies.size} empresa
              {selectedCompanies.size !== 1 ? 's' : ''} seleccionada
              {selectedCompanies.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkPlan">Nuevo Plan de Suscripción *</Label>
              <Select value={bulkPlanId} onValueChange={setBulkPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nombre} - €{plan.precioMensual}/mes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkPlanDialog(false);
                setBulkPlanId('');
              }}
              disabled={isBulkProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleBulkChangePlan} disabled={isBulkProcessing || !bulkPlanId}>
              {isBulkProcessing ? 'Procesando...' : 'Cambiar Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
