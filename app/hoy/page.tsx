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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Check,
  Euro,
  FileText,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Alert {
  id: string;
  type: 'payment' | 'contract' | 'maintenance' | 'document';
  priority: 'alto' | 'medio' | 'bajo';
  title: string;
  description: string;
  date?: string;
  daysRemaining?: number;
  entityId: string;
  entityType: string;
}

interface AlertsResponse {
  alerts: Alert[];
  summary: { total: number; high: number; medium: number; low: number };
}

function formatDate(date: Date): string {
  const str = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return str.charAt(0).toUpperCase() + str.slice(1).replace(',', '').replace(/ de /g, ' ');
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function HoyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        const [alertsRes, dashboardRes] = await Promise.all([
          fetch('/api/dashboard/alerts?fresh=true'),
          fetch('/api/dashboard'),
        ]);

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setAlerts(data);
        }
        if (dashboardRes.ok) {
          await dashboardRes.json(); // Preload for potential future use
        }
      } catch (err) {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, router]);

  const handleMarkPaid = async (paymentId: string) => {
    setMarkingPaid((prev) => new Set(prev).add(paymentId));
    try {
      const res = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodoPago: 'transferencia' }),
      });
      if (res.ok) {
        toast.success('Pago marcado como cobrado');
        setAlerts((prev) => {
          if (!prev) return prev;
          const remaining = prev.alerts.filter((a) => a.entityId !== paymentId);
          return {
            alerts: remaining,
            summary: {
              total: remaining.length,
              high: remaining.filter((a) => a.priority === 'alto').length,
              medium: remaining.filter((a) => a.priority === 'medio').length,
              low: remaining.filter((a) => a.priority === 'bajo').length,
            },
          };
        });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al marcar pago');
      }
    } catch {
      toast.error('Error al marcar pago');
    } finally {
      setMarkingPaid((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const paymentAlerts = (alerts?.alerts ?? []).filter((a) => {
    if (a.type !== 'payment') return false;
    const d = a.date ? new Date(a.date) : null;
    return d && d <= endOfToday();
  });
  const contractAlerts = (alerts?.alerts ?? []).filter(
    (a) => a.type === 'contract' && (a.daysRemaining ?? 999) <= 7
  );
  const maintenanceAlerts = (alerts?.alerts ?? []).filter((a) => a.type === 'maintenance');

  const userName = session?.user?.name ?? session?.user?.email ?? 'Usuario';

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Hoy</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-semibold text-muted-foreground">
          {getGreeting()}, {userName} · {formatDate(new Date())}
        </h1>

        {/* Section 1: Pagos a cobrar hoy */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Pagos a cobrar hoy
            </h2>
            <Badge variant={paymentAlerts.length > 0 ? 'destructive' : 'secondary'}>
              {paymentAlerts.length}
            </Badge>
          </div>
          {paymentAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <span>Todo al día</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paymentAlerts.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleMarkPaid(a.entityId)}
                      disabled={markingPaid.has(a.entityId)}
                    >
                      {markingPaid.has(a.entityId) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Marcar Cobrado
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Contratos urgentes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contratos urgentes
            </h2>
            <Badge variant={contractAlerts.length > 0 ? 'destructive' : 'secondary'}>
              {contractAlerts.length}
            </Badge>
          </div>
          {contractAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <span>Todo al día</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {contractAlerts.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                      {a.daysRemaining != null && (
                        <p className="text-xs text-amber-600 mt-1">
                          Vence en {a.daysRemaining} día{a.daysRemaining !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/contratos/${a.entityId}`}>
                        Ver contrato
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Incidencias sin resolver */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Incidencias sin resolver
            </h2>
            <Badge variant={maintenanceAlerts.length > 0 ? 'destructive' : 'secondary'}>
              {maintenanceAlerts.length}
            </Badge>
          </div>
          {maintenanceAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <span>Todo al día</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {maintenanceAlerts.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/mantenimiento/${a.entityId}`}>
                        Ver incidencia
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 pt-6 border-t">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pagos">
              <Euro className="h-4 w-4 mr-2" />
              Pagos
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/contratos">
              <FileText className="h-4 w-4 mr-2" />
              Contratos
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/mantenimiento">
              <Wrench className="h-4 w-4 mr-2" />
              Mantenimiento
            </Link>
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
