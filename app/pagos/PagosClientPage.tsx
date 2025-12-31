'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  CreditCard,
  Plus,
  Calendar,
  Euro,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import logger from '@/lib/logger';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  monto: number;
  estado: string;
  fechaPago: string | Date | null;
  fechaVencimiento: string | Date;
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

interface PagosClientPageProps {
  initialPayments: Payment[];
  session: any;
}

export default function PagosClientPage({ initialPayments, session }: PagosClientPageProps) {
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>(initialPayments);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Apply search filter
  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.contract.tenant.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.contract.unit.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.contract.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  // Update active filters
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

  const handleDeleteClick = (payment: Payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/payments/${paymentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar el pago');
      }

      // Actualizar estado local
      setPayments((prev) => prev.filter((p) => p.id !== paymentToDelete.id));
      toast.success('Pago eliminado exitosamente');
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al eliminar';
      toast.error(errorMsg);
      logger.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'default';
      case 'pendiente':
        return 'secondary';
      case 'vencido':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <CheckCircle className="h-4 w-4" />;
      case 'pendiente':
        return <Clock className="h-4 w-4" />;
      case 'vencido':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getPaymentsByStatus = (status: string) => {
    return payments.filter((p) => p.estado === status).length;
  };

  const getTotalByStatus = (status: string) => {
    return payments
      .filter((p) => p.estado === status)
      .reduce((sum, p) => sum + Number(p.monto || 0), 0);
  };

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pagos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
              <p className="text-muted-foreground mt-2">Gestiona todos los pagos de alquiler</p>
            </div>
            {canCreate && (
              <Button onClick={() => router.push('/pagos/nuevo')}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Pago
              </Button>
            )}
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(payments.reduce((sum, p) => sum + Number(p.monto || 0), 0))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getPaymentsByStatus('pagado')}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(getTotalByStatus('pagado'))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getPaymentsByStatus('pendiente')}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(getTotalByStatus('pendiente'))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getPaymentsByStatus('vencido')}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(getTotalByStatus('vencido'))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por inquilino, unidad o edificio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {activeFilters.length > 0 && (
                  <FilterChips
                    filters={activeFilters}
                    onRemove={clearFilter}
                    onClearAll={clearAllFilters}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payments list */}
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-12 w-12" />}
              title="No hay pagos"
              description={
                activeFilters.length > 0
                  ? 'No se encontraron pagos con los filtros aplicados'
                  : 'Comienza registrando el primer pago'
              }
              actions={
                activeFilters.length > 0
                  ? [
                      {
                        label: 'Limpiar Filtros',
                        onClick: clearAllFilters,
                        variant: 'outline' as const,
                      },
                    ]
                  : canCreate
                    ? [
                        {
                          label: 'Registrar Pago',
                          onClick: () => router.push('/pagos/nuevo'),
                          variant: 'default' as const,
                        },
                      ]
                    : undefined
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => router.push(`/pagos/${payment.id}`)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          {getEstadoIcon(payment.estado)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{payment.contract.tenant.nombreCompleto}</p>
                            <Badge variant={getEstadoBadgeVariant(payment.estado)}>
                              {payment.estado}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {payment.contract.unit.building.nombre} - Unidad{' '}
                            {payment.contract.unit.numero}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {payment.periodo && <span>Período: {payment.periodo}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Vence: {formatDate(payment.fechaVencimiento)}
                            </span>
                            {payment.fechaPago && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Pagado: {formatDate(payment.fechaPago)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-semibold">{formatCurrency(payment.monto)}</p>
                          {payment.metodoPago && (
                            <p className="text-xs text-muted-foreground">{payment.metodoPago}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => router.push(`/pagos/${payment.id}/editar`)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(payment);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Pago"
        description={
          paymentToDelete
            ? `¿Estás seguro de que deseas eliminar el pago de ${formatCurrency(paymentToDelete.monto)} correspondiente a ${paymentToDelete.contract.tenant.nombreCompleto}?`
            : ''
        }
      />
    </div>
  );
}
