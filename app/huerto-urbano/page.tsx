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
  MapPin,
  Users,
  Droplets,
  Sun,
  Leaf,
  CheckCircle,
  AlertCircle,
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
  precioParcela: number; // €/mes
  tipoRiego: string; // MANUAL, GOTEO, ASPERSION
  estado: string; // ACTIVO, INACTIVO, MANTENIMIENTO
  buildingId?: string;
  buildingName?: string;
  amenities: string[];
  descripcion?: string;
}

interface GardenPlot {
  id: string;
  gardenId: string;
  gardenName: string;
  numero: string;
  superficie: number; // m²
  cultivos: string[];
  inquilino?: string;
  inquilinoId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado: string; // DISPONIBLE, OCUPADA, RESERVADA
  ultimoRiego?: string;
}

export default function HuertoUrbanoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [gardens, setGardens] = useState<UrbanGarden[]>([]);
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createGardenOpen, setCreateGardenOpen] = useState(false);
  const [editGardenOpen, setEditGardenOpen] = useState(false);
  const [deleteGardenOpen, setDeleteGardenOpen] = useState(false);
  const [createPlotOpen, setCreatePlotOpen] = useState(false);
  const [selectedGarden, setSelectedGarden] = useState<UrbanGarden | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<GardenPlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);

  const emptyGardenForm = {
    nombre: '',
    ubicacion: '',
    superficie: '',
    numeroParcelas: '',
    precioParcela: '',
    tipoRiego: 'GOTEO',
    estado: 'ACTIVO',
    buildingId: '',
    descripcion: '',
    amenities: '',
  };

  const emptyPlotForm = {
    gardenId: '',
    numero: '',
    superficie: '',
    cultivos: '',
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
        fetch('/api/gardens'),
        fetch('/api/gardens/plots'),
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
      const res = await fetch('/api/gardens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gardenForm,
          superficie: parseFloat(gardenForm.superficie),
          numeroParcelas: parseInt(gardenForm.numeroParcelas),
          precioParcela: parseFloat(gardenForm.precioParcela),
          amenities: gardenForm.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success('Huerto creado correctamente');
        setCreateGardenOpen(false);
        setGardenForm(emptyGardenForm);
        fetchData();
      } else {
        throw new Error('Error al crear huerto');
      }
    } catch (error) {
      toast.error('Error al crear el huerto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGarden) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/gardens/${selectedGarden.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gardenForm,
          superficie: parseFloat(gardenForm.superficie),
          numeroParcelas: parseInt(gardenForm.numeroParcelas),
          precioParcela: parseFloat(gardenForm.precioParcela),
          amenities: gardenForm.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success('Huerto actualizado');
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
      const res = await fetch(`/api/gardens/${selectedGarden.id}`, {
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
      const res = await fetch('/api/gardens/plots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plotForm,
          superficie: parseFloat(plotForm.superficie),
          cultivos: plotForm.cultivos.split(',').map((c) => c.trim()).filter(Boolean),
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
      precioParcela: garden.precioParcela.toString(),
      tipoRiego: garden.tipoRiego,
      estado: garden.estado,
      buildingId: garden.buildingId || '',
      descripcion: garden.descripcion || '',
      amenities: garden.amenities?.join(', ') || '',
    });
    setEditGardenOpen(true);
  };

  const openDeleteGarden = (garden: UrbanGarden) => {
    setSelectedGarden(garden);
    setDeleteGardenOpen(true);
  };

  const getTipoRiegoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      MANUAL: 'Manual',
      GOTEO: 'Riego por Goteo',
      ASPERSION: 'Aspersión',
      AUTOMATICO: 'Automático',
    };
    return tipos[tipo] || tipo;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'INACTIVO':
        return <Badge variant="outline">Inactivo</Badge>;
      case 'MANTENIMIENTO':
        return <Badge className="bg-yellow-500">Mantenimiento</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getPlotEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return <Badge className="bg-green-500">Disponible</Badge>;
      case 'OCUPADA':
        return <Badge className="bg-blue-500">Ocupada</Badge>;
      case 'RESERVADA':
        return <Badge className="bg-yellow-500">Reservada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  // Stats
  const stats = {
    totalHuertos: gardens.length,
    totalParcelas: gardens.reduce((sum, g) => sum + g.numeroParcelas, 0),
    parcelasDisponibles: gardens.reduce((sum, g) => sum + g.parcelasDisponibles, 0),
    superficieTotal: gardens.reduce((sum, g) => sum + g.superficie, 0),
  };

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
                  <BreadcrumbPage>Huerto Urbano</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Sprout className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold">Huerto Urbano</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de huertos urbanos y parcelas de cultivo
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreatePlotOpen(true)} disabled={gardens.length === 0}>
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sprout className="h-4 w-4 text-green-600" />
                Huertos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHuertos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Parcelas Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParcelas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.parcelasDisponibles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                Superficie Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.superficieTotal} m²</div>
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
              <Leaf className="h-4 w-4 mr-2" />
              Parcelas
            </TabsTrigger>
          </TabsList>

          {/* Gardens Tab */}
          <TabsContent value="gardens">
            <Card>
              <CardHeader>
                <CardTitle>Huertos Urbanos</CardTitle>
                <CardDescription>Gestiona los huertos comunitarios</CardDescription>
              </CardHeader>
              <CardContent>
                {gardens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sprout className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay huertos registrados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crea tu primer huerto urbano
                    </p>
                    <Button onClick={() => setCreateGardenOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Huerto
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {gardens.map((garden) => (
                      <Card key={garden.id} className="hover:shadow-lg transition-shadow">
                        <div className="h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-t-lg flex items-center justify-center relative">
                          <Sprout className="h-16 w-16 text-green-300" />
                          <div className="absolute top-2 right-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{garden.nombre}</CardTitle>
                            {getEstadoBadge(garden.estado)}
                          </div>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {garden.ubicacion}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Superficie:</span>
                              <span className="ml-1 font-medium">{garden.superficie} m²</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Precio:</span>
                              <span className="ml-1 font-medium">€{garden.precioParcela}/mes</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Parcelas:</span>
                              <span className="font-medium">
                                {garden.parcelasDisponibles} / {garden.numeroParcelas} disponibles
                              </span>
                            </div>
                            <Progress
                              value={((garden.numeroParcelas - garden.parcelasDisponibles) / garden.numeroParcelas) * 100}
                              className="h-2"
                            />
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <span>{getTipoRiegoLabel(garden.tipoRiego)}</span>
                          </div>

                          {garden.amenities && garden.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {garden.amenities.slice(0, 3).map((amenity, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {garden.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{garden.amenities.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plots Tab */}
          <TabsContent value="plots">
            <Card>
              <CardHeader>
                <CardTitle>Parcelas</CardTitle>
                <CardDescription>Estado de todas las parcelas de cultivo</CardDescription>
              </CardHeader>
              <CardContent>
                {plots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay parcelas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Las parcelas se crean automáticamente con los huertos o puedes añadirlas manualmente
                    </p>
                    {gardens.length > 0 && (
                      <Button onClick={() => setCreatePlotOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Parcela
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Huerto</TableHead>
                        <TableHead>Superficie</TableHead>
                        <TableHead>Cultivos</TableHead>
                        <TableHead>Inquilino</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plots.map((plot) => (
                        <TableRow key={plot.id}>
                          <TableCell className="font-medium">{plot.numero}</TableCell>
                          <TableCell>{plot.gardenName}</TableCell>
                          <TableCell>{plot.superficie} m²</TableCell>
                          <TableCell>
                            {plot.cultivos.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {plot.cultivos.map((c, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sin cultivos</span>
                            )}
                          </TableCell>
                          <TableCell>{plot.inquilino || '-'}</TableCell>
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
                      placeholder="Huerto Azotea Norte"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={gardenForm.ubicacion}
                      onChange={(e) => setGardenForm({ ...gardenForm, ubicacion: e.target.value })}
                      placeholder="Azotea Bloque A"
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
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Parcelas *</Label>
                    <Input
                      type="number"
                      value={gardenForm.numeroParcelas}
                      onChange={(e) => setGardenForm({ ...gardenForm, numeroParcelas: e.target.value })}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio/mes (€) *</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={gardenForm.precioParcela}
                      onChange={(e) => setGardenForm({ ...gardenForm, precioParcela: e.target.value })}
                      placeholder="15"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="GOTEO">Riego por Goteo</SelectItem>
                        <SelectItem value="ASPERSION">Aspersión</SelectItem>
                        <SelectItem value="AUTOMATICO">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>

                <div className="space-y-2">
                  <Label>Amenities (separadas por coma)</Label>
                  <Input
                    value={gardenForm.amenities}
                    onChange={(e) => setGardenForm({ ...gardenForm, amenities: e.target.value })}
                    placeholder="Herramientas, Compostador, Banco, Agua"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={gardenForm.descripcion}
                    onChange={(e) => setGardenForm({ ...gardenForm, descripcion: e.target.value })}
                    placeholder="Información adicional sobre el huerto..."
                    rows={3}
                  />
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
                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                        <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={gardenForm.ubicacion}
                      onChange={(e) => setGardenForm({ ...gardenForm, ubicacion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio/mes (€)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={gardenForm.precioParcela}
                      onChange={(e) => setGardenForm({ ...gardenForm, precioParcela: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amenities (separadas por coma)</Label>
                  <Input
                    value={gardenForm.amenities}
                    onChange={(e) => setGardenForm({ ...gardenForm, amenities: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={gardenForm.descripcion}
                    onChange={(e) => setGardenForm({ ...gardenForm, descripcion: e.target.value })}
                    rows={3}
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
              <DialogDescription>Añade una parcela de cultivo a un huerto</DialogDescription>
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
                      step="0.5"
                      value={plotForm.superficie}
                      onChange={(e) => setPlotForm({ ...plotForm, superficie: e.target.value })}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cultivos (separados por coma)</Label>
                  <Input
                    value={plotForm.cultivos}
                    onChange={(e) => setPlotForm({ ...plotForm, cultivos: e.target.value })}
                    placeholder="Tomates, Lechugas, Zanahorias"
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
