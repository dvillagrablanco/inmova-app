'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Plus, 
  Search, 
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
  description?: string;
  dueDate?: string;
  paidAt?: string;
  estado?: string;
  monto?: number;
  fechaVencimiento?: string;
  fechaPago?: string;
  contractId?: string;
  tenantId?: string;
  contract?: {
    id: string;
    tenant?: {
      nombreCompleto: string;
    };
    unit?: {
      numero: string;
      building?: {
        nombre: string;
      };
    };
  };
  createdAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const normalizeStatus = (status?: string, estado?: string) => {
    if (status) return status;
    switch (estado) {
      case 'pagado':
        return 'paid';
      case 'pendiente':
        return 'pending';
      case 'atrasado':
        return 'overdue';
      default:
        return estado || 'pending';
    }
  };

  const normalizePayment = (payment: Payment) => ({
    ...payment,
    amount: payment.amount ?? payment.monto ?? 0,
    status: normalizeStatus(payment.status, payment.estado),
    dueDate: payment.dueDate ?? payment.fechaVencimiento,
    paidAt: payment.paidAt ?? payment.fechaPago,
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        const raw = Array.isArray(data) ? data : data.data || [];
        setPayments(raw.map((payment: Payment) => normalizePayment(payment)));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.contract?.tenant?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.contract?.unit?.building?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payments
    .filter(p => p.status === 'paid' || p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalOverdue = payments
    .filter(p => p.status === 'overdue' || p.status === 'failed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'pagado' }),
      });
      if (!response.ok) {
        throw new Error('No se pudo actualizar el pago');
      }
      const updated = await response.json();
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === paymentId ? normalizePayment(updated) : payment
        )
      );
      toast.success('Pago marcado como pagado');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('No se pudo actualizar el pago');
    }
  };

  const handleDownloadReceipt = (paymentId: string) => {
    window.open(`/api/payments/${paymentId}/receipt`, '_blank');
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencido';
      case 'failed': return 'Fallido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los cobros y pagos de alquiler
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" asChild>
            <Link href="/pagos/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pago
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Registros</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cobrado</p>
                <p className="text-2xl font-bold text-green-600">€{totalPaid.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pendiente</p>
                <p className="text-2xl font-bold text-yellow-600">€{totalPending.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Vencido</p>
                <p className="text-2xl font-bold text-red-600">€{totalOverdue.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por inquilino, propiedad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="failed">Fallido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <Card>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay pagos registrados</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No se encontraron pagos con ese criterio' 
                  : 'Los pagos de los contratos aparecerán aquí'}
              </p>
              <Button asChild>
                <Link href="/pagos/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      payment.status === 'paid' || payment.status === 'completed' 
                        ? 'bg-green-100' 
                        : payment.status === 'pending' 
                          ? 'bg-yellow-100' 
                          : 'bg-red-100'
                    }`}>
                      {payment.status === 'paid' || payment.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : payment.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {payment.contract?.tenant?.nombreCompleto || payment.description || 'Pago'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.contract?.unit?.building?.nombre} - {payment.contract?.unit?.numero}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {payment.dueDate && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <Badge className={statusBadgeVariant(payment.status)}>
                      {statusLabel(payment.status)}
                    </Badge>
                    
                    <p className="font-bold text-lg min-w-[100px] text-right">
                      €{payment.amount?.toLocaleString() || 0}
                    </p>
                    
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => undefined}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/pagos/${payment.id}`}>Ver detalles</Link>
                        </DropdownMenuItem>
                      {payment.status === 'pending' && (
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(payment.id)}>
                          Marcar como pagado
                        </DropdownMenuItem>
                        )}
                      <DropdownMenuItem onClick={() => handleDownloadReceipt(payment.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar recibo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
