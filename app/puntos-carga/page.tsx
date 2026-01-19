'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Zap,
  Plus,
  MapPin,
  Home,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Battery,
  BatteryCharging,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ChargingPoint {
  id: string;
  nombre: string;
  ubicacion: string;
  potencia: number; // kW
  tipo: string; // Type 2, CCS, CHAdeMO
  estado: string; // DISPONIBLE, EN_USO, MANTENIMIENTO
  tarifa: number; // €/kWh
  building?: {
    nombre: string;
  };
}

export default function PuntosCargaPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [chargingPoints, setChargingPoints] = useState<ChargingPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<ChargingPoint | null>(null);
  const [pointToEdit, setPointToEdit] = useState<ChargingPoint | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyForm = {
    nombre: '',
    ubicacion: '',
    potencia: '7.4',
    tipo: 'TYPE_2',
    tarifa: '0.30',
    estado: 'DISPONIBLE',
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (session) {
      setIsLoading(false);
      setChargingPoints([]);
    }
  }, [session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const nuevopunto = {
        id: Date.now().toString(),
        ...formData,
        potencia: parseFloat(formData.potencia),
        tarifa: parseFloat(formData.tarifa),
        estado: 'DISPONIBLE',
      };

      setChargingPoints([...chargingPoints, nuevopunto]);
      toast.success('Punto de carga creado');
      setCreateDialogOpen(false);
      setFormData(emptyForm);
    } catch (error) {
      toast.error('Error al crear punto de carga');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointToEdit) return;
    setIsSaving(true);
    try {
      const updatedPoint = {
        ...pointToEdit,
        ...formData,
        potencia: parseFloat(formData.potencia),
        tarifa: parseFloat(formData.tarifa),
      };

      setChargingPoints((prev) =>
        prev.map((p) => (p.id === pointToEdit.id ? updatedPoint : p))
      );
      toast.success('Punto de carga actualizado');
      setEditDialogOpen(false);
      setPointToEdit(null);
      setFormData(emptyForm);
    } catch (error) {
      toast.error('Error al actualizar punto de carga');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (point: ChargingPoint) => {
    setPointToEdit(point);
    setFormData({
      nombre: point.nombre,
      ubicacion: point.ubicacion,
      potencia: point.potencia.toString(),
      tipo: point.tipo,
      tarifa: point.tarifa.toString(),
      estado: point.estado,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!pointToDelete) return;
    setIsSaving(true);
    try {
      setChargingPoints((prev) => prev.filter((p) => p.id !== pointToDelete.id));
      toast.success('Punto eliminado');
      setDeleteDialogOpen(false);
      setPointToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setIsSaving(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Disponible
          </Badge>
        );
      case 'EN_USO':
        return (
          <Badge variant="default" className="gap-1">
            <BatteryCharging className="h-3 w-3" />
            En Uso
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Mantenimiento
          </Badge>
        );
    }
  };

  const stats = {
    total: chargingPoints.length,
    disponibles: chargingPoints.filter((p) => p.estado === 'DISPONIBLE').length,
    enUso: chargingPoints.filter((p) => p.estado === 'EN_USO').length,
    potenciaTotal: chargingPoints.reduce((sum, p) => sum + p.potencia, 0),
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Puntos de Carga</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Puntos de Carga</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de cargadores para vehículos eléctricos
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Punto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Puntos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.disponibles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.enUso}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Potencia Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.potenciaTotal} kW</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Puntos de Carga Instalados</CardTitle>
          </CardHeader>
          <CardContent>
            {chargingPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay puntos de carga</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Registra el primer punto de carga
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Punto
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Potencia</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tarifa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chargingPoints.map((point) => (
                    <TableRow key={point.id}>
                      <TableCell className="font-medium">{point.nombre}</TableCell>
                      <TableCell>{point.ubicacion}</TableCell>
                      <TableCell>{point.potencia} kW</TableCell>
                      <TableCell>
                        <Badge variant="outline">{point.tipo}</Badge>
                      </TableCell>
                      <TableCell>{point.tarifa} €/kWh</TableCell>
                      <TableCell>{getEstadoBadge(point.estado)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(point)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setPointToDelete(point);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Punto de Carga</DialogTitle>
              <DialogDescription>
                Registra un punto de carga para vehículos eléctricos
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Punto Carga #1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ubicación *</Label>
                  <Input
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Plaza de parking B-12"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Potencia (kW) *</Label>
                    <Select
                      value={formData.potencia}
                      onValueChange={(value) => setFormData({ ...formData, potencia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3.7">3.7 kW</SelectItem>
                        <SelectItem value="7.4">7.4 kW</SelectItem>
                        <SelectItem value="11">11 kW</SelectItem>
                        <SelectItem value="22">22 kW</SelectItem>
                        <SelectItem value="50">50 kW (Rápida)</SelectItem>
                        <SelectItem value="150">150 kW (Ultra-Rápida)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Conector *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TYPE_2">Type 2 (Mennekes)</SelectItem>
                        <SelectItem value="CCS">CCS Combo</SelectItem>
                        <SelectItem value="CHADEMO">CHAdeMO</SelectItem>
                        <SelectItem value="SCHUKO">Schuko</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tarifa (€/kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tarifa}
                    onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })}
                    placeholder="0.30"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Punto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Punto de Carga</DialogTitle>
              <DialogDescription>
                Modifica los datos del punto de carga
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ubicación *</Label>
                  <Input
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Potencia (kW) *</Label>
                    <Select
                      value={formData.potencia}
                      onValueChange={(value) => setFormData({ ...formData, potencia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3.7">3.7 kW</SelectItem>
                        <SelectItem value="7.4">7.4 kW</SelectItem>
                        <SelectItem value="11">11 kW</SelectItem>
                        <SelectItem value="22">22 kW</SelectItem>
                        <SelectItem value="50">50 kW (Rápida)</SelectItem>
                        <SelectItem value="150">150 kW (Ultra-Rápida)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Conector *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TYPE_2">Type 2 (Mennekes)</SelectItem>
                        <SelectItem value="CCS">CCS Combo</SelectItem>
                        <SelectItem value="CHADEMO">CHAdeMO</SelectItem>
                        <SelectItem value="SCHUKO">Schuko</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tarifa (€/kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tarifa}
                      onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                        <SelectItem value="EN_USO">En Uso</SelectItem>
                        <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar punto de carga?</DialogTitle>
              <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                {isSaving ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
