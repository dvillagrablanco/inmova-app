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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  FileText,
  Plus,
  ArrowLeft,
  Search,
  Eye,
  Download,
  CheckCircle,
  Clock,
  Edit,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Acta {
  id: string;
  numeroActa: number;
  fecha: string;
  convocatoria: string;
  asistentes: { nombre: string; unidad?: string; representado: boolean }[];
  ordenDia: { numero: number; titulo: string; descripcion?: string }[];
  acuerdos: { numero: number; descripcion: string; aprobado: boolean; votacion?: any }[];
  estado: string;
  observaciones: string | null;
  building: { id: string; name: string } | null;
}

const ESTADOS_ACTA = [
  { value: 'borrador', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  {
    value: 'pendiente_aprobacion',
    label: 'Pendiente Aprobación',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { value: 'aprobada', label: 'Aprobada', color: 'bg-green-100 text-green-800' },
  { value: 'firmada', label: 'Firmada', color: 'bg-blue-100 text-blue-800' },
];

export default function ActasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    borradores: 0,
    aprobadas: 0,
    pendientesAprobacion: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state
  const [formData, setFormData] = useState({
    fecha: '',
    convocatoria: '',
    ordenDia: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchActas();
    }
  }, [status, router, comunidadId, buildingId, filtroEstado]);

  const fetchActas = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);
      if (filtroEstado) params.append('estado', filtroEstado);

      const res = await fetch(`/api/comunidades/actas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActas(data.actas || []);
        setStats(
          data.stats || {
            total: 0,
            borradores: 0,
            aprobadas: 0,
            pendientesAprobacion: 0,
          }
        );
      }
    } catch (error) {
      console.error('Error fetching actas:', error);
      toast.error('Error al cargar actas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.fecha || !formData.convocatoria || !formData.ordenDia) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!buildingId) {
      toast.error('Selecciona primero un edificio/comunidad');
      return;
    }

    // Parsear orden del día (cada línea es un punto)
    const ordenDiaLines = formData.ordenDia.split('\n').filter((l) => l.trim());
    const ordenDia = ordenDiaLines.map((line, idx) => ({
      numero: idx + 1,
      titulo: line.trim(),
    }));

    try {
      const res = await fetch('/api/comunidades/actas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId,
          fecha: new Date(formData.fecha).toISOString(),
          convocatoria: formData.convocatoria,
          ordenDia,
          asistentes: [],
          acuerdos: [],
        }),
      });

      if (res.ok) {
        toast.success('Acta creada correctamente');
        setShowDialog(false);
        setFormData({
          fecha: '',
          convocatoria: '',
          ordenDia: '',
        });
        fetchActas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear acta');
      }
    } catch (error) {
      toast.error('Error al crear acta');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const e = ESTADOS_ACTA.find((es) => es.value === estado);
    return e ? <Badge className={e.color}>{e.label}</Badge> : <Badge>{estado}</Badge>;
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
            <h1 className="text-3xl font-bold">Libro de Actas Digital</h1>
            <p className="text-muted-foreground">Gestión de actas de junta y reuniones</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Acta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nueva Acta</DialogTitle>
                <DialogDescription>Crea una nueva acta de reunión</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha de la Reunión *</Label>
                  <Input
                    id="fecha"
                    type="datetime-local"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="convocatoria">Tipo de Convocatoria *</Label>
                  <Select
                    value={formData.convocatoria}
                    onValueChange={(value) => setFormData({ ...formData, convocatoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junta General Ordinaria">
                        Junta General Ordinaria
                      </SelectItem>
                      <SelectItem value="Junta General Extraordinaria">
                        Junta General Extraordinaria
                      </SelectItem>
                      <SelectItem value="Reunión de Junta Directiva">
                        Reunión de Junta Directiva
                      </SelectItem>
                      <SelectItem value="Reunión de Comisión">Reunión de Comisión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ordenDia">Orden del Día * (un punto por línea)</Label>
                  <Textarea
                    id="ordenDia"
                    value={formData.ordenDia}
                    onChange={(e) => setFormData({ ...formData, ordenDia: e.target.value })}
                    placeholder="Lectura y aprobación del acta anterior&#10;Aprobación de cuentas anuales&#10;Presupuesto para el ejercicio siguiente&#10;Ruegos y preguntas"
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Acta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Actas</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Borradores</CardTitle>
              <Edit className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.borradores}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendientesAprobacion}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.aprobadas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              {ESTADOS_ACTA.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Acta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Convocatoria</TableHead>
                  <TableHead>Asistentes</TableHead>
                  <TableHead>Acuerdos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay actas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  actas.map((acta) => (
                    <TableRow key={acta.id}>
                      <TableCell className="font-medium">#{acta.numeroActa}</TableCell>
                      <TableCell>
                        {format(new Date(acta.fecha), 'd MMM yyyy, HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>{acta.convocatoria}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {acta.asistentes?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>{acta.acuerdos?.length || 0}</TableCell>
                      <TableCell>{getEstadoBadge(acta.estado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Asistente IA de Documentos para actas de comunidad */}
        <AIDocumentAssistant
          context="documentos"
          variant="floating"
          position="bottom-right"
          onApplyData={(data) => {
            // Aplicar datos extraídos del acta al formulario
            if (data.numeroActa) {
              setNewActa((prev) => ({ ...prev, numeroActa: data.numeroActa }));
            }
            if (data.fecha) {
              const fecha = new Date(data.fecha);
              if (!isNaN(fecha.getTime())) {
                setNewActa((prev) => ({ ...prev, fecha: fecha.toISOString().split('T')[0] }));
              }
            }
            if (data.convocatoria || data.tipoConvocatoria) {
              setNewActa((prev) => ({
                ...prev,
                convocatoria: data.convocatoria || data.tipoConvocatoria,
              }));
            }
            if (data.observaciones || data.resumen) {
              setNewActa((prev) => ({
                ...prev,
                observaciones: data.observaciones || data.resumen,
              }));
            }
            // Abrir el diálogo de nueva acta si hay datos
            if (data.numeroActa || data.fecha) {
              setShowDialog(true);
            }
            toast.success('Datos del acta extraídos. Revise y complete el formulario.');
          }}
        />
      </div>
    </AuthenticatedLayout>
  );
}
