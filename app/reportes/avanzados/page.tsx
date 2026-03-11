// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  BarChart3,
  Users,
  FileSignature,
  Wrench,
  Euro,
  Receipt,
  CreditCard,
  TrendingUp,
  Building2,
  User,
  AlertTriangle,
  Home,
  FileCheck,
  PieChart,
  History,
  MapPin,
  Layers,
  LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { id: 'inquilinos', label: 'Inquilinos', icon: Users },
  { id: 'contratos', label: 'Contratos', icon: FileSignature },
  { id: 'incidencias', label: 'Incidencias', icon: Wrench },
  { id: 'ingresos', label: 'Ingresos', icon: Euro },
  { id: 'gastos', label: 'Gastos', icon: Euro },
  { id: 'liquidaciones', label: 'Liquidaciones', icon: Receipt },
  { id: 'facturas', label: 'Facturas', icon: FileText },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
  { id: 'rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
  { id: 'inmuebles', label: 'Inmuebles', icon: Building2 },
  { id: 'propietarios', label: 'Propietarios', icon: User },
  { id: 'impagos', label: 'Impagos', icon: AlertTriangle },
  { id: 'renta', label: 'Renta', icon: Home },
  { id: 'fiscal', label: 'Fiscal', icon: FileCheck },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'ocupacion', label: 'Ocupación', icon: PieChart },
  { id: 'morosidad', label: 'Morosidad', icon: AlertTriangle },
  { id: 'comparativa', label: 'Comparativa', icon: BarChart3 },
  { id: 'historico', label: 'Histórico', icon: History },
  { id: 'porZona', label: 'Por zona', icon: MapPin },
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function ReportTabContent({
  tipo,
  data,
  onExportCSV,
  onExportPDF,
}: {
  tipo: string;
  data: {
    kpis?: Record<string, unknown>;
    rows?: Record<string, unknown>[];
    cashflow?: Record<string, unknown>[];
  };
  onExportCSV: () => void;
  onExportPDF: () => void;
}) {
  const kpis = data?.kpis ?? {};
  const rows = (data?.rows ?? []) as Record<string, unknown>[];
  const cashflow = (data?.cashflow ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <Label>Desde</Label>
            <Input type="date" defaultValue="2025-01-01" className="w-[140px]" />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" defaultValue="2025-03-31" className="w-[140px]" />
          </div>
          <div className="flex items-end">
            <Button variant="secondary">Filtrar</Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {Object.keys(kpis).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(kpis).map(([key, val]) => {
            const isMoney =
              typeof val === 'number' &&
              (key.includes('impago') ||
                key.includes('total') ||
                key.includes('ingresos') ||
                key.includes('gastos') ||
                key.includes('beneficio') ||
                key.includes('importe') ||
                key.includes('renta') ||
                key.includes('neto') ||
                key.includes('base') ||
                (val as number) > 1000);
            const display =
              typeof val === 'number' ? (isMoney ? formatCurrency(val) : val) : String(val ?? '');
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{display}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tipo === 'rentabilidad' && cashflow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cashflow mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Gastos</TableHead>
                  <TableHead>Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashflow.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>{String(c.mes)}</TableCell>
                    <TableCell>{formatCurrency((c.ingresos as number) ?? 0)}</TableCell>
                    <TableCell>{formatCurrency((c.gastos as number) ?? 0)}</TableCell>
                    <TableCell>
                      {formatCurrency(((c.ingresos as number) ?? 0) - ((c.gastos as number) ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tipo === 'impagos' && kpis && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total impagos (€)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency((kpis.totalImpagos as number) ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Inquilinos con impago</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{kpis.inquilinosImpago ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Inmuebles con impago</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{kpis.inmueblesImpago ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tipo === 'fiscal' && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar ZIP (Declaración renta)
          </Button>
        </div>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(rows[0] ?? {}).map((k) => (
                    <TableHead key={k} className="capitalize">
                      {k.replace(/([A-Z])/g, ' $1').trim()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    {Object.values(r).map((v, j) => (
                      <TableCell key={j}>
                        {typeof v === 'number' && (String(v).includes('.') || (v as number) > 1000)
                          ? formatCurrency(v)
                          : String(v)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReportesAvanzadosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inquilinos');
  const [reportData, setReportData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;
    fetchData(activeTab);
  }, [status, activeTab, router]);

  async function fetchData(tipo: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes/avanzados?tipo=${tipo}`);
      const json = await res.json();
      if (json.success) setReportData(json.data ?? {});
    } catch {
      setReportData({});
    } finally {
      setLoading(false);
    }
  }

  const handleExportCSV = () => toast.info('Exportación CSV en desarrollo');
  const handleExportPDF = () => toast.info('Exportación PDF en desarrollo');
  const handleExportZIP = () => toast.info('Exportación ZIP en desarrollo');

  if (status === 'loading' || !session) {
    return (
      <AuthenticatedLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold">Reportes avanzados</h1>
          <p className="text-muted-foreground">Informes configurables y exportables</p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            fetchData(v);
          }}
        >
          <TabsList className="flex h-auto flex-wrap gap-1 justify-start overflow-x-auto p-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-6">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ReportTabContent
                  tipo={t.id}
                  data={
                    reportData as {
                      kpis?: Record<string, unknown>;
                      rows?: Record<string, unknown>[];
                      cashflow?: Record<string, unknown>[];
                    }
                  }
                  onExportCSV={handleExportCSV}
                  onExportPDF={t.id === 'fiscal' ? handleExportZIP : handleExportPDF}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
