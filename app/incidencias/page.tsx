'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { ContextualQuickActions } from '@/components/navigation/contextual-quick-actions';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  AlertTriangle,
  MessageSquare,
  Edit,
  Trash2,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import logger, { logError } from '@/lib/logger';

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  prioridad: string;
  ubicacion?: string;
  fotos: string[];
  building: { nombre: string };
  unit?: { numero: string };
  asignadoA?: string | null;
  createdAt: string;
  fechaResolucion?: string;
  costoFinal?: number;
}

const KANBAN_COLUMNS = [
  { id: 'abierta', label: 'Abierta', estados: ['abierta'], headerColor: 'border-l-4 border-l-red-500' },
  { id: 'asignada', label: 'Asignada', estados: ['asignada'], headerColor: 'border-l-4 border-l-orange-500' },
  { id: 'en_proceso', label: 'En Progreso', estados: ['en_proceso'], headerColor: 'border-l-4 border-l-amber-500' },
  { id: 'resuelta', label: 'Resuelta', estados: ['resuelta'], headerColor: 'border-l-4 border-l-green-500' },
  { id: 'cerrada', label: 'Cerrada', estados: ['cerrada'], headerColor: 'border-l-4 border-l-slate-500' },
] as const;

function getNextIncidentEstado(current: string): string | null {
  const order: Record<string, string> = {
    abierta: 'asignada',
    asignada: 'en_proceso',
    en_proceso: 'resuelta',
    resuelta: 'cerrada',
    cerrada: null,
    rechazada: null,
  };
  return order[current] ?? null;
}

interface Building {
  id: string;
  nombre: string;
}

