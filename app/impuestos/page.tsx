'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, ArrowLeft, Receipt, Download, Building2, AlertCircle } from 'lucide-react';

function toArray<T>(res: T | { data?: T[] }): T[] {
  if (Array.isArray(res)) return res;
  const data = (res as { data?: T[] })?.data;
  return Array.isArray(data) ? data : [];
}

interface ResumenAnual {
  ingresosBrutos: number;
  gastosDeducibles: number;
  baseImponible: number;
  impuestoEstimado: number;
  retencionesAplicadas: number;
  aPagar: number;
}

interface Obligacion {
  id: string;
  nombre: string;
  periodo: string;
  vence: string;
  estado: 'pendiente' | 'presentado' | 'pagado';
  importe: number;
}

interface PropiedadFiscal {
  nombre: string;
  valorCatastral: number | null;
  ibi: number | null;
  ingresos: number;
  gastos: number;
}

export default function ImpuestosPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [resumenAnual, setResumenAnual] = useState<ResumenAnual>({
    ingresosBrutos: 0,
    gastosDeducibles: 0,
    baseImponible: 0,
    impuestoEstimado: 0,
    retencionesAplicadas: 0,
    aPagar: 0,
  });
  const [obligaciones, setObligaciones] = useState<Obligacion[]>([]);
  const [propiedades, setPropiedades] = useState<PropiedadFiscal[]>([]);

  useEffect(() => {
    if (status === 'authenticated') setAuthLoading(false);
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    async function fetchTaxData() {
      setDataLoading(true);
      try {
        const y = parseInt(year, 10);
        const fechaDesde = `${y}-01-01`;
        const fechaHasta = `${y}-12-31`;

        const [paymentsRes, contractsRes, expensesRes, buildingsRes] = await Promise.all([
          fetch('/api/payments?limit=500').then((r) => (r.ok ? r.json() : { data: [] })),
          fetch('/api/contracts?limit=500').then((r) => (r.ok ? r.json() : { data: [] })),
          fetch(`/api/expenses?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&limit=500`).then(
            (r) => (r.ok ? r.json() : { data: [] })
          ),
          fetch('/api/buildings?limit=500').then((r) => (r.ok ? r.json() : [])),
        ]);

        const payments = toArray(paymentsRes);
        const contracts = toArray(contractsRes);
        const expenses = toArray(expensesRes);
        const buildings = Array.isArray(buildingsRes) ? buildingsRes : toArray(buildingsRes);

        // Ingresos brutos: pagos cobrados (estado pagado) con fechaPago en el año
        const startYear = new Date(y, 0, 1);
        const endYear = new Date(y, 11, 31, 23, 59, 59);
        const ingresosBrutos = payments
          .filter((p: { estado?: string; fechaPago?: string }) => {
            const est = (p.estado || '').toLowerCase();
            if (est !== 'pagado' && est !== 'cobrado') return false;
            const fp = p.fechaPago ? new Date(p.fechaPago) : null;
            return fp && fp >= startYear && fp <= endYear;
          })
          .reduce((acc: number, p: { monto?: number }) => acc + (Number(p.monto) || 0), 0);

        // Gastos deducibles: gastos del año
        const gastosDeducibles = expenses.reduce(
          (acc: number, e: { monto?: number }) => acc + (Number(e.monto) || 0),
          0
        );

        const baseImponible = Math.max(0, ingresosBrutos - gastosDeducibles);
        const impuestoEstimado = Math.round(baseImponible * 0.24);
        const retencionesAplicadas = 0;
        const aPagar = Math.max(0, impuestoEstimado - retencionesAplicadas);

        setResumenAnual({
          ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
          gastosDeducibles: Math.round(gastosDeducibles * 100) / 100,
          baseImponible: Math.round(baseImponible * 100) / 100,
          impuestoEstimado,
          retencionesAplicadas,
          aPagar,
        });

        // Obligaciones: IBI desde edificios con ibiAnual; resto pendiente de configurar
        const obligs: Obligacion[] = [];
        const activeContracts = contracts.filter(
          (c: { estado?: string }) => (c.estado || '').toLowerCase() === 'activo'
        );

        for (const b of buildings) {
          const ibi = b.ibiAnual != null ? Number(b.ibiAnual) : null;
          if (ibi != null && ibi > 0) {
            obligs.push({
              id: `ibi-${b.id}`,
              nombre: `IBI ${b.nombre || 'Edificio'}`,
              periodo: String(y),
              vence: `${y}-03-15`,
              estado: 'pendiente',
              importe: Math.round(ibi * 100) / 100,
            });
          }
        }

        if (obligs.length === 0 && (ingresosBrutos > 0 || gastosDeducibles > 0)) {
          obligs.push({
            id: 'placeholder-1',
            nombre: 'Modelo 100 - IRPF',
            periodo: String(y),
            vence: `${y + 1}-06-30`,
            estado: 'pendiente',
            importe: aPagar,
          });
        }

        if (obligs.length === 0) {
          obligs.push({
            id: 'empty',
            nombre: 'Sin obligaciones registradas',
            periodo: String(y),
            vence: '-',
            estado: 'pendiente',
            importe: 0,
          });
        }

        setObligaciones(obligs);

        // Propiedades: por edificio (ingresos = pagos cobrados, gastos = gastos del año)
        const ingresosPorBuilding = new Map<string, number>();
        const gastosPorBuilding = new Map<string, number>();

        for (const p of payments) {
          const est = (p.estado || '').toLowerCase();
          if (est !== 'pagado' && est !== 'cobrado') continue;
          const fp = p.fechaPago ? new Date(p.fechaPago) : null;
          if (!fp || fp < startYear || fp > endYear) continue;
          const buildingId = (p as { contract?: { unit?: { buildingId?: string } } }).contract?.unit
            ?.buildingId;
          if (buildingId) {
            const monto = Number((p as { monto?: number }).monto) || 0;
            ingresosPorBuilding.set(buildingId, (ingresosPorBuilding.get(buildingId) ?? 0) + monto);
          }
        }

        for (const e of expenses) {
          const buildingId =
            (e as { buildingId?: string }).buildingId ??
            (e as { building?: { id?: string } }).building?.id;
          if (buildingId) {
            const monto = Number((e as { monto?: number }).monto) || 0;
            gastosPorBuilding.set(buildingId, (gastosPorBuilding.get(buildingId) ?? 0) + monto);
          }
        }

        const props: PropiedadFiscal[] = buildings.map(
          (b: { id: string; nombre?: string; ibiAnual?: number | null }) => {
            const ingresos = ingresosPorBuilding.get(b.id) ?? 0;
            const gastos = gastosPorBuilding.get(b.id) ?? 0;
            const ibi = b.ibiAnual != null ? Number(b.ibiAnual) : null;
            return {
              nombre: b.nombre || 'Sin nombre',
              valorCatastral: null,
              ibi: ibi != null && ibi > 0 ? ibi : null,
              ingresos: Math.round(ingresos * 100) / 100,
              gastos: Math.round(gastos * 100) / 100,
            };
          }
        );

        setPropiedades(props);
      } catch (err) {
        console.error('Error fetching tax data:', err);
        setResumenAnual({
          ingresosBrutos: 0,
          gastosDeducibles: 0,
          baseImponible: 0,
          impuestoEstimado: 0,
          retencionesAplicadas: 0,
          aPagar: 0,
        });
        setObligaciones([]);
        setPropiedades([]);
      } finally {
        setDataLoading(false);
      }
    }

    fetchTaxData();
  }, [status, year]);

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pendiente: { className: 'bg-yellow-500', label: 'Pendiente' },
      presentado: { className: 'bg-green-500', label: 'Presentado' },
      pagado: { className: 'bg-blue-500', label: 'Pagado' },
    };
    const { className, label } = config[estado] || config.pendiente;
    return <Badge className={className}>{label}</Badge>;
  };

  const formatValue = (val: number | null, fallback: string) => {
    if (val == null || (typeof val === 'number' && isNaN(val))) return fallback;
    return `€${Number(val).toLocaleString()}`;
  };

  const hasData = resumenAnual.ingresosBrutos > 0 || resumenAnual.gastosDeducibles > 0;

  if (authLoading) {
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
                <BreadcrumbPage>Impuestos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <Receipt className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Impuestos</h1>
              <p className="text-muted-foreground">Control fiscal de tus propiedades</p>
            </div>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(new Date().getFullYear())}>
                {new Date().getFullYear()}
              </SelectItem>
              <SelectItem value={String(new Date().getFullYear() - 1)}>
                {new Date().getFullYear() - 1}
              </SelectItem>
              <SelectItem value={String(new Date().getFullYear() - 2)}>
                {new Date().getFullYear() - 2}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Resumen Fiscal */}
            <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <CardHeader>
                <CardTitle className="text-xl">Resumen Fiscal {year}</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasData ? (
                  <div className="flex items-center gap-3 py-4 text-white/90">
                    <AlertCircle className="h-6 w-6 shrink-0" />
                    <p>
                      Sin datos para el año {year}. Registra pagos cobrados y gastos para ver el
                      resumen fiscal.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-white/70 text-sm">Ingresos Brutos</p>
                      <p className="text-2xl font-bold">
                        {formatValue(resumenAnual.ingresosBrutos, '€0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Gastos Deducibles</p>
                      <p className="text-2xl font-bold">
                        {formatValue(resumenAnual.gastosDeducibles, '€0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Base Imponible</p>
                      <p className="text-2xl font-bold">
                        {formatValue(resumenAnual.baseImponible, '€0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Impuesto Estimado</p>
                      <p className="text-2xl font-bold">
                        {formatValue(resumenAnual.impuestoEstimado, '€0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Retenciones</p>
                      <p className="text-2xl font-bold">
                        {resumenAnual.retencionesAplicadas === 0 ? (
                          <span className="text-white/80 text-lg">Sin datos</span>
                        ) : (
                          formatValue(resumenAnual.retencionesAplicadas, '€0')
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">A Pagar/Devolver</p>
                      <p className="text-2xl font-bold">{formatValue(resumenAnual.aPagar, '€0')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="obligaciones">
              <TabsList>
                <TabsTrigger value="obligaciones">Obligaciones</TabsTrigger>
                <TabsTrigger value="propiedades">Por Propiedad</TabsTrigger>
              </TabsList>

              <TabsContent value="obligaciones" className="space-y-4 mt-4">
                {obligaciones.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Sin obligaciones registradas para {year}.</p>
                      <p className="text-sm mt-1">
                        Configura IBI en los edificios para ver obligaciones fiscales.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  obligaciones.map((ob) => (
                    <Card
                      key={ob.id}
                      className={ob.estado === 'pendiente' ? 'border-yellow-300' : ''}
                    >
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {ob.nombre}
                              {getEstadoBadge(ob.estado)}
                            </CardTitle>
                            <CardDescription>
                              Periodo: {ob.periodo} • Vence:{' '}
                              {ob.vence === '-'
                                ? 'Pendiente de configurar'
                                : new Date(ob.vence).toLocaleDateString('es-ES')}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {ob.importe > 0 ? formatValue(ob.importe, '€0') : 'Sin datos'}
                            </p>
                            <div className="flex gap-2 mt-2">
                              {ob.estado === 'pendiente' && ob.importe > 0 && (
                                <Button size="sm">Presentar</Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="propiedades" className="space-y-4 mt-4">
                {propiedades.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Sin propiedades para mostrar.</p>
                      <p className="text-sm mt-1">
                        Añade edificios y contrata inquilinos para ver datos fiscales por propiedad.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  propiedades.map((prop, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {prop.nombre}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Valor Catastral</p>
                            <p className="text-lg font-bold">
                              {formatValue(prop.valorCatastral, 'Sin datos')}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">IBI Anual</p>
                            <p className="text-lg font-bold">
                              {formatValue(prop.ibi, 'Sin datos')}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Ingresos</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatValue(prop.ingresos, '€0')}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Gastos Deducibles</p>
                            <p className="text-lg font-bold text-red-600">
                              {formatValue(prop.gastos, '€0')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
