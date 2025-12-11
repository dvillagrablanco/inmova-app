'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        const ids = searchParams?.get('ids')?.split(',') || [];
        if (ids.length < 2 || ids.length > 4) {
          toast.error('Debe seleccionar entre 2 y 4 empresas para comparar');
          router.push('/admin/clientes');
          return;
        }
        fetchComparison(ids);
      }
    }
  }, [status, session, router, searchParams]);

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
      <div className="flex h-screen items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando comparación...</p>
        </div>
      </div>
    );
  }

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
      className={`grid grid-cols-${companies.length + 1} gap-4 border-b border-gray-200 py-3 ${
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
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
              <div className={`grid grid-cols-${companies.length + 1} gap-4`}>
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
                      <div>
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
                      <div>
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
                      <div>
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
                      <div className="text-xl font-bold">
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
        </main>
      </div>
    </div>
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
