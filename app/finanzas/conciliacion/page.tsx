// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowRightLeft,
  Building,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  RefreshCw,
  Search,
  Link2,
  Unlink,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Sparkles,
  Zap,
  Building2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

// ============================================
// TIPOS
// ============================================

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
}

interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  valueDate: string;
  description: string;
  reference?: string;
  amount: number;
  balance: number;
  type: 'income' | 'expense';
  category?: string;
  subcategory?: string;
  reconciliationStatus: 'pending' | 'matched' | 'manual' | 'ignored';
  matchedDocumentId?: string;
  matchedDocumentType?: 'invoice' | 'receipt' | 'payment';
  matchConfidence?: number;
  beneficiary?: string;
  creditorName?: string;
  debtorName?: string;
  transactionType?: string;
  companyId: string;
  companyName?: string;
  bankName?: string;
  matchSuggestion?: {
    tenantId: string;
    tenantName: string;
    contractId?: string;
    matchType: string;
    confidence: number;
  };
}

interface CompanyOption {
  id: string;
  nombre: string;
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
  pendingCount: number;
  matchedCount: number;
  totalTransactions: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ConciliacionBancariaPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('movimientos');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    incomeCount: 0,
    expenseCount: 0,
    pendingCount: 0,
    matchedCount: 0,
    totalTransactions: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiProgress, setAiProgress] = useState<{
    active: boolean;
    phase: string;
    current: number;
    total: number;
    matched: number;
    reconciled: number;
  }>({ active: false, phase: '', current: 0, total: 0, matched: 0, reconciled: 0 });
  const [aiResults, setAiResults] = useState<
    Array<{
      txId: string;
      match: {
        tenantId: string | null;
        tenantName: string | null;
        contractId: string | null;
        unitId: string | null;
        unitLabel: string | null;
        confidence: number;
        reasoning: string;
        method: string;
      };
    }>
  >([]);

  // ── Estado de importación de extractos ──
  const [importDragging, setImportDragging] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    format: string;
    imported: number;
    duplicates: number;
    errors: number;
    total: number;
    message: string;
    statement?: Record<string, unknown>;
  } | null>(null);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // Cargar datos desde API - accepts explicit params to avoid stale closures
  const fetchData = async (
    page = 1,
    filters?: { company?: string; status?: string; type?: string; search?: string; period?: string }
  ) => {
    const f = filters || {
      company: selectedCompany,
      status: statusFilter,
      type: typeFilter,
      search: searchTerm,
    };
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (f.company && f.company !== 'all') params.set('companyId', f.company);
      if (f.status && f.status !== 'all') params.set('status', f.status);
      if (f.type && f.type !== 'all') params.set('type', f.type);
      if (f.search) params.set('search', f.search);
      params.set('page', String(page));
      params.set('limit', '50');

      // Period filter → dateFrom/dateTo
      const prd = f.period || periodFilter;
      const now = new Date();
      if (prd === 'mes') {
        params.set('dateFrom', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
        params.set('dateTo', now.toISOString());
      } else if (prd === 'ytd') {
        params.set('dateFrom', new Date(now.getFullYear(), 0, 1).toISOString());
        params.set('dateTo', now.toISOString());
      } else if (prd === 'tam') {
        params.set('dateFrom', new Date(now.getTime() - 365 * 86400000).toISOString());
        params.set('dateTo', now.toISOString());
      } else if (prd === 'anual') {
        params.set('dateFrom', new Date(now.getFullYear() - 1, 0, 1).toISOString());
        params.set('dateTo', new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString());
      }

      const response = await fetch(`/api/finanzas/conciliacion?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setAccounts(result.data?.accounts || []);
        setTransactions(result.data?.transactions || []);
        setCompanies(result.data?.companies || []);
        setStats(
          result.data?.stats || {
            totalIncome: 0,
            totalExpense: 0,
            incomeCount: 0,
            expenseCount: 0,
            pendingCount: 0,
            matchedCount: 0,
            totalTransactions: 0,
          }
        );
        setPagination(result.data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching conciliacion data:', error);
      toast.error('Error cargando datos de conciliación');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Debounced filter changes
  useEffect(() => {
    if (status !== 'authenticated') return;
    const timeout = setTimeout(() => {
      fetchData(1, {
        company: selectedCompany,
        status: statusFilter,
        type: typeFilter,
        search: searchTerm,
      });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCompany, statusFilter, typeFilter, periodFilter]);

  // Filtrar cuentas por empresa seleccionada
  const filteredAccounts =
    selectedCompany === 'all' ? accounts : accounts.filter((a) => a.companyId === selectedCompany);

  // Conciliar movimiento
  const handleConciliar = async (
    transactionId: string,
    action: 'conciliar' | 'descartar' | 'revertir'
  ) => {
    try {
      const response = await fetch('/api/finanzas/conciliacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action }),
      });

      if (response.ok) {
        toast.success(
          action === 'conciliar'
            ? 'Movimiento conciliado'
            : action === 'descartar'
              ? 'Movimiento descartado'
              : 'Conciliación revertida'
        );
        fetchData(pagination.page, {
          company: selectedCompany,
          status: statusFilter,
          type: typeFilter,
          search: searchTerm,
        });
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'Error procesando la acción');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // Conciliación inteligente con barra de progreso (mini-batches)
  const runSmartReconcile = async (useAI: boolean) => {
    const BATCH_SIZE = useAI ? 5 : 15;
    let allResults: typeof aiResults = [];
    let totalMatched = 0;
    let totalReconciled = 0;

    try {
      // 1. Obtener total de ingresos pendientes
      setAiProgress({
        active: true,
        phase: 'Contando movimientos pendientes...',
        current: 0,
        total: 0,
        matched: 0,
        reconciled: 0,
      });
      setAiResults([]);

      const countRes = await fetch('/api/banking/smart-reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'count' }),
      });
      const countData = await countRes.json();
      const totalPending = Math.min(countData.count || 0, useAI ? 50 : 200);

      if (totalPending === 0) {
        setAiProgress((p) => ({ ...p, active: false, phase: 'Sin movimientos pendientes' }));
        toast.info('No hay ingresos pendientes de conciliar');
        return;
      }

      setAiProgress((p) => ({
        ...p,
        total: totalPending,
        phase: useAI ? 'Analizando con IA...' : 'Analizando por reglas...',
      }));

      // 2. Procesar en mini-batches
      let processed = 0;
      while (processed < totalPending) {
        const batchLimit = Math.min(BATCH_SIZE, totalPending - processed);

        const res = await fetch('/api/banking/smart-reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'batch', useAI, limit: batchLimit }),
        });
        const data = await res.json();

        if (!data.success) {
          toast.error(data.error || 'Error en batch');
          break;
        }

        processed += data.processed || batchLimit;
        totalMatched += data.matched || 0;
        totalReconciled += data.reconciled || 0;
        if (data.results) allResults = [...allResults, ...data.results];

        setAiProgress((p) => ({
          ...p,
          current: Math.min(processed, totalPending),
          matched: totalMatched,
          reconciled: totalReconciled,
          phase: useAI
            ? `Analizando con IA... (${data.aiCalls || 0} llamadas IA)`
            : 'Analizando por reglas...',
        }));

        // Si este batch no procesó nada nuevo, salir
        if ((data.processed || 0) === 0) break;
      }

      // 3. Finalizar
      setAiResults(allResults);
      setAiProgress((p) => ({
        ...p,
        active: false,
        current: p.total,
        phase: 'Completado',
      }));

      toast.success(
        `Análisis completado: ${totalReconciled} conciliados, ${totalMatched} identificados de ${processed} procesados`
      );

      fetchData(pagination.page, {
        company: selectedCompany,
        status: statusFilter,
        type: typeFilter,
        search: searchTerm,
      });
    } catch (e: any) {
      setAiProgress((p) => ({ ...p, active: false, phase: 'Error' }));
      toast.error(e?.name === 'AbortError' ? 'Timeout' : 'Error de conexión');
    }
  };

  // Sincronizar y conciliar con GoCardless + Bankinter + IA
  const handleSyncBanks = async () => {
    setIsSyncing(true);
    try {
      const companyParam = selectedCompany !== 'all' ? selectedCompany : undefined;

      toast.info('Descargando movimientos bancarios...');

      // Paso 1: Full sync (Nordigen bank tx + GC payments/payouts + conciliación)
      const res1 = await fetch('/api/banking/reconcile-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-sync', companyId: companyParam }),
      });
      const d1 = await res1.json();

      if (!d1.success) {
        toast.error(d1.error || 'Error sincronizando movimientos');
        return;
      }

      const newBankTx = d1.sync?.newBankTransactions || 0;
      const totalBankTx = d1.sync?.bankTransactions || 0;
      const unifiedMatched =
        (d1.reconciliation?.sepaToPayment?.matched || 0) +
        (d1.reconciliation?.payoutToBankTx?.matched || 0) +
        (d1.reconciliation?.bankTxToPayment?.matched || 0);

      // Paso 2: Conciliación inteligente (reglas automáticas)
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 45000);
      let d2: any = {};
      try {
        const res2 = await fetch('/api/banking/smart-reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'batch', useAI: false, limit: 30 }),
          signal: ctrl2.signal,
        });
        d2 = await res2.json();
      } catch (e) {
        d2 = { reconciled: 0 };
      } finally {
        clearTimeout(t2);
      }
      const smartReconciled = d2.reconciled || 0;
      const totalReconciled = unifiedMatched + smartReconciled;

      // Construir mensaje de resultado
      const parts: string[] = [];
      if (newBankTx > 0) parts.push(`${newBankTx} nuevos movimientos`);
      if (totalBankTx > 0 && newBankTx === 0) parts.push(`${totalBankTx} movimientos actualizados`);
      if (totalReconciled > 0) parts.push(`${totalReconciled} conciliados`);

      if (parts.length > 0) {
        toast.success(`Sincronización completada: ${parts.join(', ')}`);
      } else {
        toast.info('Sincronización completada. No hay nuevos movimientos.');
      }

      // Recargar datos desde página 1 para mostrar los más recientes
      fetchData(1, {
        company: selectedCompany,
        status: statusFilter,
        type: typeFilter,
        search: searchTerm,
      });
    } catch (error) {
      toast.error('Error de conexión al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  };

  // Format category
  const formatCategory = (category?: string) => {
    if (!category) return '-';
    return category
      .replace(/_/g, ' ')
      .replace(/^(ingreso|gasto|transferencia)\s/, '')
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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
                <BreadcrumbPage>Conciliación Bancaria</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Link href="/finanzas/conciliacion/visual">
            <Button variant="outline" size="sm" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Vista visual
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ArrowRightLeft className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Conciliación Bancaria</h1>
              <p className="text-muted-foreground">
                Movimientos bancarios reales de Bankinter (CAMT.053)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Company selector */}
            {companies.length > 0 && (
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[240px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todas las sociedades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sociedades ({companies.length})</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="default"
              onClick={() => setActiveTab('importar')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Extracto
            </Button>
            <Button variant="outline" onClick={handleSyncBanks} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Descargando movimientos...' : 'Actualizar Movimientos'}
            </Button>
          </div>
        </div>

        {/* Estadísticas + Conciliación rápida */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingCount.toLocaleString('es-ES')}</p>
                  <p className="text-xs text-muted-foreground">Ingresos pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.matchedCount.toLocaleString('es-ES')}</p>
                  <p className="text-xs text-muted-foreground">Conciliados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-sm md:text-xl">
                    +{formatCurrency(stats.totalIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ingresos ({stats.incomeCount})</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-sm md:text-xl">
                    -{formatCurrency(stats.totalExpense)}
                  </p>
                  <p className="text-xs text-muted-foreground">Gastos ({stats.expenseCount})</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Ratio de conciliación + Botón rápido */}
          <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/30">
            <CardContent className="pt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-purple-700">
                    {stats.totalTransactions > 0
                      ? Math.round((stats.matchedCount / Math.max(stats.matchedCount + stats.pendingCount, 1)) * 100)
                      : 0}%
                  </p>
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground">Ratio conciliación</p>
                <Button
                  size="sm"
                  className="w-full mt-1"
                  disabled={aiProgress.active || stats.pendingCount === 0}
                  onClick={() => runSmartReconcile(false)}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Conciliar auto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cuentas conectadas */}
        {filteredAccounts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cuentas Bancarias ({filteredAccounts.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAccount === account.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() =>
                      setSelectedAccount(selectedAccount === account.id ? 'all' : account.id)
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{account.bankName}</span>
                      </div>
                      <Badge
                        variant={account.status === 'connected' ? 'default' : 'secondary'}
                        className={account.status === 'connected' ? 'bg-green-500' : ''}
                      >
                        {account.status === 'connected' ? 'Conectado' : 'Pendiente'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-primary">{account.companyName}</p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {account.iban && /^[A-Z]{2}\d{2}/.test(account.iban)
                        ? account.iban
                        : 'IBAN no disponible'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Última sync:{' '}
                      {format(parseISO(account.lastSync), 'd MMM HH:mm', { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="movimientos">
              Movimientos ({stats.totalTransactions.toLocaleString('es-ES')})
            </TabsTrigger>
            <TabsTrigger value="sugerencias">Sugerencias IA</TabsTrigger>
            <TabsTrigger value="importar">Importar Extracto</TabsTrigger>
          </TabsList>

          {/* Tab: Movimientos */}
          <TabsContent value="movimientos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por descripción, beneficiario o referencia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="matched">Conciliados</SelectItem>
                      <SelectItem value="unmatched">Descartados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Ingresos</SelectItem>
                      <SelectItem value="expense">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo el historial</SelectItem>
                      <SelectItem value="mes">Mes actual</SelectItem>
                      <SelectItem value="ytd">YTD {new Date().getFullYear()}</SelectItem>
                      <SelectItem value="tam">TAM (12M)</SelectItem>
                      <SelectItem value="anual">Año {new Date().getFullYear() - 1}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de movimientos */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">Cargando movimientos...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="font-medium">No hay movimientos</p>
                    <p className="text-sm">Importa movimientos con el script de CAMT.053</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Fecha</TableHead>
                        {selectedCompany === 'all' && companies.length > 1 && (
                          <TableHead>Sociedad</TableHead>
                        )}
                        <TableHead className="min-w-[220px]">Descripción</TableHead>
                        <TableHead className="min-w-[150px]">Ordenante</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow
                          key={tx.id}
                          className={tx.reconciliationStatus === 'ignored' ? 'opacity-50' : ''}
                        >
                          <TableCell>
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              {tx.type === 'income' ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm whitespace-nowrap">
                              {format(parseISO(tx.date), 'd MMM yyyy', { locale: es })}
                            </div>
                          </TableCell>
                          {selectedCompany === 'all' && companies.length > 1 && (
                            <TableCell>
                              <span className="text-xs font-medium text-primary">
                                {tx.companyName || '-'}
                              </span>
                            </TableCell>
                          )}
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{tx.description}</p>
                              {tx.beneficiary && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {tx.beneficiary}
                                </p>
                              )}
                              {tx.reference && (
                                <p className="text-xs text-muted-foreground/70 line-clamp-1">
                                  {tx.reference}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[180px]">
                              {tx.type === 'income' && tx.debtorName && (
                                <p className="text-sm font-medium truncate" title={tx.debtorName}>
                                  {tx.debtorName}
                                </p>
                              )}
                              {tx.type === 'expense' && tx.creditorName && (
                                <p className="text-sm font-medium truncate" title={tx.creditorName}>
                                  {tx.creditorName}
                                </p>
                              )}
                              {tx.matchSuggestion && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-green-600 border-green-300 truncate max-w-[170px]"
                                  >
                                    {tx.matchSuggestion.tenantName}
                                  </Badge>
                                </div>
                              )}
                              {!tx.debtorName && !tx.creditorName && !tx.matchSuggestion && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatCategory(tx.category)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {tx.type === 'income' ? '+' : ''}
                              {formatCurrency(tx.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {tx.reconciliationStatus === 'pending' && (
                              <Badge variant="outline" className="text-amber-600 border-amber-400">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                            {tx.reconciliationStatus === 'matched' && (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Conciliado
                              </Badge>
                            )}
                            {tx.reconciliationStatus === 'manual' && (
                              <Badge variant="secondary">
                                <Link2 className="h-3 w-3 mr-1" />
                                Manual
                              </Badge>
                            )}
                            {tx.reconciliationStatus === 'ignored' && (
                              <Badge variant="outline" className="text-gray-500">
                                <XCircle className="h-3 w-3 mr-1" />
                                Descartado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {tx.reconciliationStatus === 'pending' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleConciliar(tx.id, 'conciliar')}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Conciliar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleConciliar(tx.id, 'descartar')}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Descartar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(tx.reconciliationStatus === 'matched' ||
                                  tx.reconciliationStatus === 'manual') && (
                                  <DropdownMenuItem
                                    onClick={() => handleConciliar(tx.id, 'revertir')}
                                  >
                                    <Unlink className="h-4 w-4 mr-2" />
                                    Revertir conciliación
                                  </DropdownMenuItem>
                                )}
                                {tx.reconciliationStatus === 'ignored' && (
                                  <DropdownMenuItem
                                    onClick={() => handleConciliar(tx.id, 'revertir')}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Restaurar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              {/* Pagination */}
              {pagination.pages > 1 && (
                <CardFooter className="flex items-center justify-between py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total.toLocaleString('es-ES')} movimientos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        fetchData(pagination.page - 1, {
                          company: selectedCompany,
                          status: statusFilter,
                          type: typeFilter,
                          search: searchTerm,
                        })
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() =>
                        fetchData(pagination.page + 1, {
                          company: selectedCompany,
                          status: statusFilter,
                          type: typeFilter,
                          search: searchTerm,
                        })
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Sugerencias IA */}
          <TabsContent value="sugerencias" className="space-y-4">
            <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 dark:text-purple-200">
                <strong>Conciliación Inteligente:</strong> La IA analiza cada movimiento pendiente,
                identifica el inquilino y la unidad correspondiente, y concilia automáticamente los
                pagos con confianza alta (&ge;70%).
              </AlertDescription>
            </Alert>

            {/* Acciones IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Ejecutar Conciliación Inteligente
                </CardTitle>
                <CardDescription>
                  {stats.pendingCount > 0
                    ? `${stats.pendingCount.toLocaleString('es-ES')} movimientos pendientes (${stats.incomeCount.toLocaleString('es-ES')} ingresos analizables, ${stats.expenseCount.toLocaleString('es-ES')} gastos).`
                    : 'No hay movimientos pendientes.'}{' '}
                  La IA analiza los ingresos para identificar pagos de alquiler.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={async () => {
                      await runSmartReconcile(true);
                    }}
                    disabled={aiProgress.active || stats.incomeCount === 0}
                  >
                    {aiProgress.active ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {aiProgress.active
                      ? 'Analizando...'
                      : `Analizar ${stats.incomeCount > 0 ? stats.incomeCount.toLocaleString('es-ES') + ' ingresos' : ''} con IA`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await runSmartReconcile(false);
                    }}
                    disabled={aiProgress.active || stats.incomeCount === 0}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Solo reglas (rápido, sin IA)
                  </Button>
                </div>

                {/* Barra de progreso */}
                {aiProgress.active && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{aiProgress.phase}</span>
                      <span className="text-muted-foreground">
                        {aiProgress.current}/{aiProgress.total} (
                        {aiProgress.total > 0
                          ? Math.round((aiProgress.current / aiProgress.total) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-cyan-500 to-purple-500"
                        style={{
                          width: `${aiProgress.total > 0 ? Math.round((aiProgress.current / aiProgress.total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        Identificados:{' '}
                        <strong className="text-foreground">{aiProgress.matched}</strong>
                      </span>
                      <span>
                        Conciliados:{' '}
                        <strong className="text-green-600">{aiProgress.reconciled}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {stats.totalTransactions.toLocaleString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">Total movimientos</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {stats.pendingCount.toLocaleString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.matchedCount.toLocaleString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">Conciliados</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.incomeCount.toLocaleString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">Ingresos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados IA */}
            {aiResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resultados del análisis IA</CardTitle>
                  <CardDescription>
                    {aiResults.filter((r) => r.match.confidence >= 70).length} identificados con
                    alta confianza,{' '}
                    {
                      aiResults.filter((r) => r.match.confidence > 0 && r.match.confidence < 70)
                        .length
                    }{' '}
                    con baja confianza, {aiResults.filter((r) => r.match.confidence === 0).length}{' '}
                    sin match
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Confianza</TableHead>
                        <TableHead>Inquilino</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="min-w-[200px]">Razonamiento</TableHead>
                        <TableHead>Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiResults
                        .filter((r) => r.match.confidence > 0)
                        .sort((a, b) => b.match.confidence - a.match.confidence)
                        .slice(0, 50)
                        .map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-3 w-3 rounded-full ${
                                    r.match.confidence >= 70
                                      ? 'bg-green-500'
                                      : r.match.confidence >= 40
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                  }`}
                                />
                                <span className="text-sm font-medium">{r.match.confidence}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {r.match.tenantName || '-'}
                            </TableCell>
                            <TableCell className="text-sm">{r.match.unitLabel || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {r.match.method === 'exact_amount_name'
                                  ? 'Nombre+Monto'
                                  : r.match.method === 'fuzzy_name'
                                    ? 'Nombre parcial'
                                    : r.match.method === 'reference_code'
                                      ? 'Referencia'
                                      : r.match.method === 'ai_inference'
                                        ? 'IA'
                                        : r.match.method === 'gocardless_metadata'
                                          ? 'GoCardless'
                                          : r.match.method}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {r.match.reasoning}
                            </TableCell>
                            <TableCell>
                              {r.match.confidence >= 70 ? (
                                <Badge className="bg-green-500 text-xs">Conciliado</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={() => handleConciliar(r.txId, 'conciliar')}
                                >
                                  Aprobar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      {aiResults.filter((r) => r.match.confidence > 0).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No se encontraron coincidencias en los movimientos analizados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Categorías rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtrar por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { label: 'Alquileres', icon: '🏠', filter: 'alquiler' },
                    { label: 'Comunidades', icon: '🏢', filter: 'comunidad' },
                    { label: 'Seguros', icon: '🛡️', filter: 'seguro' },
                    { label: 'Impuestos', icon: '📋', filter: 'impuesto' },
                    { label: 'Suministros', icon: '💡', filter: 'suministro' },
                    { label: 'Mantenimiento', icon: '🔧', filter: 'mantenimiento' },
                    { label: 'Bancarios', icon: '🏦', filter: 'bancario' },
                    { label: 'Personal', icon: '👤', filter: 'nomina' },
                    { label: 'Transferencias', icon: '🔄', filter: 'transferencia' },
                  ].map((cat) => (
                    <Button
                      key={cat.filter}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setSearchTerm(cat.filter);
                        setActiveTab('movimientos');
                      }}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Importar Extractos */}
          <TabsContent value="importar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Importar Extracto Bancario</CardTitle>
                <CardDescription>
                  Arrastra o selecciona un archivo con movimientos bancarios para importar y conciliar automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    importDragging
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : importFile
                      ? 'border-green-400 bg-green-50 dark:bg-green-950'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImportDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImportDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImportDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImportDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setImportFile(file);
                      setImportResult(null);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv,.xml,.txt,.n43,.c43,.ofx';
                    input.onchange = (ev) => {
                      const file = (ev.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setImportFile(file);
                        setImportResult(null);
                      }
                    };
                    input.click();
                  }}
                >
                  {importDragging ? (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-primary mb-3 animate-bounce" />
                      <p className="text-sm font-medium text-primary">Suelta el archivo aquí</p>
                    </>
                  ) : importFile ? (
                    <>
                      <FileText className="mx-auto h-10 w-10 text-green-600 mb-3" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        {importFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(importFile.size / 1024).toFixed(1)} KB — Click para cambiar
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium text-primary">Haz click para seleccionar</span>{' '}
                        o arrastra un archivo
                      </p>
                      <p className="text-xs text-gray-500">
                        Formatos: Norma 43 (.txt, .n43, .c43), CAMT.053 (.xml), CSV (máx. 10MB)
                      </p>
                    </>
                  )}
                </div>

                {/* Botón importar */}
                {importFile && !importLoading && (
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        if (!importFile) return;
                        setImportLoading(true);
                        setImportResult(null);

                        const toastId = toast.loading(`Importando ${importFile.name}...`);

                        try {
                          const formData = new FormData();
                          formData.append('file', importFile);
                          if (selectedCompany !== 'all') {
                            formData.append('companyId', selectedCompany);
                          }

                          const res = await fetch('/api/finanzas/conciliacion/import', {
                            method: 'POST',
                            body: formData,
                          });

                          const data = await res.json();
                          toast.dismiss(toastId);

                          if (res.ok && data.success) {
                            setImportResult(data);
                            toast.success(data.message);
                            // Recargar movimientos
                            fetchData(1);
                          } else {
                            toast.error(data.error || 'Error importando archivo');
                            setImportResult({ success: false, format: '', imported: 0, duplicates: 0, errors: 1, total: 0, message: data.error });
                          }
                        } catch (err: any) {
                          toast.dismiss(toastId);
                          toast.error('Error de conexión al importar');
                        } finally {
                          setImportLoading(false);
                        }
                      }}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Movimientos
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportFile(null);
                        setImportResult(null);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}

                {/* Loading */}
                {importLoading && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Procesando extracto bancario...</span>
                  </div>
                )}

                {/* Resultado de importación */}
                {importResult && (
                  <div
                    className={`rounded-md p-4 ${
                      importResult.success
                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {importResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <p
                        className={`text-sm font-medium ${
                          importResult.success
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                        }`}
                      >
                        {importResult.message}
                      </p>
                    </div>
                    {importResult.success && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{importResult.imported}</p>
                          <p className="text-xs text-muted-foreground">Importados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-500">{importResult.duplicates}</p>
                          <p className="text-xs text-muted-foreground">Duplicados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">{importResult.errors}</p>
                          <p className="text-xs text-muted-foreground">Errores</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{importResult.total}</p>
                          <p className="text-xs text-muted-foreground">Total en archivo</p>
                        </div>
                      </div>
                    )}
                    {importResult.statement && (
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        <p><strong>Formato:</strong> {(importResult.statement as any).format}</p>
                        {(importResult.statement as any).iban && (
                          <p><strong>IBAN:</strong> {(importResult.statement as any).iban}</p>
                        )}
                        {(importResult.statement as any).fullAccount && (
                          <p><strong>Cuenta:</strong> {(importResult.statement as any).fullAccount}</p>
                        )}
                        {(importResult.statement as any).openingBalance !== undefined && (
                          <p>
                            <strong>Saldo:</strong>{' '}
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                              (importResult.statement as any).openingBalance
                            )}{' '}
                            →{' '}
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                              (importResult.statement as any).closingBalance
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Info formatos */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Formatos aceptados:</p>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li><strong>Norma 43</strong> (.txt, .n43, .c43) — Formato estándar de la AEB para extractos bancarios españoles</li>
                    <li><strong>CAMT.053</strong> (.xml) — Formato ISO 20022 (Bankinter, BBVA, Santander, etc.)</li>
                    <li><strong>CSV</strong> (.csv) — Formato genérico: Fecha, Concepto, Importe, Saldo</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AIDocumentAssistant context="contabilidad" variant="floating" position="bottom-right" />
    </AuthenticatedLayout>
  );
}
