'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Wallet,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw as Refresh,
  Plus,
  Search,
  RefreshCw,
  DollarSign,
  Gift,
  History,
  TrendingUp,
  ShoppingCart,
  Coffee,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface Transaction {
  id: string;
  tipo: string;
  monto: number;
  concepto: string;
  referencia?: string;
  categoria?: string;
  balanceAnterior: number;
  balanceNuevo: number;
  fecha: string;
  tenantId: string;
}

interface Stats {
  totalTransacciones: number;
  recargas: number;
  pagos: number;
  cashback: number;
  walletBalance: number;
}

const CATEGORIAS_PAGO = [
  { id: 'servicios', label: 'Servicios', icon: Zap },
  { id: 'cafeteria', label: 'Cafetería', icon: Coffee },
  { id: 'lavanderia', label: 'Lavandería', icon: ShoppingCart },
  { id: 'parking', label: 'Parking', icon: CreditCard },
  { id: 'otros', label: 'Otros', icon: DollarSign },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function MicrotransaccionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('historial');
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [tenants, setTenants] = useState<{ id: string; nombreCompleto: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  // Form state - Recarga
  const [rechargeAmount, setRechargeAmount] = useState(0);

  // Form state - Pago
  const [newPayment, setNewPayment] = useState({
    tenantId: '',
    monto: 0,
    concepto: '',
    categoria: 'servicios',
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar tenants
      const tenantsRes = await fetch('/api/tenants?limit=100');
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        const tenantList = Array.isArray(data) ? data : data.data || [];
        setTenants(tenantList);
        if (tenantList.length > 0) {
          setSelectedTenantId(tenantList[0].id);
        }
      }

      await loadTransactions();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      let url = '/api/microtransactions';
      const params = new URLSearchParams();
      if (selectedTenantId) params.append('tenantId', selectedTenantId);
      if (filterTipo !== 'all') params.append('tipo', filterTipo);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Recargar wallet
  const handleRecharge = async () => {
    if (rechargeAmount <= 0 || !selectedTenantId) {
      toast.error('Selecciona un inquilino y monto válido');
      return;
    }

    try {
      const response = await fetch('/api/microtransactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          tipo: 'recarga',
          monto: rechargeAmount,
          concepto: 'Recarga de saldo',
        }),
      });

      if (response.ok) {
        toast.success(`€${rechargeAmount} recargados exitosamente`);
        setShowRechargeDialog(false);
        setRechargeAmount(0);
        loadTransactions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al recargar');
      }
    } catch (error) {
      console.error('Error recharging:', error);
      toast.error('Error al recargar');
    }
  };

  // Realizar pago
  const handlePayment = async () => {
    if (newPayment.monto <= 0 || !newPayment.concepto || !newPayment.tenantId) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/microtransactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPayment,
          tipo: 'pago',
        }),
      });

      if (response.ok) {
        toast.success('Pago registrado');
        setShowPaymentDialog(false);
        resetPaymentForm();
        loadTransactions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al procesar pago');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar pago');
    }
  };

  const resetPaymentForm = () => {
    setNewPayment({
      tenantId: selectedTenantId,
      monto: 0,
      concepto: '',
      categoria: 'servicios',
    });
  };

  // Obtener ícono del tipo
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'recarga': return ArrowUpCircle;
      case 'pago': return ArrowDownCircle;
      case 'reembolso': return Refresh;
      case 'cashback': return Gift;
      default: return DollarSign;
    }
  };

  // Obtener color del tipo
  const getTipoColor = (tipo: string): string => {
    switch (tipo) {
      case 'recarga': return 'bg-green-100 text-green-700';
      case 'pago': return 'bg-red-100 text-red-700';
      case 'reembolso': return 'bg-blue-100 text-blue-700';
      case 'cashback': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filtrar transacciones
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.concepto.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Montos de recarga predefinidos
  const RECHARGE_AMOUNTS = [10, 20, 50, 100];

  // Loading
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Wallet className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Microtransacciones</h1>
              <p className="text-muted-foreground">
                Wallet digital y pagos pequeños
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTenantId} onValueChange={v => { setSelectedTenantId(v); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar inquilino" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nombreCompleto}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Wallet Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-emerald-100 mb-1">Saldo disponible</p>
                <p className="text-4xl font-bold">€{(stats?.walletBalance || 0).toFixed(2)}</p>
                <p className="text-emerald-200 text-sm mt-2">
                  {tenants.find(t => t.id === selectedTenantId)?.nombreCompleto || 'Selecciona un inquilino'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowRechargeDialog(true)}
                  disabled={!selectedTenantId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => { 
                    resetPaymentForm(); 
                    setShowPaymentDialog(true); 
                  }}
                  disabled={!selectedTenantId}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalTransacciones || 0}</p>
                  <p className="text-xs text-muted-foreground">Transacciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">€{(stats?.recargas || 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Recargas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">€{(stats?.pagos || 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">€{(stats?.cashback || 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Cashback</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Transacciones
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-10 w-[200px]"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterTipo} onValueChange={v => { setFilterTipo(v); loadTransactions(); }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="recarga">Recargas</SelectItem>
                    <SelectItem value="pago">Pagos</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={loadTransactions}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center">
                <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sin transacciones</h3>
                <p className="text-muted-foreground">Realiza tu primera recarga</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(tx => {
                    const Icon = getTipoIcon(tx.tipo);
                    const isPositive = tx.tipo === 'recarga' || tx.tipo === 'reembolso' || tx.tipo === 'cashback';
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${getTipoColor(tx.tipo)}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {tx.tipo}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tx.concepto}</p>
                            {tx.categoria && (
                              <p className="text-xs text-muted-foreground capitalize">{tx.categoria}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(tx.fecha), "dd MMM HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                            {isPositive ? '+' : '-'}€{Math.abs(tx.monto).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{tx.balanceNuevo.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Recargar */}
      <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recargar Wallet</DialogTitle>
            <DialogDescription>
              Añade saldo al wallet de {tenants.find(t => t.id === selectedTenantId)?.nombreCompleto}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
              {RECHARGE_AMOUNTS.map(amount => (
                <Button
                  key={amount}
                  variant={rechargeAmount === amount ? 'default' : 'outline'}
                  onClick={() => setRechargeAmount(amount)}
                >
                  €{amount}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Otro monto (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={rechargeAmount}
                onChange={e => setRechargeAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total a recargar</p>
              <p className="text-3xl font-bold text-emerald-600">€{rechargeAmount.toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRechargeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRecharge} disabled={rechargeAmount <= 0}>
              Recargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>Descuenta saldo del wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Inquilino</Label>
              <Select
                value={newPayment.tenantId}
                onValueChange={v => setNewPayment(prev => ({ ...prev, tenantId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nombreCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newPayment.monto}
                onChange={e => setNewPayment(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input
                placeholder="Café, lavandería, parking..."
                value={newPayment.concepto}
                onChange={e => setNewPayment(prev => ({ ...prev, concepto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={newPayment.categoria}
                onValueChange={v => setNewPayment(prev => ({ ...prev, categoria: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_PAGO.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePayment} disabled={newPayment.monto <= 0}>
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