export default function IncidenciasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate } = usePermissions();

  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingIncidencia, setEditingIncidencia] = useState<Incidencia | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [filterPrioridad, setFilterPrioridad] = useState('todas');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    buildingId: '',
    titulo: '',
    descripcion: '',
    tipo: 'otro',
    prioridad: 'media',
    ubicacion: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [incidenciasRes, buildingsRes] = await Promise.all([
        fetch('/api/incidencias'),
        fetch('/api/buildings'),
      ]);

      const [incidenciasData, buildingsData] = await Promise.all([
        incidenciasRes.json(),
        buildingsRes.json(),
      ]);

      setIncidencias(Array.isArray(incidenciasData) ? incidenciasData : []);
      setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
      setIncidencias([]);
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al crear incidencia');

      toast.success('Incidencia creada exitosamente');
      setOpenDialog(false);
      fetchData();
      setFormData({
        buildingId: '',
        titulo: '',
        descripcion: '',
        tipo: 'otro',
        prioridad: 'media',
        ubicacion: '',
      });
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear incidencia');
    }
  };

  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/incidencias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) throw new Error('Error al actualizar');

      toast.success('Estado actualizado');
      fetchData();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleAdvanceIncidencia = async (id: string, nextEstado: string) => {
    setUpdatingId(id);
    try {
      await handleUpdateEstado(id, nextEstado);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEdit = (incidencia: Incidencia) => {
    setEditingIncidencia(incidencia);
    setFormData({
      buildingId: incidencia.building ? (incidencia as any).buildingId || '' : '',
      titulo: incidencia.titulo,
      descripcion: incidencia.descripcion,
      tipo: incidencia.tipo,
      prioridad: incidencia.prioridad,
      ubicacion: incidencia.ubicacion || '',
    });
    setOpenEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingIncidencia) return;
    try {
      const res = await fetch(`/api/incidencias/${editingIncidencia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al actualizar incidencia');

      toast.success('Incidencia actualizada exitosamente');
      setOpenEditDialog(false);
      setEditingIncidencia(null);
      fetchData();
      setFormData({
        buildingId: '',
        titulo: '',
        descripcion: '',
        tipo: 'otro',
        prioridad: 'media',
        ubicacion: '',
      });
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar incidencia');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta incidencia?')) return;
    try {
      const res = await fetch(`/api/incidencias/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast.success('Incidencia eliminada exitosamente');
      fetchData();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar incidencia');
    }
  };

  const filteredIncidencias = incidencias.filter((inc) => {
    const matchesSearch =
      inc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.building.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = filterEstado === 'todas' || inc.estado === filterEstado;

    const matchesPrioridad = filterPrioridad === 'todas' || inc.prioridad === filterPrioridad;

    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  // KPIs
  const totalIncidencias = incidencias.length;
  const abiertas = incidencias.filter((i) => i.estado === 'abierta' || i.estado === 'asignada').length;
  const enProceso = incidencias.filter((i) => i.estado === 'en_proceso').length;
  const resueltas = incidencias.filter(
    (i) => i.estado === 'resuelta' || i.estado === 'cerrada'
  ).length;

  const kanbanStats = (() => {
    const totalAbiertas = incidencias.filter(
      (i) => !['resuelta', 'cerrada', 'rechazada'].includes(i.estado)
    ).length;
    const urgentes = incidencias.filter((i) => i.prioridad === 'urgente').length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const resueltasEsteMes = incidencias.filter(
      (i) =>
        (i.estado === 'resuelta' || i.estado === 'cerrada') &&
        i.fechaResolucion &&
        new Date(i.fechaResolucion) >= startOfMonth
    ).length;
    const resueltasConFecha = incidencias.filter(
      (i) => (i.estado === 'resuelta' || i.estado === 'cerrada') && i.fechaResolucion
    );
    const tiempoMedio =
      resueltasConFecha.length > 0
        ? Math.round(
            resueltasConFecha.reduce((acc, inc) => {
              const created = new Date(inc.createdAt).getTime();
              const resolved = new Date(inc.fechaResolucion!).getTime();
              return acc + (resolved - created) / (1000 * 60 * 60 * 24);
            }, 0) / resueltasConFecha.length
          )
        : 0;
    return {
      totalAbiertas,
      urgentes,
      resueltasEsteMes,
      tiempoMedio,
    };
  })();

  const getIncidenciasForColumn = (estados: readonly string[]) =>
    filteredIncidencias.filter((inc) => estados.includes(inc.estado));

  const getPrioridadBadgeClass = (prioridad: string) => {
    const config: Record<string, string> = {
      urgente: 'bg-red-500/15 text-red-600 border-red-200',
      alta: 'bg-orange-500/15 text-orange-600 border-orange-200',
      media: 'bg-amber-500/15 text-amber-600 border-amber-200',
      baja: 'bg-green-500/15 text-green-600 border-green-200',
    };
    return config[prioridad] ?? 'bg-gray-500/15 text-gray-600 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Smart Breadcrumbs */}
            <SmartBreadcrumbs
              totalCount={incidencias.length}
              showBackButton={true}
            />

            {/* Header con Quick Actions */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Incidencias Vecinales</h1>
                <p className="text-gray-600">Gestiona reportes y problemas de la comunidad</p>
              </div>
              
              {/* Quick Actions y botón nueva incidencia */}
              <div className="flex gap-2">
                {canCreate && (
                  <ContextualQuickActions
                    pendingIssues={incidencias.filter(i => i.estado === 'pendiente').length}
                    criticalIssues={incidencias.filter(i => i.prioridad === 'alta' || i.prioridad === 'critica').length}
                  />
                )}
                {canCreate && (
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary hover:opacity-90 shadow-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Incidencia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nueva Incidencia</DialogTitle>
                      <DialogDescription>
                        Reporta un problema o situación en la comunidad
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Edificio *</Label>
                        <Select
                          value={formData.buildingId}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, buildingId: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona edificio" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={formData.titulo}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, titulo: e.target.value }))
                          }
                          placeholder="Ej: Fuga de agua en planta 3"
                        />
                      </div>
                      <div>
                        <Label>Descripción *</Label>
                        <Textarea
                          value={formData.descripcion}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                          }
                          rows={3}
                          placeholder="Describe la situación..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={formData.tipo}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, tipo: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ruido">Ruido</SelectItem>
                              <SelectItem value="averia_comun">Avería Común</SelectItem>
                              <SelectItem value="limpieza">Limpieza</SelectItem>
                              <SelectItem value="seguridad">Seguridad</SelectItem>
                              <SelectItem value="convivencia">Convivencia</SelectItem>
                              <SelectItem value="mascota">Mascota</SelectItem>
                              <SelectItem value="parking">Parking</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Prioridad</Label>
                          <Select
                            value={formData.prioridad}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, prioridad: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baja">Baja</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Ubicación Específica</Label>
                        <Input
                          value={formData.ubicacion}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, ubicacion: e.target.value }))
                          }
                          placeholder="Ej: Planta 3, Parking B"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpenDialog(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreate}
                        disabled={!formData.buildingId || !formData.titulo || !formData.descripcion}
                        className="gradient-primary hover:opacity-90 shadow-primary"
                      >
                        Crear Incidencia
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              </div>
            </div>

            {/* Dialog de Edición */}
              <Dialog
                open={openEditDialog}
                onOpenChange={(open) => {
                  setOpenEditDialog(open);
                  if (!open) {
                    setEditingIncidencia(null);
                    setFormData({
                      buildingId: '',
                      titulo: '',
                      descripcion: '',
                      tipo: 'otro',
                      prioridad: 'media',
                      ubicacion: '',
                    });
                  }
                }}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Editar Incidencia</DialogTitle>
                    <DialogDescription>Modifica los detalles de la incidencia</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Edificio *</Label>
                      <Select
                        value={formData.buildingId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, buildingId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona edificio" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Título *</Label>
                      <Input
                        value={formData.titulo}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, titulo: e.target.value }))
                        }
                        placeholder="Ej: Fuga de agua en planta 3"
                      />
                    </div>
                    <div>
                      <Label>Descripción *</Label>
                      <Textarea
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        rows={3}
                        placeholder="Describe la situación..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, tipo: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ruido">Ruido</SelectItem>
                            <SelectItem value="averia_comun">Avería Común</SelectItem>
                            <SelectItem value="limpieza">Limpieza</SelectItem>
                            <SelectItem value="seguridad">Seguridad</SelectItem>
                            <SelectItem value="convivencia">Convivencia</SelectItem>
                            <SelectItem value="mascota">Mascota</SelectItem>
                            <SelectItem value="parking">Parking</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Prioridad</Label>
                        <Select
                          value={formData.prioridad}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, prioridad: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Ubicación Específica</Label>
                      <Input
                        value={formData.ubicacion}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ubicacion: e.target.value }))
                        }
                        placeholder="Ej: Planta 3, Parking B"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpenEditDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={!formData.buildingId || !formData.titulo || !formData.descripcion}
                      className="gradient-primary hover:opacity-90 shadow-primary"
                    >
                      Actualizar Incidencia
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            <Tabs defaultValue="lista" className="space-y-4">
              <TabsList className="grid w-full max-w-[240px] grid-cols-2">
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="lista" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kanban" className="space-y-4">
                {/* Kanban KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Abiertas</CardTitle>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kanbanStats.totalAbiertas}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kanbanStats.urgentes}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Resueltas Este Mes</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kanbanStats.resueltasEsteMes}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tiempo Medio Resolución</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kanbanStats.tiempoMedio}d</div>
                      <p className="text-xs text-muted-foreground">días</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
                  {KANBAN_COLUMNS.map((col) => {
                    const colIncidencias = getIncidenciasForColumn(col.estados);
                    return (
                      <div
                        key={col.id}
                        className={`rounded-lg border bg-muted/30 p-4 min-h-[400px] min-w-[200px] flex-shrink-0 ${col.headerColor}`}
                      >
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <span>{col.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {colIncidencias.length}
                          </Badge>
                        </h3>
                        <div className="space-y-3">
                          {colIncidencias.map((inc) => {
                            const nextEstado = getNextIncidentEstado(inc.estado);
                            const isUpdating = updatingId === inc.id;
                            const ubicacion = inc.unit
                              ? `${inc.building.nombre} - Unidad ${inc.unit.numero}`
                              : inc.building.nombre;
                            return (
                              <Card
                                key={inc.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                              >
                                <CardContent className="p-3">
                                  <div className="flex flex-col gap-2">
                                    <p className="font-medium text-sm truncate">{inc.titulo}</p>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs w-fit capitalize ${getPrioridadBadgeClass(inc.prioridad)}`}
                                    >
                                      {inc.prioridad}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {ubicacion}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(inc.createdAt).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                      })}
                                    </p>
                                    {inc.asignadoA && (
                                      <p className="text-xs text-muted-foreground">
                                        Asignado
                                      </p>
                                    )}
                                    {nextEstado && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 mt-1"
                                        disabled={!!isUpdating}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAdvanceIncidencia(inc.id, nextEstado);
                                        }}
                                      >
                                        {isUpdating ? '...' : (
                                          <>
                                            Avanzar
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                          {colIncidencias.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              Sin incidencias
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="lista" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalIncidencias}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{abiertas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{enProceso}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resueltas}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar incidencias..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todos los estados</SelectItem>
                      <SelectItem value="abierta">Abierta</SelectItem>
                      <SelectItem value="asignada">Asignada</SelectItem>
                      <SelectItem value="en_proceso">En Proceso</SelectItem>
                      <SelectItem value="resuelta">Resuelta</SelectItem>
                      <SelectItem value="cerrada">Cerrada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las prioridades</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Incidencias */}
            <div className="space-y-4">
              {filteredIncidencias.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No hay incidencias para mostrar</p>
                  </CardContent>
                </Card>
              ) : (
                filteredIncidencias.map((inc) => (
                  <Card key={inc.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {inc.prioridad === 'urgente' && (
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                            {inc.prioridad === 'alta' && (
                              <AlertCircle className="w-5 h-5 text-orange-500" />
                            )}
                            <h3 className="text-lg font-semibold">{inc.titulo}</h3>
                          </div>
                          <p className="text-gray-600 mb-3">{inc.descripcion}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Badge variant="outline">{inc.building.nombre}</Badge>
                            {inc.unit && <Badge variant="outline">Unidad {inc.unit.numero}</Badge>}
                            {inc.ubicacion && (
                              <span className="text-gray-500">· {inc.ubicacion}</span>
                            )}
                            <Badge
                              className="capitalize"
                              variant={
                                inc.estado === 'abierta' || inc.estado === 'asignada'
                                  ? 'destructive'
                                  : inc.estado === 'en_proceso'
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {inc.estado.replace('_', ' ')}
                            </Badge>
                            <Badge
                              className="capitalize"
                              variant={
                                inc.prioridad === 'urgente' || inc.prioridad === 'alta'
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {inc.prioridad}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(inc.estado === 'abierta' || inc.estado === 'asignada') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateEstado(
                                  inc.id,
                                  inc.estado === 'abierta' ? 'asignada' : 'en_proceso'
                                )
                              }
                            >
                              {inc.estado === 'abierta' ? 'Asignar' : 'Iniciar'}
                            </Button>
                          )}
                          {inc.estado === 'en_proceso' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateEstado(inc.id, 'resuelta')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Resolver
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleEdit(inc)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(inc.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
