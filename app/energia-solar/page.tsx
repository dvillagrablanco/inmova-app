'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Sun,
  Plus,
  Home,
  MoreVertical,
  Edit,
  Trash2,
  Zap,
  TrendingUp,
  Battery,
  Calendar,
  DollarSign,
  Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface SolarInstallation {
  id: string;
  nombre: string;
  ubicacion: string;
  potenciaPico: number; // kWp
  potenciaInversor: number; // kW
  numeroPaneles: number;
  marcaPaneles: string;
  fechaInstalacion: string;
  estado: string; // ACTIVO, MANTENIMIENTO, INACTIVO
  produccionMensual: number; // kWh
  ahorroMensual: number; // €
  excedenteMensual: number; // kWh vendidos a red
  co2Evitado: number; // kg CO2
  roiEstimado: number; // años
  buildingId?: string;
  buildingName?: string;
  notas?: string;
}

export default function EnergiaSolarPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [installations, setInstallations] = useState<SolarInstallation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<SolarInstallation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);

  const emptyForm = {
    nombre: '',
    ubicacion: '',
    potenciaPico: '',
    potenciaInversor: '',
    numeroPaneles: '',
    marcaPaneles: '',
    fechaInstalacion: new Date().toISOString().split('T')[0],
    estado: 'ACTIVO',
    buildingId: '',
    notas: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch buildings
      const buildingsRes = await fetch('/api/buildings');
      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      }

      // Fetch solar installations
      const res = await fetch('/api/energy/solar');
      if (res.ok) {
        const data = await res.json();
        setInstallations(Array.isArray(data) ? data : []);
      } else {
        setInstallations([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setInstallations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/energy/solar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          potenciaPico: parseFloat(formData.potenciaPico),
          potenciaInversor: parseFloat(formData.potenciaInversor),
          numeroPaneles: parseInt(formData.numeroPaneles),
        }),
      });

      if (res.ok) {
        toast.success('Instalación solar creada correctamente');
        setCreateDialogOpen(false);
        setFormData(emptyForm);
        fetchData();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Error al crear instalación');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear instalación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallation) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/energy/solar/${selectedInstallation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          potenciaPico: parseFloat(formData.potenciaPico),
          potenciaInversor: parseFloat(formData.potenciaInversor),
          numeroPaneles: parseInt(formData.numeroPaneles),
        }),
      });

      if (res.ok) {
        toast.success('Instalación actualizada correctamente');
        setEditDialogOpen(false);
        setSelectedInstallation(null);
        setFormData(emptyForm);
        fetchData();
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      toast.error('Error al actualizar la instalación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInstallation) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/energy/solar/${selectedInstallation.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Instalación eliminada');
        setDeleteDialogOpen(false);
        setSelectedInstallation(null);
        fetchData();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la instalación');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (installation: SolarInstallation) => {
    setSelectedInstallation(installation);
    setFormData({
      nombre: installation.nombre,
      ubicacion: installation.ubicacion,
      potenciaPico: installation.potenciaPico.toString(),
      potenciaInversor: installation.potenciaInversor.toString(),
      numeroPaneles: installation.numeroPaneles.toString(),
      marcaPaneles: installation.marcaPaneles,
      fechaInstalacion: installation.fechaInstalacion.split('T')[0],
      estado: installation.estado,
      buildingId: installation.buildingId || '',
      notas: installation.notas || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (installation: SolarInstallation) => {
    setSelectedInstallation(installation);
    setDeleteDialogOpen(true);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'MANTENIMIENTO':
        return <Badge className="bg-yellow-500">Mantenimiento</Badge>;
      default:
        return <Badge variant="outline">Inactivo</Badge>;
    }
  };

  // Calcular estadísticas
  const stats = {
    totalInstalaciones: installations.length,
    potenciaTotal: installations.reduce((sum, i) => sum + i.potenciaPico, 0),
    produccionMensual: installations.reduce((sum, i) => sum + (i.produccionMensual || 0), 0),
    ahorroMensual: installations.reduce((sum, i) => sum + (i.ahorroMensual || 0), 0),
    co2Evitado: installations.reduce((sum, i) => sum + (i.co2Evitado || 0), 0),
    activas: installations.filter((i) => i.estado === 'ACTIVO').length,
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Cargando instalaciones...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
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
                  <BreadcrumbPage>Energía Solar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Sun className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold">Energía Solar</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de instalaciones fotovoltaicas
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Instalación
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                Instalaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInstalaciones}</div>
              <p className="text-xs text-muted-foreground">{stats.activas} activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Potencia Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.potenciaTotal.toFixed(1)} kWp</div>
              <p className="text-xs text-muted-foreground">Capacidad instalada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Battery className="h-4 w-4 text-green-500" />
                Producción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.produccionMensual.toLocaleString()} kWh</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Ahorro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">€{stats.ahorroMensual.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                CO₂ Evitado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.co2Evitado.toFixed(0)} kg</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de instalaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Instalaciones Fotovoltaicas</CardTitle>
            <CardDescription>
              Gestiona las instalaciones de paneles solares en tus propiedades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {installations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sun className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay instalaciones solares</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Registra tu primera instalación fotovoltaica
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Instalación
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instalación</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Potencia</TableHead>
                    <TableHead>Paneles</TableHead>
                    <TableHead>Producción</TableHead>
                    <TableHead>Ahorro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installations.map((installation) => (
                    <TableRow key={installation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="font-medium">{installation.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {installation.marcaPaneles}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{installation.ubicacion}</p>
                        {installation.buildingName && (
                          <p className="text-xs text-muted-foreground">{installation.buildingName}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{installation.potenciaPico} kWp</p>
                        <p className="text-xs text-muted-foreground">
                          Inv: {installation.potenciaInversor} kW
                        </p>
                      </TableCell>
                      <TableCell>{installation.numeroPaneles}</TableCell>
                      <TableCell>
                        <p className="font-medium">{(installation.produccionMensual || 0).toLocaleString()} kWh</p>
                        <p className="text-xs text-muted-foreground">mensual</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-emerald-600">
                          €{(installation.ahorroMensual || 0).toFixed(0)}
                        </p>
                      </TableCell>
                      <TableCell>{getEstadoBadge(installation.estado)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => undefined}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(installation)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(installation)}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Instalación Solar</DialogTitle>
              <DialogDescription>
                Registra una nueva instalación fotovoltaica
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Instalación Edificio A"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                      placeholder="Azotea Bloque 1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Potencia Pico (kWp) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.potenciaPico}
                      onChange={(e) => setFormData({ ...formData, potenciaPico: e.target.value })}
                      placeholder="10.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Potencia Inversor (kW) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.potenciaInversor}
                      onChange={(e) => setFormData({ ...formData, potenciaInversor: e.target.value })}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Paneles *</Label>
                    <Input
                      type="number"
                      value={formData.numeroPaneles}
                      onChange={(e) => setFormData({ ...formData, numeroPaneles: e.target.value })}
                      placeholder="24"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marca de Paneles</Label>
                    <Select
                      value={formData.marcaPaneles}
                      onValueChange={(value) => setFormData({ ...formData, marcaPaneles: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JinkoSolar">JinkoSolar</SelectItem>
                        <SelectItem value="LONGi">LONGi</SelectItem>
                        <SelectItem value="Trina Solar">Trina Solar</SelectItem>
                        <SelectItem value="Canadian Solar">Canadian Solar</SelectItem>
                        <SelectItem value="JA Solar">JA Solar</SelectItem>
                        <SelectItem value="Risen Energy">Risen Energy</SelectItem>
                        <SelectItem value="SunPower">SunPower</SelectItem>
                        <SelectItem value="Otra">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Instalación</Label>
                    <Input
                      type="date"
                      value={formData.fechaInstalacion}
                      onChange={(e) => setFormData({ ...formData, fechaInstalacion: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Edificio (opcional)</Label>
                    <Select
                      value={formData.buildingId}
                      onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar edificio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="MANTENIMIENTO">En Mantenimiento</SelectItem>
                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Información adicional sobre la instalación..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Instalación'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Instalación Solar</DialogTitle>
              <DialogDescription>
                Modifica los datos de la instalación fotovoltaica
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Potencia Pico (kWp) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.potenciaPico}
                      onChange={(e) => setFormData({ ...formData, potenciaPico: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Potencia Inversor (kW) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.potenciaInversor}
                      onChange={(e) => setFormData({ ...formData, potenciaInversor: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Paneles *</Label>
                    <Input
                      type="number"
                      value={formData.numeroPaneles}
                      onChange={(e) => setFormData({ ...formData, numeroPaneles: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marca de Paneles</Label>
                    <Select
                      value={formData.marcaPaneles}
                      onValueChange={(value) => setFormData({ ...formData, marcaPaneles: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JinkoSolar">JinkoSolar</SelectItem>
                        <SelectItem value="LONGi">LONGi</SelectItem>
                        <SelectItem value="Trina Solar">Trina Solar</SelectItem>
                        <SelectItem value="Canadian Solar">Canadian Solar</SelectItem>
                        <SelectItem value="JA Solar">JA Solar</SelectItem>
                        <SelectItem value="Risen Energy">Risen Energy</SelectItem>
                        <SelectItem value="SunPower">SunPower</SelectItem>
                        <SelectItem value="Otra">Otra</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="MANTENIMIENTO">En Mantenimiento</SelectItem>
                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={3}
                  />
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
              <DialogTitle>¿Eliminar instalación solar?</DialogTitle>
              <DialogDescription>
                Esta acción eliminará permanentemente la instalación &quot;{selectedInstallation?.nombre}&quot;.
                Esta acción no se puede deshacer.
              </DialogDescription>
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
