'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  DialogTrigger,
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
  Filter,
  Download,
  Upload,
  Calendar,
  MoreHorizontal,
  Eye,
  Trash2,
  Sparkles,
  Zap,
  TrendingUp,
  Wallet,
  CreditCard,
  Building2,
  XCircle,
  ChevronDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// TIPOS
// ============================================

interface BankAccount {
  id: string;
  bankName: string;
  bankLogo?: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  lastSync: string;
  status: 'connected' | 'pending' | 'error';
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

interface ReconciliationSuggestion {
  transactionId: string;
  documentId: string;
  documentType: 'invoice' | 'receipt' | 'payment';
  confidence: number;
  reason: string;
}

// ============================================
// DATOS DE EJEMPLO
// ============================================

const mockBankAccounts: BankAccount[] = [
  {
    id: 'acc-1',
    bankName: 'CaixaBank',
    accountNumber: '****4521',
    iban: 'ES12 2100 0418 4502 0005 4521',
    balance: 45890.50,
    currency: 'EUR',
    lastSync: new Date().toISOString(),
    status: 'connected',
  },
  {
    id: 'acc-2',
    bankName: 'BBVA',
    accountNumber: '****7823',
    iban: 'ES91 0182 2370 4200 0178 2354',
    balance: 12450.00,
    currency: 'EUR',
    lastSync: subDays(new Date(), 1).toISOString(),
    status: 'connected',
  },
  {
    id: 'acc-3',
    bankName: 'Santander',
    accountNumber: '****9012',
    iban: 'ES68 0049 5103 8920 1690 1234',
    balance: 8320.75,
    currency: 'EUR',
    lastSync: subDays(new Date(), 2).toISOString(),
    status: 'pending',
  },
];

const mockTransactions: BankTransaction[] = [
  {
    id: 'tx-1',
    accountId: 'acc-1',
    date: new Date().toISOString(),
    valueDate: new Date().toISOString(),
    description: 'TRANSFERENCIA DE GARCIA MARTINEZ JUAN',
    reference: 'ALQUILER ENERO 2026 - PISO 3A',
    amount: 950.00,
    balance: 45890.50,
    type: 'income',
    category: 'alquiler',
    reconciliationStatus: 'pending',
    matchConfidence: 95,
  },
  {
    id: 'tx-2',
    accountId: 'acc-1',
    date: subDays(new Date(), 1).toISOString(),
    valueDate: subDays(new Date(), 1).toISOString(),
    description: 'RECIBO COMUNIDAD EDIFICIO SOL 15',
    amount: -180.50,
    balance: 44940.50,
    type: 'expense',
    category: 'comunidad',
    reconciliationStatus: 'matched',
    matchedDocumentId: 'inv-3',
    matchedDocumentType: 'invoice',
    matchConfidence: 100,
  },
  {
    id: 'tx-3',
    accountId: 'acc-1',
    date: subDays(new Date(), 2).toISOString(),
    valueDate: subDays(new Date(), 2).toISOString(),
    description: 'BIZUM DE LOPEZ FERNANDEZ MARIA',
    reference: 'Alquiler diciembre',
    amount: 850.00,
    balance: 45121.00,
    type: 'income',
    category: 'alquiler',
    reconciliationStatus: 'matched',
    matchedDocumentId: 'inv-2',
    matchedDocumentType: 'invoice',
    matchConfidence: 92,
  },
  {
    id: 'tx-4',
    accountId: 'acc-1',
    date: subDays(new Date(), 3).toISOString(),
    valueDate: subDays(new Date(), 3).toISOString(),
    description: 'PAGO SEGURO HOGAR MAPFRE',
    amount: -425.00,
    balance: 44271.00,
    type: 'expense',
    category: 'seguros',
    reconciliationStatus: 'manual',
    matchedDocumentId: 'inv-5',
    matchedDocumentType: 'receipt',
  },
  {
    id: 'tx-5',
    accountId: 'acc-1',
    date: subDays(new Date(), 5).toISOString(),
    valueDate: subDays(new Date(), 5).toISOString(),
    description: 'TRANSFERENCIA PEREZ SANCHEZ ANTONIO',
    amount: 1200.00,
    balance: 44696.00,
    type: 'income',
    category: 'alquiler',
    reconciliationStatus: 'pending',
  },
  {
    id: 'tx-6',
    accountId: 'acc-2',
    date: subDays(new Date(), 1).toISOString(),
    valueDate: subDays(new Date(), 1).toISOString(),
    description: 'FACTURA ELECTRICIDAD ENDESA',
    amount: -156.30,
    balance: 12450.00,
    type: 'expense',
    category: 'suministros',
    reconciliationStatus: 'pending',
  },
  {
    id: 'tx-7',
    accountId: 'acc-2',
    date: subDays(new Date(), 4).toISOString(),
    valueDate: subDays(new Date(), 4).toISOString(),
    description: 'DOMICILIACION AGUA CANAL ISABEL II',
    amount: -45.80,
    balance: 12606.30,
    type: 'expense',
    category: 'suministros',
    reconciliationStatus: 'ignored',
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    number: 'FAC-2026-0015',
    date: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    tenant: 'Juan García Martínez',
    concept: 'Alquiler Enero 2026 - Piso 3A',
    amount: 950.00,
    status: 'pending',
    reconciled: false,
  },
  {
    id: 'inv-2',
    number: 'FAC-2025-0198',
    date: subDays(new Date(), 30).toISOString(),
    dueDate: subDays(new Date(), 25).toISOString(),
    tenant: 'María López Fernández',
    concept: 'Alquiler Diciembre 2025',
    amount: 850.00,
    status: 'paid',
    reconciled: true,
    matchedTransactionId: 'tx-3',
  },
  {
    id: 'inv-3',
    number: 'COM-2026-001',
    date: subDays(new Date(), 5).toISOString(),
    dueDate: subDays(new Date(), 1).toISOString(),
    concept: 'Cuota Comunidad Enero - Edificio Sol 15',
    amount: 180.50,
    status: 'paid',
    reconciled: true,
    matchedTransactionId: 'tx-2',
  },
  {
    id: 'inv-4',
    number: 'FAC-2026-0014',
    date: subDays(new Date(), 2).toISOString(),
    dueDate: subDays(new Date(), 2).toISOString(),
    tenant: 'Antonio Pérez Sánchez',
    concept: 'Alquiler Enero 2026 - Local Comercial',
    amount: 1200.00,
    status: 'pending',
    reconciled: false,
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ConciliacionBancariaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('movimientos');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [transactions, setTransactions] = useState<BankTransaction[]>(mockTransactions);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [transactionToMatch, setTransactionToMatch] = useState<BankTransaction | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Filtrar transacciones
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === '' || 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccount === 'all' || tx.accountId === selectedAccount;
    const matchesStatus = statusFilter === 'all' || tx.reconciliationStatus === statusFilter;
    return matchesSearch && matchesAccount && matchesStatus;
  });

