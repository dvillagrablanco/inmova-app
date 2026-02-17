'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Home,
  RefreshCw,
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  AlertCircle,
  Zap,
  FileCheck2,
  Loader2,
  UserPlus,
  Copy,
  ExternalLink,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface Stats {
  gocardless: {
    configured: boolean;
    environment: string;
    creditor: { id: string; name: string } | null;
  };
  reconciliation: {
    payments: {
      total: number;
      reconciled: number;
      pendingReconciliation: number;
      failed: number;
      reconciliationRate: number;
    };
    payouts: {
      total: number;
      totalAmount: number;
      unreconciledCount: number;
    };
    monthlyRevenue: Record<string, number>;
  } | null;
}

interface SepaPayment {
  id: string;
  gcPaymentId: string;
  amountEuros: number;
  currency: string;
  description: string;
  reference: string;
  chargeDate: string;
  status: string;
  conciliado: boolean;
  createdAt: string;
  mandate: {
    gcMandateId: string;
    reference: string;
    customer: { givenName: string; familyName: string; email: string };
  };
  inmovaPayment: { id: string; periodo: string; monto: number; estado: string } | null;
}

interface SepaMandate {
  id: string;
  gcMandateId: string;
  reference: string;
  scheme: string;
  status: string;
  nextPossibleChargeDate: string;
  createdAt: string;
  customer: {
    givenName: string;
    familyName: string;
    email: string;
    tenantId: string;
    bankName: string;
    iban: string;
  };
  _count: { payments: number; subscriptions: number };
}

interface SepaSubscription {
  id: string;
  gcSubscriptionId: string;
  name: string;
  amountEuros: number;
  intervalUnit: string;
  dayOfMonth: number;
  status: string;
  mandate: {
    customer: { givenName: string; familyName: string; email: string };
  };
  _count: { payments: number };
}

