'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  ExternalLink,
  Building2,
  CreditCard,
  Loader2,
  ArrowRight,
  Info,
  Wifi,
  Database,
  Shield,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SetupStatus {
  timestamp: string;
  environment: string;
  integrations: {
    nordigen: NordigenStatus;
    gocardless: GoCardlessStatus;
    tink: TinkStatus;
  };
  database: DatabaseStatus;
  recommendations: string[];
}

interface NordigenStatus {
  configured: boolean;
  connected: boolean;
  error?: string;
  setupUrl?: string;
  totalBanksES?: number;
  bankinterAvailable?: boolean;
  bankinterInstitutionId?: string;
  tokenExpiresAt?: string | null;
}

interface GoCardlessStatus {
  configured: boolean;
  connected: boolean;
  environment?: string;
  isLive?: boolean;
  error?: string;
  creditorName?: string;
  creditorCountry?: string;
  sepaActive?: boolean;
  webhookConfigured?: boolean;
  webhookUrl?: string;
  setupUrl?: string;
}

interface TinkStatus {
  configured: boolean;
  environment?: string;
  note?: string;
}

interface DatabaseStatus {
  bankConnections: { active: number; list: BankConnection[] };
  sepaMandates: { active: number; total: number };
  pendingReconciliation: number;
  bankTransactions: { total: number; pendingReview: number };
  error?: string;
}

interface BankConnection {
  id: string;
  provider: string;
  bank: string | null;
  status: string;
  lastSync: string | null;
}

interface NordigenInstitution {
  id: string;
  name: string;
  bic: string;
  logo: string;
  transactionDays: string;
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════

function StatusBadge({ ok, text }: { ok: boolean | 'warn'; text: string }) {
  if (ok === 'warn') {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50 gap-1">
        <AlertCircle className="w-3 h-3" />
        {text}
      </Badge>
    );
  }
  if (ok) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-400 bg-green-50 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {text}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-red-600 border-red-400 bg-red-50 gap-1">
      <XCircle className="w-3 h-3" />
      {text}
    </Badge>
  );
}

