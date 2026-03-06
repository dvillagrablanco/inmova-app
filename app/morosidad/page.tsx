'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Home, Loader2, Send, Eye, AlertTriangle } from 'lucide-react';
import { AiInsightPanel } from '@/components/ai/AiInsightPanel';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

interface Payment {
  id: string;
  monto: number;
  estado: string;
  fechaVencimiento: string;
  contract?: {
    tenant?: { nombreCompleto?: string; id?: string };
    unit?: { numero?: string; building?: { nombre?: string } };
  };
}

export default function MorosidadPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

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
      const res = await fetch('/api/payments?limit=500');
      if (!res.ok) throw new Error('Error cargando pagos');
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data || [];
      setPayments(data);
    } catch {
      toast.error('Error al cargar pagos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const today = useMemo(() => new Date(), []);

  const morosos = useMemo(() => {
    return payments
      .filter((p) => {
        const estado = (p.estado || '').toLowerCase();
        const isPendiente = estado === 'pendiente';
        if (!isPendiente) return false;
        const venc = p.fechaVencimiento ? new Date(p.fechaVencimiento) : null;
        return venc && venc < today;
      })
      .map((p) => {
        const venc = new Date(p.fechaVencimiento);
        const diasRetraso = differenceInDays(today, venc);
        return {
          ...p,
          diasRetraso,
          inquilino: p.contract?.tenant?.nombreCompleto || 'N/A',
          unidad: p.contract?.unit
            ? `${p.contract.unit.numero || ''} - ${p.contract.unit.building?.nombre || ''}`
            : 'N/A',
        };
      })
      .sort((a, b) => b.diasRetraso - a.diasRetraso);
  }, [payments, today]);

  const uniqueTenants = useMemo(() => {
    const ids = new Set<string>();
    morosos.forEach((m) => {
      const tid = m.contract?.tenant?.id;
      if (tid) ids.add(tid);
      else ids.add(m.inquilino);
    });
    return ids.size;
  }, [morosos]);

  const importeTotalVencido = useMemo(
    () => morosos.reduce((s, m) => s + (m.monto || 0), 0),
    [morosos]
  );

  const diasPromedioRetraso = useMemo(() => {
    if (morosos.length === 0) return 0;
    const sum = morosos.reduce((s, m) => s + m.diasRetraso, 0);
    return Math.round(sum / morosos.length);
  }, [morosos]);

  const tasaMorosidad = useMemo(() => {
    if (payments.length === 0) return 0;
    return Math.round((morosos.length / payments.length) * 100);
  }, [morosos.length, payments.length]);

  const exportData = useMemo(
    () =>
      morosos.map((m) => ({
        Inquilino: m.inquilino,
        Unidad: m.unidad,
        Importe: m.monto,
        'Días de Retraso': m.diasRetraso,
        'Último Contacto': 'N/A',
      })),
    [morosos]
  );

  const getRowBg = (dias: number) => {
    if (dias > 30) return 'bg-red-50 dark:bg-red-950/30';
    if (dias >= 15) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-yellow-50 dark:bg-yellow-950/30';
  };

  const handleEnviarRecordatorio = () => {
    toast.info('Función de recordatorio en desarrollo');
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

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
              <BreadcrumbPage>Morosidad</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Informe de Morosidad</h1>
            <p className="text-muted-foreground">
              Pagos vencidos y pendientes de cobro
            </p>
          </div>
          <ExportCSVButton
            data={exportData}
            filename="morosidad"
            columns={[
              { key: 'Inquilino', label: 'Inquilino' },
              { key: 'Unidad', label: 'Unidad' },
              { key: 'Importe', label: 'Importe' },
              { key: 'Días de Retraso', label: 'Días de Retraso' },
              { key: 'Último Contacto', label: 'Último Contacto' },
            ]}
          />
        </div>

        {/* Panel IA: Riesgo de Morosidad */}
        <AiInsightPanel
          apiUrl="/api/ai/delinquency-risk"
          mode="insights"
          title="Predicción de Morosidad IA"
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          transformResponse={(data) => {
            const tenants = data.tenants || data.results || [];
            return tenants.slice(0, 10).map((t: any, i: number) => ({
              id: `risk-${i}`,
              nivel: (t.riskScore || t.score || 0) >= 70 ? 'rojo' : (t.riskScore || t.score || 0) >= 40 ? 'amarillo' : 'verde',
              titulo: `${t.name || t.nombreCompleto || 'Inquilino'} — Riesgo ${t.riskScore || t.score || 0}/100`,
              detalle: t.reason || t.factors?.join(', ') || `${t.latePayments || 0} pagos atrasados, ratio deuda ${t.debtRatio || 0}%`,
            }));
          }}
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Morosos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueTenants}</div>
              <p className="text-xs text-muted-foreground">inquilinos únicos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Importe Total Vencido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {fmt(importeTotalVencido)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Días Promedio Retraso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{diasPromedioRetraso}</div>
              <p className="text-xs text-muted-foreground">días</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa Morosidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasaMorosidad}%</div>
              <p className="text-xs text-muted-foreground">
                pagos vencidos / total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pagos en mora ({morosos.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ordenado por días de retraso (mayor primero)
            </p>
          </CardHeader>
          <CardContent>
            {morosos.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No hay pagos vencidos pendientes
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Días de Retraso</TableHead>
                    <TableHead>Último Contacto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {morosos.map((m) => (
                    <TableRow
                      key={m.id}
                      className={getRowBg(m.diasRetraso)}
                    >
                      <TableCell className="font-medium">{m.inquilino}</TableCell>
                      <TableCell>{m.unidad}</TableCell>
                      <TableCell>{fmt(m.monto || 0)}</TableCell>
                      <TableCell>{m.diasRetraso}</TableCell>
                      <TableCell className="text-muted-foreground">N/A</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEnviarRecordatorio}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Enviar Recordatorio
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/pagos/${m.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Ver Pago
                          </Link>
                        </Button>
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
