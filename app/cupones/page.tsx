'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Tag,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Percent,
  Euro,
  Calendar,
  Copy,
  TrendingUp,
} from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface Coupon {
  id: string;
  codigo: string;
  tipo: 'PERCENTAGE' | 'FIXED';
  valor: number;
  descripcion: string | null;
  usosMaximos: number | null;
  usosActuales: number;
  usosPorUsuario: number | null;
  montoMinimo: number | null;
  fechaInicio: string;
  fechaExpiracion: string;
  aplicaATodos: boolean;
  estado: string;
  activo: boolean;
  _count: {
    usos: number;
  };
}

export default function CuponesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete, isAdmin } = usePermissions();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    valor: '',
    descripcion: '',
    usosMaximos: '',
    usosPorUsuario: '',
    montoMinimo: '',
    fechaInicio: '',
    fechaExpiracion: '',
    aplicaATodos: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadCoupons();
    }
  }, [status]);

  // Update active filters
  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];

    if (searchTerm) {
      filters.push({ id: 'search', label: 'Búsqueda', value: searchTerm });
    }
    if (statusFilter !== 'all') {
      filters.push({ id: 'status', label: 'Estado', value: statusFilter });
    }

    setActiveFilters(filters);
  }, [searchTerm, statusFilter]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('estado', statusFilter);
      }

      const response = await fetch(`/api/coupons?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (error) {
      logger.error('Error loading coupons:', error);
      toast.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : '/api/coupons';
      const method = editingCoupon ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          usosMaximos: formData.usosMaximos ? parseInt(formData.usosMaximos) : null,
          usosPorUsuario: formData.usosPorUsuario ? parseInt(formData.usosPorUsuario) : null,
          montoMinimo: formData.montoMinimo ? parseFloat(formData.montoMinimo) : null,
        }),
      });

      if (response.ok) {
        toast.success(editingCoupon ? 'Cupón actualizado' : 'Cupón creado exitosamente');
        setOpenDialog(false);
        resetForm();
        loadCoupons();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al guardar cupón');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar cupón');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      codigo: coupon.codigo,
      tipo: coupon.tipo,
      valor: coupon.valor.toString(),
      descripcion: coupon.descripcion || '',
      usosMaximos: coupon.usosMaximos?.toString() || '',
      usosPorUsuario: coupon.usosPorUsuario?.toString() || '',
      montoMinimo: coupon.montoMinimo?.toString() || '',
      fechaInicio: coupon.fechaInicio.split('T')[0],
      fechaExpiracion: coupon.fechaExpiracion.split('T')[0],
      aplicaATodos: coupon.aplicaATodos,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;

    try {
      const response = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Cupón eliminado');
        loadCoupons();
      } else {
        toast.error('Error al eliminar cupón');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar cupón');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const action = coupon.activo ? 'deactivate' : 'reactivate';
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast.success(coupon.activo ? 'Cupón desactivado' : 'Cupón activado');
        loadCoupons();
      } else {
        toast.error('Error al cambiar estado');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      codigo: '',
      tipo: 'PERCENTAGE',
      valor: '',
      descripcion: '',
      usosMaximos: '',
      usosPorUsuario: '',
      montoMinimo: '',
      fechaInicio: '',
      fechaExpiracion: '',
      aplicaATodos: true,
    });
  };

  const clearFilter = (id: string) => {
    if (id === 'search') setSearchTerm('');
    if (id === 'status') setStatusFilter('all');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch =
        coupon.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coupon.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || coupon.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      activos: coupons.filter((c) => c.activo && c.estado === 'activo').length,
      expirados: coupons.filter((c) => c.estado === 'expirado').length,
      agotados: coupons.filter((c) => c.estado === 'agotado').length,
      totalUsos: coupons.reduce((sum, c) => sum + c.usosActuales, 0),
    };
  }, [coupons]);

  if (loading) {
    return <LoadingState message="Cargando cupones..." />;
  }

  const hasResults = filteredCoupons.length > 0;
  const hasNoData = coupons.length === 0;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cupones de Descuento</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cupones de Descuento</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona códigos promocionales y descuentos
              </p>
            </div>
          </div>
          {canCreate && (
            <Dialog
              open={openDialog}
              onOpenChange={(open) => {
                setOpenDialog(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gradient-primary shadow-primary">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nuevo Cupón</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="codigo">Código *</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) =>
                          setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                        }
                        placeholder="VERANO2024"
                        required
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo de Descuento *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tipo: value as 'PERCENTAGE' | 'FIXED' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                          <SelectItem value="FIXED">Cantidad Fija (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valor">Valor del Descuento *</Label>
                      <div className="relative">
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          min="0"
                          max={formData.tipo === 'PERCENTAGE' ? '100' : undefined}
                          value={formData.valor}
                          onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                          required
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {formData.tipo === 'PERCENTAGE' ? '%' : '€'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="montoMinimo">Monto Mínimo de Compra</Label>
                      <div className="relative">
                        <Input
                          id="montoMinimo"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.montoMinimo}
                          onChange={(e) =>
                            setFormData({ ...formData, montoMinimo: e.target.value })
                          }
                          placeholder="Sin mínimo"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          €
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descuento de verano 2024"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="usosMaximos">Usos Máximos Totales</Label>
                      <Input
                        id="usosMaximos"
                        type="number"
                        min="1"
                        value={formData.usosMaximos}
                        onChange={(e) => setFormData({ ...formData, usosMaximos: e.target.value })}
                        placeholder="Ilimitado"
                      />
                    </div>
                    <div>
                      <Label htmlFor="usosPorUsuario">Usos por Usuario</Label>
                      <Input
                        id="usosPorUsuario"
                        type="number"
                        min="1"
                        value={formData.usosPorUsuario}
                        onChange={(e) =>
                          setFormData({ ...formData, usosPorUsuario: e.target.value })
                        }
                        placeholder="Ilimitado"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                      <Input
                        id="fechaInicio"
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaExpiracion">Fecha de Expiración *</Label>
                      <Input
                        id="fechaExpiracion"
                        type="date"
                        value={formData.fechaExpiracion}
                        onChange={(e) =>
                          setFormData({ ...formData, fechaExpiracion: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="gradient-primary shadow-primary">
                      {editingCoupon ? 'Actualizar' : 'Crear'} Cupón
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cupones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Expirados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">{stats.expirados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Agotados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.agotados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Usos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.totalUsos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                  <SelectItem value="expirado">Expirados</SelectItem>
                  <SelectItem value="agotado">Agotados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeFilters.length > 0 && (
              <FilterChips
                filters={activeFilters}
                onRemove={clearFilter}
                onClearAll={clearAllFilters}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>

        {/* Coupons List or Empty State */}
        {hasNoData ? (
          <EmptyState
            icon={Tag}
            title="No hay cupones creados"
            description="Crea tu primer cupón de descuento para ofrecer promociones a tus clientes"
            action={
              canCreate
                ? {
                    label: 'Crear Primer Cupón',
                    onClick: () => setOpenDialog(true),
                    icon: <Plus className="h-4 w-4" />,
                  }
                : undefined
            }
          />
        ) : !hasResults ? (
          <EmptyState
            icon={Search}
            title="No se encontraron resultados"
            description="Intenta ajustar los filtros de búsqueda"
            action={{
              label: 'Limpiar búsqueda',
              onClick: clearAllFilters,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded">
                          {coupon.codigo}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(coupon.codigo)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {coupon.descripcion && (
                        <p className="text-sm text-gray-600 mb-2">{coupon.descripcion}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={coupon.activo ? 'default' : 'secondary'}>
                          {coupon.estado}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {coupon.tipo === 'PERCENTAGE' ? (
                            <>
                              <Percent className="h-3 w-3" /> {coupon.valor}%
                            </>
                          ) : (
                            <>
                              <Euro className="h-3 w-3" /> {coupon.valor}€
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    {(canUpdate || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(coupon)}>
                                {coupon.activo ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" /> Desactivar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(coupon.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Usos:</span>
                      <span className="font-medium">
                        {coupon.usosActuales} {coupon.usosMaximos ? `/ ${coupon.usosMaximos}` : ''}
                      </span>
                    </div>
                    {coupon.montoMinimo && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Compra mínima:</span>
                        <span className="font-medium">{coupon.montoMinimo}€</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vigencia:</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {format(new Date(coupon.fechaInicio), 'dd MMM', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500">
                          hasta{' '}
                          {format(new Date(coupon.fechaExpiracion), 'dd MMM yyyy', {
                            locale: es,
                          })}
                        </div>
                      </div>
                    </div>
                    {coupon._count.usos > 0 && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-1 text-indigo-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">{coupon._count.usos} usos registrados</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