  // Estadísticas
  const stats = {
    pendingCount: transactions.filter(t => t.reconciliationStatus === 'pending').length,
    matchedCount: transactions.filter(t => t.reconciliationStatus === 'matched' || t.reconciliationStatus === 'manual').length,
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0),
  };

  // Sincronizar bancos
  const handleSyncBanks = async () => {
    setIsSyncing(true);
    toast.loading('Sincronizando con bancos...');
    
    // Simular sincronización
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsSyncing(false);
    toast.dismiss();
    toast.success('Sincronización completada', {
      description: 'Se han obtenido 12 nuevos movimientos',
    });
  };

  // Auto-matching con IA
  const handleAutoMatch = async () => {
    setIsAutoMatching(true);
    toast.loading('Analizando movimientos con IA...');
    
    // Simular análisis IA
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Actualizar algunas transacciones como matched
    setTransactions(prev => prev.map(tx => {
      if (tx.id === 'tx-1' && tx.reconciliationStatus === 'pending') {
        return {
          ...tx,
          reconciliationStatus: 'matched',
          matchedDocumentId: 'inv-1',
          matchedDocumentType: 'invoice',
          matchConfidence: 95,
        };
      }
      if (tx.id === 'tx-5' && tx.reconciliationStatus === 'pending') {
        return {
          ...tx,
          reconciliationStatus: 'matched',
          matchedDocumentId: 'inv-4',
          matchedDocumentType: 'invoice',
          matchConfidence: 88,
        };
      }
      return tx;
    }));

    // Actualizar facturas
    setInvoices(prev => prev.map(inv => {
      if (inv.id === 'inv-1') {
        return { ...inv, status: 'paid', reconciled: true, matchedTransactionId: 'tx-1' };
      }
      if (inv.id === 'inv-4') {
        return { ...inv, status: 'paid', reconciled: true, matchedTransactionId: 'tx-5' };
      }
      return inv;
    }));
    
    setIsAutoMatching(false);
    toast.dismiss();
    toast.success('Conciliación automática completada', {
      description: '2 movimientos conciliados automáticamente',
    });
  };

  // Vincular manualmente
  const handleManualMatch = (transactionId: string, invoiceId: string) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === transactionId) {
        return {
          ...tx,
          reconciliationStatus: 'manual',
          matchedDocumentId: invoiceId,
          matchedDocumentType: 'invoice',
        };
      }
      return tx;
    }));

    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, reconciled: true, matchedTransactionId: transactionId, status: 'paid' };
      }
      return inv;
    }));

    setIsMatchDialogOpen(false);
    setTransactionToMatch(null);
    toast.success('Movimiento conciliado manualmente');
  };

  // Desvincular
  const handleUnlink = (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return;

    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          reconciliationStatus: 'pending',
          matchedDocumentId: undefined,
          matchedDocumentType: undefined,
          matchConfidence: undefined,
        };
      }
      return t;
    }));

    if (tx.matchedDocumentId) {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === tx.matchedDocumentId) {
          return { ...inv, reconciled: false, matchedTransactionId: undefined, status: 'pending' };
        }
        return inv;
      }));
    }

    toast.success('Vinculación eliminada');
  };

  // Ignorar movimiento
  const handleIgnore = (transactionId: string) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === transactionId) {
        return { ...tx, reconciliationStatus: 'ignored' };
      }
      return tx;
    }));
    toast.success('Movimiento marcado como ignorado');
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
            <div className="grid md:grid-cols-3 gap-4">
              {mockBankAccounts.map(account => (
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
                  <p className="text-sm text-muted-foreground mb-1">{account.iban}</p>
                  <p className="text-xl font-bold">{account.balance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Última sync: {format(parseISO(account.lastSync), "d MMM HH:mm", { locale: es })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="facturas">Facturas</TabsTrigger>
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
                      <SelectItem value="manual">Manuales</SelectItem>
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
                      const linkedInvoice = tx.matchedDocumentId 
                        ? invoices.find(inv => inv.id === tx.matchedDocumentId)
                        : null;
                      
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
                            {linkedInvoice ? (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{linkedInvoice.number}</span>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Facturas */}
          <TabsContent value="facturas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facturas y Recibos Pendientes de Conciliar</CardTitle>
                <CardDescription>
                  Facturas emitidas que aún no tienen movimiento bancario vinculado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Factura</TableHead>
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
                            {inv.status === 'paid' ? 'Pagada' : inv.status === 'overdue' ? 'Vencida' : 'Pendiente'}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Sugerencias IA */}
          <TabsContent value="sugerencias" className="space-y-4">
            <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 dark:text-purple-200">
                <strong>Conciliación Inteligente:</strong> La IA analiza descripciones, importes y fechas para sugerir 
                vinculaciones automáticas entre movimientos bancarios y facturas.
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
                  {transactions
                    .filter(tx => tx.reconciliationStatus === 'pending')
                    .map(tx => {
                      // Buscar posible match
                      const possibleMatch = invoices.find(inv => 
                        !inv.reconciled && 
                        Math.abs(inv.amount - Math.abs(tx.amount)) < 1
                      );
                      
                      if (!possibleMatch) return null;

                      return (
                        <div key={tx.id} className="p-4 border rounded-lg space-y-3">
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
                              95% coincidencia
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ArrowRightLeft className="h-4 w-4" />
                            Posible coincidencia:
                          </div>
                          
                          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium">{possibleMatch.number}</p>
                              <p className="text-sm text-muted-foreground">{possibleMatch.concept}</p>
                            </div>
                            <p className="font-semibold">
                              {possibleMatch.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleManualMatch(tx.id, possibleMatch.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aceptar Vinculación
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleIgnore(tx.id)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Ignorar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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
                Selecciona la factura o recibo que corresponde a este movimiento bancario
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
                  <Label className="mb-2 block">Facturas disponibles</Label>
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
                          No hay facturas pendientes de vincular
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
          totalBalance: mockBankAccounts.reduce((sum, acc) => sum + acc.balance, 0),
          unreconciled: stats.pendingCount,
          bankAccounts: mockBankAccounts.map(acc => ({ name: acc.bankName, balance: acc.balance })),
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
