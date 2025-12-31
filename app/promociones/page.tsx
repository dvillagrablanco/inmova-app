'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Percent, Calendar, Plus, Edit, Trash2, Tag, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  currentUses: number;
  status: 'active' | 'expired' | 'disabled';
  minimumAmount?: number;
}

export default function PromocionesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    startDate: '',
    endDate: '',
    maxUses: '',
    minimumAmount: '',
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockPromotions: Promotion[] = [
        {
          id: '1',
          code: 'WELCOME25',
          description: 'Descuento de bienvenida para nuevos clientes',
          discountType: 'percentage',
          discountValue: 25,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
          maxUses: 100,
          currentUses: 23,
          status: 'active',
          minimumAmount: 100,
        },
        {
          id: '2',
          code: 'VERANO2025',
          description: 'Promoción especial de verano',
          discountType: 'fixed',
          discountValue: 50,
          startDate: '2025-06-01',
          endDate: '2025-09-30',
          maxUses: 500,
          currentUses: 0,
          status: 'active',
        },
      ];

      setPromotions(mockPromotions);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newPromotion: Promotion = {
        id: Date.now().toString(),
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxUses: parseInt(formData.maxUses),
        currentUses: 0,
        status: 'active',
        minimumAmount: formData.minimumAmount ? parseFloat(formData.minimumAmount) : undefined,
      };

      setPromotions([newPromotion, ...promotions]);
      toast.success('Promoción creada correctamente');
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Error al crear promoción');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;

    try {
      const updated = promotions.map((p) =>
        p.id === editingPromotion.id
          ? {
              ...p,
              code: formData.code.toUpperCase(),
              description: formData.description,
              discountType: formData.discountType,
              discountValue: parseFloat(formData.discountValue),
              startDate: formData.startDate,
              endDate: formData.endDate,
              maxUses: parseInt(formData.maxUses),
              minimumAmount: formData.minimumAmount
                ? parseFloat(formData.minimumAmount)
                : undefined,
            }
          : p
      );

      setPromotions(updated);
      toast.success('Promoción actualizada correctamente');
      setEditingPromotion(null);
      resetForm();
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Error al actualizar promoción');
    }
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;

    try {
      setPromotions(promotions.filter((p) => p.id !== promotionToDelete));
      toast.success('Promoción eliminada correctamente');
      setDeleteDialogOpen(false);
      setPromotionToDelete(null);
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Error al eliminar promoción');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      maxUses: '',
      minimumAmount: '',
    });
  };

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue.toString(),
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      maxUses: promotion.maxUses.toString(),
      minimumAmount: promotion.minimumAmount?.toString() || '',
    });
  };

  const getStatusBadge = (status: Promotion['status']) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Activa' },
      expired: { variant: 'destructive' as const, label: 'Expirada' },
      disabled: { variant: 'outline' as const, label: 'Desactivada' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: promotions.length,
    active: promotions.filter((p) => p.status === 'active').length,
    totalUses: promotions.reduce((sum, p) => sum + p.currentUses, 0),
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Promociones y Descuentos</h1>
            <p className="text-muted-foreground">Gestiona cupones y códigos promocionales</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Promoción
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Promociones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUses}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Validez</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay promociones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                      <TableCell>{promo.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {promo.discountType === 'percentage'
                            ? `${promo.discountValue}%`
                            : `€${promo.discountValue}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(promo.startDate), 'dd/MM/yyyy', { locale: es })}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(promo.endDate), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {promo.currentUses} / {promo.maxUses}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(promo.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(promo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPromotionToDelete(promo.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={createDialogOpen || editingPromotion !== null}
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditingPromotion(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}</DialogTitle>
              <DialogDescription>Configura los detalles del código promocional</DialogDescription>
            </DialogHeader>
            <form onSubmit={editingPromotion ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="VERANO2025"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Descuento *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Cantidad Fija (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la promoción..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor del Descuento *</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '25' : '50'}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Usos Máximos *</Label>
                  <Input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Fin *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Monto Mínimo (opcional)</Label>
                  <Input
                    type="number"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData({ ...formData, minimumAmount: e.target.value })}
                    placeholder="100"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">{editingPromotion ? 'Actualizar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar promoción?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la promoción.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
