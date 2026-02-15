'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
    totalIncome: 0, totalExpense: 0, incomeCount: 0, expenseCount: 0,
    pendingCount: 0, matchedCount: 0, totalTransactions: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Cargar datos desde API - accepts explicit params to avoid stale closures
  const fetchData = async (
    page = 1,
    filters?: { company?: string; status?: string; type?: string; search?: string }
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

      const response = await fetch(`/api/finanzas/conciliacion?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setAccounts(result.data?.accounts || []);
        setTransactions(result.data?.transactions || []);
        setCompanies(result.data?.companies || []);
        setStats(result.data?.stats || {
          totalIncome: 0, totalExpense: 0, incomeCount: 0, expenseCount: 0,
          pendingCount: 0, matchedCount: 0, totalTransactions: 0,
        });
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
  }, [searchTerm, selectedCompany, statusFilter, typeFilter]);

  // Filtrar cuentas por empresa seleccionada
  const filteredAccounts = selectedCompany === 'all' 
    ? accounts 
    : accounts.filter(a => a.companyId === selectedCompany);

  // Conciliar movimiento
  const handleConciliar = async (transactionId: string, action: 'conciliar' | 'descartar' | 'revertir') => {
    try {
      const response = await fetch('/api/finanzas/conciliacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action }),
      });

      if (response.ok) {
        toast.success(
          action === 'conciliar' ? 'Movimiento conciliado' : 
          action === 'descartar' ? 'Movimiento descartado' : 
          'Conciliación revertida'
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

  // Sincronizar
  const handleSyncBanks = async () => {
    setIsSyncing(true);
    toast.loading('Sincronizando movimientos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    toast.dismiss();
    toast.info('Los movimientos se cargan desde archivos CAMT.053 importados. Use el script de importación para actualizar.');
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
      .replace(/^\w/, c => c.toUpperCase());
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
                  <SelectItem value="all">
                    Todas las sociedades ({companies.length})
                  </SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={handleSyncBanks} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingCount.toLocaleString('es-ES')}</p>
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
                  <p className="text-2xl font-bold text-sm md:text-xl">+{formatCurrency(stats.totalIncome)}</p>
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
                  <p className="text-2xl font-bold text-sm md:text-xl">-{formatCurrency(stats.totalExpense)}</p>
                  <p className="text-xs text-muted-foreground">Gastos ({stats.expenseCount})</p>
                </div>
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
                {filteredAccounts.map(account => (
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
                        {account.status === 'connected' ? 'Conectado' : 'Pendiente'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-primary">{account.companyName}</p>
                    <p className="text-sm text-muted-foreground mb-1">{account.iban}</p>
                    <p className="text-xs text-muted-foreground">
                      Última sync: {format(parseISO(account.lastSync), "d MMM HH:mm", { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="movimientos">
              Movimientos ({stats.totalTransactions.toLocaleString('es-ES')})
            </TabsTrigger>
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
                        <TableHead className="min-w-[280px]">Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
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
                            <div className="text-sm whitespace-nowrap">
                              {format(parseISO(tx.date), "d MMM yyyy", { locale: es })}
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
                                <p className="text-xs text-muted-foreground line-clamp-1">{tx.beneficiary}</p>
                              )}
                              {tx.reference && (
                                <p className="text-xs text-muted-foreground/70 line-clamp-1">{tx.reference}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatCategory(tx.category)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
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
                                    <DropdownMenuItem onClick={() => handleConciliar(tx.id, 'conciliar')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Conciliar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleConciliar(tx.id, 'descartar')}>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Descartar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(tx.reconciliationStatus === 'matched' || tx.reconciliationStatus === 'manual') && (
                                  <DropdownMenuItem onClick={() => handleConciliar(tx.id, 'revertir')}>
                                    <Unlink className="h-4 w-4 mr-2" />
                                    Revertir conciliación
                                  </DropdownMenuItem>
                                )}
                                {tx.reconciliationStatus === 'ignored' && (
                                  <DropdownMenuItem onClick={() => handleConciliar(tx.id, 'revertir')}>
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
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total.toLocaleString('es-ES')} movimientos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchData(pagination.page - 1, {
                        company: selectedCompany,
                        status: statusFilter,
                        type: typeFilter,
                        search: searchTerm,
                      })}
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
                      onClick={() => fetchData(pagination.page + 1, {
                        company: selectedCompany,
                        status: statusFilter,
                        type: typeFilter,
                        search: searchTerm,
                      })}
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
                <strong>Conciliación Inteligente:</strong> La IA analiza descripciones, importes y fechas para sugerir 
                vinculaciones automáticas entre movimientos bancarios y facturas/contratos.
              </AlertDescription>
            </Alert>

            {stats.pendingCount > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Resumen de Categorización Automática
                  </CardTitle>
                  <CardDescription>
                    Los movimientos han sido categorizados automáticamente al importarlos.
                    {stats.pendingCount} movimientos pendientes de revisión.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{stats.totalTransactions.toLocaleString('es-ES')}</p>
                      <p className="text-xs text-muted-foreground">Total movimientos</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.incomeCount.toLocaleString('es-ES')}</p>
                      <p className="text-xs text-muted-foreground">Ingresos</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{stats.expenseCount.toLocaleString('es-ES')}</p>
                      <p className="text-xs text-muted-foreground">Gastos</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-600">{stats.pendingCount.toLocaleString('es-ES')}</p>
                      <p className="text-xs text-muted-foreground">Pendientes</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Categorías detectadas en los movimientos:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { label: 'Alquileres', icon: '🏠', filter: 'ingreso_alquiler' },
                        { label: 'Comunidades', icon: '🏢', filter: 'gasto_comunidad' },
                        { label: 'Seguros', icon: '🛡️', filter: 'gasto_seguro' },
                        { label: 'Impuestos', icon: '📋', filter: 'gasto_impuesto' },
                        { label: 'Suministros', icon: '💡', filter: 'gasto_suministros' },
                        { label: 'Mantenimiento', icon: '🔧', filter: 'gasto_mantenimiento' },
                        { label: 'Bancarios', icon: '🏦', filter: 'gasto_bancario' },
                        { label: 'Personal', icon: '👤', filter: 'gasto_personal' },
                        { label: 'Transferencias internas', icon: '🔄', filter: 'transferencia_interna' },
                      ].map(cat => (
                        <Button
                          key={cat.filter}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            setSearchTerm(cat.filter.replace(/_/g, ' '));
                            setActiveTab('movimientos');
                          }}
                        >
                          <span className="mr-2">{cat.icon}</span>
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay movimientos pendientes</h3>
                  <p className="text-muted-foreground">
                    Todos los movimientos han sido conciliados o descartados
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
