'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Home,
  ArrowLeft,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Lightbulb,
  Droplets,
  Flame,
  Shield,
  Building2,
  RefreshCw,
  Edit,
  Trash2,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  cantidadMinima: number;
  unidad: string;
  ubicacion?: string;
  proveedor?: string;
  precioUnitario?: number;
  ultimaActualizacion?: string;
  buildingId?: string;
  building?: { nombre: string };
}

interface ItemFormData {
  nombre: string;
  categoria: string;
  cantidad: number;
  cantidadMinima: number;
  unidad: string;
  ubicacion: string;
  proveedor: string;
  precioUnitario: number;
  buildingId: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function InventarioMantenimientoPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<ItemFormData>({
    nombre: '',
    categoria: 'general',
    cantidad: 0,
    cantidadMinima: 1,
    unidad: 'unidades',
    ubicacion: '',
    proveedor: '',
    precioUnitario: 0,
    buildingId: '',
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadInventory();
      loadBuildings();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('categoria', filterCategory);
      if (filterLowStock) params.append('lowStock', 'true');

      const response = await fetch(`/api/maintenance-pro/inventory?${params}`);
      if (response.ok) {
        const result = await response.json();
        setInventory(result.inventory || []);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const loadBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const url = editingItem
        ? `/api/maintenance-pro/inventory/${editingItem.id}`
        : '/api/maintenance-pro/inventory';
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error');

      toast.success(editingItem ? 'Item actualizado' : 'Item creado');
      setShowNewDialog(false);
      setEditingItem(null);
      loadInventory();
      resetForm();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este item del inventario?')) return;

    try {
      const response = await fetch(`/api/maintenance-pro/inventory/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Item eliminado');
        loadInventory();
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad,
      cantidadMinima: item.cantidadMinima,
      unidad: item.unidad,
      ubicacion: item.ubicacion || '',
      proveedor: item.proveedor || '',
      precioUnitario: item.precioUnitario || 0,
      buildingId: item.buildingId || '',
    });
    setShowNewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'general',
      cantidad: 0,
      cantidadMinima: 1,
      unidad: 'unidades',
      ubicacion: '',
      proveedor: '',
      precioUnitario: 0,
      buildingId: '',
    });
  };

  const getCategoryIcon = (categoria: string) => {
    const icons: Record<string, any> = {
      electricidad: Lightbulb,
      fontaneria: Droplets,
      climatizacion: Flame,
      seguridad: Shield,
      general: Package,
      herramientas: Wrench,
    };
    const Icon = icons[categoria?.toLowerCase()] || Package;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      electricidad: 'bg-yellow-100 text-yellow-600',
      fontaneria: 'bg-blue-100 text-blue-600',
      climatizacion: 'bg-red-100 text-red-600',
      seguridad: 'bg-purple-100 text-purple-600',
      general: 'bg-gray-100 text-gray-600',
      herramientas: 'bg-orange-100 text-orange-600',
    };
    return colors[categoria?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const isLowStock = (item: InventoryItem) => item.cantidad <= item.cantidadMinima;

  // Filtrar inventario
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !filterLowStock || isLowStock(item);
    return matchesSearch && matchesLowStock;
  });

  // Stats
  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(isLowStock).length,
    totalValue: inventory.reduce((sum, item) => sum + (item.cantidad * (item.precioUnitario || 0)), 0),
    categories: [...new Set(inventory.map(i => i.categoria))].length,
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
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
                <BreadcrumbPage>Inventario de Mantenimiento</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Inventario de Mantenimiento</h1>
              <p className="text-muted-foreground">
                Control de stock de materiales y repuestos
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setEditingItem(null); setShowNewDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Item
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Items Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                  <p className="text-xs text-muted-foreground">Stock Bajo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.categories}</p>
                  <p className="text-xs text-muted-foreground">Categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalValue.toLocaleString('es-ES')}€</p>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar item..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); loadInventory(); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="electricidad">Electricidad</SelectItem>
                  <SelectItem value="fontaneria">Fontanería</SelectItem>
                  <SelectItem value="climatizacion">Climatización</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="herramientas">Herramientas</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={filterLowStock ? 'default' : 'outline'}
                onClick={() => setFilterLowStock(!filterLowStock)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Stock Bajo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sin items en inventario</h3>
                <p className="text-muted-foreground mb-4">
                  Añade materiales y repuestos para controlar el stock
                </p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Item
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isLowStock(item) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{item.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(item.categoria)}>
                          {getCategoryIcon(item.categoria)}
                          <span className="ml-1 capitalize">{item.categoria}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={isLowStock(item) ? 'text-red-600 font-bold' : ''}>
                          {item.cantidad} {item.unidad}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Mín: {item.cantidadMinima}
                        </p>
                      </TableCell>
                      <TableCell>
                        {item.ubicacion || '-'}
                        {item.building && (
                          <p className="text-xs text-muted-foreground">
                            {item.building.nombre}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.precioUnitario
                          ? `${item.precioUnitario.toLocaleString('es-ES')}€`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
      </div>

      {/* Dialog Nuevo/Editar Item */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Nuevo Item de Inventario'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Modifica los datos del item' : 'Añade un nuevo material o repuesto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Bombilla LED 10W"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricidad">Electricidad</SelectItem>
                    <SelectItem value="fontaneria">Fontanería</SelectItem>
                    <SelectItem value="climatizacion">Climatización</SelectItem>
                    <SelectItem value="seguridad">Seguridad</SelectItem>
                    <SelectItem value="herramientas">Herramientas</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidad</Label>
                <Select
                  value={formData.unidad}
                  onValueChange={(value) => setFormData({ ...formData, unidad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="metros">Metros</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="cajas">Cajas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cantidad Actual</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Cantidad Mínima</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.cantidadMinima}
                  onChange={(e) => setFormData({ ...formData, cantidadMinima: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Precio Unitario (€)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.precioUnitario || ''}
                onChange={(e) => setFormData({ ...formData, precioUnitario: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label>Ubicación</Label>
              <Input
                placeholder="Ej: Almacén principal, Estante A3"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              />
            </div>

            <div>
              <Label>Proveedor</Label>
              <Input
                placeholder="Nombre del proveedor"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
              />
            </div>

            {buildings.length > 0 && (
              <div>
                <Label>Edificio Asociado</Label>
                <Select
                  value={formData.buildingId}
                  onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setEditingItem(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editingItem ? 'Guardar Cambios' : 'Crear Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
