'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Euro,
  Home,
  ArrowLeft,
  Download,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface PropertyStats {
  nombre: string;
  ingresos: number;
  gastos: number;
  ocupacion: number;
  rentabilidad: number;
}

function toArray<T>(res: T | { data?: T[] }): T[] {
  if (Array.isArray(res)) return res;
  const data = (res as { data?: T[] })?.data;
  return Array.isArray(data) ? data : [];
}

export default function ReportesFinancierosPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState({
    ingresos: 0,
    gastos: 0,
    beneficio: 0,
    ocupacion: 0,
    morosidad: 0,
    rentabilidad: 0,
    ingresosChange: 0,
    gastosChange: 0,
  });
  const [propiedades, setPropiedades] = useState<PropertyStats[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;

    async function fetchFinancialData() {
      setLoading(true);
      try {
        const now = new Date();

        // Current period date range
        let fechaDesde: string;
        let fechaHasta: string;
        // Previous period for month-over-month change
        let prevFechaDesde: string;
        let prevFechaHasta: string;

        if (period === 'year') {
          fechaDesde = `${now.getFullYear()}-01-01`;
          fechaHasta = now.toISOString().slice(0, 10);
          prevFechaDesde = `${now.getFullYear() - 1}-01-01`;
          prevFechaHasta = `${now.getFullYear() - 1}-12-31`;
        } else if (period === 'quarter') {
          const qStart = Math.floor(now.getMonth() / 3) * 3;
          fechaDesde = `${now.getFullYear()}-${String(qStart + 1).padStart(2, '0')}-01`;
          fechaHasta = now.toISOString().slice(0, 10);
          const prevQStart = qStart === 0 ? 9 : qStart - 3;
          const prevYear = qStart === 0 ? now.getFullYear() - 1 : now.getFullYear();
          prevFechaDesde = `${prevYear}-${String(prevQStart + 1).padStart(2, '0')}-01`;
          const prevQEndMonth = prevQStart + 3;
          prevFechaHasta =
            prevQEndMonth <= 12
              ? `${prevYear}-${String(prevQEndMonth).padStart(2, '0')}-${new Date(prevYear, prevQEndMonth, 0).getDate()}`
              : `${prevYear}-12-31`;
        } else {
          fechaDesde = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          fechaHasta = now.toISOString().slice(0, 10);
          const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          prevFechaDesde = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
          prevFechaHasta = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${new Date(prevYear, prevMonth + 1, 0).getDate()}`;
        }

        const startCurrent = new Date(fechaDesde);
        const endCurrent = new Date(fechaHasta);
        endCurrent.setHours(23, 59, 59, 999);
        const startPrev = new Date(prevFechaDesde);
        const endPrev = new Date(prevFechaHasta);
        endPrev.setHours(23, 59, 59, 999);

        const [paymentsRes, unitsRes, buildingsRes, expensesRes, prevExpensesRes] =
          await Promise.all([
            fetch('/api/payments?limit=500').then((r) => (r.ok ? r.json() : { data: [] })),
            fetch('/api/units').then((r) => (r.ok ? r.json() : [])),
            fetch('/api/buildings').then((r) => (r.ok ? r.json() : [])),
            fetch(`/api/expenses?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`).then((r) =>
              r.ok ? r.json() : { data: [] }
            ),
            fetch(
              `/api/expenses?fechaDesde=${prevFechaDesde}&fechaHasta=${prevFechaHasta}`
            ).then((r) => (r.ok ? r.json() : { data: [] })),
          ]);

        const payments = toArray(paymentsRes);
        const units = Array.isArray(unitsRes) ? unitsRes : toArray(unitsRes);
        const buildings = Array.isArray(buildingsRes) ? buildingsRes : toArray(buildingsRes);
        const expenses = toArray(expensesRes);
        const prevExpenses = toArray(prevExpensesRes);

        // Ingresos: sum of ACTUAL payments (estado=pagado) with fechaPago in current period
        const paidInPeriod = payments.filter((p: { estado?: string; fechaPago?: string }) => {
          const est = (p.estado || '').toLowerCase();
          if (est !== 'pagado' && est !== 'cobrado') return false;
          const fp = p.fechaPago ? new Date(p.fechaPago) : null;
          if (!fp) return false;
          return fp >= startCurrent && fp <= endCurrent;
        });
        const ingresos = paidInPeriod.reduce(
          (acc: number, p: { monto?: number }) => acc + (Number(p.monto) || 0),
          0
        );

        // Previous period ingresos for change %
        const paidInPrevPeriod = payments.filter((p: { estado?: string; fechaPago?: string }) => {
          const est = (p.estado || '').toLowerCase();
          if (est !== 'pagado' && est !== 'cobrado') return false;
          const fp = p.fechaPago ? new Date(p.fechaPago) : null;
          if (!fp) return false;
          return fp >= startPrev && fp <= endPrev;
        });
        const prevIngresos = paidInPrevPeriod.reduce(
          (acc: number, p: { monto?: number }) => acc + (Number(p.monto) || 0),
          0
        );

        const gastos = expenses.reduce(
          (acc: number, e: { monto?: number }) => acc + (Number(e.monto) || 0),
          0
        );
        const prevGastos = prevExpenses.reduce(
          (acc: number, e: { monto?: number }) => acc + (Number(e.monto) || 0),
          0
        );

        const ingresosChange =
          prevIngresos > 0 ? Math.round(((ingresos - prevIngresos) / prevIngresos) * 1000) / 10 : 0;
        const gastosChange =
          prevGastos > 0 ? Math.round(((gastos - prevGastos) / prevGastos) * 1000) / 10 : 0;

        const beneficio = ingresos - gastos;

        const totalUnits = units.length;
        const occupiedUnits = units.filter(
          (u: { estado?: string }) => u.estado?.toLowerCase() === 'ocupada'
        ).length;
        const ocupacion = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        const duePayments = payments.filter(
          (p: { estado?: string }) => p.estado === 'pendiente' || p.estado === 'atrasado'
        );
        const overduePayments = payments.filter(
          (p: { estado?: string }) => p.estado === 'atrasado'
        );
        const totalDue = duePayments.reduce(
          (acc: number, p: { monto?: number }) => acc + (Number(p.monto) || 0),
          0
        );
        const overdueAmount = overduePayments.reduce(
          (acc: number, p: { monto?: number }) => acc + (Number(p.monto) || 0),
          0
        );
        const morosidad = totalDue > 0 ? (overdueAmount / totalDue) * 100 : 0;
        const rentabilidad = ingresos > 0 ? (beneficio / ingresos) * 100 : 0;

        const ingresosPorBuilding = new Map<string, number>();
        const gastosPorBuilding = new Map<string, number>();
        const unitsPorBuilding = new Map<string, { total: number; ocupadas: number }>();

        // Ingresos por building from ACTUAL payments in period (not contract rentaMensual)
        for (const p of paidInPeriod) {
          const contract = (p as { contract?: { unit?: { buildingId?: string } } }).contract;
          const buildingId = contract?.unit?.buildingId;
          if (buildingId) {
            const monto = Number((p as { monto?: number }).monto) || 0;
            ingresosPorBuilding.set(buildingId, (ingresosPorBuilding.get(buildingId) ?? 0) + monto);
          }
        }
        for (const e of expenses) {
          const buildingId =
            (e as { buildingId?: string }).buildingId ??
            (e as { unit?: { buildingId?: string } }).unit?.buildingId;
          if (buildingId) {
            const monto = Number((e as { monto?: number }).monto) || 0;
            gastosPorBuilding.set(buildingId, (gastosPorBuilding.get(buildingId) ?? 0) + monto);
          }
        }
        for (const u of units) {
          const unitWithBuilding = u as {
            buildingId?: string;
            building?: { id?: string };
            estado?: string;
          };
          const buildingId = unitWithBuilding.buildingId ?? unitWithBuilding.building?.id;
          if (buildingId) {
            const curr = unitsPorBuilding.get(buildingId) ?? { total: 0, ocupadas: 0 };
            curr.total++;
            if (unitWithBuilding.estado?.toLowerCase() === 'ocupada') curr.ocupadas++;
            unitsPorBuilding.set(buildingId, curr);
          }
        }

        const props: PropertyStats[] = buildings.map(
          (b: { id: string; nombre?: string; direccion?: string }) => {
            const ingresosProp = ingresosPorBuilding.get(b.id) ?? 0;
            const gastosProp = gastosPorBuilding.get(b.id) ?? 0;
            const beneficioProp = ingresosProp - gastosProp;
            const unitsData = unitsPorBuilding.get(b.id) ?? { total: 0, ocupadas: 0 };
            const ocupacionProp =
              unitsData.total > 0 ? (unitsData.ocupadas / unitsData.total) * 100 : 0;
            const rentabilidadProp = ingresosProp > 0 ? (beneficioProp / ingresosProp) * 100 : 0;
            return {
              nombre:
                (b as { nombre?: string }).nombre ||
                (b as { direccion?: string }).direccion ||
                'Sin nombre',
              ingresos: Math.round(ingresosProp * 100) / 100,
              gastos: Math.round(gastosProp * 100) / 100,
              ocupacion: Math.round(ocupacionProp * 10) / 10,
              rentabilidad: Math.round(rentabilidadProp * 10) / 10,
            };
          }
        );

        setStats({
          ingresos: Math.round(ingresos * 100) / 100,
          gastos: Math.round(gastos * 100) / 100,
          beneficio: Math.round(beneficio * 100) / 100,
          ocupacion: Math.round(ocupacion * 10) / 10,
          morosidad: Math.round(morosidad * 10) / 10,
          rentabilidad: Math.round(rentabilidad * 10) / 10,
          ingresosChange,
          gastosChange,
        });
        setPropiedades(props);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setStats({
          ingresos: 0,
          gastos: 0,
          beneficio: 0,
          ocupacion: 0,
          morosidad: 0,
          rentabilidad: 0,
          ingresosChange: 0,
          gastosChange: 0,
        });
        setPropiedades([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFinancialData();
  }, [status, router, period]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/reportes">Reportes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Financieros</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Euro className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Reportes Financieros</h1>
              <p className="text-muted-foreground">Análisis de ingresos, gastos y rentabilidad</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{stats.ingresos.toLocaleString()}
              </div>
              {stats.ingresosChange !== 0 && (
                <p
                  className={`text-xs flex items-center ${stats.ingresosChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  <ArrowUpRight className="h-3 w-3" />
                  {stats.ingresosChange >= 0 ? '+' : ''}
                  {stats.ingresosChange}%
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                €{stats.gastos.toLocaleString()}
              </div>
              {stats.gastosChange !== 0 && (
                <p
                  className={`text-xs flex items-center ${stats.gastosChange <= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  <ArrowDownRight className="h-3 w-3" />
                  {stats.gastosChange}%
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Beneficio Neto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.beneficio.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ocupación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.ocupacion}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Morosidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.morosidad}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rentabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.rentabilidad}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle por Propiedad */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Propiedad</CardTitle>
            <CardDescription>Comparativa de ingresos y rentabilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propiedades.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No hay datos de propiedades. Crea edificios y contratos para ver el rendimiento.
                </p>
              ) : (
                propiedades.map((prop, idx) => (
                  <div
                    key={`${prop.nombre}-${idx}`}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{prop.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Ocupación: {prop.ocupacion}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                        <p className="font-bold text-green-600">
                          €{prop.ingresos.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Gastos</p>
                        <p className="font-bold text-red-600">€{prop.gastos.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Rentabilidad</p>
                        <p className="font-bold text-purple-600">{prop.rentabilidad}%</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
