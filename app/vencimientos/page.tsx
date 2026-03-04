'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Calendar,
  FileText,
  Euro,
  Shield,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Home,
} from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface TimelineItem {
  id: string;
  date: Date;
  type: 'contrato' | 'pago' | 'seguro';
  description: string;
  entityId: string;
  entityType: string;
  daysUntil: number;
  link: string;
  extra?: string;
}

interface ExpiringContract {
  id: string;
  buildingName: string;
  unitNumber: string;
  tenantName: string;
  fechaFin: string;
  daysUntil: number;
}

interface PaymentItem {
  id: string;
  fechaVencimiento: string;
  estado: string;
  monto: number;
  periodo?: string;
  contract?: {
    tenant?: { nombreCompleto?: string };
    unit?: { numero?: string; building?: { nombre?: string } };
  };
}

interface InsuranceItem {
  id: string;
  fechaVencimiento: string;
  numeroPoliza?: string;
  aseguradora?: string;
  tipo?: string;
  building?: { nombre?: string };
}

interface AlertItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  date?: string;
  daysRemaining?: number;
  entityId: string;
  entityType: string;
}

function getUrgencyBg(daysUntil: number): string {
  if (daysUntil < 0) return 'bg-red-500/15 border-red-500/40';
  if (daysUntil <= 7) return 'bg-amber-500/15 border-amber-500/40';
  return 'bg-green-500/15 border-green-500/40';
}

