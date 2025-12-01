'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Home, 
  ArrowLeft, 
  Vote, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Votacion {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  opciones: string[];
  estado: 'activa' | 'cerrada' | 'cancelada';
  quorumRequerido: number;
  totalVotantes: number;
  fechaCierre: string;
  fechaResultado?: string;
  resultado?: string;
  building: {
    id: string;
    nombre: string;
  };
  votos: any[];
  createdAt: string;
}

interface DetalleVotacion extends Votacion {
  totalVotos: number;
  resultados: {
    opcion: string;
    votos: number;
    porcentaje: number;
  }[];
  quorumAlcanzado: boolean;
  opcionGanadora: {
    opcion: string;
    votos: number;
    porcentaje: number;
  } | null;
}

export default function VotacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedVotacion, setSelectedVotacion] = useState<DetalleVotacion | null>(null);
  const [editingVotacion, setEditingVotacion] = useState<Votacion | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state para nueva votación
  const [formData, setFormData] = useState({
    buildingId: '',
    titulo: '',
    descripcion: '',
    tipo: 'decision_comunidad',
    opciones: ['', ''],
    fechaCierre: '',
    quorumRequerido: 50,
    totalVotantes: 0,
  });

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadVotaciones();
      loadBuildings();
    }
  }, [status]);

  const loadVotaciones = async () => {
    try {
      const res = await fetch('/api/votaciones');
      if (res.ok) {
        const data = await res.json();
        setVotaciones(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error al cargar votaciones:', error);
      toast.error('Error al cargar votaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadBuildings = async () => {
    try {
      const res = await fetch('/api/buildings');
      if (res.ok) {
        const data = await res.json();
        setBuildings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error al cargar edificios:', error);
    }
  };

  const handleCreateVotacion = async () => {
    try {
      // Validaciones
      if (!formData.buildingId || !formData.titulo || !formData.descripcion) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      const opcionesValidas = formData.opciones.filter((o) => o.trim() !== '');
      if (opcionesValidas.length < 2) {
        toast.error('Debes proporcionar al menos 2 opciones');
        return;
      }

      const res = await fetch('/api/votaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          opciones: opcionesValidas,
        }),
      });

      if (res.ok) {
        toast.success('Votación creada correctamente');
        setOpenNewDialog(false);
        loadVotaciones();
        // Reset form
        setFormData({
          buildingId: '',
          titulo: '',
          descripcion: '',
          tipo: 'decision_comunidad',
          opciones: ['', ''],
          fechaCierre: '',
          quorumRequerido: 50,
          totalVotantes: 0,
        });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear votación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear votación');
    }
  };

  const handleViewDetail = async (votacionId: string) => {
    try {
      const res = await fetch(`/api/votaciones/${votacionId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVotacion(data);
        setOpenDetailDialog(true);
      } else {
        toast.error('Error al cargar detalles de votación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar detalles');
    }
  };

  const handleVotar = async (opcionSeleccionada: string, comentario: string) => {
    if (!selectedVotacion) return;

    try {
      const res = await fetch(`/api/votaciones/${selectedVotacion.id}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opcionSeleccionada, comentario }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Voto registrado correctamente');
        setOpenDetailDialog(false);
        loadVotaciones();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al votar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al registrar voto');
    }
  };

  const handleCerrarVotacion = async (votacionId: string) => {
    try {
      const res = await fetch(`/api/votaciones/${votacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cerrada' }),
      });

      if (res.ok) {
        toast.success('Votación cerrada correctamente');
        setOpenDetailDialog(false);
        loadVotaciones();
      } else {
        toast.error('Error al cerrar votación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cerrar votación');
    }
  };

  const handleEditVotacion = (votacion: Votacion) => {
    setEditingVotacion(votacion);
    setFormData({
      buildingId: votacion.building.id,
      titulo: votacion.titulo,
      descripcion: votacion.descripcion,
      tipo: votacion.tipo,
      opciones: votacion.opciones,
      fechaCierre: format(new Date(votacion.fechaCierre), "yyyy-MM-dd'T'HH:mm"),
      quorumRequerido: votacion.quorumRequerido,
      totalVotantes: votacion.totalVotantes,
    });
    setOpenEditDialog(true);
  };

  const handleUpdateVotacion = async () => {
    if (!editingVotacion) return;

    try {
      if (!formData.buildingId || !formData.titulo || !formData.descripcion) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      const opcionesValidas = formData.opciones.filter((o) => o.trim() !== '');
      if (opcionesValidas.length < 2) {
        toast.error('Debes proporcionar al menos 2 opciones');
        return;
      }

      const res = await fetch(`/api/votaciones/${editingVotacion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: formData.buildingId,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          opciones: opcionesValidas,
          fechaCierre: formData.fechaCierre,
          quorumRequerido: formData.quorumRequerido,
          totalVotantes: formData.totalVotantes,
        }),
      });

      if (res.ok) {
        toast.success('Votación actualizada correctamente');
        setOpenEditDialog(false);
        setEditingVotacion(null);
        resetForm();
        loadVotaciones();
      } else {
        toast.error('Error al actualizar votación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar votación');
    }
  };

  const handleDeleteVotacion = async (votacionId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta votación?')) return;

    try {
      const res = await fetch(`/api/votaciones/${votacionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Votación cancelada correctamente');
        loadVotaciones();
      } else {
        toast.error('Error al cancelar votación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cancelar votación');
    }
  };

  const resetForm = () => {
    setFormData({
      buildingId: '',
      titulo: '',
      descripcion: '',
      tipo: 'decision_comunidad',
      opciones: ['', ''],
      fechaCierre: '',
      quorumRequerido: 50,
      totalVotantes: 0,
    });
  };

  const addOpcion = () => {
    setFormData({ ...formData, opciones: [...formData.opciones, ''] });
  };

  const removeOpcion = (index: number) => {
    if (formData.opciones.length > 2) {
      const newOpciones = formData.opciones.filter((_, i) => i !== index);
      setFormData({ ...formData, opciones: newOpciones });
    }
  };

  const updateOpcion = (index: number, value: string) => {
    const newOpciones = [...formData.opciones];
    newOpciones[index] = value;
    setFormData({ ...formData, opciones: newOpciones });
  };

  // Filtrar votaciones
  const votacionesFiltradas = useMemo(() => {
    let filtered = votaciones;

    // Filtrar por estado
    if (filterEstado !== 'todas') {
      filtered = filtered.filter((v) => v.estado === filterEstado);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.building.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [votaciones, filterEstado, searchTerm]);

  // KPIs
  const totalVotaciones = votaciones.length;
  const votacionesActivas = votaciones.filter((v) => v.estado === 'activa').length;
  const votacionesCerradas = votaciones.filter((v) => v.estado === 'cerrada').length;
  const participacionPromedio = votaciones.length > 0 
    ? votaciones.reduce((sum, v) => {
        const participacion = v.totalVotantes > 0 ? (v.votos.length / v.totalVotantes) * 100 : 0;
        return sum + participacion;
      }, 0) / votaciones.length
    : 0;

  const isAdmin = session?.user?.role === 'administrador' || session?.user?.role === 'gestor';

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-full">
              <p>Cargando votaciones...</p>
            </div>
           </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </div>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Votaciones Vecinales</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Votaciones Vecinales</h1>
                <p className="text-muted-foreground mt-1">
                  Sistema de toma de decisiones comunitarias
                </p>
              </div>
              {isAdmin && (
                <>
                  <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nueva Votación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Votación</DialogTitle>
                      <DialogDescription>
                        Define la votación para la comunidad
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="building">Edificio *</Label>
                        <Select
                          value={formData.buildingId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, buildingId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar edificio" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((building) => (
                              <SelectItem key={building.id} value={building.id}>
                                {building.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="titulo">Título *</Label>
                        <Input
                          id="titulo"
                          value={formData.titulo}
                          onChange={(e) =>
                            setFormData({ ...formData, titulo: e.target.value })
                          }
                          placeholder="Ej: Renovación del ascensor"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción *</Label>
                        <Textarea
                          id="descripcion"
                          value={formData.descripcion}
                          onChange={(e) =>
                            setFormData({ ...formData, descripcion: e.target.value })
                          }
                          placeholder="Describe la propuesta..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo de Votación</Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(value) =>
                            setFormData({ ...formData, tipo: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="decision_comunidad">
                              Decisión de Comunidad
                            </SelectItem>
                            <SelectItem value="mejora">Mejora</SelectItem>
                            <SelectItem value="gasto">Gasto</SelectItem>
                            <SelectItem value="normativa">Normativa</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Opciones de Votación *</Label>
                        {formData.opciones.map((opcion, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={opcion}
                              onChange={(e) => updateOpcion(index, e.target.value)}
                              placeholder={`Opción ${index + 1}`}
                            />
                            {formData.opciones.length > 2 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeOpcion(index)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addOpcion}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Opción
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fechaCierre">Fecha de Cierre *</Label>
                          <Input
                            id="fechaCierre"
                            type="datetime-local"
                            value={formData.fechaCierre}
                            onChange={(e) =>
                              setFormData({ ...formData, fechaCierre: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="quorum">Quórum Requerido (%)</Label>
                          <Input
                            id="quorum"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.quorumRequerido}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quorumRequerido: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="totalVotantes">
                          Total de Votantes (0 = sin límite)
                        </Label>
                        <Input
                          id="totalVotantes"
                          type="number"
                          min="0"
                          value={formData.totalVotantes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              totalVotantes: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Ej: 50 (número de propietarios)"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setOpenNewDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateVotacion}>Crear Votación</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Dialog de Edición */}
                <Dialog 
                  open={openEditDialog} 
                  onOpenChange={(open) => {
                    setOpenEditDialog(open);
                    if (!open) {
                      setEditingVotacion(null);
                      resetForm();
                    }
                  }}
                >
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Editar Votación</DialogTitle>
                      <DialogDescription>
                        Modifica los detalles de la votación
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-building">Edificio *</Label>
                        <Select
                          value={formData.buildingId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, buildingId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar edificio" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((building) => (
                              <SelectItem key={building.id} value={building.id}>
                                {building.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-titulo">Título *</Label>
                        <Input
                          id="edit-titulo"
                          value={formData.titulo}
                          onChange={(e) =>
                            setFormData({ ...formData, titulo: e.target.value })
                          }
                          placeholder="Ej: Renovación del ascensor"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-descripcion">Descripción *</Label>
                        <Textarea
                          id="edit-descripcion"
                          value={formData.descripcion}
                          onChange={(e) =>
                            setFormData({ ...formData, descripcion: e.target.value })
                          }
                          placeholder="Describe la propuesta..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-tipo">Tipo de Votación</Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(value) =>
                            setFormData({ ...formData, tipo: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="decision_comunidad">
                              Decisión de Comunidad
                            </SelectItem>
                            <SelectItem value="mejora">Mejora</SelectItem>
                            <SelectItem value="gasto">Gasto</SelectItem>
                            <SelectItem value="normativa">Normativa</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Opciones de Votación *</Label>
                        {formData.opciones.map((opcion, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={opcion}
                              onChange={(e) => updateOpcion(index, e.target.value)}
                              placeholder={`Opción ${index + 1}`}
                            />
                            {formData.opciones.length > 2 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeOpcion(index)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addOpcion}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Opción
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-fechaCierre">Fecha de Cierre *</Label>
                          <Input
                            id="edit-fechaCierre"
                            type="datetime-local"
                            value={formData.fechaCierre}
                            onChange={(e) =>
                              setFormData({ ...formData, fechaCierre: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-quorum">Quórum Requerido (%)</Label>
                          <Input
                            id="edit-quorum"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.quorumRequerido}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quorumRequerido: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-totalVotantes">
                          Total de Votantes (0 = sin límite)
                        </Label>
                        <Input
                          id="edit-totalVotantes"
                          type="number"
                          min="0"
                          value={formData.totalVotantes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              totalVotantes: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Ej: 50 (número de propietarios)"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setOpenEditDialog(false);
                          setEditingVotacion(null);
                          resetForm();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdateVotacion}>Actualizar Votación</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Votaciones</CardTitle>
                <Vote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVotaciones}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activas</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{votacionesActivas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cerradas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{votacionesCerradas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participación Promedio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {participacionPromedio.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar votaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="cerrada">Cerradas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de votaciones */}
          <div className="grid gap-4">
            {votacionesFiltradas.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Vote className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No hay votaciones disponibles
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => setOpenNewDialog(true)}
                      className="mt-4"
                    >
                      Crear Primera Votación
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              votacionesFiltradas.map((votacion) => {
                const participacion = votacion.totalVotantes > 0
                  ? (votacion.votos.length / votacion.totalVotantes) * 100
                  : 0;
                const diasRestantes = Math.ceil(
                  (new Date(votacion.fechaCierre).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <Card key={votacion.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{votacion.titulo}</CardTitle>
                            <Badge
                              variant={
                                votacion.estado === 'activa'
                                  ? 'default'
                                  : votacion.estado === 'cerrada'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {votacion.estado === 'activa'
                                ? 'Activa'
                                : votacion.estado === 'cerrada'
                                ? 'Cerrada'
                                : 'Cancelada'}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {votacion.descripcion}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {votacion.votos.length} / {votacion.totalVotantes || '∞'} votos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {votacion.estado === 'activa' && diasRestantes > 0
                                ? `${diasRestantes} días restantes`
                                : votacion.estado === 'activa' && diasRestantes <= 0
                                ? 'Vencida'
                                : format(new Date(votacion.fechaCierre), 'dd/MM/yyyy', {
                                    locale: es,
                                  })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>Quórum: {votacion.quorumRequerido}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>{votacion.opciones.length} opciones</span>
                          </div>
                        </div>

                        {votacion.totalVotantes > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Participación</span>
                              <span className="font-medium">{participacion.toFixed(1)}%</span>
                            </div>
                            <Progress value={participacion} className="h-2" />
                          </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleViewDetail(votacion.id)}
                              className="flex-1"
                            >
                              Ver Resultados
                            </Button>
                            {votacion.estado === 'activa' && !isAdmin && (
                              <Button
                                onClick={() => handleViewDetail(votacion.id)}
                                className="flex-1"
                              >
                                Votar Ahora
                              </Button>
                            )}
                            {votacion.estado === 'activa' && isAdmin && (
                              <Button
                                variant="destructive"
                                onClick={() => handleCerrarVotacion(votacion.id)}
                              >
                                Cerrar Votación
                              </Button>
                            )}
                          </div>
                          {votacion.estado === 'activa' && isAdmin && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditVotacion(votacion)}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVotacion(votacion.id)}
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Dialog de Detalle y Votación */}
          <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {selectedVotacion && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <DialogTitle>{selectedVotacion.titulo}</DialogTitle>
                      <Badge
                        variant={
                          selectedVotacion.estado === 'activa'
                            ? 'default'
                            : selectedVotacion.estado === 'cerrada'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {selectedVotacion.estado}
                      </Badge>
                    </div>
                    <DialogDescription>
                      {selectedVotacion.descripcion}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Información general */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Edificio:</span>
                        <p className="font-medium">{selectedVotacion.building.nombre}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha cierre:</span>
                        <p className="font-medium">
                          {format(
                            new Date(selectedVotacion.fechaCierre),
                            "dd/MM/yyyy HH:mm 'h'",
                            { locale: es }
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total votos:</span>
                        <p className="font-medium">
                          {selectedVotacion.totalVotos} /{' '}
                          {selectedVotacion.totalVotantes || '∞'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quórum:</span>
                        <p className="font-medium">
                          {selectedVotacion.quorumAlcanzado ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Alcanzado
                            </span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              No alcanzado ({selectedVotacion.quorumRequerido}%)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Resultados */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Resultados</h3>
                      {selectedVotacion.resultados.map((resultado, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{resultado.opcion}</span>
                            <span className="text-muted-foreground">
                              {resultado.votos} votos ({resultado.porcentaje.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={resultado.porcentaje} className="h-2" />
                        </div>
                      ))}

                      {selectedVotacion.opcionGanadora && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-semibold text-green-700 dark:text-green-300">
                                Opción Ganadora
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {selectedVotacion.opcionGanadora.opcion} con{' '}
                                {selectedVotacion.opcionGanadora.votos} votos (
                                {selectedVotacion.opcionGanadora.porcentaje.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Opciones de votación para inquilinos */}
                    {selectedVotacion.estado === 'activa' && !isAdmin && (
                      <>
                        <Separator />
                        <VotarForm
                          opciones={selectedVotacion.opciones}
                          onVotar={handleVotar}
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
           </div>
        </main>
      </div>
    </div>
  );
}

// Componente auxiliar para el formulario de votación
function VotarForm({
  opciones,
  onVotar,
}: {
  opciones: string[];
  onVotar: (opcion: string, comentario: string) => void;
}) {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState('');
  const [comentario, setComentario] = useState('');

  const handleSubmit = () => {
    if (!opcionSeleccionada) {
      toast.error('Por favor selecciona una opción');
      return;
    }
    onVotar(opcionSeleccionada, comentario);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Emitir Voto</h3>
      <div className="space-y-2">
        <Label>Selecciona tu opción *</Label>
        <Select value={opcionSeleccionada} onValueChange={setOpcionSeleccionada}>
          <SelectTrigger>
            <SelectValue placeholder="Elige una opción..." />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((opcion, index) => (
              <SelectItem key={index} value={opcion}>
                {opcion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comentario">Comentario (opcional)</Label>
        <Textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comparte tu opinión..."
          rows={3}
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        <Vote className="h-4 w-4 mr-2" />
        Confirmar Voto
      </Button>
    </div>
  );
}
