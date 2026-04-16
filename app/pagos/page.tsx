'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { ContextualQuickActions } from '@/components/navigation/contextual-quick-actions';

import {
  CreditCard,
  Plus,
  Calendar,
  Euro,
  Home,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ContextualHelp } from '@/components/ui/contextual-help';
import { helpData } from '@/lib/contextual-help-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';

function safeFmtDate(iso: string | Date | null | undefined, fmt: string = 'dd MMM yyyy'): string {
  try {
    if (!iso) return '—';
    const d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return format(d, fmt, { locale: es });
  } catch {
    return '—';
  }
}

import PaymentsDashboard from './components/PaymentsDashboard';
import { LoadingState } from '@/components/ui/loading-state';
import { SkeletonList, SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ExportCSVButton } from '@/components/ui/export-csv-button';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

interface Payment {
  id: string;
  monto: number;
  estado: string;
  fechaPago: string | null;
  fechaVencimiento: string;
  metodoPago?: string;
  periodo?: string;
  contract: {
    tenant: {
      nombreCompleto: string;
    };
    unit: {
      numero: string;
      building: {
        nombre: string;
      };
    };
  };
}

function PagosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate } = usePermissions();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stripe'>('list');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);

  // Initialize currentDate on client to avoid hydration errors
  useEffect(() => {
    if (!currentDate) {
      setCurrentDate(new Date());
    }
  }, [currentDate]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/payments?limit=500');
        if (response.ok) {
          const json = await response.json();
        const data = Array.isArray(json) ? json : (json.data || json.buildings || json.units || json.tenants || json.payments || json.requests || []);
          setPayments(data);
          setFilteredPayments(data);
        }
      } catch (error) {
        logger.error('Error fetching payments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchPayments();
    }
  }, [status]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = payments.filter(
        (payment) =>
          payment.contract.tenant.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.contract.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(payments);
    }
  }, [searchTerm, payments]);

  // Actualizar filtros activos
  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];

    if (searchTerm) {
      filters.push({
        id: 'search',
        label: 'Búsqueda',
        value: searchTerm,
      });
    }

    setActiveFilters(filters);
  }, [searchTerm]);

  const clearFilter = (id: string) => {
    if (id === 'search') {
      setSearchTerm('');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Skeleton for breadcrumbs */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-6 w-48" />
              </div>

              {/* Skeleton for header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>

              {/* Skeleton for tabs */}
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>

              {/* Skeleton for search */}
              <SkeletonCard showHeader={false} />

              {/* Skeleton for stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <SkeletonCard showHeader={true} lines={1} />
                <SkeletonCard showHeader={true} lines={1} />
                <SkeletonCard showHeader={true} lines={1} />
              </div>

              {/* Skeleton for payments list */}
              <SkeletonList items={3} />

              {/* Loading message */}
              <LoadingState message="Cargando pagos..." size="sm" />
            </div>
          </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  const getEstadoBadge = (estado: string | null | undefined) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> = {
      pagado: { variant: 'default', label: 'Pagado', icon: CheckCircle },
      pendiente: { variant: 'outline', label: 'Pendiente', icon: Clock },
      vencido: { variant: 'destructive', label: 'Vencido', icon: XCircle },
    };
    const key = (estado || '').toLowerCase();
    return badges[key] || { variant: 'default', label: estado || 'desconocido', icon: CreditCard };
  };

  const pagadosCount = (payments || []).filter((p) => (p?.estado || '').toLowerCase() === 'pagado').length;
  const pendientesCount = (payments || []).filter((p) => (p?.estado || '').toLowerCase() === 'pendiente').length;
  const vencidosCount = (payments || []).filter((p) => (p?.estado || '').toLowerCase() === 'vencido').length;
  const totalCobrado = (payments || [])
    .filter((p) => (p?.estado || '').toLowerCase() === 'pagado')
    .reduce((acc, p) => acc + Number(p?.monto || 0), 0);
  const totalPendiente = (payments || [])
    .filter((p) => (p?.estado || '').toLowerCase() === 'pendiente')
    .reduce((acc, p) => acc + Number(p?.monto || 0), 0);

  // Calendar logic
  const monthStart = currentDate ? startOfMonth(currentDate) : startOfMonth(new Date());
  const monthEnd = currentDate ? endOfMonth(currentDate) : endOfMonth(new Date());
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPaymentsForDay = (day: Date) => {
    return (payments || []).filter((payment) => {
      try {
        const iso = payment?.fechaPago || payment?.fechaVencimiento;
        if (!iso) return false;
        const paymentDate = new Date(iso);
        if (isNaN(paymentDate.getTime())) return false;
        return isSameDay(paymentDate, day);
      } catch {
        return false;
      }
    });
  };

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Smart Breadcrumbs */}
            <SmartBreadcrumbs
              totalCount={payments.length}
              showBackButton={true}
            />

            {/* Header Section con Quick Actions */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pagos</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Gestiona los pagos de alquileres
                  </p>
                </div>
                <ContextualHelp
                  module={helpData.pagos.module}
                  title={helpData.pagos.title}
                  description={helpData.pagos.description}
                  sections={helpData.pagos.sections}
                />
              </div>
              
              {/* View Mode + Quick Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Botones de vista */}
                <div className="flex rounded-lg border overflow-hidden">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0"
                  >
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="rounded-none border-0 border-l"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendario
                  </Button>
                  <Button
                    variant={viewMode === 'stripe' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('stripe')}
                    className="rounded-none border-0 border-l"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Stripe
                  </Button>
                </div>
                
                {/* Acciones rápidas */}
                <ContextualQuickActions
                  pendingPayments={payments.filter(p => p.estado === 'pendiente').length}
                  overduePayments={payments.filter(p => {
                    const isOverdue = new Date(p.fechaVencimiento) < new Date();
                    return p.estado === 'pendiente' && isOverdue;
                  }).length}
                />
              </div>
            </div>

            {/* Search Bar */}
            {viewMode === 'list' && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por inquilino o edificio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Active Filters */}
                <FilterChips
                  filters={activeFilters}
                  onRemove={clearFilter}
                  onClearAll={clearAllFilters}
                />
              </>
            )}

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pagados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{pagadosCount}</div>
                  <p className="text-xs text-muted-foreground">€{totalCobrado.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendientesCount}</div>
                  <p className="text-xs text-muted-foreground">
                    €{totalPendiente.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{vencidosCount}</div>
                  <p className="text-xs text-muted-foreground">Requieren acción</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total General</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{payments.length}</div>
                  <p className="text-xs text-muted-foreground">Registros</p>
                </CardContent>
              </Card>
            </div>

            {/* Export + Batch Actions */}
            {viewMode === 'list' && payments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <ExportCSVButton
                  data={payments.map(p => ({
                    inquilino: p.contract.tenant.nombreCompleto,
                    edificio: p.contract.unit.building.nombre,
                    unidad: p.contract.unit.numero,
                    monto: Number(p.monto),
                    estado: p.estado,
                    fechaVencimiento: p.fechaVencimiento,
                    fechaPago: p.fechaPago || '',
                    periodo: p.periodo || '',
                  }))}
                  filename="pagos"
                  columns={[
                    { key: 'inquilino', label: 'Inquilino' },
                    { key: 'edificio', label: 'Edificio' },
                    { key: 'unidad', label: 'Unidad' },
                    { key: 'monto', label: 'Importe' },
                    { key: 'estado', label: 'Estado' },
                    { key: 'fechaVencimiento', label: 'Vencimiento' },
                    { key: 'fechaPago', label: 'Fecha Pago' },
                    { key: 'periodo', label: 'Periodo' },
                  ]}
                />
                {pendientesCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const pendientes = (payments || []).filter(p => (p?.estado || '').toLowerCase() === 'pendiente').map(p => p.id);
                      if (pendientes.length === 0) return;
                      if (!confirm(`¿Marcar ${pendientes.length} pagos pendientes como cobrados?`)) return;
                      try {
                        const res = await fetch('/api/payments/batch-mark-paid', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ paymentIds: pendientes }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          toast.success(`${data.updated} pagos marcados como cobrados`);
                          setPayments(prev => prev.map(p => pendientes.includes(p.id) ? { ...p, estado: 'pagado', fechaPago: new Date().toISOString() } : p));
                        } else {
                          toast.error('Error al procesar cobro masivo');
                        }
                      } catch { toast.error('Error de conexión'); }
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Cobrar todos pendientes ({pendientesCount})
                  </Button>
                )}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {currentDate ? format(currentDate, 'MMMM yyyy', { locale: es }) : ''}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const date = currentDate || new Date();
                          setCurrentDate(new Date(date.getFullYear(), date.getMonth() - 1));
                        }}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const date = currentDate || new Date();
                          setCurrentDate(new Date(date.getFullYear(), date.getMonth() + 1));
                        }}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-muted-foreground p-2"
                      >
                        {day}
                      </div>
                    ))}
                    {daysInMonth.map((day, index) => {
                      const dayPayments = getPaymentsForDay(day);
                      const hasPayments = dayPayments.length > 0;
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div
                          key={index}
                          className={`min-h-[80px] rounded-lg border p-2 transition-colors ${
                            isToday ? 'border-primary bg-primary/5' : 'border-border'
                          } ${hasPayments ? 'cursor-pointer hover:bg-muted' : ''}`}
                        >
                          <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          {dayPayments.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {dayPayments.slice(0, 2).map((payment) => {
                                const badge = getEstadoBadge(payment.estado);
                                return (
                                  <div
                                    key={payment.id}
                                    className="text-xs p-1 rounded truncate"
                                    style={{
                                      backgroundColor:
                                        (payment.estado || '').toLowerCase() === 'pagado'
                                          ? 'rgb(220, 252, 231)'
                                          : (payment.estado || '').toLowerCase() === 'vencido'
                                            ? 'rgb(254, 226, 226)'
                                            : 'rgb(254, 249, 195)',
                                    }}
                                  >
                                    €{payment.monto}
                                  </div>
                                );
                              })}
                              {dayPayments.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayPayments.length - 2} más
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="grid gap-4">
                {filteredPayments.map((payment) => {
                  const estadoBadge = getEstadoBadge(payment.estado);
                  const IconComponent = estadoBadge.icon;

                  return (
                    <Card key={payment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="space-y-2 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <AvatarInitials name={payment.contract.tenant.nombreCompleto} size="sm" />
                                  <h3 className="text-base sm:text-lg font-semibold break-words">
                                    {payment.contract.tenant.nombreCompleto}
                                  </h3>
                                  <Badge
                                    variant={estadoBadge.variant}
                                    className="flex items-center gap-1"
                                  >
                                    <IconComponent className="h-3 w-3" />
                                    {estadoBadge.label}
                                  </Badge>
                                </div>
                                <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded-md">
                                  <Home className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                  <span className="break-words">
                                    {payment.contract.unit.building.nombre} - Unidad{' '}
                                    {payment.contract.unit.numero}
                                  </span>
                                </div>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-xl sm:text-2xl font-bold text-green-600">
                                  €{Number(payment.monto || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Fecha Vencimiento</p>
                                <p className="text-sm font-medium">
                                  {safeFmtDate(payment.fechaVencimiento)}
                                </p>
                              </div>
                              {payment.fechaPago && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Fecha Pago</p>
                                  <p className="text-sm font-medium">
                                    {safeFmtDate(payment.fechaPago)}
                                  </p>
                                </div>
                              )}
                              {payment.metodoPago && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Método</p>
                                  <p className="text-sm font-medium capitalize">
                                    {payment.metodoPago}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() => router.push(`/pagos/${payment.id}`)}
                                variant="outline"
                                size="sm"
                              >
                                Ver Detalles
                              </Button>
                              {(payment.estado || '').toLowerCase() === 'pendiente' && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const res = await fetch(`/api/payments/${payment.id}/mark-paid`, { method: 'POST' });
                                      if (res.ok) {
                                        toast.success('Pago marcado como cobrado');
                                        setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, estado: 'pagado', fechaPago: new Date().toISOString() } : p));
                                      } else {
                                        const data = await res.json();
                                        toast.error(data.error || 'Error al marcar pago');
                                      }
                                    } catch {
                                      toast.error('Error de conexión');
                                    }
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Marcar Cobrado
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Stripe Dashboard */}
            {viewMode === 'stripe' && <PaymentsDashboard />}

            {filteredPayments.length === 0 &&
              viewMode === 'list' &&
              (searchTerm ? (
                <EmptyState
                  icon={<Search className="h-16 w-16 text-gray-400" />}
                  title="No se encontraron resultados"
                  description={`No hay pagos que coincidan con "${searchTerm}"`}
                  action={{
                    label: 'Limpiar búsqueda',
                    onClick: () => setSearchTerm(''),
                  }}
                />
              ) : (
                <EmptyState
                  icon={<CreditCard className="h-16 w-16 text-gray-400" />}
                  title="No hay pagos registrados"
                  description="Los pagos aparecerán aquí cuando se registren contratos"
                />
              ))}
          </div>
        </AuthenticatedLayout>
  );
}

export default function PagosPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <PagosPage />
    </ErrorBoundary>
  );
}
