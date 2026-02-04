'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  Shield,
  Volume2,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  prioridad: string;
  ubicacion: string | null;
  fechaReporte: string;
  fechaResolucion: string | null;
  building: { id: string; name: string } | null;
}

const TIPOS = [
  { value: 'averia', label: 'Avería', icon: Wrench },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { value: 'limpieza', label: 'Limpieza', icon: CheckCircle },
  { value: 'seguridad', label: 'Seguridad', icon: Shield },
  { value: 'ruidos', label: 'Ruidos', icon: Volume2 },
  { value: 'otro', label: 'Otro', icon: MoreHorizontal },
];

const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  { value: 'media', label: 'Media', color: 'bg-blue-100 text-blue-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

const ESTADOS = [
  { value: 'abierta', label: 'Abierta', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  { value: 'pendiente_respuesta', label: 'Pendiente', color: 'bg-purple-100 text-purple-800' },
  { value: 'resuelta', label: 'Resuelta', color: 'bg-green-100 text-green-800' },
  { value: 'cerrada', label: 'Cerrada', color: 'bg-gray-100 text-gray-800' },
];

export default function IncidenciasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    abiertas: 0,
    enProceso: 0,
    resueltas: 0,
    urgentes: 0,
    tiempoMedioResolucion: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'averia',
    prioridad: 'media',
    ubicacion: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchIncidencias();
    }
  }, [status, router, comunidadId, buildingId, filtroEstado, filtroPrioridad]);

  const fetchIncidencias = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroPrioridad) params.append('prioridad', filtroPrioridad);

      const res = await fetch(`/api/comunidades/incidencias?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIncidencias(data.incidencias || []);
        setStats(data.stats || {
          total: 0,
          abiertas: 0,
          enProceso: 0,
          resueltas: 0,
          urgentes: 0,
          tiempoMedioResolucion: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching incidencias:', error);
      toast.error('Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.titulo || !formData.descripcion) {
      toast.error('Título y descripción son obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          buildingId: buildingId || '',
        }),
      });

      if (res.ok) {
        toast.success('Incidencia creada correctamente');
        setShowDialog(false);
        setFormData({
          titulo: '',
          descripcion: '',
          tipo: 'averia',
          prioridad: 'media',
          ubicacion: '',
        });
        fetchIncidencias();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear incidencia');
      }
    } catch (error) {
      toast.error('Error al crear incidencia');
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/comunidades/incidencias?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        toast.success('Estado actualizado');
        fetchIncidencias();
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    const p = PRIORIDADES.find((pr) => pr.value === prioridad);
    return p ? (
      <Badge className={p.color}>{p.label}</Badge>
    ) : (
      <Badge>{prioridad}</Badge>
    );
  };

  const getEstadoBadge = (estado: string) => {
    const e = ESTADOS.find((es) => es.value === estado);
    return e ? (
      <Badge className={e.color}>{e.label}</Badge>
    ) : (
      <Badge>{estado}</Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Incidencias</h1>
            <p className="text-muted-foreground">
              Gestión de incidencias y averías de la comunidad
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Incidencia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Incidencia</DialogTitle>
                <DialogDescription>Reporta una nueva incidencia en la comunidad</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Avería en ascensor"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe la incidencia con detalle..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.prioridad}
                      onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORIDADES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Ej: Planta 2, Portal B"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Incidencia</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.abiertas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.enProceso}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resueltas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.urgentes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Medio</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tiempoMedioResolucion} días</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar incidencias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {PRIORIDADES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Incidencias List */}
        <div className="space-y-4">
          {incidencias.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay incidencias registradas</p>
              </CardContent>
            </Card>
          ) : (
            incidencias.map((incidencia) => (
              <Card key={incidencia.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{incidencia.titulo}</h3>
                        {getPrioridadBadge(incidencia.prioridad)}
                        {getEstadoBadge(incidencia.estado)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {incidencia.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{incidencia.tipo}</span>
                        {incidencia.ubicacion && <span>📍 {incidencia.ubicacion}</span>}
                        <span>
                          Hace{' '}
                          {formatDistanceToNow(new Date(incidencia.fechaReporte), {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {incidencia.estado === 'abierta' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateEstado(incidencia.id, 'en_proceso')}
                        >
                          Iniciar
                        </Button>
                      )}
                      {incidencia.estado === 'en_proceso' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateEstado(incidencia.id, 'resuelta')}
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
