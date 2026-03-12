'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Check,
  RefreshCw,
  CheckCircle2,
  Building,
  Shield,
  Wallet,
  ArrowRightLeft,
  Home,
  ArrowLeft,
  BarChart3,
  Clock,
  Euro,
  Settings,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PSD2ConnectionWizard } from '@/components/open-banking/PSD2ConnectionWizard';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  lastSync: string;
  status: 'connected' | 'pending' | 'error';
  companyId: string;
  companyName: string;
  transactionCount?: number;
}

interface CompanyBanking {
  companyId: string;
  companyName: string;
  iban: string;
  banco: string;
  gcConfigured: boolean;
  nordigenConnected: boolean;
  bankConnectionId?: string;
  totalMandates: number;
  activeMandates: number;
  totalPayments: number;
  pendingReconciliation: number;
  lastSync?: string;
}

interface Stats {
  cuentasConectadas: number;
  transaccionesSincronizadas: number;
  conciliacionesPendientes: number;
  conciliadas: number;
  ultimaSincronizacion: string | null;
}

export default function OpenBankingPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [companies, setCompanies] = useState<CompanyBanking[]>([]);
  const [stats, setStats] = useState<Stats>({
    cuentasConectadas: 0,
    transaccionesSincronizadas: 0,
    conciliacionesPendientes: 0,
    conciliadas: 0,
    ultimaSincronizacion: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bankingRes, concilRes] = await Promise.all([
        fetch('/api/banking/reconcile-unified?all=true'),
        fetch('/api/finanzas/conciliacion?page=1&limit=1'),
      ]);

      if (bankingRes.ok) {
        const bankingData = await bankingRes.json();
        setCompanies(bankingData.companies || []);
      }

      if (concilRes.ok) {
        const concilData = await concilRes.json();
        const accts: BankAccount[] = concilData.data?.accounts || [];
        setAccounts(accts);

        const s = concilData.data?.stats || {};
        const latestSync = accts
          .map((a) => a.lastSync)
          .filter(Boolean)
          .sort()
          .pop();

        setStats({
          cuentasConectadas: accts.length,
          transaccionesSincronizadas: s.totalTransactionsGlobal || s.totalTransactions || 0,
          conciliacionesPendientes: s.pendingCount || 0,
          conciliadas: s.matchedCount || 0,
          ultimaSincronizacion: latestSync || null,
        });
      }
    } catch (error) {
      console.error('Error loading open banking data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') loadData();
  }, [status, router, loadData]);

  useEffect(() => {
    const tinkStatus = searchParams.get('tink');
    const bankinterStatus = searchParams.get('bankinter');
    const message = searchParams.get('message');

    if (tinkStatus === 'success') {
      toast.success('Conexion Tink autorizada correctamente');
    } else if (tinkStatus === 'error') {
      toast.error(message || 'Error al autorizar la conexion Tink');
    }

    if (bankinterStatus === 'success') {
      toast.success('Conexion Bankinter autorizada correctamente');
    } else if (bankinterStatus === 'error') {
      toast.error(message || 'Error al autorizar la conexion Bankinter');
    }
  }, [searchParams]);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('Sincronizando movimientos bancarios...');
    try {
      const res = await fetch('/api/banking/reconcile-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-sync' }),
      });
      const data = await res.json();

      if (data.success) {
        const newTx = data.sync?.newBankTransactions || 0;
        const matched =
          (data.reconciliation?.sepaToPayment?.matched || 0) +
          (data.reconciliation?.payoutToBankTx?.matched || 0) +
          (data.reconciliation?.bankTxToPayment?.matched || 0);

        const parts: string[] = [];
        if (newTx > 0) parts.push(`${newTx} nuevos movimientos`);
        if (matched > 0) parts.push(`${matched} conciliados`);
        toast.success(
          parts.length > 0
            ? `Sincronización completada: ${parts.join(', ')}`
            : 'Sincronización completada. Sin nuevos movimientos.'
        );
        loadData();
      } else {
        toast.error(data.error || 'Error en sincronización');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsSyncing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/finanzas')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Finanzas
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Open Banking</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building className="h-8 w-8 text-primary" />
              Open Banking
            </h1>
            <p className="text-muted-foreground mt-2">
              Cuentas bancarias conectadas, transacciones y conciliación automática
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/finanzas/conciliacion')}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Conciliación
            </Button>
          </div>
        </div>

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Conexión segura PSD2:</strong> Usamos protocolos bancarios regulados por la
            Unión Europea (GoCardless / Nordigen). Nunca almacenamos tus credenciales bancarias.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Conectar Banco via PSD2</CardTitle>
            <CardDescription>
              Conecta tu cuenta bancaria de forma segura para sincronizar movimientos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PSD2ConnectionWizard onComplete={loadData} />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuentas Conectadas</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cuentasConectadas}</div>
              <p className="text-xs text-muted-foreground">
                {companies.length} sociedad{companies.length !== 1 ? 'es' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.transaccionesSincronizadas.toLocaleString('es-ES')}
              </div>
              <p className="text-xs text-muted-foreground">Total sincronizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conciliadas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.conciliacionesPendientes.toLocaleString('es-ES')} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.ultimaSincronizacion
                  ? format(new Date(stats.ultimaSincronizacion), 'dd MMM HH:mm', { locale: es })
                  : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.ultimaSincronizacion ? 'Sincronización automática' : 'Sin sincronizar'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cuentas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cuentas">Cuentas Conectadas</TabsTrigger>
            <TabsTrigger value="sociedades">Sociedades</TabsTrigger>
            <TabsTrigger value="funcionalidades">Funcionalidades</TabsTrigger>
          </TabsList>

          {/* Cuentas Conectadas */}
          <TabsContent value="cuentas" className="space-y-4 mt-4">
            {accounts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay cuentas conectadas</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecta tu primera cuenta bancaria para empezar a sincronizar
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {accounts.map((account) => (
                  <Card key={account.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{account.bankName}</CardTitle>
                            <CardDescription>{account.companyName}</CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={account.status === 'connected' ? 'default' : 'secondary'}
                          className={
                            account.status === 'connected'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : ''
                          }
                        >
                          {account.status === 'connected' ? 'Conectado' : account.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {account.iban && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IBAN</span>
                            <span className="font-mono">{account.iban}</span>
                          </div>
                        )}
                        {account.accountNumber && !account.iban && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cuenta</span>
                            <span className="font-mono">{account.accountNumber}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Moneda</span>
                          <span>{account.currency}</span>
                        </div>
                        {account.transactionCount !== undefined && account.transactionCount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Transacciones</span>
                            <span>{account.transactionCount.toLocaleString('es-ES')}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Última sync</span>
                          <span>
                            {account.lastSync
                              ? format(new Date(account.lastSync), 'dd MMM yyyy HH:mm', {
                                  locale: es,
                                })
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sociedades */}
          <TabsContent value="sociedades" className="space-y-4 mt-4">
            {companies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay sociedades configuradas</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {companies.map((company) => (
                  <Card key={company.companyId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{company.companyName}</CardTitle>
                          <CardDescription>
                            {company.banco} · {company.iban}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          {company.gcConfigured && (
                            <Badge
                              variant="outline"
                              className="border-green-300 text-green-700 dark:text-green-400"
                            >
                              GoCardless
                            </Badge>
                          )}
                          {company.nordigenConnected && (
                            <Badge
                              variant="outline"
                              className="border-blue-300 text-blue-700 dark:text-blue-400"
                            >
                              Nordigen
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Mandatos SEPA</p>
                          <p className="text-lg font-semibold">
                            {company.activeMandates}/{company.totalMandates}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pagos GC</p>
                          <p className="text-lg font-semibold">{company.totalPayments}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pendientes</p>
                          <p className="text-lg font-semibold">{company.pendingReconciliation}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estado</p>
                          <Badge
                            variant={company.nordigenConnected ? 'default' : 'secondary'}
                            className={
                              company.nordigenConnected
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30'
                                : ''
                            }
                          >
                            {company.nordigenConnected ? 'Conectado' : 'Sin conexión'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Funcionalidades */}
          <TabsContent value="funcionalidades" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                    Conciliación Automática
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Concilia automáticamente los pagos recibidos con las facturas y alquileres
                    pendientes por importe, referencia y fecha.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Matching automático de pagos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Alertas de pagos no conciliados
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Historial de conciliaciones
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => router.push('/finanzas/conciliacion')}
                  >
                    Ir a Conciliación
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-green-600" />
                    Pagos SEPA (GoCardless)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Domiciliaciones SEPA para el cobro automático de alquileres. Compatible con la
                    normativa europea de pagos.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Domiciliación de recibos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Gestión de mandatos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Notificación de devoluciones
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Análisis Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Insights sobre flujo de caja, morosidad y proyecciones basadas en datos
                    bancarios reales.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Dashboard de flujo de caja
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Análisis de morosidad
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Proyecciones de ingresos
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => router.push('/bi')}
                  >
                    Ir a Business Intelligence
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Open Banking (Nordigen)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Lectura de movimientos bancarios via Open Banking PSD2 (Nordigen/GoCardless Bank
                    Account Data). Gratuito hasta 250 conexiones/día.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Saldos en tiempo real
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Historial de movimientos (hasta 2 años)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Bancos españoles: Bankinter, BBVA, CaixaBank, Santander...
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
