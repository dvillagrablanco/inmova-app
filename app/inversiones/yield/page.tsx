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
import { Home, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatPercent } from '@/lib/utils';

const PRECIO_M2_ESTIMADO = 4500;

interface Unit {
  id: string;
  numero?: string;
  tipo?: string;
  estado?: string;
  superficie?: number;
  rentaMensual?: number;
  building?: { nombre?: string };
}

export default function YieldTrackerPage() {
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

  const yieldRows = useMemo(() => {
    return units
      .filter((u) => {
        const estado = (u.estado || '').toLowerCase();
        const renta = Number(u.rentaMensual || 0);
        const sup = Number(u.superficie || 0);
        return estado === 'ocupada' && renta > 0 && sup > 0;
      })
      .map((u) => {
        const renta = Number(u.rentaMensual || 0);
        const sup = Number(u.superficie || 1);
        const valorEstimado = sup * PRECIO_M2_ESTIMADO;
        const yieldPct = valorEstimado > 0
          ? (renta * 12 / valorEstimado) * 100
          : 0;
        let clasificacion: 'Alto' | 'Medio' | 'Bajo' = 'Bajo';
        if (yieldPct > 6) clasificacion = 'Alto';
        else if (yieldPct >= 4) clasificacion = 'Medio';

        return {
          id: u.id,
          unidad: u.numero || u.id.slice(0, 8),
          edificio: u.building?.nombre || 'N/A',
          rentaMensual: renta,
          superficie: sup,
          yieldPct,
          clasificacion,
        };
      })
      .sort((a, b) => b.yieldPct - a.yieldPct);
  }, [units]);

  const yieldMedio = useMemo(() => {
    if (yieldRows.length === 0) return 0;
    const sum = yieldRows.reduce((s, r) => s + r.yieldPct, 0);
    return sum / yieldRows.length;
  }, [yieldRows]);

  const yieldMaximo = useMemo(
    () => (yieldRows.length > 0 ? Math.max(...yieldRows.map((r) => r.yieldPct)) : 0),
    [yieldRows]
  );

  const yieldMinimo = useMemo(
    () => (yieldRows.length > 0 ? Math.min(...yieldRows.map((r) => r.yieldPct)) : 0),
    [yieldRows]
  );

  const getBadgeClass = (c: string) => {
    if (c === 'Alto') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (c === 'Medio') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

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
              <BreadcrumbPage>Yield Tracker</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Yield Tracker por Propiedad
          </h1>
          <p className="text-muted-foreground">
            Rentabilidad anual estimada (valoración €{PRECIO_M2_ESTIMADO.toLocaleString('es-ES')}/m²)
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yield Medio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(yieldMedio, 2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yield Máximo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPercent(yieldMaximo, 2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yield Mínimo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(yieldMinimo, 2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unidades Analizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yieldRows.length}</div>
              <p className="text-xs text-muted-foreground">ocupadas con renta</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Unidad</CardTitle>
            <p className="text-sm text-muted-foreground">
              Clasificación: Alto &gt;6%, Medio 4-6%, Bajo &lt;4%
            </p>
          </CardHeader>
          <CardContent>
            {yieldRows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No hay unidades ocupadas con renta para analizar
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Edificio</TableHead>
                    <TableHead>Renta/mes</TableHead>
                    <TableHead>Superficie</TableHead>
                    <TableHead>Yield %</TableHead>
                    <TableHead>Clasificación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yieldRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.unidad}</TableCell>
                      <TableCell>{r.edificio}</TableCell>
                      <TableCell>{fmt(r.rentaMensual)}</TableCell>
                      <TableCell>{r.superficie} m²</TableCell>
                      <TableCell>{formatPercent(r.yieldPct, 2)}</TableCell>
                      <TableCell>
                        <Badge className={getBadgeClass(r.clasificacion)}>
                          {r.clasificacion}
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
