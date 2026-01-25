'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Package,
  Search,
  Home,
  ArrowLeft,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  RefreshCw,
  Edit,
  Trash2,
  Filter,
  Download,
  BarChart3,
  Boxes,
  MapPin,
  DollarSign,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface InventoryItem {
  id: string;
  companyId: string;
  buildingId?: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  codigoSKU?: string;
  cantidad: number;
  cantidadMinima: number;
  unidadMedida: string;
  costoUnitario: number;
  proveedor?: string;
  ubicacion?: string;
  fechaUltimaCompra?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  building?: { id: string; nombre: string };
  stockBajo: boolean;
  valorTotal: number;
}

interface Stats {
  totalItems: number;
  stockBajo: number;
  valorTotal: number;
  categorias: number;
}

interface Building {
  id: string;
  nombre: string;
}

// Categorías de inventario
const CATEGORIAS = [
  { value: 'herramientas', label: 'Herramientas', icon: '🔧' },
  { value: 'materiales', label: 'Materiales', icon: '📦' },
  { value: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { value: 'electricidad', label: 'Electricidad', icon: '⚡' },
  { value: 'fontaneria', label: 'Fontanería', icon: '🔧' },
  { value: 'jardineria', label: 'Jardinería', icon: '🌱' },
  { value: 'seguridad', label: 'Seguridad', icon: '🔒' },
  { value: 'mobiliario', label: 'Mobiliario', icon: '🪑' },
  { value: 'otros', label: 'Otros', icon: '📋' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function WarehouseInventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Estados formulario
  const [newItem, setNewItem] = useState({
    nombre: '',
    categoria: 'materiales',
    descripcion: '',
    codigoSKU: '',
    cantidad: 0,
    cantidadMinima: 5,
    unidadMedida: 'unidad',
    costoUnitario: 0,
    proveedor: '',
    ubicacion: '',
    buildingId: '',
  });

  const [movement, setMovement] = useState({
    tipo: 'entrada' as 'entrada' | 'salida' | 'ajuste',
    cantidad: 0,
    motivo: '',
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar edificios
      const buildingsRes = await fetch('/api/buildings?limit=100');
      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(Array.isArray(buildingsData) ? buildingsData : buildingsData.data || []);
      }

      // Cargar inventario
      await loadInventory();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      let url = '/api/warehouse/inventory';
      const params = new URLSearchParams();
      
      if (filterCategoria !== 'all') params.append('categoria', filterCategoria);
      if (filterBuilding !== 'all') params.append('buildingId', filterBuilding);
      if (showLowStock) params.append('lowStock', 'true');

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  // Efecto para recargar cuando cambian filtros
  useEffect(() => {
    if (!loading) {
      loadInventory();
    }
  }, [filterCategoria, filterBuilding, showLowStock]);

  // Crear item
  const handleCreateItem = async () => {
    if (!newItem.nombre || !newItem.categoria) {
      toast.error('Nombre y categoría son requeridos');
      return;
    }

    try {
      const response = await fetch('/api/warehouse/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        toast.success('Item creado exitosamente');
        setShowNewItemDialog(false);
        resetNewItemForm();
        loadInventory();
      } else {
        toast.error('Error al crear item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Error al crear item');
    }
  };

  // Registrar movimiento
  const handleRegisterMovement = async () => {
    if (!selectedItem || movement.cantidad <= 0) {
      toast.error('Cantidad inválida');
      return;
    }

    try {
      const response = await fetch('/api/warehouse/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          ...movement,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Movimiento registrado. Nueva cantidad: ${data.nuevaCantidad}`);
        setShowMovementDialog(false);
        setSelectedItem(null);
        setMovement({ tipo: 'entrada', cantidad: 0, motivo: '' });
        loadInventory();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error registering movement:', error);
      toast.error('Error al registrar movimiento');
    }
  };

  // Reset formulario
  const resetNewItemForm = () => {
    setNewItem({
      nombre: '',
      categoria: 'materiales',
      descripcion: '',
      codigoSKU: '',
      cantidad: 0,
      cantidadMinima: 5,
      unidadMedida: 'unidad',
      costoUnitario: 0,
      proveedor: '',
      ubicacion: '',
      buildingId: '',
    });
  };

  // Filtrar items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigoSKU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proveedor?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [items, searchTerm]);

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/warehouse')}>
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
                <BreadcrumbLink href="/warehouse">Warehouse</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Inventario</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Boxes className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Inventario</h1>
              <p className="text-muted-foreground">
                Gestión de stock y materiales
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadInventory}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setShowNewItemDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Item
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Boxes className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                    <p className="text-xs text-muted-foreground">Total Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={stats.stockBajo > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-8 w-8 ${stats.stockBajo > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-2xl font-bold">{stats.stockBajo}</p>
                    <p className="text-xs text-muted-foreground">Stock Bajo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">€{stats.valorTotal.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.categorias}</p>
                    <p className="text-xs text-muted-foreground">Categorías</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o proveedor..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIAS.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBuilding} onValueChange={setFilterBuilding}>
            <SelectTrigger className="w-[180px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Edificio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los edificios</SelectItem>
              {buildings.map(building => (
                <SelectItem key={building.id} value={building.id}>
                  {building.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showLowStock ? 'default' : 'outline'}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Stock Bajo
          </Button>
        </div>

        {/* Tabla de inventario */}
        <Card>
          <CardContent className="p-0">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center">
                <Boxes className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No hay items</h3>
                <p className="text-muted-foreground">
                  Agrega tu primer item de inventario
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id} className={item.stockBajo ? 'bg-yellow-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.nombre}</p>
                            {item.stockBajo && (
                              <Badge variant="destructive" className="text-xs">
                                Stock bajo
                              </Badge>
                            )}
                          </div>
                          {item.codigoSKU && (
                            <p className="text-xs text-muted-foreground font-mono">
                              SKU: {item.codigoSKU}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {CATEGORIAS.find(c => c.value === item.categoria)?.icon || '📦'}{' '}
                          {item.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {item.cantidad} {item.unidadMedida}
                          </p>
                          <Progress
                            value={Math.min((item.cantidad / (item.cantidadMinima * 2)) * 100, 100)}
                            className={`h-1.5 ${item.stockBajo ? 'bg-yellow-100' : ''}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Mín: {item.cantidadMinima}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {item.ubicacion || item.building?.nombre || '-'}
                        </div>
                      </TableCell>
                      <TableCell>€{item.costoUnitario.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        €{item.valorTotal.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovement({ tipo: 'entrada', cantidad: 0, motivo: '' });
                              setShowMovementDialog(true);
                            }}
                          >
                            <ArrowUpRight className="h-4 w-4" />
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
      <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Item de Inventario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo item al inventario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Nombre del item"
                  value={newItem.nombre}
                  onChange={e => setNewItem(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={newItem.categoria}
                  onValueChange={v => setNewItem(prev => ({ ...prev, categoria: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  placeholder="Código SKU"
                  value={newItem.codigoSKU}
                  onChange={e => setNewItem(prev => ({ ...prev, codigoSKU: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad Inicial</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.cantidad}
                  onChange={e => setNewItem(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad Mínima</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.cantidadMinima}
                  onChange={e => setNewItem(prev => ({ ...prev, cantidadMinima: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad de Medida</Label>
                <Select
                  value={newItem.unidadMedida}
                  onValueChange={v => setNewItem(prev => ({ ...prev, unidadMedida: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="metros">Metros</SelectItem>
                    <SelectItem value="cajas">Cajas</SelectItem>
                    <SelectItem value="paquetes">Paquetes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Costo Unitario (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.costoUnitario}
                  onChange={e => setNewItem(prev => ({ ...prev, costoUnitario: parseFloat(e.target.value) || 0 }))}
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
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  placeholder="Estantería, almacén..."
                  value={newItem.ubicacion}
                  onChange={e => setNewItem(prev => ({ ...prev, ubicacion: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Edificio (opcional)</Label>
                <Select
                  value={newItem.buildingId}
                  onValueChange={v => setNewItem(prev => ({ ...prev, buildingId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin edificio asignado</SelectItem>
                    {buildings.map(building => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Descripción del item..."
                  value={newItem.descripcion}
                  onChange={e => setNewItem(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewItemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Movimiento */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>
              {selectedItem?.nombre}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                <span className="text-sm">Stock actual:</span>
                <span className="font-bold">{selectedItem.cantidad} {selectedItem.unidadMedida}</span>
              </div>
              <div className="space-y-2">
                <Label>Tipo de movimiento</Label>
                <Select
                  value={movement.tipo}
                  onValueChange={v => setMovement(prev => ({ ...prev, tipo: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                        Entrada (agregar stock)
                      </span>
                    </SelectItem>
                    <SelectItem value="salida">
                      <span className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                        Salida (restar stock)
                      </span>
                    </SelectItem>
                    <SelectItem value="ajuste">
                      <span className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-blue-600" />
                        Ajuste (establecer cantidad)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={movement.cantidad}
                  onChange={e => setMovement(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                />
                {movement.tipo !== 'ajuste' && movement.cantidad > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nuevo stock: {movement.tipo === 'entrada'
                      ? selectedItem.cantidad + movement.cantidad
                      : Math.max(0, selectedItem.cantidad - movement.cantidad)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Input
                  placeholder="Motivo del movimiento..."
                  value={movement.motivo}
                  onChange={e => setMovement(prev => ({ ...prev, motivo: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterMovement}>
              Registrar Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
