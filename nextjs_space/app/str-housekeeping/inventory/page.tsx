'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'limpieza',
    unidadMedida: 'unidad',
    stockActual: 0,
    stockMinimo: 0,
    costoUnitario: '',
  });
  const [movementData, setMovementData] = useState({
    tipo: 'salida',
    cantidad: 1,
    motivo: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadInventory();
    }
  }, [status, router]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/str-housekeeping/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/str-housekeeping/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          costoUnitario: formData.costoUnitario ? parseFloat(formData.costoUnitario) : null,
        }),
      });

      if (res.ok) {
        toast.success('Item creado correctamente');
        setShowDialog(false);
        setFormData({
          nombre: '',
          descripcion: '',
          categoria: 'limpieza',
          unidadMedida: 'unidad',
          stockActual: 0,
          stockMinimo: 0,
          costoUnitario: '',
        });
        loadInventory();
      } else {
        toast.error('Error al crear item');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear item');
    }
  };

  const handleMovement = async () => {
    if (!selectedItem) return;

    try {
      const res = await fetch(`/api/str-housekeeping/inventory/${selectedItem.id}/movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData),
      });

      if (res.ok) {
        toast.success('Movimiento registrado');
        setShowMovementDialog(false);
        setSelectedItem(null);
        setMovementData({ tipo: 'salida', cantidad: 1, motivo: '' });
        loadInventory();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al registrar movimiento');
    }
  };

  const bajoStock = inventory.filter((item) => item.stockActual <= item.stockMinimo);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Inventario</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona productos de limpieza y suministros
                </p>
              </div>
              <Button onClick={() => setShowDialog(true)} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Item
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventory.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Bajo Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{bajoStock.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Valor Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €
                    {inventory
                      .reduce(
                        (sum, item) => sum + (item.stockActual * (item.costoUnitario || 0)),
                        0
                      )
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alert */}
            {bajoStock.length > 0 && (
              <Card className="border-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">
                      {bajoStock.length} item(s) con stock bajo
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inventory List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No hay items</h3>
                    <p className="text-muted-foreground mb-4">
                      Añade el primer item al inventario
                    </p>
                    <Button onClick={() => setShowDialog(true)} className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Item
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                inventory.map((item) => {
                  const lowStock = item.stockActual <= item.stockMinimo;
                  return (
                    <Card
                      key={item.id}
                      className={`hover:shadow-md transition-shadow ${
                        lowStock ? 'border-orange-500' : ''
                      }`}
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.nombre}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.descripcion || 'Sin descripción'}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">
                                {item.categoria === 'limpieza' && 'Limpieza'}
                                {item.categoria === 'amenities' && 'Amenities'}
                                {item.categoria === 'mantenimiento' && 'Mantenimiento'}
                                {item.categoria === 'otros' && 'Otros'}
                              </Badge>
                              {lowStock && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Bajo stock
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Stock actual:</span>
                            <span
                              className={`font-medium ${
                                lowStock ? 'text-orange-500' : ''
                              }`}
                            >
                              {item.stockActual} {item.unidadMedida}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Stock mínimo:</span>
                            <span className="font-medium">
                              {item.stockMinimo} {item.unidadMedida}
                            </span>
                          </div>
                          {item.costoUnitario && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Costo unitario:</span>
                              <span className="font-medium">€{item.costoUnitario}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovementData({ tipo: 'entrada', cantidad: 1, motivo: '' });
                              setShowMovementDialog(true);
                            }}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Entrada
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovementData({ tipo: 'salida', cantidad: 1, motivo: '' });
                              setShowMovementDialog(true);
                            }}
                          >
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Salida
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Dialog Create Item */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Item de Inventario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Jabón líquido"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del producto"
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
                    <SelectItem value="limpieza">Limpieza</SelectItem>
                    <SelectItem value="amenities">Amenities</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Unidad de medida</Label>
                <Select
                  value={formData.unidadMedida}
                  onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                    <SelectItem value="kg">Kilogramo</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                    <SelectItem value="paquete">Paquete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Stock actual</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stockActual}
                  onChange={(e) =>
                    setFormData({ ...formData, stockActual: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stockMinimo}
                  onChange={(e) =>
                    setFormData({ ...formData, stockMinimo: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <Label>Costo (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costoUnitario}
                  onChange={(e) => setFormData({ ...formData, costoUnitario: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} className="gradient-primary">
                Añadir Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Movement */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementData.tipo === 'entrada' ? 'Entrada' : 'Salida'} de Inventario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-semibold">{selectedItem.nombre}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Stock actual: {selectedItem.stockActual} {selectedItem.unidadMedida}
                </div>
              </div>
            )}

            <div>
              <Label>Tipo</Label>
              <Select
                value={movementData.tipo}
                onValueChange={(value) => setMovementData({ ...movementData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="uso">Uso</SelectItem>
                  <SelectItem value="devolucion">Devolución</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={movementData.cantidad}
                onChange={(e) =>
                  setMovementData({ ...movementData, cantidad: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div>
              <Label>Motivo</Label>
              <Input
                value={movementData.motivo}
                onChange={(e) => setMovementData({ ...movementData, motivo: e.target.value })}
                placeholder="Motivo del movimiento..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMovementDialog(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleMovement} className="gradient-primary">
                Registrar Movimiento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
