'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  Warehouse, Package, AlertTriangle, Euro, Boxes,
  Plus, ArrowUpRight, ArrowDownLeft, BarChart3, MapPin
} from 'lucide-react';

interface InventoryItem {
  id: string;
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
  stockBajo: boolean;
  valorTotal: number;
  building?: {
    id: string;
    nombre: string;
  };
}

interface Stats {
  totalItems: number;
  stockBajo: number;
  valorTotal: number;
  categorias: number;
}

export default function WarehousePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [filterCategoria, showLowStock]);

  async function loadInventory() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategoria) params.append('categoria', filterCategoria);
      if (showLowStock) params.append('lowStock', 'true');

      const response = await fetch(`/api/warehouse/inventory?${params}`);
      if (!response.ok) throw new Error('Error al cargar inventario');
      
      const data = await response.json();
      setItems(data.data || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const categorias = [...new Set(items.map(i => i.categoria))];

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Almacén</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Warehouse className="h-6 w-6 text-amber-500" />
              Gestión de Almacén
            </h1>
            <p className="text-muted-foreground">
              Control de inventario y logística
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/warehouse/inventory">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Item
              </Button>
            </Link>
            <Link href="/warehouse/movements">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Movimientos
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            <Card className={stats.stockBajo > 0 ? 'border-red-200' : ''}>
              <CardContent className="pt-4">
                <div className={`text-2xl font-bold ${stats.stockBajo > 0 ? 'text-red-600' : ''}`}>
                  {stats.stockBajo}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  {stats.stockBajo > 0 && <AlertTriangle className="h-3 w-3 text-red-600" />}
                  Stock Bajo
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{formatCurrency(stats.valorTotal)}</div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.categorias}</div>
                <div className="text-sm text-muted-foreground">Categorías</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/warehouse/inventory">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="font-medium">Inventario</div>
                  <div className="text-sm text-muted-foreground">Ver todo</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/warehouse/movements">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <ArrowUpRight className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">Entrada</div>
                  <div className="text-sm text-muted-foreground">Registrar</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/warehouse/movements">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <ArrowDownLeft className="h-8 w-8 text-red-500" />
                <div>
                  <div className="font-medium">Salida</div>
                  <div className="text-sm text-muted-foreground">Registrar</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/warehouse/locations">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="font-medium">Ubicaciones</div>
                  <div className="text-sm text-muted-foreground">Gestionar</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterCategoria === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategoria('')}
                >
                  Todos
                </Button>
                {categorias.map(cat => (
                  <Button
                    key={cat}
                    variant={filterCategoria === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategoria(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="ml-auto">
                <Button
                  variant={showLowStock ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowLowStock(!showLowStock)}
                  className={showLowStock ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Solo Stock Bajo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay items en el inventario</h3>
                <p className="text-muted-foreground mb-4">
                  Añade tu primer item al almacén
                </p>
                <Link href="/warehouse/inventory">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Item
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Inventario</CardTitle>
              <CardDescription>{items.length} item(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Item</th>
                      <th className="text-left py-3 px-2 font-medium">Categoría</th>
                      <th className="text-right py-3 px-2 font-medium">Cantidad</th>
                      <th className="text-right py-3 px-2 font-medium">Mínimo</th>
                      <th className="text-right py-3 px-2 font-medium">Costo Unit.</th>
                      <th className="text-right py-3 px-2 font-medium">Valor</th>
                      <th className="text-left py-3 px-2 font-medium">Ubicación</th>
                      <th className="text-center py-3 px-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium">{item.nombre}</div>
                            {item.codigoSKU && (
                              <div className="text-xs text-muted-foreground">SKU: {item.codigoSKU}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{item.categoria}</Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={item.stockBajo ? 'text-red-600 font-bold' : ''}>
                            {item.cantidad} {item.unidadMedida}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          {item.cantidadMinima}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {formatCurrency(item.costoUnitario)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCurrency(item.valorTotal)}
                        </td>
                        <td className="py-3 px-2">
                          {item.ubicacion || '-'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {item.stockBajo ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                              <AlertTriangle className="h-3 w-3" />
                              Bajo
                            </Badge>
                          ) : (
                            <Badge variant="default">OK</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
