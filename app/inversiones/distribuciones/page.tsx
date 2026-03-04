'use client';

import { useEffect, useState } from 'react';
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
import { Home, Loader2, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ParticipacionPE {
  id: string;
  targetCompanyName: string;
  tipo: string;
  capitalLlamado?: number | null;
  capitalDistribuido?: number | null;
  tvpi?: number | null;
  dpi?: number | null;
}

interface DistributionEvent {
  id: string;
  fecha: string;
  concepto: string;
  importe: number;
  account?: { entidad?: string };
}

export default function DistribucionesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participations, setParticipations] = useState<ParticipacionPE[]>([]);
  const [distributionEvents, setDistributionEvents] = useState<DistributionEvent[]>([]);

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
      const [partRes, txRes] = await Promise.all([
        fetch('/api/family-office/participations'),
        fetch('/api/family-office/transactions?tipo=distribucion'),
      ]);

      if (partRes.ok) {
        const partJson = await partRes.json();
        const data = partJson.data || partJson;
        setParticipations(Array.isArray(data) ? data : []);
      }

      if (txRes.ok) {
        const txJson = await txRes.json();
        const txs = txJson.data || txJson.transactions || txJson;
        setDistributionEvents(Array.isArray(txs) ? txs : []);
      }
    } catch {
      toast.error('Error cargando distribuciones PE');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const peFunds = participations.filter(
    (p) =>
      p.tipo === 'pe_fund' ||
      p.tipo?.includes('pe') ||
      (p.capitalLlamado != null && p.capitalLlamado > 0) ||
      (p.capitalDistribuido != null && p.capitalDistribuido > 0)
  );
  const totalCalled = peFunds.reduce((s, p) => s + (p.capitalLlamado ?? 0), 0);
  const totalDistributed = peFunds.reduce((s, p) => s + (p.capitalDistribuido ?? 0), 0);
  const aggregateDPI = totalCalled > 0 ? totalDistributed / totalCalled : 0;
  const totalValor = peFunds.reduce((s, p) => s + ((p as any).valorEstimado ?? (p as any).valorContable ?? 0), 0);
  const aggregateTVPI = totalCalled > 0 ? (totalValor + totalDistributed) / totalCalled : 0;

  const latestDistDate = distributionEvents.length > 0
    ? distributionEvents.reduce((max, t) => {
        const d = new Date(t.fecha);
        return d > max ? d : max;
      }, new Date(0))
    : null;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Distribuciones PE</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-bold text-gray-900">Distribuciones Private Equity</h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Distribuido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{fmt(totalDistributed)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Called</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{fmt(totalCalled)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">DPI Agregado</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{aggregateDPI.toFixed(2)}x</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">TVPI Agregado</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{aggregateTVPI.toFixed(2)}x</span>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fondos PE</CardTitle>
            <p className="text-sm text-gray-500">Capital llamado, distribuido y métricas por fondo</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fondo</TableHead>
                  <TableHead className="text-right">Total Called</TableHead>
                  <TableHead className="text-right">Total Distribuido</TableHead>
                  <TableHead className="text-right">TVPI</TableHead>
                  <TableHead className="text-right">DPI</TableHead>
                  <TableHead>Última Distribución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peFunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay fondos PE con datos de distribuciones
                    </TableCell>
                  </TableRow>
                ) : (
                  peFunds.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.targetCompanyName}</TableCell>
                      <TableCell className="text-right">{fmt(p.capitalLlamado ?? 0)}</TableCell>
                      <TableCell className="text-right">{fmt(p.capitalDistribuido ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {p.tvpi != null ? `${Number(p.tvpi).toFixed(2)}x` : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {p.dpi != null ? `${Number(p.dpi).toFixed(2)}x` : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {latestDistDate ? format(latestDistDate, 'dd MMM yyyy', { locale: es }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Timeline */}
        {distributionEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Eventos de distribución
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {distributionEvents
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .slice(0, 20)
                  .map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <span className="font-medium">{e.concepto}</span>
                        {e.account?.entidad && (
                          <span className="text-gray-500 text-sm ml-2">({e.account.entidad})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 font-medium">{fmt(e.importe)}</span>
                        <span className="text-gray-500 text-sm">
                          {format(new Date(e.fecha), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
