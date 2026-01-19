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
  Calendar,
  Plus,
  Clock,
  MapPin,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reunion {
  id: string;
  titulo: string;
  tipo: string;
  fechaReunion: string;
  ubicacion: string | null;
  ordenDel: string;
  estado: string;
  acta: string | null;
  acuerdos: any[];
  asistentes: any[];
  building: { id: string; name: string } | null;
}

const TIPOS_REUNION = [
  { value: 'ordinaria', label: 'Ordinaria' },
  { value: 'extraordinaria', label: 'Extraordinaria' },
  { value: 'junta_propietarios', label: 'Junta de Propietarios' },
  { value: 'comision', label: 'Comisión' },
];

const ESTADOS_REUNION = [
  { value: 'programada', label: 'Programada', color: 'bg-blue-100 text-blue-800' },
  { value: 'realizada', label: 'Realizada', color: 'bg-green-100 text-green-800' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
];

export default function ReunionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [proximaReunion, setProximaReunion] = useState<Reunion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    programadas: 0,
    realizadas: 0,
    canceladas: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'ordinaria',
    fechaReunion: '',
    ubicacion: '',
    ordenDia: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReuniones();
    }
  }, [status, router, comunidadId, buildingId]);

  const fetchReuniones = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);

      const res = await fetch(`/api/comunidades/reuniones?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReuniones(data.reuniones || []);
        setProximaReunion(data.proximaReunion || null);
        setStats(data.stats || {
          total: 0,
          programadas: 0,
          realizadas: 0,
          canceladas: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching reuniones:', error);
      toast.error('Error al cargar reuniones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.titulo || !formData.fechaReunion || !formData.ordenDia) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/reuniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          buildingId: buildingId || '',
        }),
      });

      if (res.ok) {
        toast.success('Reunión programada correctamente');
        setShowDialog(false);
        setFormData({
          titulo: '',
          tipo: 'ordinaria',
          fechaReunion: '',
          ubicacion: '',
          ordenDia: '',
        });
        fetchReuniones();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al programar reunión');
      }
    } catch (error) {
      toast.error('Error al programar reunión');
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/comunidades/reuniones?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        toast.success('Estado actualizado');
        fetchReuniones();
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const e = ESTADOS_REUNION.find((es) => es.value === estado);
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
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
            <h1 className="text-3xl font-bold">Reuniones y Juntas</h1>
            <p className="text-muted-foreground">
              Programación y gestión de reuniones de la comunidad
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Programar Reunión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nueva Reunión</DialogTitle>
                <DialogDescription>Programa una nueva reunión o junta</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Junta General Ordinaria 2024"
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
                        {TIPOS_REUNION.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha">Fecha y Hora *</Label>
                    <Input
                      id="fecha"
                      type="datetime-local"
                      value={formData.fechaReunion}
                      onChange={(e) => setFormData({ ...formData, fechaReunion: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Ej: Sala de juntas, Planta baja"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ordenDia">Orden del Día *</Label>
                  <Textarea
                    id="ordenDia"
                    value={formData.ordenDia}
                    onChange={(e) => setFormData({ ...formData, ordenDia: e.target.value })}
                    placeholder="1. Lectura y aprobación del acta anterior&#10;2. Aprobación de cuentas&#10;3. Propuestas y ruegos"
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Programar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Programadas</CardTitle>
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.programadas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.realizadas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <XCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.canceladas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Próxima Reunión Destacada */}
        {proximaReunion && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Próxima Reunión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{proximaReunion.titulo}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(proximaReunion.fechaReunion), "EEEE d 'de' MMMM, HH:mm", {
                        locale: es,
                      })}
                    </span>
                    {proximaReunion.ubicacion && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {proximaReunion.ubicacion}
                      </span>
                    )}
                  </div>
                  <Badge className="mt-2 capitalize">{proximaReunion.tipo}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Convocatoria
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Reuniones */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Reuniones</CardTitle>
          </CardHeader>
          <CardContent>
            {reuniones.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay reuniones programadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reuniones.map((reunion) => (
                  <div
                    key={reunion.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{reunion.titulo}</h4>
                        {getEstadoBadge(reunion.estado)}
                        <Badge variant="outline" className="capitalize">
                          {reunion.tipo}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(reunion.fechaReunion), "d MMM yyyy, HH:mm", {
                            locale: es,
                          })}
                        </span>
                        {reunion.ubicacion && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {reunion.ubicacion}
                          </span>
                        )}
                        {reunion.asistentes?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {reunion.asistentes.length} asistentes
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {reunion.estado === 'programada' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEstado(reunion.id, 'realizada')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar Realizada
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEstado(reunion.id, 'cancelada')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      {reunion.estado === 'realizada' && !reunion.acta && (
                        <Button
                          size="sm"
                          onClick={() => router.push('/comunidades/actas')}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Crear Acta
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
