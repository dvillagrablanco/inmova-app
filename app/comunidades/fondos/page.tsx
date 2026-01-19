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
  TrendingUp,
  Plus,
  ArrowLeft,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Fondo {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string | null;
  saldoActual: number;
  saldoObjetivo: number | null;
  aportacionMensual: number;
  totalAportaciones: number;
  totalGastos: number;
  porcentajeObjetivo: number | null;
  movimientos: {
    id: string;
    tipo: string;
    concepto: string;
    importe: number;
    fecha: string;
    saldoAnterior: number;
    saldoNuevo: number;
  }[];
  activo: boolean;
  building: { id: string; name: string } | null;
}

const TIPOS_FONDO = [
  { value: 'reserva', label: 'Fondo de Reserva' },
  { value: 'obras', label: 'Fondo de Obras' },
  { value: 'mejoras', label: 'Fondo de Mejoras' },
  { value: 'emergencia', label: 'Fondo de Emergencia' },
  { value: 'otro', label: 'Otro' },
];

export default function FondosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showMovimientoDialog, setShowMovimientoDialog] = useState(false);
  const [selectedFondo, setSelectedFondo] = useState<Fondo | null>(null);
  const [stats, setStats] = useState({
    totalFondos: 0,
    saldoTotal: 0,
    objetivoTotal: 0,
    aportacionesMensuales: 0,
    porcentajeGlobal: 0,
  });

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  // Form state para nuevo fondo
  const [formData, setFormData] = useState({
    tipo: 'reserva',
    nombre: '',
    descripcion: '',
    saldoObjetivo: '',
    aportacionMensual: '',
  });

  // Form state para movimiento
  const [movimiento, setMovimiento] = useState({
    tipo: 'aportacion',
    concepto: '',
    importe: '',
    referencia: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchFondos();
    }
  }, [status, router, comunidadId, buildingId]);

  const fetchFondos = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);

      const res = await fetch(`/api/comunidades/fondos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFondos(data.fondos || []);
        setStats(data.stats || {
          totalFondos: 0,
          saldoTotal: 0,
          objetivoTotal: 0,
          aportacionesMensuales: 0,
          porcentajeGlobal: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching fondos:', error);
      toast.error('Error al cargar fondos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nombre) {
      toast.error('El nombre del fondo es obligatorio');
      return;
    }

    if (!buildingId) {
      toast.error('Selecciona primero un edificio/comunidad');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/fondos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          buildingId,
          saldoObjetivo: formData.saldoObjetivo ? parseFloat(formData.saldoObjetivo) : undefined,
          aportacionMensual: formData.aportacionMensual
            ? parseFloat(formData.aportacionMensual)
            : 0,
        }),
      });

      if (res.ok) {
        toast.success('Fondo creado correctamente');
        setShowDialog(false);
        setFormData({
          tipo: 'reserva',
          nombre: '',
          descripcion: '',
          saldoObjetivo: '',
          aportacionMensual: '',
        });
        fetchFondos();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear fondo');
      }
    } catch (error) {
      toast.error('Error al crear fondo');
    }
  };

  const handleMovimiento = async () => {
    if (!selectedFondo || !movimiento.concepto || !movimiento.importe) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      const res = await fetch('/api/comunidades/fondos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fondoId: selectedFondo.id,
          tipo: movimiento.tipo,
          concepto: movimiento.concepto,
          importe: parseFloat(movimiento.importe),
          referencia: movimiento.referencia,
        }),
      });

      if (res.ok) {
        toast.success('Movimiento registrado correctamente');
        setShowMovimientoDialog(false);
        setSelectedFondo(null);
        setMovimiento({
          tipo: 'aportacion',
          concepto: '',
          importe: '',
          referencia: '',
        });
        fetchFondos();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al registrar movimiento');
      }
    } catch (error) {
      toast.error('Error al registrar movimiento');
    }
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      reserva: 'bg-blue-100 text-blue-800',
      obras: 'bg-orange-100 text-orange-800',
      mejoras: 'bg-green-100 text-green-800',
      emergencia: 'bg-red-100 text-red-800',
      otro: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[tipo] || colors.otro}>
        {TIPOS_FONDO.find((t) => t.value === tipo)?.label || tipo}
      </Badge>
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
            <h1 className="text-3xl font-bold">Fondos y Derramas</h1>
            <p className="text-muted-foreground">Gestión de fondos de reserva de la comunidad</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Fondo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Fondo</DialogTitle>
                <DialogDescription>Crea un nuevo fondo de reserva</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Tipo de Fondo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_FONDO.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Fondo de Reserva Legal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del fondo..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="objetivo">Objetivo (€)</Label>
                    <Input
                      id="objetivo"
                      type="number"
                      value={formData.saldoObjetivo}
                      onChange={(e) => setFormData({ ...formData, saldoObjetivo: e.target.value })}
                      placeholder="10000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="aportacion">Aportación Mensual (€)</Label>
                    <Input
                      id="aportacion"
                      type="number"
                      value={formData.aportacionMensual}
                      onChange={(e) =>
                        setFormData({ ...formData, aportacionMensual: e.target.value })
                      }
                      placeholder="500"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Fondo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <Wallet className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.saldoTotal.toLocaleString('es-ES')}€
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Objetivo Total</CardTitle>
              <Target className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.objetivoTotal.toLocaleString('es-ES')}€
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aportaciones/Mes</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.aportacionesMensuales.toLocaleString('es-ES')}€
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Progreso Global</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porcentajeGlobal}%</div>
              <Progress value={stats.porcentajeGlobal} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Fondos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fondos.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay fondos creados</p>
              </CardContent>
            </Card>
          ) : (
            fondos.map((fondo) => (
              <Card key={fondo.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {fondo.nombre}
                        {getTipoBadge(fondo.tipo)}
                      </CardTitle>
                      {fondo.descripcion && (
                        <CardDescription className="mt-1">{fondo.descripcion}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFondo(fondo);
                        setShowMovimientoDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Movimiento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Saldo */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Saldo actual</span>
                    <span className="text-2xl font-bold text-green-600">
                      {fondo.saldoActual.toLocaleString('es-ES')}€
                    </span>
                  </div>

                  {/* Progreso */}
                  {fondo.saldoObjetivo && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Objetivo</span>
                        <span>{fondo.saldoObjetivo.toLocaleString('es-ES')}€</span>
                      </div>
                      <Progress value={fondo.porcentajeObjetivo || 0} />
                      <div className="text-sm text-right text-muted-foreground">
                        {fondo.porcentajeObjetivo}% completado
                      </div>
                    </div>
                  )}

                  {/* Resumen */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Aportaciones</div>
                        <div className="font-medium">
                          {fondo.totalAportaciones.toLocaleString('es-ES')}€
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Gastos</div>
                        <div className="font-medium">
                          {fondo.totalGastos.toLocaleString('es-ES')}€
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Últimos movimientos */}
                  {fondo.movimientos && fondo.movimientos.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <History className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Últimos movimientos</span>
                      </div>
                      <div className="space-y-2">
                        {fondo.movimientos.slice(0, 3).map((mov) => (
                          <div
                            key={mov.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {mov.tipo === 'aportacion' ? (
                                <ArrowUpCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <ArrowDownCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span className="truncate max-w-[150px]">{mov.concepto}</span>
                            </div>
                            <span
                              className={
                                mov.importe > 0 ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {mov.importe > 0 ? '+' : ''}
                              {mov.importe.toLocaleString('es-ES')}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog Movimiento */}
        <Dialog open={showMovimientoDialog} onOpenChange={setShowMovimientoDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Movimiento</DialogTitle>
              <DialogDescription>
                {selectedFondo?.nombre} - Saldo actual:{' '}
                {selectedFondo?.saldoActual.toLocaleString('es-ES')}€
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tipo de Movimiento</Label>
                <Select
                  value={movimiento.tipo}
                  onValueChange={(value) => setMovimiento({ ...movimiento, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aportacion">Aportación</SelectItem>
                    <SelectItem value="gasto">Gasto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="concepto">Concepto *</Label>
                <Input
                  id="concepto"
                  value={movimiento.concepto}
                  onChange={(e) => setMovimiento({ ...movimiento, concepto: e.target.value })}
                  placeholder="Ej: Aportación mensual febrero"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="importe">Importe (€) *</Label>
                <Input
                  id="importe"
                  type="number"
                  value={movimiento.importe}
                  onChange={(e) => setMovimiento({ ...movimiento, importe: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="referencia">Referencia</Label>
                <Input
                  id="referencia"
                  value={movimiento.referencia}
                  onChange={(e) => setMovimiento({ ...movimiento, referencia: e.target.value })}
                  placeholder="Nº transferencia, factura..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMovimientoDialog(false);
                  setSelectedFondo(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleMovimiento}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
