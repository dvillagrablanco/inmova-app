'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

// Lazy load del asistente financiero IA
const FinancialAIAssistant = dynamic(
  () => import('@/components/ai/FinancialAIAssistant'),
  { ssr: false }
);
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  AlertCircle,
  Clock,
  Euro,
  FileText,
  Home,
  RefreshCw,
  Search,
  Link2,
  Unlink,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  MoreHorizontal,
  Sparkles,
  Zap,
  Building2,
  XCircle,
  Check,
  AlertTriangle,
  Loader2,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
  transactionCount?: number;
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
  reconciliationStatus: 'pending' | 'matched' | 'manual' | 'ignored';
  matchedDocumentId?: string;
  matchedDocumentType?: 'invoice' | 'receipt' | 'payment';
  matchConfidence?: number;
  linkedPayment?: {
    id: string;
    amount: number;
    period: string;
    status: string;
    tenant?: string;
    property?: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  tenant?: string;
  concept: string;
  amount: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  reconciled: boolean;
  matchedTransactionId?: string;
}

interface MatchSuggestion {
  transactionId: string;
  paymentId: string;
  confidence: number;
  reason: string;
  applied?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ConciliacionBancariaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Estados de datos
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    matchedCount: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalBalance: 0
  });
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('movimientos');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [transactionToMatch, setTransactionToMatch] = useState<BankTransaction | null>(null);
  
  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedAccount !== 'all') params.append('accountId', selectedAccount);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/finanzas/conciliacion?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error cargando datos de conciliación');
      }

      const data = await response.json();
      
      if (data.success) {
        setBankAccounts(data.bankAccounts || []);
        setTransactions(data.transactions || []);
        setInvoices(data.invoices || []);
        setStats(data.stats || {
          pendingCount: 0,
          matchedCount: 0,
          totalIncome: 0,
          totalExpense: 0,
          totalBalance: 0
        });
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Error cargando datos', {
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount, statusFilter, searchTerm]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, loadData]);

  // Filtrar transacciones localmente para búsqueda rápida
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === '' || 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccount === 'all' || tx.accountId === selectedAccount;
    const matchesStatus = statusFilter === 'all' || tx.reconciliationStatus === statusFilter;
    return matchesSearch && matchesAccount && matchesStatus;
  });

  // Sincronizar bancos
  const handleSyncBanks = async () => {
    setIsSyncing(true);
    toast.loading('Sincronizando con bancos...');
    
    try {
      const response = await fetch('/api/finanzas/conciliacion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diasAtras: 30 })
      });

      const data = await response.json();
      toast.dismiss();

      if (data.success) {
        toast.success('Sincronización completada', {
          description: data.message || `${data.synced} transacciones obtenidas`
        });
        await loadData(); // Recargar datos
      } else {
        toast.error('Error en sincronización', {
          description: data.error
        });
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error('Error de conexión', {
        description: err.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-matching con IA
  const handleAutoMatch = async () => {
    setIsAutoMatching(true);
    toast.loading('Analizando movimientos con IA...');
    
    try {
      const response = await fetch('/api/finanzas/conciliacion/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyMatches: true })
      });

      const data = await response.json();
      toast.dismiss();

      if (data.success) {
        setSuggestions(data.suggestions || []);
        toast.success('Conciliación automática completada', {
          description: data.message
        });
        await loadData(); // Recargar datos
      } else {
        toast.error('Error en auto-conciliación', {
          description: data.error
        });
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error('Error de conexión', {
        description: err.message
      });
    } finally {
      setIsAutoMatching(false);
    }
  };

  // Vincular manualmente
  const handleManualMatch = async (transactionId: string, invoiceId: string) => {
    try {
      const response = await fetch('/api/finanzas/conciliacion/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, paymentId: invoiceId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Movimiento conciliado');
        setIsMatchDialogOpen(false);
        setTransactionToMatch(null);
        await loadData();
      } else {
        toast.error('Error al vincular', {
          description: data.error
        });
      }
    } catch (err: any) {
      toast.error('Error de conexión', {
        description: err.message
      });
    }
  };

  // Desvincular
  const handleUnlink = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/finanzas/conciliacion/match?transactionId=${transactionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Vinculación eliminada');
        await loadData();
      } else {
        toast.error('Error al desvincular', {
          description: data.error
        });
      }
    } catch (err: any) {
      toast.error('Error de conexión', {
        description: err.message
      });
    }
  };

  // Ignorar movimiento
  const handleIgnore = async (transactionId: string) => {
    try {
      const response = await fetch('/api/finanzas/conciliacion/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Movimiento ignorado');
        await loadData();
      } else {
        toast.error('Error al ignorar', {
          description: data.error
        });
      }
    } catch (err: any) {
      toast.error('Error de conexión', {
        description: err.message
      });
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
          {/* Skeleton loading */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-4">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  const pendingInvoices = invoices.filter(inv => !inv.reconciled && inv.status !== 'paid');

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
        {/* Breadcrumb */}
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

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ArrowRightLeft className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Conciliación Bancaria</h1>
              <p className="text-muted-foreground">
                Vincula movimientos bancarios con facturas y recibos
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/open-banking')}>
              <Building className="h-4 w-4 mr-2" />
              Open Banking
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/contabilidad/integraciones')}>
              <FileText className="h-4 w-4 mr-2" />
              Contabilidad
            </Button>
            <Button variant="outline" onClick={handleSyncBanks} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            <Button onClick={handleAutoMatch} disabled={isAutoMatching}>
              <Sparkles className={`h-4 w-4 mr-2 ${isAutoMatching ? 'animate-pulse' : ''}`} />
              Conciliar con IA
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info cuando no hay datos */}
        {!isLoading && bankAccounts.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Sin cuentas bancarias conectadas.</strong> Para ver datos reales, conecta una cuenta bancaria 
              desde <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/open-banking')}>
                Open Banking
              </Button>.
            </AlertDescription>
          </Alert>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
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
                  <p className="text-2xl font-bold">{stats.matchedCount}</p>
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
                  <p className="text-2xl font-bold">+{stats.totalIncome.toLocaleString('es-ES')}€</p>
                  <p className="text-xs text-muted-foreground">Ingresos</p>
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
                  <p className="text-2xl font-bold">-{stats.totalExpense.toLocaleString('es-ES')}€</p>
                  <p className="text-xs text-muted-foreground">Gastos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cuentas conectadas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Cuentas Bancarias Conectadas
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => router.push('/open-banking')}>
                <Link2 className="h-4 w-4 mr-2" />
                Conectar Cuenta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay cuentas bancarias conectadas</p>
                <Button variant="link" onClick={() => router.push('/open-banking')}>
                  Conectar una cuenta →
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {bankAccounts.map(account => (
                  <div
                    key={account.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAccount === account.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAccount(selectedAccount === account.id ? 'all' : account.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{account.bankName}</span>
                      </div>
                      <Badge variant={account.status === 'connected' ? 'default' : 'secondary'} className={account.status === 'connected' ? 'bg-green-500' : ''}>
                        {account.status === 'connected' ? 'Conectado' : account.status === 'error' ? 'Error' : 'Pendiente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{account.accountNumber}</p>
                    <p className="text-xl font-bold">{account.balance.toLocaleString('es-ES', { style: 'currency', currency: account.currency })}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última sync: {format(parseISO(account.lastSync), "d MMM HH:mm", { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="facturas">Pagos</TabsTrigger>
            <TabsTrigger value="sugerencias">Sugerencias IA</TabsTrigger>
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
                        placeholder="Buscar por descripción o referencia..."
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
                      <SelectItem value="ignored">Ignorados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de movimientos */}
            <Card>
              <CardContent className="p-0">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos bancarios</p>
                    {bankAccounts.length > 0 && (
                      <Button variant="link" onClick={handleSyncBanks}>
                        Sincronizar cuentas →
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vinculado a</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map(tx => {
                        return (
                          <TableRow key={tx.id} className={tx.reconciliationStatus === 'ignored' ? 'opacity-50' : ''}>
                            <TableCell>
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {tx.type === 'income' ? (
                                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(parseISO(tx.date), "d MMM yyyy", { locale: es })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{tx.description}</p>
                                {tx.reference && (
                                  <p className="text-xs text-muted-foreground">{tx.reference}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'income' ? '+' : ''}{tx.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
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
                                  Conciliado {tx.matchConfidence && `(${tx.matchConfidence}%)`}
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
                                  Ignorado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {tx.linkedPayment ? (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div className="text-sm">
                                    <p>{tx.linkedPayment.period}</p>
                                    {tx.linkedPayment.tenant && (
                                      <p className="text-xs text-muted-foreground">{tx.linkedPayment.tenant}</p>
                                    )}
                                  </div>
                                </div>
                              ) : tx.reconciliationStatus === 'pending' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setTransactionToMatch(tx);
                                    setIsMatchDialogOpen(true);
                                  }}
                                >
                                  <Link2 className="h-3 w-3 mr-1" />
                                  Vincular
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
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
                                  <DropdownMenuItem onClick={() => {
                                    setTransactionToMatch(tx);
                                    setIsMatchDialogOpen(true);
                                  }}>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Vincular manualmente
                                  </DropdownMenuItem>
                                  {(tx.reconciliationStatus === 'matched' || tx.reconciliationStatus === 'manual') && (
                                    <DropdownMenuItem onClick={() => handleUnlink(tx.id)}>
                                      <Unlink className="h-4 w-4 mr-2" />
                                      Desvincular
                                    </DropdownMenuItem>
                                  )}
                                  {tx.reconciliationStatus === 'pending' && (
                                    <DropdownMenuItem onClick={() => handleIgnore(tx.id)}>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Ignorar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pagos */}
          <TabsContent value="facturas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes de Conciliar</CardTitle>
                <CardDescription>
                  Pagos que aún no tienen movimiento bancario vinculado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Todos los pagos están conciliados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Inquilino</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Conciliado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.number}</TableCell>
                          <TableCell>{format(parseISO(inv.date), "d MMM yyyy", { locale: es })}</TableCell>
                          <TableCell>{inv.concept}</TableCell>
                          <TableCell>{inv.tenant || '-'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {inv.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'outline'}>
                              {inv.status === 'paid' ? 'Pagado' : inv.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {inv.reconciled ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-amber-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Sugerencias IA */}
          <TabsContent value="sugerencias" className="space-y-4">
            <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 dark:text-purple-200">
                <strong>Conciliación Inteligente:</strong> La IA analiza descripciones, importes y fechas para sugerir 
                vinculaciones automáticas entre movimientos bancarios y pagos.
              </AlertDescription>
            </Alert>

            {stats.pendingCount > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Sugerencias de Conciliación
                  </CardTitle>
                  <CardDescription>
                    Movimientos pendientes con posibles coincidencias detectadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, idx) => {
                      const tx = transactions.find(t => t.id === suggestion.transactionId);
                      const inv = invoices.find(i => i.id === suggestion.paymentId);
                      
                      if (!tx || !inv) return null;

                      return (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(tx.date), "d MMMM yyyy", { locale: es })} • 
                                <span className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                  {' '}{tx.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                              </p>
                            </div>
                            <Badge className="bg-purple-500">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {suggestion.confidence}% coincidencia
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ArrowRightLeft className="h-4 w-4" />
                            {suggestion.reason}
                          </div>
                          
                          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium">{inv.number}</p>
                              <p className="text-sm text-muted-foreground">{inv.concept}</p>
                            </div>
                            <p className="font-semibold">
                              {inv.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                          
                          {!suggestion.applied && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleManualMatch(tx.id, inv.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aceptar Vinculación
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleIgnore(tx.id)}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Ignorar
                              </Button>
                            </div>
                          )}
                          {suggestion.applied && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Aplicado automáticamente
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 mx-auto text-purple-400 mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Pulsa "Conciliar con IA" para obtener sugerencias automáticas
                      </p>
                      <Button onClick={handleAutoMatch} disabled={isAutoMatching}>
                        <Sparkles className={`h-4 w-4 mr-2 ${isAutoMatching ? 'animate-pulse' : ''}`} />
                        Analizar con IA
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">¡Todo conciliado!</h3>
                  <p className="text-muted-foreground">
                    No hay movimientos pendientes de conciliar
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog para vincular manualmente */}
        <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vincular Movimiento</DialogTitle>
              <DialogDescription>
                Selecciona el pago que corresponde a este movimiento bancario
              </DialogDescription>
            </DialogHeader>
            
            {transactionToMatch && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{transactionToMatch.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{format(parseISO(transactionToMatch.date), "d MMM yyyy", { locale: es })}</span>
                    <span className={`font-semibold ${transactionToMatch.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transactionToMatch.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="mb-2 block">Pagos disponibles</Label>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {pendingInvoices.map(inv => (
                        <div
                          key={inv.id}
                          className="p-3 border rounded-lg hover:border-primary cursor-pointer transition-all"
                          onClick={() => handleManualMatch(transactionToMatch.id, inv.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{inv.number}</p>
                              <p className="text-sm text-muted-foreground">{inv.concept}</p>
                              {inv.tenant && (
                                <p className="text-xs text-muted-foreground">{inv.tenant}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {inv.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(inv.date), "d MMM yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {pendingInvoices.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay pagos pendientes de vincular
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Asistente Financiero IA */}
      <FinancialAIAssistant
        context="conciliacion"
        contextData={{
          pendingTransactions: stats.pendingCount,
          totalBalance: stats.totalBalance,
          unreconciled: stats.pendingCount,
          bankAccounts: bankAccounts.map(acc => ({ name: acc.bankName, balance: acc.balance })),
        }}
        onAutoReconcile={handleAutoMatch}
        isSyncing={isSyncing || isAutoMatching}
        onAction={(action, data) => {
          if (action === 'sync_banks') {
            handleSyncBanks();
          } else if (action === 'view_pending') {
            setStatusFilter('pending');
            setActiveTab('movimientos');
          }
        }}
      />
    </AuthenticatedLayout>
  );
}
