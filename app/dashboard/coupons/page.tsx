'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Ticket, 
  Plus, 
  Search, 
  MoreHorizontal,
  Percent,
  Calendar,
  Users,
  RefreshCw,
  Copy,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Coupon {
  id: string;
  codigo: string;
  descuento: number;
  tipoDescuento: 'porcentaje' | 'fijo';
  usos: number;
  maxUsos?: number;
  activo: boolean;
  fechaExpiracion?: string;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    codigo: '',
    descuento: 10,
    tipoDescuento: 'porcentaje' as const,
    maxUsos: 100,
  });

  const handleEditCoupon = (coupon: Coupon) => {
    toast.info(`Editar cupón ${coupon.codigo}`);
  };

  const handleToggleCoupon = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((coupon) =>
        coupon.id === couponId ? { ...coupon, activo: !coupon.activo } : coupon
      )
    );
    toast.success('Estado del cupón actualizado');
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
    toast.success('Cupón eliminado');
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon),
      });

      if (response.ok) {
        toast.success('Cupón creado correctamente');
        setIsDialogOpen(false);
        setNewCoupon({ codigo: '', descuento: 10, tipoDescuento: 'porcentaje', maxUsos: 100 });
        fetchCoupons();
      } else {
        toast.error('Error al crear cupón');
      }
    } catch (error) {
      toast.error('Error al crear cupón');
    } finally {
      setSaving(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCoupons = coupons.filter(c => c.activo).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.usos || 0), 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupones</h1>
          <p className="text-gray-600 mt-1">Gestiona cupones de descuento</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchCoupons}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cupón
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Cupón</DialogTitle>
                <DialogDescription>Crea un nuevo cupón de descuento</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCoupon}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={newCoupon.codigo}
                      onChange={(e) => setNewCoupon({ ...newCoupon, codigo: e.target.value.toUpperCase() })}
                      placeholder="Ej: DESCUENTO20"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="descuento">Descuento</Label>
                      <Input
                        id="descuento"
                        type="number"
                        value={newCoupon.descuento}
                        onChange={(e) => setNewCoupon({ ...newCoupon, descuento: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxUsos">Máximo usos</Label>
                      <Input
                        id="maxUsos"
                        type="number"
                        value={newCoupon.maxUsos}
                        onChange={(e) => setNewCoupon({ ...newCoupon, maxUsos: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creando...' : 'Crear Cupón'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cupones</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-green-600">{activeCoupons}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Usos</p>
                <p className="text-2xl font-bold">{totalUses}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar cupones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Coupons List */}
      <div className="space-y-4">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay cupones</h3>
            <p className="text-gray-500 mb-4">Crea tu primer cupón de descuento</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Cupón
            </Button>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Ticket className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-lg font-bold">{coupon.codigo}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.codigo)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Badge className={coupon.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {coupon.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {coupon.tipoDescuento === 'porcentaje' ? `${coupon.descuento}% descuento` : `€${coupon.descuento} descuento`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Usos</p>
                      <p className="font-semibold">{coupon.usos} / {coupon.maxUsos || '∞'}</p>
                    </div>
                    {coupon.fechaExpiracion && (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Expira</p>
                        <p className="font-semibold">{new Date(coupon.fechaExpiracion).toLocaleDateString()}</p>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => undefined}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleCoupon(coupon.id)}>
                          {coupon.activo ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