export default function VencimientosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;

    const fetchAll = async () => {
      try {
        const [expiringRes, alertsRes, paymentsRes, segurosRes] = await Promise.all([
          fetch('/api/contracts/expiring?days=90'),
          fetch('/api/dashboard/alerts'),
          fetch('/api/payments?limit=100'),
          fetch('/api/seguros').catch(() => ({ ok: false } as Response)),
        ]);

        const timeline: TimelineItem[] = [];
        const today = startOfDay(new Date());

        if (expiringRes.ok) {
          const expData = await expiringRes.json();
          const allContracts: ExpiringContract[] = [
            ...(expData.data?.critico || []),
            ...(expData.data?.alerta || []),
            ...(expData.data?.info || []),
          ];
          for (const c of allContracts) {
            const date = new Date(c.fechaFin);
            timeline.push({
              id: `contract-${c.id}`,
              date,
              type: 'contrato',
              description: `Contrato vence: ${c.tenantName} - ${c.buildingName} ${c.unitNumber}`,
              entityId: c.id,
              entityType: 'contract',
              daysUntil: c.daysUntil,
              link: `/contratos/${c.id}`,
              extra: c.tenantName,
            });
          }
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          const alerts: AlertItem[] = alertsData.alerts || [];
          for (const a of alerts) {
            if (a.entityType === 'payment' && !timeline.some((t) => t.entityId === a.entityId && t.type === 'pago')) {
              const date = a.date ? new Date(a.date) : today;
              timeline.push({
                id: a.id,
                date,
                type: 'pago',
                description: a.description || a.title,
                entityId: a.entityId,
                entityType: 'payment',
                daysUntil: a.daysRemaining ?? 0,
                link: `/pagos/${a.entityId}`,
              });
            }
          }
        }

        if (paymentsRes.ok) {
          const payData = await paymentsRes.json();
          const payments: PaymentItem[] = Array.isArray(payData) ? payData : payData?.data ?? [];
          const pending = payments.filter((p) => p.estado === 'pendiente' || p.estado === 'atrasado');
          const futureEnd = addMonths(today, 4);
          for (const p of pending) {
            const date = new Date(p.fechaVencimiento);
            if (date > futureEnd) continue;
            if (timeline.some((t) => t.entityId === p.id && t.type === 'pago')) continue;
            const daysUntil = differenceInDays(date, today);
            timeline.push({
              id: `payment-${p.id}`,
              date,
              type: 'pago',
              description: `${p.contract?.tenant?.nombreCompleto || 'Pago'} - ${p.monto?.toFixed(2)}€ ${p.periodo || ''}`.trim(),
              entityId: p.id,
              entityType: 'payment',
              daysUntil,
              link: `/pagos/${p.id}`,
            });
          }
        }

        if (segurosRes.ok) {
          try {
            const segurosRaw = await (segurosRes as Response).json();
            const seguros: InsuranceItem[] = Array.isArray(segurosRaw) ? segurosRaw : (segurosRaw?.data || []);
            const futureEnd = addMonths(today, 4);
            for (const s of seguros) {
              if (!s.fechaVencimiento) continue;
              const date = new Date(s.fechaVencimiento);
              if (isNaN(date.getTime()) || date > futureEnd) continue;
              const daysUntil = differenceInDays(date, today);
              timeline.push({
                id: `seguro-${s.id}`,
                date,
                type: 'seguro',
                description: `Seguro ${s.tipo || 'general'} - ${s.aseguradora || ''} ${s.building?.nombre || ''}`.trim(),
                entityId: s.id,
                entityType: 'insurance',
                daysUntil,
                link: `/seguros/${s.id}`,
                extra: s.numeroPoliza,
              });
            }
          } catch {
            // Seguros API may return unexpected format
          }
        }

        timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
        setItems(timeline);
      } catch (err) {
        toast.error('Error al cargar vencimientos');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [status, router]);

  const today = startOfDay(new Date());
  const months = [0, 1, 2, 3].map((i) => addMonths(today, i));

  const itemsThisMonth = items.filter((i) =>
    isWithinInterval(i.date, { start: startOfMonth(today), end: endOfMonth(today) })
  );
  const itemsNextWeek = items.filter((i) => i.daysUntil >= 0 && i.daysUntil <= 7);
  const urgentCount = items.filter((i) => i.daysUntil < 0 || i.daysUntil <= 7).length;

  const byMonth = months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const monthItems = items.filter((i) =>
      isWithinInterval(i.date, { start: monthStart, end: monthEnd })
    );
    const byType = {
      contratos: monthItems.filter((i) => i.type === 'contrato'),
      pagos: monthItems.filter((i) => i.type === 'pago'),
      seguros: monthItems.filter((i) => i.type === 'seguro'),
    };
    return { monthStart, monthItems, byType };
  });

  const typeLabels: Record<string, { label: string; icon: typeof FileText }> = {
    contratos: { label: 'Contratos', icon: FileText },
    pagos: { label: 'Pagos', icon: Euro },
    seguros: { label: 'Seguros', icon: Shield },
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vencimientos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vencimientos</h1>
            <p className="text-muted-foreground">
              Contratos, pagos y seguros próximos a vencer
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Vencimientos Este Mes</CardDescription>
                  <CardTitle className="text-3xl">{itemsThisMonth.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Próxima Semana</CardDescription>
                  <CardTitle className="text-3xl">{itemsNextWeek.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Acciones Urgentes</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    {urgentCount}
                    {urgentCount > 0 && (
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="space-y-8">
              {byMonth.map(({ monthStart, byType }) => {
                const total = byType.contratos.length + byType.pagos.length + byType.seguros.length;
                if (total === 0) return null;

                return (
                  <Card key={monthStart.toISOString()}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {format(monthStart, 'MMMM yyyy', { locale: es })}
                      </CardTitle>
                      <CardDescription>
                        {total} vencimiento{total !== 1 ? 's' : ''} este mes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(['contratos', 'pagos', 'seguros'] as const).map((type) => {
                        const list = byType[type];
                        if (list.length === 0) return null;

                        const { label, icon: Icon } = typeLabels[type];
                        return (
                          <div key={type}>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {label}
                            </h3>
                            <div className="space-y-2">
                              {list.map((item) => (
                                <div
                                  key={item.id}
                                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${getUrgencyBg(item.daysUntil)}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(item.date, "d 'de' MMMM", { locale: es })}
                                      {item.daysUntil < 0 && (
                                        <Badge variant="destructive" className="ml-2">
                                          Vencido
                                        </Badge>
                                      )}
                                      {item.daysUntil >= 0 && item.daysUntil <= 7 && (
                                        <Badge variant="default" className="ml-2">
                                          {item.daysUntil === 0
                                            ? 'Hoy'
                                            : `${item.daysUntil} días`}
                                        </Badge>
                                      )}
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={item.link}>
                                      Ver
                                      <ChevronRight className="ml-1 h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}

              {items.length === 0 && !loading && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No hay vencimientos en los próximos 3 meses
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
