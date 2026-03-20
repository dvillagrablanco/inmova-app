'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  Loader2,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Wifi,
  Database,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CompanyBankStatus {
  companyId: string;
  companyName: string;
  iban: string | null;
  isHolding: boolean;
  banking: {
    saltEdge: {
      connected: boolean;
      connections: Array<{ bank: string; lastSync: string | null }>;
    };
    nordigen: {
      connected: boolean;
      connections: Array<{ bank: string; lastSync: string | null }>;
    };
    lastSync: string | null;
  };
  sepa: {
    mandatesActive: number;
    mandatesTotal: number;
    pendingPayments: number;
    payouts: number;
  };
  reconciliation: {
    pendingReconciliation: number;
    bankTransactionsTotal: number;
    bankTransactionsPending: number;
  };
  alerts: string[];
}

interface GrupoStatus {
  timestamp: string;
  grupoVidaro: {
    totalSociedades: number;
    companies: CompanyBankStatus[];
  };
  saltEdge: {
    configured: boolean;
    totalConnections: number;
    connectedBanks: string[];
  };
  globalReconciliation: {
    totalPending: number;
    totalBankTxPending: number;
    totalBankTx: number;
    totalMandatesActive: number;
  };
  bancosPorConectar: Array<{ banco: string; connected: boolean }>;
  availableBanks: Array<{
    code: string;
    name: string;
    sociedades: string[];
    priority: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function BancariaGrupoPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [grupoStatus, setGrupoStatus] = useState<GrupoStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const role = session?.user?.role;
      if (!['super_admin', 'administrador'].includes(role || '')) {
        router.replace('/dashboard');
      }
    }
  }, [sessionStatus, session, router]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/banking/grupo-status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setGrupoStatus(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') fetchStatus();
  }, [sessionStatus, fetchStatus]);

  // Detectar callback de Salt Edge en la URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const success = url.searchParams.get('success');
    const errorParam = url.searchParams.get('error');
    const bank = url.searchParams.get('bank');
    const sociedades = url.searchParams.get('sociedades');

    if (success === 'bank_connected') {
      toast.success(`${bank || 'Banco'} conectado — ${sociedades || '?'} sociedades detectadas`);
      window.history.replaceState({}, '', window.location.pathname);
      fetchStatus();
    } else if (errorParam) {
      toast.error(`Error al conectar: ${errorParam}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchStatus]);

  const connectBank = async (providerCode?: string) => {
    setConnecting(bankName || 'all');
    try {
      // Enable Banking (PSD2 OAuth — prioritario)
      const res = await fetch('/api/open-banking/enablebanking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName: bankName || 'Bankinter', countryCode: 'ES' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes('no configurado') || data.error?.includes('PRIVATE_KEY')) {
          throw new Error(
            'Falta la clave privada de Enable Banking. ' +
              'Ve a https://enablebanking.com/dashboard → Applications → tu app → Keys → descarga la clave privada.'
          );
        }
        throw new Error(data.error || 'Error al conectar');
      }
      toast.success('Redirigiendo al banco...');
      setTimeout(() => {
        window.location.href = data.authUrl;
      }, 800);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConnecting(null);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/banking/grupo-status', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        `Sync completado: +${data.totalNewTransactions} nuevas transacciones, ${data.totalReconciled} conciliadas`
      );
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const g = grupoStatus;
  const saltEdgeOk = g?.saltEdge.configured;
  const totalConnected = g?.saltEdge.totalConnections ?? 0;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas/conciliacion">Conciliación</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Banca Grupo Vidaro</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Banca Grupo Vidaro</h1>
            <p className="text-muted-foreground">
              Estado bancario consolidado — {g?.grupoVidaro.totalSociedades ?? '?'} sociedades
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            {saltEdgeOk && totalConnected > 0 && (
              <Button size="sm" onClick={syncAll} disabled={syncing}>
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Sincronizar todo
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── KPIs GLOBALES ── */}
        {g && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              icon={<Wifi />}
              label="Conexiones activas"
              value={String(g.saltEdge.totalConnections)}
              ok={g.saltEdge.totalConnections > 0}
            />
            <KpiCard
              icon={<CreditCard />}
              label="Mandatos SEPA"
              value={String(g.globalReconciliation.totalMandatesActive)}
              ok={g.globalReconciliation.totalMandatesActive > 0}
            />
            <KpiCard
              icon={<Database />}
              label="Movimientos bancarios"
              value={String(g.globalReconciliation.totalBankTx)}
              ok={g.globalReconciliation.totalBankTx > 0}
            />
            <KpiCard
              icon={<AlertCircle />}
              label="Pendientes conciliar"
              value={String(g.globalReconciliation.totalPending)}
              ok={g.globalReconciliation.totalPending === 0 ? true : 'warn'}
            />
          </div>
        )}

        {/* ── CONECTAR BANCOS ── */}
        {saltEdgeOk && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Conectar bancos del Grupo Vidaro
              </CardTitle>
              <CardDescription>
                Conecta cada banco una vez. Salt Edge detecta automáticamente las cuentas de todas
                las sociedades.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {g?.saltEdge.connectedBanks && g.saltEdge.connectedBanks.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {g.saltEdge.connectedBanks.map((b) => (
                    <Badge
                      key={b}
                      variant="outline"
                      className="text-green-700 border-green-400 bg-green-50 gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {b}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {g?.availableBanks.map((bank) => {
                  const isConnected = g.saltEdge.connectedBanks.some(
                    (b) =>
                      b.toLowerCase().includes(bank.name.toLowerCase()) ||
                      bank.name.toLowerCase().includes(b.toLowerCase())
                  );
                  return (
                    <Button
                      key={bank.code}
                      variant={
                        isConnected ? 'outline' : bank.priority === 'HIGH' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => connectBank(bank.name)}
                      disabled={connecting !== null}
                      className={`justify-start text-xs ${isConnected ? 'opacity-70' : ''}`}
                    >
                      {connecting === bank.code ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : isConnected ? (
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                      ) : (
                        <Building2 className="w-3 h-3 mr-1" />
                      )}
                      <span className="truncate">{bank.name}</span>
                      {bank.priority === 'HIGH' && !isConnected && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                          Pri
                        </Badge>
                      )}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectBank('Bankinter')}
                  disabled={connecting !== null}
                  className="text-xs justify-start"
                >
                  {connecting === 'all' ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3 h-3 mr-1" />
                  )}
                  Otro banco
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bankinter y BBVA (prioridad alta) cubren todas las cuentas operativas de Rovida,
                Viroda y Vidaro. Después de autorizar, Salt Edge detecta las cuentas por IBAN y las
                asigna a cada sociedad.
              </p>
            </CardContent>
          </Card>
        )}

        {!saltEdgeOk && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Salt Edge no está configurado.{' '}
              <Link href="/finanzas/bancaria-setup" className="underline font-medium">
                Ir a configuración
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* ── ESTADO POR SOCIEDAD ── */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Estado por sociedad
          </h2>
          {g?.grupoVidaro.companies.map((company) => (
            <CompanyCard key={company.companyId} company={company} />
          ))}
          {!g?.grupoVidaro.companies.length && !loading && (
            <p className="text-sm text-muted-foreground">
              No se encontraron sociedades del Grupo Vidaro en la BD.
            </p>
          )}
        </div>

        {/* ── ACCESOS RÁPIDOS ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink href="/finanzas/conciliacion" icon={<TrendingUp />} label="Conciliación" />
          <QuickLink href="/pagos/sepa" icon={<CreditCard />} label="Pagos SEPA" />
          <QuickLink href="/finanzas/bancaria-setup" icon={<Building2 />} label="Configurar" />
          <QuickLink
            href="/finanzas/conciliacion?tab=importar"
            icon={<Database />}
            label="Importar CAMT.053"
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPANY CARD
// ═══════════════════════════════════════════════════════════════

function CompanyCard({ company }: { company: CompanyBankStatus }) {
  const openBankingOk = company.banking.saltEdge.connected || company.banking.nordigen.connected;
  const lastSync = company.banking.lastSync
    ? new Date(company.banking.lastSync).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Card className={`${company.alerts.length > 0 ? 'border-yellow-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${openBankingOk ? 'bg-green-500' : 'bg-red-400'}`}
            />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {company.companyName}
                {company.isHolding && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Holding
                  </Badge>
                )}
              </p>
              {company.iban && (
                <p className="text-xs text-muted-foreground font-mono truncate">{company.iban}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {/* Open Banking */}
            {company.banking.saltEdge.connected ? (
              <Badge
                variant="outline"
                className="text-blue-700 border-blue-300 bg-blue-50 text-xs gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Salt Edge
                {company.banking.saltEdge.connections.length > 0 && (
                  <span>
                    · {company.banking.saltEdge.connections.length} banco
                    {company.banking.saltEdge.connections.length > 1 ? 's' : ''}
                  </span>
                )}
              </Badge>
            ) : company.banking.nordigen.connected ? (
              <Badge
                variant="outline"
                className="text-purple-700 border-purple-300 bg-purple-50 text-xs gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Nordigen
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-red-600 border-red-300 bg-red-50 text-xs gap-1"
              >
                <XCircle className="w-3 h-3" />
                Sin conectar
              </Badge>
            )}

            {/* SEPA */}
            {company.sepa.mandatesActive > 0 && (
              <Badge variant="secondary" className="text-xs">
                {company.sepa.mandatesActive} mandatos SEPA
              </Badge>
            )}

            {/* Pendiente conciliar */}
            {company.reconciliation.pendingReconciliation > 0 && (
              <Badge
                variant="outline"
                className="text-yellow-700 border-yellow-300 bg-yellow-50 text-xs gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {company.reconciliation.pendingReconciliation} pendientes
              </Badge>
            )}
          </div>
        </div>

        {/* Detalles de conexión */}
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">
              {company.reconciliation.bankTransactionsTotal}
            </strong>{' '}
            movimientos
          </span>
          <span>
            <strong className="text-foreground">
              {company.reconciliation.bankTransactionsPending}
            </strong>{' '}
            por revisar
          </span>
          <span>{lastSync ? `Sync: ${lastSync}` : 'Sin sync'}</span>
        </div>

        {/* Alertas */}
        {company.alerts.length > 0 && (
          <div className="mt-2 space-y-1">
            {company.alerts.map((alert, i) => (
              <p key={i} className="text-xs text-yellow-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {alert}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function KpiCard({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean | 'warn';
}) {
  const color =
    ok === true
      ? 'text-green-700 bg-green-50 border-green-200'
      : ok === 'warn'
        ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
        : 'text-red-700 bg-red-50 border-red-200';

  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <div className="flex items-center gap-2 mb-1 opacity-70">
        <span className="w-4 h-4">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href}>
      <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors flex items-center gap-2 text-sm">
        <span className="w-4 h-4 text-muted-foreground">{icon}</span>
        {label}
        <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
      </div>
    </Link>
  );
}
