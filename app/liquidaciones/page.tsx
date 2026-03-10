'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import {
  Euro,
  Plus,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  FileDown,
  Wallet,
  Calendar,
  FileText,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

interface LiquidacionItem {
  id: string;
  propietarioId: string;
  inmuebleId: string;
  propietario: { nombre: string; email: string };
  inmueble: { nombre: string; direccion: string };
  periodo: string;
  periodoMes: number;
  periodoAnio: number;
  rentaCobrada: number;
  honorariosMonto: number;
  gastosRepercutidos: number;
  importeNeto: number;
  estado: string;
  fechaCreacion: string;
  fechaPago: string | null;
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);
}

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<
    string,
    { className: string; label: string }
  > = {
    pendiente: {
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      label: 'Pendiente',
    },
    pagada: {
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: 'Pagada',
    },
    anulada: {
      className: 'bg-red-100 text-red-800 border-red-200',
      label: 'Anulada',
    },
  };
  const c = config[estado] || { className: '', label: estado };
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

export default function LiquidacionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionItem[]>([]);
  const [filtered, setFiltered] = useState<LiquidacionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>('todas');
  const [propietarioFilter, setPropietarioFilter] = useState<string>('todos');
  const [inmuebleFilter, setInmuebleFilter] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [propietariosOptions, setPropietariosOptions] = useState<Array<{ id: string; nombre: string }>>([]);
  const [inmueblesOptions, setInmueblesOptions] = useState<Array<{ id: string; nombre: string; propietarioId: string }>>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/liquidaciones/options');
        const json = await res.json();
        if (json.success && json.data) {
          setPropietariosOptions(json.data.propietarios?.map((p: { id: string; nombre: string }) => ({ id: p.id, nombre: p.nombre })) || []);
          setInmueblesOptions(json.data.inmuebles || []);
        }
      } catch {
        // Ignore
      }
    };
    if (status === 'authenticated') fetchOptions();
  }, [status]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (estadoFilter !== 'todas') params.set('estado', estadoFilter);
        if (propietarioFilter && propietarioFilter !== 'todos') params.set('propietarioId', propietarioFilter);
        if (inmuebleFilter && inmuebleFilter !== 'todos') params.set('inmuebleId', inmuebleFilter);
        if (fechaDesde) params.set('fechaDesde', fechaDesde);
        if (fechaHasta) params.set('fechaHasta', fechaHasta);
        const res = await fetch(`/api/liquidaciones?${params}`);
        const json = await res.json();
        const data = json.data || [];
        setLiquidaciones(data);
        setFiltered(data);
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar liquidaciones');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [status, estadoFilter, propietarioFilter, inmuebleFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    let filteredList = liquidaciones;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredList = filteredList.filter(
        (l) =>
          l.propietario.nombre.toLowerCase().includes(term) ||
          l.inmueble.nombre.toLowerCase().includes(term)
      );
    }
    setFiltered(filteredList);
  }, [liquidaciones, searchTerm]);

  const now = new Date();
  const pendientes = liquidaciones.filter((l) => l.estado === 'pendiente');
  const totalPendiente = pendientes.reduce((s, l) => s + l.importeNeto, 0);
  const pagadas = liquidaciones.filter((l) => l.estado === 'pagada');
  const totalPagado = pagadas.reduce((s, l) => s + l.importeNeto, 0);
  const liquidacionesEsteMes = liquidaciones.filter(
    (l) =>
      l.periodoMes === now.getMonth() + 1 &&
      l.periodoAnio === now.getFullYear()
  );
  const importeMedio =
    liquidaciones.length > 0
      ? liquidaciones.reduce((s, l) => s + l.importeNeto, 0) / liquidaciones.length
      : 0;

  const handleMarcarPagada = async (id: string) => {
    try {
      const res = await fetch(`/api/liquidaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'pagada' }),
      });
      if (!res.ok) throw new Error('Error');
      setLiquidaciones((prev) =>
        prev.map((l) => (l.id === id ? { ...l, estado: 'pagada', fechaPago: new Date().toISOString() } : l))
      );
      setFiltered((prev) =>
        prev.map((l) => (l.id === id ? { ...l, estado: 'pagada', fechaPago: new Date().toISOString() } : l))
      );
      toast.success('Liquidación marcada como pagada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleAnular = async (id: string) => {
    try {
      const res = await fetch(`/api/liquidaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'anulada' }),
      });
      if (!res.ok) throw new Error('Error');
      setLiquidaciones((prev) =>
        prev.map((l) => (l.id === id ? { ...l, estado: 'anulada', fechaPago: null } : l))
      );
      setFiltered((prev) =>
        prev.map((l) => (l.id === id ? { ...l, estado: 'anulada', fechaPago: null } : l))
      );
      toast.success('Liquidación anulada');
    } catch {
      toast.error('Error al anular');
    }
  };

  const handleDescargarPDF = (id: string) => {
    toast.info('Descarga de PDF en desarrollo');
  };

  const inmueblesFiltrados = propietarioFilter && propietarioFilter !== 'todos'
    ? inmueblesOptions.filter((i) => i.propietarioId === propietarioFilter)
    : inmueblesOptions;

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SmartBreadcrumbs
            customSegments={[
              { label: 'Inicio', href: '/dashboard', icon: Home },
              {
                label: 'Liquidaciones a Propietarios',
                href: '/liquidaciones',
                icon: FileText,
              },
            ]}
          />
          <Button asChild>
            <Link href="/liquidaciones/nueva" className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva liquidación
            </Link>
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total pendiente
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatEuro(totalPendiente)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total pagado
              </CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatEuro(totalPagado)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nº liquidaciones este mes
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{liquidacionesEsteMes.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Importe medio
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatEuro(importeMedio)}</span>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de liquidaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por propietario o inmueble..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="anulada">Anulada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={propietarioFilter} onValueChange={(v) => { setPropietarioFilter(v); setInmuebleFilter('todos'); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Propietario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {propietariosOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={inmuebleFilter} onValueChange={setInmuebleFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Inmueble" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {inmueblesFiltrados.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="month"
                  placeholder="Desde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
                <Input
                  type="month"
                  placeholder="Hasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Sin liquidaciones"
                  description="Crea tu primera liquidación para comenzar a gestionar los pagos a propietarios."
                  action={{
                    label: 'Crear liquidación',
                    onClick: () => router.push('/liquidaciones/nueva'),
                    icon: <Plus className="h-4 w-4" />,
                  }}
                  className="mt-6"
                />
              ) : (
                <div className="mt-4 overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Propietario</TableHead>
                        <TableHead>Inmueble</TableHead>
                        <TableHead className="text-right">Renta</TableHead>
                        <TableHead className="text-right">Honorarios</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Neto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.periodo}</TableCell>
                          <TableCell>
                            <div>{l.propietario.nombre}</div>
                            {l.propietario.email && (
                              <div className="text-xs text-muted-foreground">{l.propietario.email}</div>
                            )}
                          </TableCell>
                          <TableCell>{l.inmueble.nombre}</TableCell>
                          <TableCell className="text-right">{formatEuro(l.rentaCobrada)}</TableCell>
                          <TableCell className="text-right">{formatEuro(l.honorariosMonto)}</TableCell>
                          <TableCell className="text-right">{formatEuro(l.gastosRepercutidos)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatEuro(l.importeNeto)}
                          </TableCell>
                          <TableCell>
                            <EstadoBadge estado={l.estado} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/liquidaciones/${l.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalle
                                </DropdownMenuItem>
                                {l.estado === 'pendiente' && (
                                  <DropdownMenuItem onClick={() => handleMarcarPagada(l.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marcar como pagada
                                  </DropdownMenuItem>
                                )}
                                {l.estado !== 'anulada' && (
                                  <DropdownMenuItem
                                    onClick={() => handleAnular(l.id)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Anular
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDescargarPDF(l.id)}>
                                  <FileDown className="mr-2 h-4 w-4" />
                                  Descargar PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
