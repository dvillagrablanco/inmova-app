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

  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];
    if (searchTerm) filters.push({ id: 'search', label: 'Búsqueda', value: searchTerm });
    if (statusFilter !== 'all')
      filters.push({ id: 'status', label: 'Estado', value: statusFilter });
    setActiveFilters(filters);
  }, [searchTerm, statusFilter]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await fetch(`/api/coupons?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      } else {
        toast.error('Error al cargar cupones');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading coupons'), {
        context: 'loadCoupons',
      });
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

      const payload = {
        codigo: formData.codigo,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descripcion: formData.descripcion || null,
        usosMaximos: formData.usosMaximos ? parseInt(formData.usosMaximos) : null,
        usosPorUsuario: formData.usosPorUsuario ? parseInt(formData.usosPorUsuario) : null,
        montoMinimo: formData.montoMinimo ? parseFloat(formData.montoMinimo) : null,
        fechaInicio: formData.fechaInicio,
        fechaExpiracion: formData.fechaExpiracion,
        aplicaATodos: formData.aplicaATodos,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingCoupon ? 'Cupón actualizado' : 'Cupón creado correctamente');
        setOpenDialog(false);
        resetForm();
        loadCoupons();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al guardar cupón');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error saving coupon'), {
        context: 'handleSubmit',
      });
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
    if (!confirm('¿Está seguro de eliminar este cupón?')) return;

    try {
      const response = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Cupón eliminado correctamente');
        loadCoupons();
      } else {
        toast.error('Error al eliminar cupón');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error deleting coupon'), {
        context: 'handleDelete',
        couponId: id,
      });
      toast.error('Error al eliminar cupón');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const action = coupon.activo ? 'deactivate' : 'reactivate';
      const response = await fetch(`/api/coupons/${coupon.id}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(
          coupon.activo ? 'Cupón desactivado correctamente' : 'Cupón reactivado correctamente'
        );
        loadCoupons();
      } else {
        toast.error('Error al cambiar estado del cupón');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error toggling coupon status'), {
        context: 'handleToggleStatus',
        couponId: coupon.id,
      });
      toast.error('Error al cambiar estado');
    }
  };

  const resetForm = () => {
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
    setEditingCoupon(null);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
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
        (coupon.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesSearch;
    });
  }, [coupons, searchTerm]);

  const stats = useMemo(() => {
    const activeCoupons = coupons.filter((c) => c.activo).length;
    const totalUses = coupons.reduce((acc, c) => acc + c._count.usos, 0);
    return { activeCoupons, totalCoupons: coupons.length, totalUses };
  }, [coupons]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando cupones..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Cupones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Title & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Cupones de Descuento</h1>
              <p className="text-muted-foreground">Gestiona códigos promocionales</p>
            </div>
            {canCreate && (
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cupón
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="codigo">Código*</Label>
                        <Input
                          id="codigo"
                          value={formData.codigo}
                          onChange={(e) =>
                            setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo">Tipo*</Label>
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
                            <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                            <SelectItem value="FIXED">Fijo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="valor">
                        Valor* {formData.tipo === 'PERCENTAGE' ? '(%)' : '(€)'}
                      </Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fechaInicio">Fecha Inicio*</Label>
                        <Input
                          id="fechaInicio"
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) =>
                            setFormData({ ...formData, fechaInicio: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="fechaExpiracion">Fecha Expiración*</Label>
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

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="usosMaximos">Usos Máximos</Label>
                        <Input
                          id="usosMaximos"
                          type="number"
                          value={formData.usosMaximos}
                          onChange={(e) =>
                            setFormData({ ...formData, usosMaximos: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="usosPorUsuario">Usos por Usuario</Label>
                        <Input
                          id="usosPorUsuario"
                          type="number"
                          value={formData.usosPorUsuario}
                          onChange={(e) =>
                            setFormData({ ...formData, usosPorUsuario: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="montoMinimo">Monto Mínimo (€)</Label>
                        <Input
                          id="montoMinimo"
                          type="number"
                          step="0.01"
                          value={formData.montoMinimo}
                          onChange={(e) =>
                            setFormData({ ...formData, montoMinimo: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit">{editingCoupon ? 'Actualizar' : 'Crear'}</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOpenDialog(false);
                          resetForm();
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cupones Activos</CardTitle>
                <Tag className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeCoupons}</div>
                <p className="text-xs text-muted-foreground">de {stats.totalCoupons} totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalUses}</div>
                <p className="text-xs text-muted-foreground">aplicaciones</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Cupones</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCoupons}</div>
                <p className="text-xs text-muted-foreground">registrados</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFilters.length > 0 && (
            <FilterChips
              filters={activeFilters}
              onRemove={clearFilter}
              onClearAll={clearAllFilters}
            />
          )}

          {/* Coupons List */}
          {filteredCoupons.length === 0 ? (
            <EmptyState
              icon={<Tag className="h-16 w-16 text-gray-400" />}
              title="No hay cupones"
              description={
                searchTerm
                  ? `No se encontraron cupones con "${searchTerm}"`
                  : 'Crea tu primer cupón de descuento'
              }
              action={
                canCreate && !searchTerm
                  ? {
                      label: 'Crear Primer Cupón',
                      onClick: () => {
                        resetForm();
                        setOpenDialog(true);
                      },
                      icon: <Plus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-4">
              {filteredCoupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="text-lg font-mono px-3 py-1 cursor-pointer"
                            onClick={() => copyToClipboard(coupon.codigo)}
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            {coupon.codigo}
                          </Badge>
                          <Badge variant={coupon.activo ? 'default' : 'secondary'}>
                            {coupon.activo ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline">
                            {coupon.tipo === 'PERCENTAGE' ? (
                              <>
                                <Percent className="h-3 w-3 mr-1" />
                                {coupon.valor}%
                              </>
                            ) : (
                              <>
                                <Euro className="h-3 w-3 mr-1" />€{coupon.valor}
                              </>
                            )}
                          </Badge>
                        </div>

                        {coupon.descripcion && (
                          <p className="text-sm text-muted-foreground">{coupon.descripcion}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Inicio</p>
                            <p className="font-medium">
                              {format(new Date(coupon.fechaInicio), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expiración</p>
                            <p className="font-medium">
                              {format(new Date(coupon.fechaExpiracion), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Usos</p>
                            <p className="font-medium">
                              {coupon._count.usos}
                              {coupon.usosMaximos ? ` / ${coupon.usosMaximos}` : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monto Mínimo</p>
                            <p className="font-medium">
                              {coupon.montoMinimo ? `€${coupon.montoMinimo}` : 'Sin mínimo'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(canUpdate || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Activar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(coupon.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
