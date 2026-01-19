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
  Euro,
  Plus,
  ArrowLeft,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Cuota {
  id: string;
  tipo: string;
  periodo: string;
  concepto: string;
  importeBase: number;
  coeficiente: number;
  importeTotal: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  estado: string;
  unit: { id: string; unitNumber: string } | null;
  building: { id: string; name: string } | null;
}

const TIPOS_CUOTA = [
  { value: 'ordinaria', label: 'Ordinaria' },
  { value: 'extraordinaria', label: 'Extraordinaria' },
  { value: 'derrama', label: 'Derrama' },
];

const ESTADOS_CUOTA = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pagado', label: 'Pagada', color: 'bg-green-100 text-green-800' },
  { value: 'vencida', label: 'Vencida', color: 'bg-red-100 text-red-800' },
];

export default function CuotasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({
    totalPendiente: 0,
    cuotasPendientes: 0,
    totalCobrado: 0,
    cuotasCobradas: 0,
    unidadesMorosas: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state para generación masiva
  const [formData, setFormData] = useState({
    tipo: 'ordinaria',
    periodo: '',
    concepto: '',
    importeBase: '',
    fechaVencimiento: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCuotas();
    }
  }, [status, router, comunidadId, buildingId, filtroEstado]);

  const fetchCuotas = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);
      if (filtroEstado) params.append('estado', filtroEstado);

      const res = await fetch(`/api/comunidades/cuotas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCuotas(data.cuotas || []);
        setStats(data.stats || {
          totalPendiente: 0,
          cuotasPendientes: 0,
          totalCobrado: 0,
          cuotasCobradas: 0,
          unidadesMorosas: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching cuotas:', error);
      toast.error('Error al cargar cuotas');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarCuotas = async () => {
    if (!formData.periodo || !formData.concepto || !formData.importeBase || !formData.fechaVencimiento) {
      toast.error('Completa todos los campos');
      return;
    }

    if (!buildingId) {
      toast.error('Selecciona primero un edificio/comunidad');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/cuotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generarParaTodas: true,
          buildingId,
          ...formData,
          importeBase: parseFloat(formData.importeBase),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Cuotas generadas correctamente');
        setShowDialog(false);
        setFormData({
          tipo: 'ordinaria',
          periodo: '',
          concepto: '',
          importeBase: '',
          fechaVencimiento: '',
        });
        fetchCuotas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al generar cuotas');
      }
    } catch (error) {
      toast.error('Error al generar cuotas');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const e = ESTADOS_CUOTA.find((es) => es.value === estado);
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Cuotas de Comunidad</h1>
            <p className="text-muted-foreground">
              Gestión de cuotas, cobros y morosidad
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generar Cuotas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generar Cuotas</DialogTitle>
                <DialogDescription>
                  Genera cuotas automáticamente para todas las unidades
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Tipo de Cuota</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CUOTA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="periodo">Período</Label>
                  <Input
                    id="periodo"
                    value={formData.periodo}
                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                    placeholder="Ej: 2024-Q1, 2024-01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="concepto">Concepto</Label>
                  <Input
                    id="concepto"
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    placeholder="Ej: Cuota ordinaria enero 2024"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="importe">Importe Base Total (€)</Label>
                  <Input
                    id="importe"
                    type="number"
                    value={formData.importeBase}
                    onChange={(e) => setFormData({ ...formData, importeBase: e.target.value })}
                    placeholder="Ej: 5000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se dividirá proporcionalmente según coeficientes
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vencimiento">Fecha de Vencimiento</Label>
                  <Input
                    id="vencimiento"
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
                <Button onClick={handleGenerarCuotas}>Generar Cuotas</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.totalPendiente.toLocaleString('es-ES')}€
              </div>
              <p className="text-xs text-muted-foreground">{stats.cuotasPendientes} cuotas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalCobrado.toLocaleString('es-ES')}€
              </div>
              <p className="text-xs text-muted-foreground">{stats.cuotasCobradas} cuotas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Morosos</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unidadesMorosas}</div>
              <p className="text-xs text-muted-foreground">unidades</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
              <Euro className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.cuotasCobradas + stats.cuotasPendientes > 0
                  ? Math.round(
                      (stats.cuotasCobradas / (stats.cuotasCobradas + stats.cuotasPendientes)) * 100
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              {ESTADOS_CUOTA.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay cuotas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  cuotas.map((cuota) => (
                    <TableRow key={cuota.id}>
                      <TableCell className="font-medium">
                        {cuota.unit?.unitNumber || 'General'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cuota.concepto}</div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {cuota.tipo}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{cuota.periodo}</TableCell>
                      <TableCell className="font-medium">
                        {cuota.importeTotal.toLocaleString('es-ES')}€
                      </TableCell>
                      <TableCell>
                        {format(new Date(cuota.fechaVencimiento), 'd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>{getEstadoBadge(cuota.estado)}</TableCell>
                      <TableCell className="text-right">
                        {cuota.estado === 'pendiente' && (
                          <Button size="sm" variant="outline">
                            Registrar Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
