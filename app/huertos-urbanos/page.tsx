'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Sprout,
  Plus,
  Home,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Users,
  MapPin,
  Droplets,
  Sun,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UrbanGarden {
  id: string;
  nombre: string;
  ubicacion: string;
  superficie: number; // m²
  numeroParcelas: number;
  parcelasDisponibles: number;
  tipoRiego: string; // GOTEO, ASPERSION, MANUAL
  estado: string; // ACTIVO, MANTENIMIENTO, CERRADO
  fechaInauguracion: string;
  horario: string;
  precioMensual: number;
  buildingId?: string;
  buildingName?: string;
  descripcion?: string;
  cultivosPermitidos?: string;
  servicios?: string;
}

interface GardenPlot {
  id: string;
  gardenId: string;
  gardenName: string;
  numero: string;
  superficie: number;
  estado: string; // DISPONIBLE, ASIGNADA, RESERVADA
  arrendatario?: string;
  arrendatarioEmail?: string;
  fechaInicio?: string;
  fechaFin?: string;
  cultivoActual?: string;
}

export default function HuertosUrbanosPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [gardens, setGardens] = useState<UrbanGarden[]>([]);
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createGardenOpen, setCreateGardenOpen] = useState(false);
  const [editGardenOpen, setEditGardenOpen] = useState(false);
  const [deleteGardenOpen, setDeleteGardenOpen] = useState(false);
  const [createPlotOpen, setCreatePlotOpen] = useState(false);
  const [selectedGarden, setSelectedGarden] = useState<UrbanGarden | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);

  const emptyGardenForm = {
    nombre: '',
    ubicacion: '',
    superficie: '',
    numeroParcelas: '',
    tipoRiego: 'GOTEO',
    estado: 'ACTIVO',
    fechaInauguracion: format(new Date(), 'yyyy-MM-dd'),
    horario: '08:00 - 20:00',
    precioMensual: '',
    buildingId: '',
    descripcion: '',
    cultivosPermitidos: '',
    servicios: '',
  };

  const emptyPlotForm = {
    gardenId: '',
    numero: '',
    superficie: '',
    estado: 'DISPONIBLE',
    cultivoActual: '',
  };

  const [gardenForm, setGardenForm] = useState(emptyGardenForm);
  const [plotForm, setPlotForm] = useState(emptyPlotForm);

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
      const [buildingsRes, gardensRes, plotsRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/innovation/urban-gardens'),
        fetch('/api/innovation/urban-gardens/plots'),
      ]);

      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(Array.isArray(data) ? data : []);
      }

      if (gardensRes.ok) {
        const data = await gardensRes.json();
        setGardens(Array.isArray(data) ? data : []);
      }

      if (plotsRes.ok) {
        const data = await plotsRes.json();
        setPlots(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGarden = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/innovation/urban-gardens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gardenForm,
          superficie: parseFloat(gardenForm.superficie),
          numeroParcelas: parseInt(gardenForm.numeroParcelas),
          precioMensual: parseFloat(gardenForm.precioMensual),
        }),
      });

      if (res.ok) {
        toast.success('Huerto urbano creado correctamente');
        setCreateGardenOpen(false);
        setGardenForm(emptyGardenForm);
        fetchData();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Error al crear huerto');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el huerto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGarden) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/innovation/urban-gardens/${selectedGarden.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gardenForm,
          superficie: parseFloat(gardenForm.superficie),
          numeroParcelas: parseInt(gardenForm.numeroParcelas),
          precioMensual: parseFloat(gardenForm.precioMensual),
        }),
      });

      if (res.ok) {
        toast.success('Huerto actualizado correctamente');
        setEditGardenOpen(false);
        setSelectedGarden(null);
        setGardenForm(emptyGardenForm);
        fetchData();
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      toast.error('Error al actualizar el huerto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGarden = async () => {
    if (!selectedGarden) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/innovation/urban-gardens/${selectedGarden.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Huerto eliminado');
        setDeleteGardenOpen(false);
        setSelectedGarden(null);
        fetchData();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar el huerto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/innovation/urban-gardens/plots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plotForm,
          superficie: parseFloat(plotForm.superficie),
        }),
      });

      if (res.ok) {
        toast.success('Parcela creada correctamente');
        setCreatePlotOpen(false);
        setPlotForm(emptyPlotForm);
        fetchData();
      } else {
        throw new Error('Error al crear parcela');
      }
    } catch (error) {
      toast.error('Error al crear la parcela');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditGarden = (garden: UrbanGarden) => {
    setSelectedGarden(garden);
    setGardenForm({
      nombre: garden.nombre,
      ubicacion: garden.ubicacion,
      superficie: garden.superficie.toString(),
      numeroParcelas: garden.numeroParcelas.toString(),
      tipoRiego: garden.tipoRiego,
      estado: garden.estado,
      fechaInauguracion: garden.fechaInauguracion.split('T')[0],
      horario: garden.horario,
      precioMensual: garden.precioMensual.toString(),
      buildingId: garden.buildingId || '',
      descripcion: garden.descripcion || '',
      cultivosPermitidos: garden.cultivosPermitidos || '',
      servicios: garden.servicios || '',
    });
    setEditGardenOpen(true);
  };

  const openDeleteGarden = (garden: UrbanGarden) => {
    setSelectedGarden(garden);
    setDeleteGardenOpen(true);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'MANTENIMIENTO':
        return <Badge className="bg-yellow-500">Mantenimiento</Badge>;
      case 'CERRADO':
        return <Badge variant="outline">Cerrado</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getPlotEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return <Badge className="bg-green-500">Disponible</Badge>;
      case 'ASIGNADA':
        return <Badge className="bg-blue-500">Asignada</Badge>;
      case 'RESERVADA':
        return <Badge className="bg-yellow-500">Reservada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getTipoRiegoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      GOTEO: 'Goteo',
      ASPERSION: 'Aspersión',
      MANUAL: 'Manual',
      AUTOMATICO: 'Automático',
    };
    return tipos[tipo] || tipo;
  };

  // Stats
  const stats = {
    totalGardens: gardens.length,
    totalParcelas: gardens.reduce((sum, g) => sum + g.numeroParcelas, 0),
    parcelasDisponibles: gardens.reduce((sum, g) => sum + (g.parcelasDisponibles || 0), 0),
    superficieTotal: gardens.reduce((sum, g) => sum + g.superficie, 0),
    gardensActivos: gardens.filter((g) => g.estado === 'ACTIVO').length,
  };

  const ocupacion =
    stats.totalParcelas > 0
      ? (((stats.totalParcelas - stats.parcelasDisponibles) / stats.totalParcelas) * 100).toFixed(1)
      : 0;

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Cargando huertos...</p>
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
                  <BreadcrumbPage>Huertos Urbanos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Sprout className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold">Huertos Urbanos</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de huertos comunitarios y parcelas
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreatePlotOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Parcela
            </Button>
            <Button onClick={() => setCreateGardenOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Huerto
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sprout className="h-4 w-4 text-green-600" />
                Huertos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGardens}</div>
              <p className="text-xs text-muted-foreground">{stats.gardensActivos} activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                Parcelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParcelas}</div>
              <p className="text-xs text-muted-foreground">{stats.parcelasDisponibles} disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                Superficie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.superficieTotal.toLocaleString()} m²</div>
              <p className="text-xs text-muted-foreground">Total cultivable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Ocupación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ocupacion}%</div>
              <Progress value={Number(ocupacion)} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-500" />
                Eco Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{(stats.superficieTotal * 2.5).toFixed(0)} kg</div>
              <p className="text-xs text-muted-foreground">CO₂ absorbido/año</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="gardens" className="space-y-4">
          <TabsList>
            <TabsTrigger value="gardens">
              <Sprout className="h-4 w-4 mr-2" />
              Huertos
            </TabsTrigger>
            <TabsTrigger value="plots">
              <MapPin className="h-4 w-4 mr-2" />
              Parcelas
            </TabsTrigger>
          </TabsList>

          {/* Gardens Tab */}
          <TabsContent value="gardens">
            <Card>
              <CardHeader>
                <CardTitle>Huertos Comunitarios</CardTitle>
                <CardDescription>Gestiona los huertos urbanos de tus propiedades</CardDescription>
              </CardHeader>
              <CardContent>
                {gardens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sprout className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay huertos registrados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crea tu primer huerto urbano comunitario
                    </p>
                    <Button onClick={() => setCreateGardenOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Huerto
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Huerto</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Superficie</TableHead>
                        <TableHead>Parcelas</TableHead>
                        <TableHead>Riego</TableHead>
                        <TableHead>Precio/mes</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gardens.map((garden) => (
                        <TableRow key={garden.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Sprout className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="font-medium">{garden.nombre}</p>
                                <p className="text-xs text-muted-foreground">{garden.horario}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {garden.ubicacion}
                            </div>
                            {garden.buildingName && (
                              <p className="text-xs text-muted-foreground">{garden.buildingName}</p>
                            )}
                          </TableCell>
                          <TableCell>{garden.superficie} m²</TableCell>
                          <TableCell>
                            <span className="font-medium">{garden.parcelasDisponibles || 0}</span>
                            <span className="text-muted-foreground">/{garden.numeroParcelas}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <Droplets className="h-3 w-3" />
                              {getTipoRiegoLabel(garden.tipoRiego)}
                            </Badge>
                          </TableCell>
                          <TableCell>€{garden.precioMensual}/mes</TableCell>
                          <TableCell>{getEstadoBadge(garden.estado)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditGarden(garden)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteGarden(garden)}
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
          </TabsContent>

          {/* Plots Tab */}
          <TabsContent value="plots">
            <Card>
              <CardHeader>
                <CardTitle>Parcelas</CardTitle>
                <CardDescription>Gestión de parcelas individuales</CardDescription>
              </CardHeader>
              <CardContent>
                {plots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay parcelas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crea parcelas para tus huertos
                    </p>
                    <Button onClick={() => setCreatePlotOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Parcela
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Huerto</TableHead>
                        <TableHead>Superficie</TableHead>
                        <TableHead>Arrendatario</TableHead>
                        <TableHead>Cultivo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plots.map((plot) => (
                        <TableRow key={plot.id}>
                          <TableCell className="font-medium">Parcela {plot.numero}</TableCell>
                          <TableCell>{plot.gardenName}</TableCell>
                          <TableCell>{plot.superficie} m²</TableCell>
                          <TableCell>{plot.arrendatario || '-'}</TableCell>
                          <TableCell>{plot.cultivoActual || '-'}</TableCell>
                          <TableCell>{getPlotEstadoBadge(plot.estado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Garden Dialog */}
        <Dialog open={createGardenOpen} onOpenChange={setCreateGardenOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Huerto Urbano</DialogTitle>
              <DialogDescription>Registra un nuevo huerto comunitario</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGarden}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={gardenForm.nombre}
                      onChange={(e) => setGardenForm({ ...gardenForm, nombre: e.target.value })}
                      placeholder="Huerto Comunitario Norte"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={gardenForm.ubicacion}
                      onChange={(e) => setGardenForm({ ...gardenForm, ubicacion: e.target.value })}
                      placeholder="Zona jardín, Bloque 2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Superficie (m²) *</Label>
                    <Input
                      type="number"
                      value={gardenForm.superficie}
                      onChange={(e) => setGardenForm({ ...gardenForm, superficie: e.target.value })}
                      placeholder="500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Parcelas *</Label>
                    <Input
                      type="number"
                      value={gardenForm.numeroParcelas}
                      onChange={(e) => setGardenForm({ ...gardenForm, numeroParcelas: e.target.value })}
                      placeholder="20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio/mes (€)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={gardenForm.precioMensual}
                      onChange={(e) => setGardenForm({ ...gardenForm, precioMensual: e.target.value })}
                      placeholder="25"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Riego</Label>
                    <Select
                      value={gardenForm.tipoRiego}
                      onValueChange={(value) => setGardenForm({ ...gardenForm, tipoRiego: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOTEO">Goteo</SelectItem>
                        <SelectItem value="ASPERSION">Aspersión</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="AUTOMATICO">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Horario</Label>
                    <Input
                      value={gardenForm.horario}
                      onChange={(e) => setGardenForm({ ...gardenForm, horario: e.target.value })}
                      placeholder="08:00 - 20:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Inauguración</Label>
                    <Input
                      type="date"
                      value={gardenForm.fechaInauguracion}
                      onChange={(e) => setGardenForm({ ...gardenForm, fechaInauguracion: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Edificio (opcional)</Label>
                    <Select
                      value={gardenForm.buildingId}
                      onValueChange={(value) => setGardenForm({ ...gardenForm, buildingId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {buildings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={gardenForm.estado}
                      onValueChange={(value) => setGardenForm({ ...gardenForm, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="MANTENIMIENTO">En Mantenimiento</SelectItem>
                        <SelectItem value="CERRADO">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={gardenForm.descripcion}
                    onChange={(e) => setGardenForm({ ...gardenForm, descripcion: e.target.value })}
                    placeholder="Descripción del huerto..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cultivos Permitidos</Label>
                    <Textarea
                      value={gardenForm.cultivosPermitidos}
                      onChange={(e) => setGardenForm({ ...gardenForm, cultivosPermitidos: e.target.value })}
                      placeholder="Tomates, lechugas, calabacines..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Servicios</Label>
                    <Textarea
                      value={gardenForm.servicios}
                      onChange={(e) => setGardenForm({ ...gardenForm, servicios: e.target.value })}
                      placeholder="Caseta herramientas, compostaje..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateGardenOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Huerto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Garden Dialog */}
        <Dialog open={editGardenOpen} onOpenChange={setEditGardenOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Huerto</DialogTitle>
              <DialogDescription>Modifica los datos del huerto</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditGarden}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={gardenForm.nombre}
                      onChange={(e) => setGardenForm({ ...gardenForm, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={gardenForm.ubicacion}
                      onChange={(e) => setGardenForm({ ...gardenForm, ubicacion: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Superficie (m²) *</Label>
                    <Input
                      type="number"
                      value={gardenForm.superficie}
                      onChange={(e) => setGardenForm({ ...gardenForm, superficie: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Parcelas *</Label>
                    <Input
                      type="number"
                      value={gardenForm.numeroParcelas}
                      onChange={(e) => setGardenForm({ ...gardenForm, numeroParcelas: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio/mes (€)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={gardenForm.precioMensual}
                      onChange={(e) => setGardenForm({ ...gardenForm, precioMensual: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Riego</Label>
                    <Select
                      value={gardenForm.tipoRiego}
                      onValueChange={(value) => setGardenForm({ ...gardenForm, tipoRiego: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOTEO">Goteo</SelectItem>
                        <SelectItem value="ASPERSION">Aspersión</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="AUTOMATICO">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={gardenForm.estado}
                      onValueChange={(value) => setGardenForm({ ...gardenForm, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="MANTENIMIENTO">En Mantenimiento</SelectItem>
                        <SelectItem value="CERRADO">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Horario</Label>
                    <Input
                      value={gardenForm.horario}
                      onChange={(e) => setGardenForm({ ...gardenForm, horario: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={gardenForm.descripcion}
                    onChange={(e) => setGardenForm({ ...gardenForm, descripcion: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditGardenOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Garden Dialog */}
        <Dialog open={deleteGardenOpen} onOpenChange={setDeleteGardenOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar huerto?</DialogTitle>
              <DialogDescription>
                Esta acción eliminará el huerto &quot;{selectedGarden?.nombre}&quot; y todas sus parcelas.
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteGardenOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteGarden} disabled={isSaving}>
                {isSaving ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Plot Dialog */}
        <Dialog open={createPlotOpen} onOpenChange={setCreatePlotOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Parcela</DialogTitle>
              <DialogDescription>Añade una parcela a un huerto</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePlot}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Huerto *</Label>
                  <Select
                    value={plotForm.gardenId}
                    onValueChange={(value) => setPlotForm({ ...plotForm, gardenId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar huerto" />
                    </SelectTrigger>
                    <SelectContent>
                      {gardens.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Parcela *</Label>
                    <Input
                      value={plotForm.numero}
                      onChange={(e) => setPlotForm({ ...plotForm, numero: e.target.value })}
                      placeholder="A-01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Superficie (m²) *</Label>
                    <Input
                      type="number"
                      value={plotForm.superficie}
                      onChange={(e) => setPlotForm({ ...plotForm, superficie: e.target.value })}
                      placeholder="25"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cultivo Actual</Label>
                  <Input
                    value={plotForm.cultivoActual}
                    onChange={(e) => setPlotForm({ ...plotForm, cultivoActual: e.target.value })}
                    placeholder="Tomates cherry, albahaca..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreatePlotOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving || !plotForm.gardenId}>
                  {isSaving ? 'Creando...' : 'Crear Parcela'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
