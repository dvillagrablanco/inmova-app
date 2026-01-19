'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Percent, Calendar, Plus, Edit, Trash2, Tag, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Promotion {
  id: string;
  codigo: string;
  descripcion?: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  fechaInicio: string;
  fechaExpiracion: string;
  usosMaximos?: number;
  usosActuales: number;
  estado: 'activo' | 'expirado' | 'inactivo';
  montoMinimo?: number;
  activo: boolean;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function PromocionesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'porcentaje' as 'porcentaje' | 'monto_fijo',
    valor: '',
    fechaInicio: '',
    fechaExpiracion: '',
    usosMaximos: '',
    montoMinimo: '',
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await fetch('/api/coupons');
      if (response.ok) {
        const data = await response.json();
        // Mapear datos del API al formato de la interfaz
        const mappedPromotions: Promotion[] = (data || []).map((coupon: any) => ({
          id: coupon.id,
          codigo: coupon.codigo,
          descripcion: coupon.descripcion,
          tipo: coupon.tipo,
          valor: coupon.valor,
          fechaInicio: coupon.fechaInicio,
          fechaExpiracion: coupon.fechaExpiracion,
          usosMaximos: coupon.usosMaximos,
          usosActuales: coupon.usosActuales || 0,
          estado: coupon.estado,
          montoMinimo: coupon.montoMinimo,
          activo: coupon.activo,
        }));
        setPromotions(mappedPromotions);
      } else {
        console.error('Error fetching coupons');
        setPromotions([]);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Error al cargar promociones');
      setPromotions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPromotions();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: formData.codigo.toUpperCase(),
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          valor: formData.valor,
          fechaInicio: formData.fechaInicio,
          fechaExpiracion: formData.fechaExpiracion,
          usosMaximos: formData.usosMaximos || null,
          montoMinimo: formData.montoMinimo || null,
        }),
      });

      if (response.ok) {
        toast.success('Promocion creada correctamente');
        setCreateDialogOpen(false);
        resetForm();
        loadPromotions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear promocion');
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Error al crear promocion');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/coupons/${editingPromotion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: formData.codigo.toUpperCase(),
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          valor: formData.valor,
          fechaInicio: formData.fechaInicio,
          fechaExpiracion: formData.fechaExpiracion,
          usosMaximos: formData.usosMaximos || null,
          montoMinimo: formData.montoMinimo || null,
        }),
      });

      if (response.ok) {
        toast.success('Promocion actualizada correctamente');
        setEditingPromotion(null);
        resetForm();
        loadPromotions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar promocion');
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Error al actualizar promocion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/coupons/${promotionToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Promocion eliminada correctamente');
        setDeleteDialogOpen(false);
        setPromotionToDelete(null);
        loadPromotions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar promocion');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Error al eliminar promocion');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descripcion: '',
      tipo: 'porcentaje',
      valor: '',
      fechaInicio: '',
      fechaExpiracion: '',
      usosMaximos: '',
      montoMinimo: '',
    });
  };

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      codigo: promotion.codigo,
      descripcion: promotion.descripcion || '',
      tipo: promotion.tipo,
      valor: promotion.valor.toString(),
      fechaInicio: promotion.fechaInicio.split('T')[0],
      fechaExpiracion: promotion.fechaExpiracion.split('T')[0],
      usosMaximos: promotion.usosMaximos?.toString() || '',
      montoMinimo: promotion.montoMinimo?.toString() || '',
    });
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const endDate = new Date(promotion.fechaExpiracion);
    
    if (!promotion.activo) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (endDate < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (promotion.usosMaximos && promotion.usosActuales >= promotion.usosMaximos) {
      return <Badge variant="secondary">Agotado</Badge>;
    }
    return <Badge variant="default">Activo</Badge>;
  };

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.tipo === 'porcentaje') {
      return `${promotion.valor}%`;
    }
    return `${promotion.valor.toFixed(2)}€`;
  };

  // Calcular estadísticas
  const stats = {
    total: promotions.length,
    activas: promotions.filter((p) => p.activo && new Date(p.fechaExpiracion) >= new Date()).length,
    usosTotal: promotions.reduce((sum, p) => sum + p.usosActuales, 0),
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Promociones y Cupones</h1>
            <p className="text-muted-foreground">
              Gestiona codigos de descuento para tus clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Promocion
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Promociones
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Promociones Activas
              </CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usos Totales
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.usosTotal}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Promociones */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Promociones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : promotions.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No hay promociones</p>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera promocion para ofrecer descuentos a tus clientes
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Promocion
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-mono font-semibold">
                        {promotion.codigo}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {promotion.descripcion || '-'}
                      </TableCell>
                      <TableCell>{formatDiscount(promotion)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(promotion.fechaInicio), 'dd/MM/yy', { locale: es })} -{' '}
                          {format(new Date(promotion.fechaExpiracion), 'dd/MM/yy', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {promotion.usosActuales}
                        {promotion.usosMaximos ? `/${promotion.usosMaximos}` : ''}
                      </TableCell>
                      <TableCell>{getStatusBadge(promotion)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(promotion)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPromotionToDelete(promotion.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogo Crear */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Promocion</DialogTitle>
              <DialogDescription>
                Crea un nuevo codigo de descuento para tus clientes
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Codigo</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej: VERANO25"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de descuento</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="monto_fijo">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">
                  Valor ({formData.tipo === 'porcentaje' ? '%' : '€'})
                </Label>
                <Input
                  id="valor"
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripcion de la promocion..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaExpiracion">Fecha expiracion</Label>
                  <Input
                    id="fechaExpiracion"
                    type="date"
                    value={formData.fechaExpiracion}
                    onChange={(e) => setFormData({ ...formData, fechaExpiracion: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usosMaximos">Usos maximos (opcional)</Label>
                  <Input
                    id="usosMaximos"
                    type="number"
                    value={formData.usosMaximos}
                    onChange={(e) => setFormData({ ...formData, usosMaximos: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montoMinimo">Monto minimo (opcional)</Label>
                  <Input
                    id="montoMinimo"
                    type="number"
                    value={formData.montoMinimo}
                    onChange={(e) => setFormData({ ...formData, montoMinimo: e.target.value })}
                    placeholder="Sin minimo"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Promocion'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialogo Editar */}
        <Dialog open={!!editingPromotion} onOpenChange={() => setEditingPromotion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Promocion</DialogTitle>
              <DialogDescription>
                Modifica los datos de la promocion
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-codigo">Codigo</Label>
                  <Input
                    id="edit-codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tipo">Tipo de descuento</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="monto_fijo">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-valor">
                  Valor ({formData.tipo === 'porcentaje' ? '%' : '€'})
                </Label>
                <Input
                  id="edit-valor"
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-descripcion">Descripcion</Label>
                <Textarea
                  id="edit-descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fechaInicio">Fecha inicio</Label>
                  <Input
                    id="edit-fechaInicio"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fechaExpiracion">Fecha expiracion</Label>
                  <Input
                    id="edit-fechaExpiracion"
                    type="date"
                    value={formData.fechaExpiracion}
                    onChange={(e) => setFormData({ ...formData, fechaExpiracion: e.target.value })}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingPromotion(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialogo Eliminar */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Promocion</DialogTitle>
              <DialogDescription>
                ¿Estas seguro de que deseas eliminar esta promocion? Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