// ============================================================================
// STATUS BADGE HELPERS
// ============================================================================

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending_submission: { label: 'Pendiente', variant: 'secondary' },
    submitted: { label: 'Enviado', variant: 'secondary' },
    confirmed: { label: 'Confirmado', variant: 'default' },
    paid_out: { label: 'Transferido', variant: 'default' },
    failed: { label: 'Fallido', variant: 'destructive' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    charged_back: { label: 'Devuelto', variant: 'destructive' },
    customer_approval_denied: { label: 'Denegado', variant: 'destructive' },
  };
  const config = map[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function MandateStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Activo', variant: 'default' },
    pending_submission: { label: 'Pendiente', variant: 'secondary' },
    submitted: { label: 'Enviado', variant: 'secondary' },
    failed: { label: 'Fallido', variant: 'destructive' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    expired: { label: 'Expirado', variant: 'destructive' },
    suspended_by_payer: { label: 'Suspendido', variant: 'destructive' },
  };
  const config = map[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function SepaPaymentsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<SepaPayment[]>([]);
  const [mandates, setMandates] = useState<SepaMandate[]>([]);
  const [subscriptions, setSubscriptions] = useState<SepaSubscription[]>([]);

  // Filters
  const [paymentStatus, setPaymentStatus] = useState('all');

  // Alta SEPA dialog
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [tenants, setTenants] = useState<Array<{ id: string; nombreCompleto: string; email: string; hasMandate: boolean }>>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<{ redirectUrl?: string; tenantName?: string; alreadySetup?: boolean; mandateId?: string } | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login');
  }, [authStatus, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/gocardless/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const qs = paymentStatus !== 'all' ? `?status=${paymentStatus}` : '';
      const res = await fetch(`/api/gocardless/payments${qs}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching payments:', e);
    }
  }, [paymentStatus]);

  const fetchMandates = useCallback(async () => {
    try {
      const res = await fetch('/api/gocardless/mandates');
      if (res.ok) {
        const data = await res.json();
        setMandates(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching mandates:', e);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/gocardless/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching subscriptions:', e);
    }
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    Promise.all([fetchStats(), fetchPayments(), fetchMandates(), fetchSubscriptions()])
      .finally(() => setLoading(false));
  }, [authStatus, fetchStats, fetchPayments, fetchMandates, fetchSubscriptions]);

  useEffect(() => {
    if (authStatus === 'authenticated') fetchPayments();
  }, [paymentStatus, authStatus, fetchPayments]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/gocardless/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Sincronización completada');
        fetchStats();
        fetchPayments();
      } else {
        toast.error(data.error || 'Error en sincronización');
      }
    } catch (e) {
      toast.error('Error de conexión');
    } finally {
      setSyncing(false);
    }
  };

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch('/api/tenants?limit=500');
      if (res.ok) {
        const data = await res.json();
        const list = (data.data || data.tenants || []).map((t: any) => ({
          id: t.id,
          nombreCompleto: t.nombreCompleto,
          email: t.email,
          hasMandate: false,
        }));
        // Mark those with active mandates
        const mandatesRes = await fetch('/api/gocardless/mandates?status=active');
        if (mandatesRes.ok) {
          const mData = await mandatesRes.json();
          const mandateTenantIds = new Set(
            (mData.data || []).map((m: any) => m.customer?.tenantId).filter(Boolean)
          );
          for (const t of list) {
            t.hasMandate = mandateTenantIds.has(t.id);
          }
        }
        setTenants(list);
      }
    } catch (e) {
      console.error('Error fetching tenants:', e);
    }
  }, []);

  const handleSetupTenant = async () => {
    if (!selectedTenantId) {
      toast.error('Selecciona un inquilino');
      return;
    }
    setSetupLoading(true);
    setSetupResult(null);
    try {
      const res = await fetch('/api/gocardless/setup-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: selectedTenantId }),
      });
      const data = await res.json();
      if (data.success) {
        setSetupResult(data);
        if (data.alreadySetup) {
          toast.info('Este inquilino ya tiene mandato SEPA activo');
        } else {
          toast.success('Link de autorización generado');
        }
        fetchMandates();
      } else {
        toast.error(data.error || 'Error configurando inquilino');
      }
    } catch (e) {
      toast.error('Error de conexión');
    } finally {
      setSetupLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const handleAutoReconcile = async () => {
    setReconciling(true);
    try {
      const res = await fetch('/api/gocardless/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchStats();
        fetchPayments();
      } else {
        toast.error(data.error || 'Error en conciliación');
      }
    } catch (e) {
      toast.error('Error de conexión');
    } finally {
      setReconciling(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const isConfigured = stats?.gocardless?.configured;
  const recon = stats?.reconciliation;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 px-4 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/pagos">Pagos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>SEPA Direct Debit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pagos SEPA</h1>
              <p className="text-sm text-muted-foreground">
                Domiciliaciones bancarias via GoCardless
                {stats?.gocardless?.creditor && (
                  <span className="ml-2">
                    &middot; {stats.gocardless.creditor.name}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={setupDialogOpen} onOpenChange={(open) => {
              setSetupDialogOpen(open);
              if (open) { fetchTenants(); setSetupResult(null); setSelectedTenantId(''); }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Alta SEPA
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Alta domiciliación SEPA</DialogTitle>
                  <DialogDescription>
                    Genera un link para que el inquilino autorice la domiciliación bancaria.
                    El inquilino introducirá su IBAN en la página segura de GoCardless.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Inquilino</Label>
                    <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar inquilino..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {tenants.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="flex items-center gap-2">
                              {t.nombreCompleto}
                              {t.hasMandate && (
                                <Badge variant="outline" className="text-xs ml-1 border-green-300 text-green-600">SEPA activo</Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!setupResult && (
                    <Button onClick={handleSetupTenant} disabled={setupLoading || !selectedTenantId} className="w-full">
                      {setupLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Generar link de autorización
                    </Button>
                  )}

                  {setupResult && !setupResult.alreadySetup && setupResult.redirectUrl && (
                    <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Link generado para {setupResult.tenantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Envía este link al inquilino. Al abrirlo, introducirá su IBAN y autorizará la domiciliación SEPA.
                      </p>
                      <div className="flex gap-2">
                        <Input value={setupResult.redirectUrl} readOnly className="text-xs" />
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(setupResult.redirectUrl!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => copyToClipboard(setupResult.redirectUrl!)}>
                          <Copy className="h-4 w-4 mr-1" /> Copiar link
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(setupResult.redirectUrl!, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                        </Button>
                      </div>
                    </div>
                  )}

                  {setupResult?.alreadySetup && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        Este inquilino ya tiene mandato SEPA activo ({setupResult.mandateId}).
                        Puedes cobrarle directamente desde la pestaña Pagos.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Sincronizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleAutoReconcile} disabled={reconciling}>
              {reconciling ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileCheck2 className="h-4 w-4 mr-1" />}
              Conciliar
            </Button>
          </div>
        </div>

        {!isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GoCardless no está configurado. Añade <code>GOCARDLESS_ACCESS_TOKEN</code> en las variables de entorno.
            </AlertDescription>
          </Alert>
        )}

        {/* KPIs */}
        {recon && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CreditCard className="h-4 w-4" />
                  Pagos totales
                </div>
                <p className="text-2xl font-bold">{recon.payments.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Conciliados
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {recon.payments.reconciled}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({recon.payments.reconciliationRate}%)
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pendientes
                </div>
                <p className="text-2xl font-bold text-amber-600">{recon.payments.pendingReconciliation}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  Transferido
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {recon.payouts.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Pagos</TabsTrigger>
            <TabsTrigger value="mandates">Mandatos</TabsTrigger>
            <TabsTrigger value="subscriptions">Recurrentes</TabsTrigger>
            <TabsTrigger value="payouts">Transferencias</TabsTrigger>
          </TabsList>

          {/* Pagos */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending_submission">Pendiente</SelectItem>
                  <SelectItem value="submitted">Enviado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="paid_out">Transferido</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="charged_back">Devuelto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Fecha cobro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Conciliado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay pagos SEPA registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {p.mandate?.customer?.givenName} {p.mandate?.customer?.familyName}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.mandate?.customer?.email}</div>
                        </TableCell>
                        <TableCell className="text-sm">{p.description}</TableCell>
                        <TableCell className="text-right font-medium">
                          {p.amountEuros.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.chargeDate || '-'}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell>
                          {p.conciliado ? (
                            <Badge variant="outline" className="border-green-300 text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Sí
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-300 text-amber-600">
                              <Clock className="h-3 w-3 mr-1" /> No
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Mandatos */}
          <TabsContent value="mandates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mandatos SEPA</CardTitle>
                <CardDescription>Autorizaciones de domiciliación bancaria de los inquilinos</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pagos</TableHead>
                    <TableHead>Próximo cargo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mandates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay mandatos SEPA
                      </TableCell>
                    </TableRow>
                  ) : (
                    mandates.map(m => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {m.customer?.givenName} {m.customer?.familyName}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.customer?.email}</div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{m.reference || m.gcMandateId}</TableCell>
                        <TableCell className="text-sm">
                          {m.customer?.bankName || '-'}
                          {m.customer?.iban && <span className="text-xs text-muted-foreground ml-1">****{m.customer.iban}</span>}
                        </TableCell>
                        <TableCell><MandateStatusBadge status={m.status} /></TableCell>
                        <TableCell className="text-sm">{m._count?.payments || 0}</TableCell>
                        <TableCell className="text-sm">{m.nextPossibleChargeDate || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Suscripciones */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cobros Recurrentes</CardTitle>
                <CardDescription>Suscripciones mensuales de alquiler via SEPA</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Importe/mes</TableHead>
                    <TableHead>Día cobro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cobros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay cobros recurrentes
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {s.mandate?.customer?.givenName} {s.mandate?.customer?.familyName}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{s.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {s.amountEuros?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </TableCell>
                        <TableCell className="text-sm">Día {s.dayOfMonth || 1}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'active' ? 'default' : s.status === 'paused' ? 'secondary' : 'destructive'}>
                            {s.status === 'active' ? 'Activo' : s.status === 'paused' ? 'Pausado' : s.status === 'cancelled' ? 'Cancelado' : s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{s._count?.payments || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transferencias a tu cuenta</CardTitle>
                <CardDescription>Pagos transferidos por GoCardless a tu cuenta bancaria</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Las transferencias se sincronizan automáticamente. Pulsa &quot;Sincronizar&quot; para actualizar.
                </p>
                {recon && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total transferencias</p>
                      <p className="text-lg font-bold">{recon.payouts.total}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Monto total</p>
                      <p className="text-lg font-bold">
                        {recon.payouts.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Sin conciliar</p>
                      <p className="text-lg font-bold text-amber-600">{recon.payouts.unreconciledCount}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
