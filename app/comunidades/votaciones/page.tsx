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
import { Progress } from '@/components/ui/progress';
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
  Vote,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Votacion {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  opciones: { id: string; texto: string; votos: number }[];
  requiereQuorum: boolean;
  quorumRequerido: number;
  fechaInicio: string;
  fechaCierre: string;
  totalVotos: number;
  totalElegibles: number;
  participacion: number;
  quorumAlcanzado: boolean;
  building: { id: string; name: string } | null;
}

const TIPOS_VOTACION = [
  { value: 'ordinaria', label: 'Ordinaria' },
  { value: 'extraordinaria', label: 'Extraordinaria' },
  { value: 'urgente', label: 'Urgente' },
];

export default function VotacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    activas: 0,
    cerradas: 0,
    pendientesCierre: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'ordinaria',
    opciones: [
      { id: '1', texto: 'A favor', votos: 0 },
      { id: '2', texto: 'En contra', votos: 0 },
      { id: '3', texto: 'Abstención', votos: 0 },
    ],
    quorumRequerido: 50,
    fechaCierre: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchVotaciones();
    }
  }, [status, router, comunidadId, buildingId]);

  const fetchVotaciones = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);

      const res = await fetch(`/api/comunidades/votaciones?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVotaciones(data.votaciones || []);
        setStats(data.stats || {
          total: 0,
          activas: 0,
          cerradas: 0,
          pendientesCierre: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching votaciones:', error);
      toast.error('Error al cargar votaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.titulo || !formData.descripcion || !formData.fechaCierre) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!buildingId) {
      toast.error('Selecciona primero un edificio/comunidad');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/votaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          buildingId,
          fechaCierre: new Date(formData.fechaCierre).toISOString(),
        }),
      });

      if (res.ok) {
        toast.success('Votación creada correctamente');
        setShowDialog(false);
        setFormData({
          titulo: '',
          descripcion: '',
          tipo: 'ordinaria',
          opciones: [
            { id: '1', texto: 'A favor', votos: 0 },
            { id: '2', texto: 'En contra', votos: 0 },
            { id: '3', texto: 'Abstención', votos: 0 },
          ],
          quorumRequerido: 50,
          fechaCierre: '',
        });
        fetchVotaciones();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear votación');
      }
    } catch (error) {
      toast.error('Error al crear votación');
    }
  };

  const getEstadoBadge = (votacion: Votacion) => {
    if (votacion.estado === 'cerrada') {
      return <Badge className="bg-gray-100 text-gray-800">Cerrada</Badge>;
    }
    if (new Date(votacion.fechaCierre) < new Date()) {
      return <Badge className="bg-orange-100 text-orange-800">Pendiente Cierre</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Activa</Badge>;
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Votaciones Telemáticas</h1>
            <p className="text-muted-foreground">Sistema de votación online para la comunidad</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Votación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nueva Votación</DialogTitle>
                <DialogDescription>Crea una nueva votación para la comunidad</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Aprobación de presupuesto 2024"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe el tema a votar..."
                    rows={3}
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
                        {TIPOS_VOTACION.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quorum">Quórum Requerido (%)</Label>
                    <Input
                      id="quorum"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.quorumRequerido}
                      onChange={(e) =>
                        setFormData({ ...formData, quorumRequerido: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fechaCierre">Fecha de Cierre *</Label>
                  <Input
                    id="fechaCierre"
                    type="datetime-local"
                    value={formData.fechaCierre}
                    onChange={(e) => setFormData({ ...formData, fechaCierre: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Votación</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <Vote className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes Cierre</CardTitle>
              <Clock className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendientesCierre}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cerradas</CardTitle>
              <CheckCircle className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.cerradas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Votaciones */}
        <div className="space-y-4">
          {votaciones.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay votaciones registradas</p>
              </CardContent>
            </Card>
          ) : (
            votaciones.map((votacion) => (
              <Card key={votacion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{votacion.titulo}</CardTitle>
                        {getEstadoBadge(votacion)}
                        <Badge variant="outline" className="capitalize">
                          {votacion.tipo}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">{votacion.descripcion}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Cierra: {format(new Date(votacion.fechaCierre), "d MMM yyyy, HH:mm", { locale: es })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resultados */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Resultados</h4>
                      {votacion.opciones.map((opcion) => {
                        const porcentaje =
                          votacion.totalVotos > 0
                            ? Math.round((opcion.votos / votacion.totalVotos) * 100)
                            : 0;
                        return (
                          <div key={opcion.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{opcion.texto}</span>
                              <span className="font-medium">
                                {opcion.votos} votos ({porcentaje}%)
                              </span>
                            </div>
                            <Progress value={porcentaje} className="h-2" />
                          </div>
                        );
                      })}
                    </div>

                    {/* Participación */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Participación</h4>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {votacion.totalVotos} de {votacion.totalElegibles} propietarios
                        </span>
                      </div>
                      <Progress value={votacion.participacion} className="h-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Participación</span>
                        <span className="font-medium">{votacion.participacion}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {votacion.quorumAlcanzado ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Quórum alcanzado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Quórum pendiente ({votacion.quorumRequerido}% requerido)
                          </Badge>
                        )}
                      </div>
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
