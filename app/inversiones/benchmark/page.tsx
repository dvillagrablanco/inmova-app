'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ExportCSVButton } from '@/components/ui/export-csv-button';
import { Home, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const REFERENCE_PRICES: Record<string, number> = {
  madrid: 15,
  barcelona: 14,
  valladolid: 8,
};
const DEFAULT_PRICE = 10;

function getPricePerM2(city: string): number {
  const key = (city || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return REFERENCE_PRICES[key] ?? DEFAULT_PRICE;
}

function resolveCity(building?: { ciudad?: string; direccion?: string }): string {
  if (building?.ciudad) return building.ciudad;
  const addr = (building?.direccion || '').toLowerCase();
  if (addr.includes('madrid')) return 'Madrid';
  if (addr.includes('barcelona')) return 'Barcelona';
  if (addr.includes('valladolid')) return 'Valladolid';
  return 'default';
}

interface Unit {
  id: string;
  numero?: string;
  tipo?: string;
  estado?: string;
  superficie?: number;
  rentaMensual?: number;
  building?: { nombre?: string; ciudad?: string; direccion?: string };
}

interface BenchmarkRow {
  id: string;
  unidad: string;
  edificio: string;
  ciudad: string;
  rentaActual: number;
  rentaMercado: number;
  diferencia: number;
  diferenciaPct: number;
  recomendacion: string;
  aboveMarket: boolean;
}

export default function BenchmarkPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/units');
      if (!res.ok) throw new Error('Error cargando unidades');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setUnits(list);
    } catch {
      toast.error('Error al cargar unidades');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const benchmarkRows = useMemo((): BenchmarkRow[] => {
    return units
      .filter((u) => {
        const estado = (u.estado || '').toLowerCase();
        const renta = Number(u.rentaMensual || 0);
        const sup = Number(u.superficie || 0);
        return estado === 'ocupada' && renta > 0 && sup > 0;
      })
      .map((u) => {
        const rentaActual = Number(u.rentaMensual || 0);
        const sup = Number(u.superficie || 1);
        const ciudad = resolveCity(u.building);
        const precioM2 = getPricePerM2(ciudad);
        const rentaMercado = Math.round(sup * precioM2);
        const diferencia = rentaActual - rentaMercado;
        const diferenciaPct = rentaMercado > 0 ? (diferencia / rentaMercado) * 100 : 0;
        const aboveMarket = rentaActual >= rentaMercado;
        const recomendacion = aboveMarket
          ? 'Por encima del mercado'
          : 'Oportunidad de incremento';

        return {
          id: u.id,
          unidad: u.numero || u.id.slice(0, 8),
          edificio: u.building?.nombre || 'N/A',
          ciudad: ciudad === 'default' ? '-' : ciudad,
          rentaActual,
          rentaMercado,
          diferencia,
          diferenciaPct,
          recomendacion,
          aboveMarket,
        };
      })
      .sort((a, b) => a.diferencia - b.diferencia);
  }, [units]);

  const unidadesDebajoMercado = useMemo(
    () => benchmarkRows.filter((r) => !r.aboveMarket).length,
    [benchmarkRows]
  );

  const potencialIncrementoMensual = useMemo(
    () =>
      benchmarkRows
        .filter((r) => !r.aboveMarket)
        .reduce((sum, r) => sum + (r.rentaMercado - r.rentaActual), 0),
    [benchmarkRows]
  );

  const pctCarteraMercado = useMemo(() => {
    if (benchmarkRows.length === 0) return 0;
    const atMarket = benchmarkRows.filter((r) => r.aboveMarket).length;
    return (atMarket / benchmarkRows.length) * 100;
  }, [benchmarkRows]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  const exportData = useMemo(
    () =>
      benchmarkRows.map((r) => ({
        Unidad: r.unidad,
        Edificio: r.edificio,
        Ciudad: r.ciudad,
        'Renta Actual': r.rentaActual,
        'Renta Mercado': r.rentaMercado,
        Diferencia: r.diferencia,
        'Diferencia %': `${r.diferenciaPct.toFixed(1)}%`,
        Recomendación: r.recomendacion,
      })),
    [benchmarkRows]
  );

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-3.5 w-3.5" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Benchmark</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Benchmark de Mercado
            </h1>
            <p className="text-muted-foreground">
              Comparación renta actual vs renta de mercado estimada (€/m²/mes por ciudad)
            </p>
          </div>
          <ExportCSVButton
            data={exportData}
            filename="benchmark-mercado"
            columns={[
              { key: 'Unidad', label: 'Unidad' },
              { key: 'Edificio', label: 'Edificio' },
              { key: 'Ciudad', label: 'Ciudad' },
              { key: 'Renta Actual', label: 'Renta Actual' },
              { key: 'Renta Mercado', label: 'Renta Mercado' },
              { key: 'Diferencia', label: 'Diferencia' },
              { key: 'Diferencia %', label: 'Diferencia %' },
              { key: 'Recomendación', label: 'Recomendación' },
            ]}
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unidades por debajo de mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {unidadesDebajoMercado}
              </div>
              <p className="text-xs text-muted-foreground">oportunidad de incremento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Potencial incremento mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {fmt(potencialIncrementoMensual)}
              </div>
              <p className="text-xs text-muted-foreground">si se ajusta al mercado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                % cartera a precio de mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {pctCarteraMercado.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">por encima o en mercado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unidades analizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{benchmarkRows.length}</div>
              <p className="text-xs text-muted-foreground">ocupadas con renta</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativa por Unidad</CardTitle>
            <p className="text-sm text-muted-foreground">
              Referencia: Madrid 15€/m², Barcelona 14€/m², Valladolid 8€/m², resto 10€/m²
            </p>
          </CardHeader>
          <CardContent>
            {benchmarkRows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No hay unidades ocupadas con renta para analizar
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Edificio</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Renta Actual</TableHead>
                    <TableHead>Renta Mercado</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead>Recomendación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchmarkRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.unidad}</TableCell>
                      <TableCell>{r.edificio}</TableCell>
                      <TableCell>{r.ciudad}</TableCell>
                      <TableCell>{fmt(r.rentaActual)}</TableCell>
                      <TableCell>{fmt(r.rentaMercado)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            r.aboveMarket
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : 'text-red-600 dark:text-red-400 font-medium'
                          }
                        >
                          {fmt(r.diferencia)} ({fmtPct(r.diferenciaPct)})
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.aboveMarket
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }
                        >
                          {r.recomendacion}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
