'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertTriangle,
  Search,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

// Interfaz para empresas disponibles
interface CompanyOption {
  id: string;
  nombre: string;
  activo: boolean;
  estadoCliente: string | null;
  subscriptionPlan: { nombre: string } | null;
  _count: { users: number; buildings: number };
}

interface CompanyComparison {
  id: string;
  nombre: string;
  activo: boolean;
  estadoCliente: string | null;
  createdAt: string;
  tags: string[];
  contactoPrincipal: string | null;
  emailContacto: string | null;
  subscriptionPlan: {
    id: string;
    nombre: string;
    precio: number;
  } | null;
  metrics: {
    users: number;
    buildings: number;
    tenants: number;
    providers: number;
    tasks: number;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
    activeContracts: number;
    monthlyRevenue: number;
    activeModules: number;
    recentActivity: number;
  };
  limits: {
    maxUsuarios: number | null;
    maxEdificios: number | null;
    maxPropiedades: number | null;
    userLimitUsage: number;
    buildingLimitUsage: number;
  };
  roleDistribution: Record<string, number>;
}

function CompareCompaniesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [companies, setCompanies] = useState<CompanyComparison[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el selector de empresas
  const [showSelector, setShowSelector] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Cargar empresas disponibles
  const loadAvailableCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch('/api/admin/companies?limit=100');
      if (res.ok) {
        const data = await res.json();
        setAvailableCompanies(data.companies || []);
      }
    } catch (error) {
      logger.error('Error cargando empresas:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        const ids = searchParams?.get('ids')?.split(',').filter(Boolean) || [];
        if (ids.length >= 2 && ids.length <= 4) {
          fetchComparison(ids);
        } else {
          // Mostrar selector si no hay IDs válidos
          setShowSelector(true);
          setLoading(false);
          loadAvailableCompanies();
        }
      }
    }
  }, [status, session, router, searchParams]);

  const handleSelectCompany = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked && selectedIds.size < 4) {
      newSelected.add(id);
    } else if (!checked) {
      newSelected.delete(id);
    } else {
      toast.error('Máximo 4 empresas para comparar');
    }
    setSelectedIds(newSelected);
  };

  const handleCompare = () => {
    if (selectedIds.size < 2) {
      toast.error('Selecciona al menos 2 empresas');
      return;
    }
    const idsParam = Array.from(selectedIds).join(',');
    router.push(`/admin/clientes/comparar?ids=${idsParam}`);
  };

  const filteredCompanies = availableCompanies.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchComparison = async (companyIds: string[]) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/companies/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds }),
      });

      if (!response.ok) throw new Error('Error al comparar empresas');
      const data = await response.json();
      setCompanies(data.companies);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al comparar empresas');
      router.push('/admin/clientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-600">Cargando comparación...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Mostrar selector de empresas si no hay IDs
  if (showSelector) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/clientes')}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Clientes
              </Button>
              <h1 className="text-3xl font-bold">Comparar Empresas</h1>
              <p className="text-muted-foreground mt-1">
                Selecciona entre 2 y 4 empresas para comparar sus métricas
              </p>
            </div>
            <Button
              onClick={handleCompare}
              disabled={selectedIds.size < 2}
              size="lg"
              className="gap-2"
            >
              <BarChart3 className="h-5 w-5" />
              Comparar ({selectedIds.size})
            </Button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {/* Selección actual */}
          {selectedIds.size > 0 && (
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">
                      {selectedIds.size} empresa{selectedIds.size !== 1 ? 's' : ''} seleccionada{selectedIds.size !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from(selectedIds).map(id => {
                      const company = availableCompanies.find(c => c.id === id);
                      return company ? (
                        <Badge key={id} variant="secondary" className="gap-1">
                          {company.nombre}
                          <button
                            onClick={() => handleSelectCompany(id, false)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de empresas */}
          {loadingCompanies ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  className={`cursor-pointer transition-all ${
                    selectedIds.has(company.id)
                      ? 'ring-2 ring-indigo-600 bg-indigo-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectCompany(company.id, !selectedIds.has(company.id))}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedIds.has(company.id)}
                          onCheckedChange={(checked) => handleSelectCompany(company.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <CardTitle className="text-lg">{company.nombre}</CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={company.activo ? 'default' : 'secondary'} className="text-xs">
                              {company.activo ? 'Activa' : 'Inactiva'}
                            </Badge>
                            {company.subscriptionPlan && (
                              <Badge variant="outline" className="text-xs">
                                {company.subscriptionPlan.nombre}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{company._count?.users || 0} usuarios</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{company._count?.buildings || 0} edificios</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredCompanies.length === 0 && !loadingCompanies && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No se encontraron empresas</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Intenta con otro término de búsqueda' : 'No hay empresas disponibles'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </AuthenticatedLayout>
    );
  }

  // Función para obtener la clase de grid según el número de columnas
  const getGridColsClass = (cols: number) => {
    const gridClasses: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
    };
    return gridClasses[cols] || 'grid-cols-3';
  };

  const ComparisonRow = ({
    label,
    icon,
    values,
    highlight = false,
  }: {
    label: string;
    icon?: React.ReactNode;
    values: (string | number | React.ReactNode)[];
    highlight?: boolean;
  }) => (
    <div
      className={`grid ${getGridColsClass(companies.length + 1)} gap-4 border-b border-gray-200 py-3 ${
        highlight ? 'bg-indigo-50' : ''
      }`}
    >
      <div className="flex items-center font-medium text-gray-700">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>
      {values.map((value, index) => (
        <div key={index} className="text-center">
          {typeof value === 'object' ? value : value}
        </div>
      ))}
    </div>
  );

  return (
    <AuthenticatedLayout>
          <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/clientes')}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Clientes
                </Button>
                <h1 className="text-3xl font-bold gradient-text">Comparador de Empresas</h1>
                <p className="text-gray-600 mt-1">
                  Comparando {companies.length} empresas lado a lado
                </p>
              </div>
            </div>

            {/* Company Headers */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className={`grid ${getGridColsClass(companies.length + 1)} gap-4`}>
                <div></div>
                {companies.map((company) => (
                  <Card key={company.id} className="border-t-4 border-t-indigo-600">
                    <CardHeader>
                      <CardTitle className="text-center">{company.nombre}</CardTitle>
                      <div className="flex flex-col items-center space-y-2 mt-2">
                        <Badge variant={company.activo ? 'default' : 'destructive'}>
                          {company.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                        {company.estadoCliente && (
                          <Badge variant="outline">{company.estadoCliente}</Badge>
                        )}
                        {company.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {company.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-0">
                  {/* Información Básica */}
                  <div className="text-lg font-semibold text-indigo-600 py-3 border-b-2 border-indigo-600">
                    Información Básica
                  </div>
                  <ComparisonRow
                    label="Fecha de Creación"
                    values={companies.map((c) =>
                      format(new Date(c.createdAt), "d 'de' MMMM, yyyy", {
                        locale: es,
                      })
                    )}
                  />
                  <ComparisonRow
                    label="Contacto Principal"
                    values={companies.map((c) => c.contactoPrincipal || '-')}
                  />
                  <ComparisonRow
                    label="Email Contacto"
                    values={companies.map((c) => c.emailContacto || '-')}
                  />
                  <ComparisonRow
                    label="Plan de Suscripción"
                    values={companies.map((c) =>
                      c.subscriptionPlan
                        ? `${c.subscriptionPlan.nombre} (€${c.subscriptionPlan.precio}/mes)`
                        : '-'
                    )}
                  />

                  {/* Métricas Principales */}
                  <div className="text-lg font-semibold text-indigo-600 py-3 border-b-2 border-indigo-600 mt-4">
                    Métricas Principales
                  </div>
                  <ComparisonRow
                    label="Usuarios"
                    icon={<Users className="h-4 w-4" />}
                    values={companies.map((c) => (
                      <div key={c.id}>
                        <div className="text-xl font-bold">{c.metrics.users}</div>
                        {c.limits.maxUsuarios && (
                          <div className="text-xs text-gray-500">
                            de {c.limits.maxUsuarios} ({c.limits.userLimitUsage.toFixed(0)}%)
                          </div>
                        )}
                      </div>
                    ))}
                    highlight
                  />
                  <ComparisonRow
                    label="Edificios"
                    icon={<Building2 className="h-4 w-4" />}
                    values={companies.map((c) => (
                      <div key={c.id}>
                        <div className="text-xl font-bold">{c.metrics.buildings}</div>
                        {c.limits.maxEdificios && (
                          <div className="text-xs text-gray-500">
                            de {c.limits.maxEdificios} ({c.limits.buildingLimitUsage.toFixed(0)}%)
                          </div>
                        )}
                      </div>
                    ))}
                    highlight
                  />
                  <ComparisonRow
                    label="Unidades Totales"
                    values={companies.map((c) => c.metrics.totalUnits)}
                  />
                  <ComparisonRow
                    label="Inquilinos"
                    values={companies.map((c) => c.metrics.tenants)}
                  />
                  <ComparisonRow
                    label="Proveedores"
                    values={companies.map((c) => c.metrics.providers)}
                  />
                  <ComparisonRow label="Tareas" values={companies.map((c) => c.metrics.tasks)} />

                  {/* Métricas de Operación */}
                  <div className="text-lg font-semibold text-indigo-600 py-3 border-b-2 border-indigo-600 mt-4">
                    Métricas de Operación
                  </div>
                  <ComparisonRow
                    label="Tasa de Ocupación"
                    icon={<TrendingUp className="h-4 w-4" />}
                    values={companies.map((c) => (
                      <div key={c.id}>
                        <div className="text-xl font-bold">
                          {c.metrics.occupancyRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {c.metrics.occupiedUnits} de {c.metrics.totalUnits}
                        </div>
                      </div>
                    ))}
                    highlight
                  />
                  <ComparisonRow
                    label="Contratos Activos"
                    values={companies.map((c) => c.metrics.activeContracts)}
                  />
                  <ComparisonRow
                    label="Ingresos Mensuales"
                    icon={<DollarSign className="h-4 w-4" />}
                    values={companies.map((c) => (
                      <div key={c.id} className="text-xl font-bold">
                        €{c.metrics.monthlyRevenue.toLocaleString('es-ES')}
                      </div>
                    ))}
                    highlight
                  />

                  {/* Actividad y Módulos */}
                  <div className="text-lg font-semibold text-indigo-600 py-3 border-b-2 border-indigo-600 mt-4">
                    Actividad y Módulos
                  </div>
                  <ComparisonRow
                    label="Módulos Activos"
                    values={companies.map((c) => c.metrics.activeModules)}
                  />
                  <ComparisonRow
                    label="Actividad Reciente (7 días)"
                    icon={<Activity className="h-4 w-4" />}
                    values={companies.map((c) => c.metrics.recentActivity)}
                  />

                  {/* Distribución de Roles */}
                  <div className="text-lg font-semibold text-indigo-600 py-3 border-b-2 border-indigo-600 mt-4">
                    Distribución de Roles
                  </div>
                  <ComparisonRow
                    label="Administradores"
                    values={companies.map((c) => c.roleDistribution['admin'] || 0)}
                  />
                  <ComparisonRow
                    label="Propietarios"
                    values={companies.map((c) => c.roleDistribution['propietario'] || 0)}
                  />
                  <ComparisonRow
                    label="Gestores"
                    values={companies.map((c) => c.roleDistribution['gestor'] || 0)}
                  />
                  <ComparisonRow
                    label="Otros"
                    values={companies.map((c) =>
                      Object.entries(c.roleDistribution)
                        .filter(([role]) => !['admin', 'propietario', 'gestor'].includes(role))
                        .reduce((sum, [, count]) => sum + count, 0)
                    )}
                  />

                  {/* Alertas de Límites */}
                  {companies.some(
                    (c) => c.limits.userLimitUsage > 80 || c.limits.buildingLimitUsage > 80
                  ) && (
                    <>
                      <div className="text-lg font-semibold text-orange-600 py-3 border-b-2 border-orange-600 mt-4">
                        Alertas
                      </div>
                      <ComparisonRow
                        label="Estado de Límites"
                        icon={<AlertTriangle className="h-4 w-4" />}
                        values={companies.map((c) => {
                          const warnings: string[] = [];
                          if (c.limits.userLimitUsage > 80) {
                            warnings.push('Usuarios');
                          }
                          if (c.limits.buildingLimitUsage > 80) {
                            warnings.push('Edificios');
                          }
                          return warnings.length > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {warnings.join(', ')} cerca del límite
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          );
                        })}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex justify-center space-x-4">
              {companies.map((company) => (
                <Button
                  key={company.id}
                  onClick={() => router.push(`/admin/clientes/${company.id}`)}
                  variant="outline"
                >
                  Ver {company.nombre}
                </Button>
              ))}
            </div>
          </div>
        </AuthenticatedLayout>
  );
}

export default function CompareCompaniesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando comparación...</p>
          </div>
        </div>
      }
    >
      <CompareCompaniesPageContent />
    </Suspense>
  );
}
