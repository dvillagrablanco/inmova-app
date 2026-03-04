'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from '@/components/ui/lazy-charts-extended';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { addMonths, format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardKpis {
  ingresosTotalesMensuales: number;
  gastosTotales: number;
}

interface ExpiringContract {
  id: string;
  fechaFin: string;
  rentaMensual: number;
  daysUntil: number;
}

interface MonthProjection {
  mes: string;
  mesLabel: string;
  ingresos: number;
  gastos: number;
  neto: number;
  contratosQueVencen: number;
  riesgoVacancia: boolean;
}

export default function PrevisionPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [expiring, setExpiring] = useState<ExpiringContract[]>([]);

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
      const [dashboardRes, expiringRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/contracts/expiring?days=365'),
      ]);

      if (!dashboardRes.ok) throw new Error('Error cargando dashboard');
      if (!expiringRes.ok) throw new Error('Error cargando contratos');

      const dashboardData = await dashboardRes.json();
      const expiringData = await expiringRes.json();

      setKpis(dashboardData.kpis || null);
      const allExpiring: ExpiringContract[] = [
        ...(expiringData.data?.critico || []),
        ...(expiringData.data?.alerta || []),
        ...(expiringData.data?.info || []),
      ];
      setExpiring(allExpiring);
    } catch (e) {
      toast.error('Error al cargar datos');
      setKpis(null);
      setExpiring([]);
    } finally {
      setLoading(false);
    }
  };

  const projection = useMemo((): MonthProjection[] => {
    if (!kpis) return [];
    const baseIngresos = kpis.ingresosTotalesMensuales || 0;
    const baseGastos = kpis.gastosTotales || 0;
    const today = startOfMonth(new Date());
    const result: MonthProjection[] = [];

    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMMM yyyy', { locale: es });

      const contratosQueVencen = expiring.filter((c) => {
        const fin = new Date(c.fechaFin);
        return format(fin, 'yyyy-MM') === monthKey;
      }).length;

      result.push({
        mes: monthKey,
        mesLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        ingresos: baseIngresos,
        gastos: baseGastos,
        neto: baseIngresos - baseGastos,
        contratosQueVencen,
        riesgoVacancia: contratosQueVencen > 0,
      });
    }
    return result;
  }, [kpis, expiring]);

  const chartData = useMemo(
    () =>
      projection.map((p) => ({
        name: format(new Date(p.mes + '-01'), 'MMM yy', { locale: es }),
        Ingresos: p.ingresos,
        Gastos: p.gastos,
        Neto: p.neto,
        riesgo: p.riesgoVacancia,
      })),
    [projection]
  );

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Previsión 12 meses</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Previsión 12 meses</h1>
          <p className="text-muted-foreground">
            Proyección de cash-flow mensual con alertas de contratos que vencen
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Proyección de flujo de caja</CardTitle>
                <CardDescription>
                  Ingresos esperados vs gastos mensuales. Los meses con contratos que vencen se
                  marcan como riesgo de vacancia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) =>
                          value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                        }
                        labelFormatter={(label, payload) => {
                          const p = payload[0]?.payload;
                          return p?.riesgo ? `${label} (Riesgo vacancia)` : label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Ingresos" fill="#22c55e" name="Ingresos Esperados" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Neto" fill="#3b82f6" name="Neto" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle mensual</CardTitle>
                <CardDescription>
                  Mes a mes: ingresos esperados, gastos, neto y contratos que vencen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Ingresos Esperados</TableHead>
                      <TableHead className="text-right">Gastos</TableHead>
                      <TableHead className="text-right">Neto</TableHead>
                      <TableHead className="text-center">Contratos que Vencen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projection.map((p) => (
                      <TableRow key={p.mes} className={p.riesgoVacancia ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            {p.mesLabel}
                            {p.riesgoVacancia && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Riesgo vacancia
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.ingresos.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.gastos.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={p.neto >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {p.neto.toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {p.contratosQueVencen > 0 ? (
                            <Badge variant="secondary">{p.contratosQueVencen}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {projection.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    No hay datos de KPIs para generar la proyección
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
