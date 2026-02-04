'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Plus,
  Calendar,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentoCumplimiento {
  requerido: boolean;
  estado: string;
  fechaVencimiento: string | null;
}

interface EdificioCumplimiento {
  id: string;
  name: string;
  address: string;
  antiguedad: number;
  documentos: {
    ite: DocumentoCumplimiento;
    cee: DocumentoCumplimiento;
    seguro: DocumentoCumplimiento;
    cedulaHabitabilidad: DocumentoCumplimiento;
  };
}

const TIPOS_DOCUMENTO = [
  { value: 'cee', label: 'Certificado Energético (CEE)', icon: '⚡' },
  { value: 'ite', label: 'Inspección Técnica (ITE)', icon: '🔍' },
  { value: 'cedula_habitabilidad', label: 'Cédula de Habitabilidad', icon: '🏠' },
  { value: 'seguro', label: 'Seguro de la Comunidad', icon: '🛡️' },
  { value: 'licencia', label: 'Licencia de Actividad', icon: '📋' },
  { value: 'modelo_fiscal', label: 'Modelo Fiscal (347, etc)', icon: '📊' },
];

export default function CumplimientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [cumplimiento, setCumplimiento] = useState<EdificioCumplimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({
    totalEdificios: 0,
    requierenITE: 0,
    documentosPendientes: 0,
    proximosVencimientos: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state
  const [formData, setFormData] = useState({
    buildingId: '',
    tipo: 'cee',
    nombre: '',
    fechaVencimiento: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCumplimiento();
    }
  }, [status, router, comunidadId, buildingId]);

  const fetchCumplimiento = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);

      const res = await fetch(`/api/comunidades/cumplimiento?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCumplimiento(data.cumplimiento || []);
        setStats(data.stats || {
          totalEdificios: 0,
          requierenITE: 0,
          documentosPendientes: 0,
          proximosVencimientos: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching cumplimiento:', error);
      toast.error('Error al cargar datos de cumplimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.buildingId || !formData.nombre) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/cumplimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fechaVencimiento: formData.fechaVencimiento
            ? new Date(formData.fechaVencimiento).toISOString()
            : undefined,
        }),
      });

      if (res.ok) {
        toast.success('Documento registrado correctamente');
        setShowDialog(false);
        setFormData({
          buildingId: '',
          tipo: 'cee',
          nombre: '',
          fechaVencimiento: '',
        });
        fetchCumplimiento();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al registrar documento');
      }
    } catch (error) {
      toast.error('Error al registrar documento');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { color: string; label: string }> = {
      vigente: { color: 'bg-green-100 text-green-800', label: 'Vigente' },
      por_vencer: { color: 'bg-yellow-100 text-yellow-800', label: 'Por Vencer' },
      vencido: { color: 'bg-red-100 text-red-800', label: 'Vencido' },
      en_tramite: { color: 'bg-blue-100 text-blue-800', label: 'En Trámite' },
      pendiente: { color: 'bg-gray-100 text-gray-800', label: 'Pendiente' },
      no_aplica: { color: 'bg-gray-50 text-gray-500', label: 'No Aplica' },
    };
    const e = estados[estado] || estados.pendiente;
    return <Badge className={e.color}>{e.label}</Badge>;
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
            <h1 className="text-3xl font-bold">Cumplimiento Legal</h1>
            <p className="text-muted-foreground">
              CEE, ITE, Cédulas, Seguros y Modelos Fiscales
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Documento</DialogTitle>
                <DialogDescription>
                  Añade un nuevo documento de cumplimiento
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Edificio *</Label>
                  <Select
                    value={formData.buildingId}
                    onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      {cumplimiento.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre/Referencia *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: CEE-2024-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                  <Input
                    id="fechaVencimiento"
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Edificios</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEdificios}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Requieren ITE</CardTitle>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.requierenITE}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Docs. Pendientes</CardTitle>
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.documentosPendientes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Próx. Vencimientos</CardTitle>
              <Calendar className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.proximosVencimientos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de edificios y su cumplimiento */}
        <div className="space-y-4">
          {cumplimiento.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay edificios registrados</p>
              </CardContent>
            </Card>
          ) : (
            cumplimiento.map((edificio) => (
              <Card key={edificio.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {edificio.name}
                      </CardTitle>
                      <CardDescription>
                        {edificio.address} • Antigüedad: {edificio.antiguedad} años
                      </CardDescription>
                    </div>
                    {edificio.antiguedad >= 50 && (
                      <Badge variant="destructive">ITE Obligatoria</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* CEE */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⚡</span>
                        <span className="font-medium text-sm">CEE</span>
                      </div>
                      {getEstadoBadge(edificio.documentos.cee.estado)}
                      <p className="text-xs text-muted-foreground mt-2">
                        Certificado Energético
                      </p>
                    </div>

                    {/* ITE */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🔍</span>
                        <span className="font-medium text-sm">ITE</span>
                      </div>
                      {getEstadoBadge(edificio.documentos.ite.estado)}
                      <p className="text-xs text-muted-foreground mt-2">
                        {edificio.documentos.ite.requerido
                          ? 'Inspección Técnica'
                          : 'No requerida (<50 años)'}
                      </p>
                    </div>

                    {/* Seguro */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🛡️</span>
                        <span className="font-medium text-sm">Seguro</span>
                      </div>
                      {getEstadoBadge(edificio.documentos.seguro.estado)}
                      <p className="text-xs text-muted-foreground mt-2">
                        Seguro Comunidad
                      </p>
                    </div>

                    {/* Cédula */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🏠</span>
                        <span className="font-medium text-sm">Cédula</span>
                      </div>
                      {getEstadoBadge(edificio.documentos.cedulaHabitabilidad.estado)}
                      <p className="text-xs text-muted-foreground mt-2">
                        Cédula Habitabilidad
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Información legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Información Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>ITE (Inspección Técnica de Edificios):</strong> Obligatoria para edificios
              de más de 50 años de antigüedad. Debe renovarse cada 10 años.
            </p>
            <p>
              <strong>CEE (Certificado de Eficiencia Energética):</strong> Obligatorio para
              alquiler o venta de viviendas. Validez de 10 años.
            </p>
            <p>
              <strong>Seguro de la Comunidad:</strong> Obligatorio cubrir daños a terceros
              y elementos comunes.
            </p>
            <p>
              <strong>Modelo 347:</strong> Declaración anual de operaciones con terceros
              superiores a 3.005,06€.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
