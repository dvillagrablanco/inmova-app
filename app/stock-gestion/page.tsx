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
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface StockItem {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  cantidad: number;
  stockMinimo: number;
  stockMaximo?: number;
  unidad: string;
  precioUnitario?: number;
  ubicacion?: string;
  proveedor?: string;
}

interface Stats {
  totalItems: number;
  totalUnidades: number;
  valorTotal: number;
  lowStock: number;
  categorias: number;
}

const CATEGORIAS = [
  'Limpieza',
  'Mantenimiento',
  'Oficina',
  'Herramientas',
  'Electricidad',
  'Fontanería',
  'Seguridad',
  'Otros',
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function StockGestionPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StockItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  // Form state
  const [newItem, setNewItem] = useState({
    nombre: '',
    sku: '',
    categoria: 'Limpieza',
    cantidad: 0,
    stockMinimo: 0,
    stockMaximo: 0,
    unidad: 'unidades',
    precioUnitario: 0,
    ubicacion: '',
    proveedor: '',
  });

  const [movement, setMovement] = useState({
    tipo: 'entrada',
    cantidad: 0,
    motivo: '',
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadItems();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadItems = async () => {
    try {
      setLoading(true);
      let url = '/api/stock';
      const params = new URLSearchParams();
      if (filterCategoria !== 'all') params.append('categoria', filterCategoria);
      if (showLowStock) params.append('lowStock', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Error al cargar stock');
    } finally {
      setLoading(false);
    }
  };

  // Crear item
  const handleCreate = async () => {
    if (!newItem.nombre || !newItem.categoria) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        toast.success('Item creado exitosamente');
        setShowNewDialog(false);
        resetForm();
        loadItems();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Error al crear item');
    }
  };

  const resetForm = () => {
    setNewItem({
      nombre: '',
      sku: '',
      categoria: 'Limpieza',
      cantidad: 0,
      stockMinimo: 0,
      stockMaximo: 0,
      unidad: 'unidades',
      precioUnitario: 0,
      ubicacion: '',
      proveedor: '',
    });
  };

  // Registrar movimiento
  const handleMovement = () => {
    if (!selectedItem || movement.cantidad <= 0) {
      toast.error('Cantidad inválida');
      return;
    }

    // En una implementación real, esto haría una llamada a la API
    toast.success(`Movimiento de ${movement.tipo} registrado`);
    setShowMovementDialog(false);
    setMovement({ tipo: 'entrada', cantidad: 0, motivo: '' });
    setSelectedItem(null);
    loadItems();
  };

  // Calcular nivel de stock
  const getStockLevel = (item: StockItem): number => {
    if (!item.stockMinimo) return 100;
    return Math.min((item.cantidad / item.stockMinimo) * 50, 100);
  };

  // Color según nivel de stock
  const getStockColor = (item: StockItem): string => {
    const level = getStockLevel(item);
    if (level <= 25) return 'bg-red-500';
    if (level <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Filtrar items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Loading
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <Boxes className="h-8 w-8 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Stock</h1>
              <p className="text-muted-foreground">
                Control de inventario y materiales
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Item
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Boxes className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUnidades || 0}</p>
                  <p className="text-xs text-muted-foreground">Unidades</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">€{((stats?.valorTotal || 0) / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-muted-foreground">Valor total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.lowStock || 0}</p>
                  <p className="text-xs text-muted-foreground">Bajo stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.categorias || 0}</p>
                  <p className="text-xs text-muted-foreground">Categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategoria} onValueChange={v => { setFilterCategoria(v); loadItems(); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIAS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant={showLowStock ? 'default' : 'outline'}
            onClick={() => { setShowLowStock(!showLowStock); }}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Bajo stock
          </Button>
          <Button variant="outline" onClick={loadItems}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center">
                <Boxes className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sin items de stock</h3>
                <p className="text-muted-foreground">Añade tu primer item de inventario</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          {item.ubicacion && (
                            <p className="text-xs text-muted-foreground">{item.ubicacion}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.cantidad}</span>
                          <span className="text-muted-foreground">{item.unidad}</span>
                          {item.cantidad <= item.stockMinimo && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="space-y-1">
                          <Progress value={getStockLevel(item)} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Mín: {item.stockMinimo}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        €{((item.cantidad || 0) * (item.precioUnitario || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovement({ tipo: 'entrada', cantidad: 0, motivo: '' });
                              setShowMovementDialog(true);
                            }}
                          >
                            <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovement({ tipo: 'salida', cantidad: 0, motivo: '' });
                              setShowMovementDialog(true);
                            }}
                          >
                            <ArrowDownCircle className="h-4 w-4 text-red-600" />
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

      {/* Dialog: Nuevo Item */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Item de Stock</DialogTitle>
            <DialogDescription>Añade un producto al inventario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Producto de limpieza"
                  value={newItem.nombre}
                  onChange={e => setNewItem(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>SKU (automático si vacío)</Label>
                <Input
                  placeholder="SKU-001"
                  value={newItem.sku}
                  onChange={e => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={newItem.categoria}
                  onValueChange={v => setNewItem(prev => ({ ...prev, categoria: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad inicial</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.cantidad}
                  onChange={e => setNewItem(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.stockMinimo}
                  onChange={e => setNewItem(prev => ({ ...prev, stockMinimo: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select
                  value={newItem.unidad}
                  onValueChange={v => setNewItem(prev => ({ ...prev, unidad: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="metros">Metros</SelectItem>
                    <SelectItem value="cajas">Cajas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precio unitario (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.precioUnitario}
                  onChange={e => setNewItem(prev => ({ ...prev, precioUnitario: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  placeholder="Almacén A, Estante 3"
                  value={newItem.ubicacion}
                  onChange={e => setNewItem(prev => ({ ...prev, ubicacion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={newItem.proveedor}
                  onChange={e => setNewItem(prev => ({ ...prev, proveedor: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Movimiento */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {movement.tipo === 'entrada' ? 'Entrada de Stock' : 'Salida de Stock'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.nombre} - Stock actual: {selectedItem?.cantidad} {selectedItem?.unidad}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <Select
                value={movement.tipo}
                onValueChange={v => setMovement(prev => ({ ...prev, tipo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={movement.cantidad}
                onChange={e => setMovement(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                placeholder="Reposición, uso, ajuste..."
                value={movement.motivo}
                onChange={e => setMovement(prev => ({ ...prev, motivo: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMovement}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
