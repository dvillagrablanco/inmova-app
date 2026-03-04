'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportCSVButton } from '@/components/ui/export-csv-button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Calculator, Euro, FileText, Home, AlertTriangle, TrendingUp, RefreshCw,
} from 'lucide-react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface FiscalEstimation {
  concepto: string;
  baseImponible: number;
  tipo: number; // %
  cuota: number;
  modelo: string;
}

export default function FiscalTrimestralPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    ingresosTrimestre: number;
    gastosTrimestre: number;
    estimaciones: FiscalEstimation[];
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error();
      const dashData = await res.json();

      const ingresosMes = dashData.kpis?.ingresosTotalesMensuales || 0;
      const gastosMes = dashData.kpis?.gastosTotales || 0;
      const ingresosTrimestre = ingresosMes * 3;
      const gastosTrimestre = gastosMes * 3;

      // Estimaciones fiscales simplificadas
      const estimaciones: FiscalEstimation[] = [
        {
          concepto: 'IVA Repercutido (alquileres locales)',
          baseImponible: ingresosTrimestre * 0.3, // ~30% son locales con IVA
          tipo: 21,
          cuota: ingresosTrimestre * 0.3 * 0.21,
          modelo: '303',
        },
        {
          concepto: 'IVA Soportado (gastos deducibles)',
          baseImponible: gastosTrimestre * 0.7, // ~70% con IVA
          tipo: 21,
          cuota: -(gastosTrimestre * 0.7 * 0.21),
          modelo: '303',
        },
        {
          concepto: 'Retención IRPF alquileres (19%)',
          baseImponible: ingresosTrimestre,
          tipo: 19,
          cuota: ingresosTrimestre * 0.19,
          modelo: '115',
        },
        {
          concepto: 'Retenciones trabajadores',
          baseImponible: gastosTrimestre * 0.2, // ~20% nóminas
          tipo: 15,
          cuota: gastosTrimestre * 0.2 * 0.15,
          modelo: '111',
        },
      ];

      setData({ ingresosTrimestre, gastosTrimestre, estimaciones });
    } catch {
      toast.error('Error cargando datos fiscales');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const currentQuarter = `T${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-64" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const ivaLiquidar = data?.estimaciones
    .filter(e => e.modelo === '303')
    .reduce((s, e) => s + e.cuota, 0) || 0;

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Estimación Fiscal</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              Estimación Fiscal Trimestral
            </h1>
            <p className="text-muted-foreground">
              Previsión {currentQuarter} · Datos estimados basados en operaciones actuales
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Estimaciones orientativas</p>
            <p className="text-sm text-amber-600">Estos cálculos son aproximados. Consulta con tu asesor fiscal para las liquidaciones definitivas.</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Ingresos Trimestre</p>
              <p className="text-2xl font-bold text-green-600">{fmt(data?.ingresosTrimestre || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Gastos Trimestre</p>
              <p className="text-2xl font-bold text-red-500">{fmt(data?.gastosTrimestre || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">IVA a Liquidar (est.)</p>
              <p className={`text-2xl font-bold ${ivaLiquidar >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fmt(ivaLiquidar)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla detalle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Detalle por Modelo</CardTitle>
              <CardDescription>Estimación de cuotas tributarias</CardDescription>
            </div>
            {data?.estimaciones && (
              <ExportCSVButton
                data={data.estimaciones}
                filename={`fiscal-${currentQuarter}`}
                columns={[
                  { key: 'modelo', label: 'Modelo' },
                  { key: 'concepto', label: 'Concepto' },
                  { key: 'baseImponible', label: 'Base Imponible' },
                  { key: 'tipo', label: 'Tipo %' },
                  { key: 'cuota', label: 'Cuota' },
                ]}
              />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Base Imponible</TableHead>
                  <TableHead className="text-right">Tipo</TableHead>
                  <TableHead className="text-right">Cuota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.estimaciones.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell><Badge variant="outline">{e.modelo}</Badge></TableCell>
                    <TableCell>{e.concepto}</TableCell>
                    <TableCell className="text-right">{fmt(e.baseImponible)}</TableCell>
                    <TableCell className="text-right">{e.tipo}%</TableCell>
                    <TableCell className={`text-right font-medium ${e.cuota >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {fmt(e.cuota)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