function StatusIcon({ ok }: { ok: boolean | null }) {
  if (ok === null) return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
  if (ok) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  return <XCircle className="w-5 h-5 text-red-500" />;
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function BancariSetupPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [connectingBank, setConnectingBank] = useState(false);
  const [institutions, setInstitutions] = useState<NordigenInstitution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const role = session?.user?.role;
      if (!['super_admin', 'administrador'].includes(role || '')) {
        router.replace('/dashboard');
      }
    }
  }, [sessionStatus, session, router]);

  const fetchStatus = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/banking/setup-status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSetupStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchStatus();
    }
  }, [sessionStatus, fetchStatus]);

  // Cargar instituciones desde Nordigen
  const loadInstitutions = useCallback(async () => {
    setLoadingInstitutions(true);
    try {
      const res = await fetch('/api/open-banking/nordigen/institutions?country=ES');
      if (!res.ok) throw new Error('Error cargando bancos');
      const data = await res.json();
      setInstitutions(data.institutions || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingInstitutions(false);
    }
  }, []);

  // Iniciar conexión con un banco vía Nordigen
  const connectBank = useCallback(async (institutionId: string, institutionName: string) => {
    setConnectingBank(true);
    try {
      const res = await fetch('/api/open-banking/nordigen/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId, institutionName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error conectando banco');

      toast.success('Redirigiendo al banco para autorizar acceso...');
      // Redirigir al banco para autorizar
      setTimeout(() => {
        window.location.href = data.link || data.redirectUrl;
      }, 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConnectingBank(false);
    }
  }, []);

  // Sincronizar movimientos bancarios
  const syncBankTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/open-banking/nordigen/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error sincronizando');
      toast.success(`Sincronización completada: ${data.newTransactions || 0} nuevas transacciones`);
      fetchStatus(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [fetchStatus]);

  if (sessionStatus === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const nordigen = setupStatus?.integrations.nordigen;
  const gc = setupStatus?.integrations.gocardless;
  const db = setupStatus?.database;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
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
              <BreadcrumbPage>Configuración Bancaria</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Configuración Bancaria</h1>
            <p className="text-muted-foreground">
              Estado de integraciones bancarias — Grupo Vidaro
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Actualizar
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Recomendaciones */}
        {setupStatus?.recommendations && setupStatus.recommendations.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <ul className="space-y-1 list-disc list-inside">
                {setupStatus.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* ── ESTADO GENERAL ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Wifi className="w-5 h-5" />}
            label="Nordigen"
            value={
              nordigen?.connected ? 'Conectado' : nordigen?.configured ? 'Error' : 'No configurado'
            }
            ok={nordigen?.connected ? true : false}
          />
          <StatCard
            icon={<CreditCard className="w-5 h-5" />}
            label="GoCardless SEPA"
            value={
              gc?.connected
                ? gc.isLive
                  ? 'Live'
                  : 'Sandbox'
                : gc?.configured
                  ? 'Error'
                  : 'No configurado'
            }
            ok={gc?.connected && gc?.isLive ? true : gc?.connected ? 'warn' : false}
          />
          <StatCard
            icon={<Database className="w-5 h-5" />}
            label="Cuentas conectadas"
            value={String(db?.bankConnections.active ?? '—')}
            ok={db && db.bankConnections.active > 0 ? true : false}
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Mandatos SEPA"
            value={db ? `${db.sepaMandates.active} activos` : '—'}
            ok={db && db.sepaMandates.active > 0 ? true : 'warn'}
          />
        </div>

        {/* ── NORDIGEN / BANK ACCOUNT DATA ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-base">
                    GoCardless Bank Account Data (Nordigen)
                  </CardTitle>
                  <CardDescription>
                    Lectura automática de movimientos Bankinter — Gratuito, sin licencia TPP
                  </CardDescription>
                </div>
              </div>
              <StatusIcon ok={nordigen ? nordigen.connected : null} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estado */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                ok={nordigen?.configured ?? false}
                text={nordigen?.configured ? 'Credenciales configuradas' : 'Sin credenciales'}
              />
              <StatusBadge
                ok={nordigen?.connected ?? false}
                text={nordigen?.connected ? 'API accesible' : 'API no accesible'}
              />
              {nordigen?.bankinterAvailable !== undefined && (
                <StatusBadge
                  ok={nordigen.bankinterAvailable}
                  text={
                    nordigen.bankinterAvailable ? 'Bankinter disponible' : 'Bankinter no encontrado'
                  }
                />
              )}
              {nordigen?.totalBanksES && (
                <Badge variant="secondary">{nordigen.totalBanksES} bancos ES disponibles</Badge>
              )}
            </div>

            {nordigen?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{nordigen.error}</AlertDescription>
              </Alert>
            )}

            {/* Sin configurar: guía de setup */}
            {!nordigen?.configured && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-blue-900">
                  Pasos para activar la lectura automática de movimientos bancarios:
                </p>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>
                    Regístrate en{' '}
                    <a
                      href="https://bankaccountdata.gocardless.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      bankaccountdata.gocardless.com
                    </a>
                  </li>
                  <li>
                    Ve a <strong>User secrets</strong> y crea un par de secretos
                  </li>
                  <li>
                    Añade a <code className="bg-blue-100 px-1 rounded">.env.production</code>:
                    <pre className="bg-blue-100 rounded p-2 mt-1 text-xs font-mono">
                      {`NORDIGEN_SECRET_ID=xxxx\nNORDIGEN_SECRET_KEY=xxxx`}
                    </pre>
                  </li>
                  <li>
                    Reinicia el servidor:{' '}
                    <code className="bg-blue-100 px-1 rounded">
                      pm2 restart inmova-app --update-env
                    </code>
                  </li>
                  <li>Vuelve aquí y conecta Bankinter</li>
                </ol>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href="https://bankaccountdata.gocardless.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ir al portal Nordigen
                  </a>
                </Button>
              </div>
            )}

            {/* Configurado: mostrar opciones */}
            {nordigen?.configured && (
              <>
                <Separator />
                {/* Cuentas conectadas */}
                {db && db.bankConnections.list.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cuentas conectadas:</p>
                    {db.bankConnections.list
                      .filter((c) => c.provider === 'nordigen' || c.provider === 'gocardless')
                      .map((conn) => (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">{conn.bank || conn.provider}</p>
                            <p className="text-xs text-muted-foreground">
                              {conn.lastSync
                                ? `Última sync: ${new Date(conn.lastSync).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                : 'Sin sincronizar aún'}
                            </p>
                          </div>
                          <Badge variant={conn.status === 'conectado' ? 'default' : 'secondary'}>
                            {conn.status}
                          </Badge>
                        </div>
                      ))}
                    {db.bankConnections.list.filter(
                      (c) => c.provider === 'nordigen' || c.provider === 'gocardless'
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Sin cuentas Nordigen conectadas aún.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin cuentas conectadas aún.</p>
                )}

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-2">
                  {nordigen.connected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadInstitutions}
                      disabled={loadingInstitutions}
                    >
                      {loadingInstitutions ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Building2 className="w-4 h-4 mr-2" />
                      )}
                      Ver bancos disponibles
                    </Button>
                  )}
                  {db && db.bankConnections.active > 0 && (
                    <Button size="sm" onClick={syncBankTransactions}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar movimientos
                    </Button>
                  )}
                </div>

                {/* Lista de instituciones */}
                {institutions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Conectar banco:</p>
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                      {/* Bankinter primero */}
                      {[
                        ...institutions.filter((i) => i.name.toLowerCase().includes('bankinter')),
                        ...institutions.filter((i) => !i.name.toLowerCase().includes('bankinter')),
                      ]
                        .slice(0, 20)
                        .map((inst) => (
                          <div
                            key={inst.id}
                            className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              {inst.logo ? (
                                <Image
                                  src={inst.logo}
                                  alt={inst.name}
                                  width={32}
                                  height={32}
                                  className="object-contain rounded"
                                  unoptimized
                                />
                              ) : (
                                <Building2 className="w-8 h-8 text-muted-foreground" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{inst.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {inst.id} · {inst.transactionDays} días histórico
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => connectBank(inst.id, inst.name)}
                              disabled={connectingBank}
                            >
                              {connectingBank ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  Conectar
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mostrando los primeros 20. Bankinter aparece primero.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── GOCARDLESS PAYMENTS / SEPA ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-green-600" />
                <div>
                  <CardTitle className="text-base">
                    GoCardless Payments — SEPA Direct Debit
                  </CardTitle>
                  <CardDescription>
                    Cobro automático de alquileres mediante domiciliación bancaria
                  </CardDescription>
                </div>
              </div>
              <StatusIcon ok={gc ? gc.connected : null} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estado */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                ok={gc?.configured ?? false}
                text={gc?.configured ? 'Token configurado' : 'Sin token'}
              />
              {gc?.connected && (
                <StatusBadge
                  ok={gc.isLive ? true : 'warn'}
                  text={gc.isLive ? 'LIVE — Producción' : 'SANDBOX — No es producción'}
                />
              )}
              {gc?.sepaActive !== undefined && (
                <StatusBadge
                  ok={gc.sepaActive}
                  text={
                    gc.sepaActive
                      ? 'Scheme SEPA activo'
                      : 'SEPA no activado (verificación pendiente)'
                  }
                />
              )}
              {gc?.webhookConfigured !== undefined && (
                <StatusBadge
                  ok={gc.webhookConfigured}
                  text={gc.webhookConfigured ? 'Webhook configurado' : 'Webhook no configurado'}
                />
              )}
            </div>

            {gc?.creditorName && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Conectado como: {gc.creditorName} ({gc.creditorCountry})
                  </p>
                  {gc.webhookUrl && (
                    <p className="text-xs text-green-700">Webhook URL: {gc.webhookUrl}</p>
                  )}
                </div>
              </div>
            )}

            {gc?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{gc.error}</AlertDescription>
              </Alert>
            )}

            {/* Sin configurar */}
            {!gc?.configured && (
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-green-900">
                  Pasos para activar SEPA Direct Debit:
                </p>
                <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                  <li>
                    Crea una cuenta en{' '}
                    <a
                      href="https://manage.gocardless.com/sign-up"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      manage.gocardless.com
                    </a>
                  </li>
                  <li>Completa la verificación KYB (2-5 días laborables)</li>
                  <li>Añade la cuenta Bankinter (IBAN ROVIDA o VIRODA) como creditor</li>
                  <li>
                    Genera un Access Token en <strong>Developers → Access tokens</strong>
                  </li>
                  <li>
                    Configura un Webhook con URL:{' '}
                    <code className="bg-green-100 px-1 rounded text-xs">
                      https://inmovaapp.com/api/gocardless/webhook
                    </code>
                  </li>
                  <li>
                    Añade a <code className="bg-green-100 px-1 rounded">.env.production</code>:
                    <pre className="bg-green-100 rounded p-2 mt-1 text-xs font-mono">
                      {`GOCARDLESS_ACCESS_TOKEN=live_...\nGOCARDLESS_ENVIRONMENT=live\nGOCARDLESS_WEBHOOK_SECRET=whsec_...`}
                    </pre>
                  </li>
                </ol>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href="https://manage.gocardless.com/sign-up"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ir a GoCardless
                  </a>
                </Button>
              </div>
            )}

            {/* Sandbox warning */}
            {gc?.connected && !gc.isLive && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  GoCardless está en modo <strong>SANDBOX</strong>. Los cobros son simulados y no
                  reales. Para producción: cambiar <code>GOCARDLESS_ENVIRONMENT=live</code> y usar
                  un token <code>live_...</code> del dashboard.
                </AlertDescription>
              </Alert>
            )}

            {/* SEPA no activo */}
            {gc?.connected && gc.sepaActive === false && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El scheme SEPA no está activo todavía. Esto significa que la verificación KYB de
                  tu empresa en GoCardless aún no está completada, o que no has añadido la cuenta
                  bancaria española como creditor. Contacta a GoCardless para confirmar el estado.
                </AlertDescription>
              </Alert>
            )}

            {gc?.connected && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/pagos/sepa" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Gestionar pagos SEPA
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── BASE DE DATOS ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-600" />
              <div>
                <CardTitle className="text-base">Estado en Base de Datos</CardTitle>
                <CardDescription>Datos sincronizados y pendientes de conciliar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {db?.error ? (
              <Alert variant="destructive">
                <AlertDescription>{db.error}</AlertDescription>
              </Alert>
            ) : db ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{db.bankConnections.active}</p>
                  <p className="text-xs text-muted-foreground">Cuentas bancarias conectadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{db.sepaMandates.active}</p>
                  <p className="text-xs text-muted-foreground">
                    Mandatos SEPA activos (de {db.sepaMandates.total})
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className={`text-2xl font-bold ${db.pendingReconciliation > 0 ? 'text-yellow-600' : 'text-green-600'}`}
                  >
                    {db.pendingReconciliation}
                  </p>
                  <p className="text-xs text-muted-foreground">Pagos SEPA sin conciliar</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{db.bankTransactions.total}</p>
                  <p className="text-xs text-muted-foreground">
                    Movimientos bancarios ({db.bankTransactions.pendingReview} pendientes)
                  </p>
                </div>
              </div>
            ) : null}

            {db && db.pendingReconciliation > 0 && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" asChild>
                  <a href="/finanzas/conciliacion">
                    <Zap className="w-4 h-4 mr-2" />
                    Conciliar ahora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── TINK INFO ── */}
        <Card className="opacity-75">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <CardTitle className="text-base text-muted-foreground">
                  Tink (Open Banking) — No recomendado
                </CardTitle>
                <CardDescription>
                  {setupStatus?.integrations.tink.note ||
                    'Requiere licencia TPP regulatoria (6-18 meses de aprobación)'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StatusBadge
              ok={setupStatus?.integrations.tink.configured ?? false}
              text={
                setupStatus?.integrations.tink.configured
                  ? `Configurado (${setupStatus.integrations.tink.environment})`
                  : 'No configurado'
              }
            />
            <p className="text-xs text-muted-foreground mt-3">
              Tink en producción requiere licencia de Third Party Provider (TPP) aprobada por el
              Banco de España u otra autoridad regulatoria de la UE. El proceso tarda entre 6 y 18
              meses. Para el caso de Grupo Vidaro, se recomienda usar{' '}
              <strong>GoCardless Bank Account Data (Nordigen)</strong> que no requiere licencia y
              funciona de forma inmediata.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════

function StatCard({
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
      ? 'text-green-600 bg-green-50 border-green-200'
      : ok === 'warn'
        ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
        : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
