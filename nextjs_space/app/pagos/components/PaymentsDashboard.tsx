'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentStats {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  stripeRevenue: number;
  stripeFees: number;
  netRevenue: number;
  paymentsThisMonth: number;
  successRate: number;
}

interface StripePayment {
  id: string;
  periodo: string;
  monto: number;
  fechaPago: string | null;
  estado: string;
  stripePaymentStatus: string | null;
  stripeFee: number | null;
  stripeNetAmount: number | null;
  contract: {
    tenant: {
      nombreCompleto: string;
      email: string;
    };
    unit: {
      numero: string;
      building: {
        nombre: string;
      };
    };
  };
}

export default function PaymentsDashboard() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        fetch('/api/stripe/stats'),
        fetch('/api/stripe/payments'),
      ]);

      if (!statsRes.ok || !paymentsRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const statsData = await statsRes.json();
      const paymentsData = await paymentsRes.json();

      setStats(statsData);
      setPayments(paymentsData.payments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const exportToCSV = () => {
    if (payments.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = [
      'Período',
      'Inquilino',
      'Edificio',
      'Unidad',
      'Monto',
      'Estado',
      'Estado Stripe',
      'Comisión Stripe',
      'Monto Neto',
      'Fecha Pago',
    ];

    const rows = payments.map((p) => [
      p.periodo,
      p.contract.tenant.nombreCompleto,
      p.contract.unit.building.nombre,
      p.contract.unit.numero,
      p.monto.toFixed(2),
      p.estado,
      p.stripePaymentStatus || 'N/A',
      p.stripeFee?.toFixed(2) || 'N/A',
      p.stripeNetAmount?.toFixed(2) || 'N/A',
      p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-ES') : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagos-stripe-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Datos exportados exitosamente');
  };

  const getStatusBadge = (estado: string, stripeStatus?: string | null) => {
    if (stripeStatus === 'processing') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Procesando
        </Badge>
      );
    }

    switch (estado) {
      case 'pagado':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pagado
          </Badge>
        );
      case 'pendiente':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'atrasado':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Atrasado
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const stripePayments = payments.filter((p) => p.stripePaymentStatus);
  const successfulPayments = stripePayments.filter(
    (p) => p.stripePaymentStatus === 'succeeded'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Cobros Stripe</h2>
          <p className="text-gray-600">Monitorea tus pagos en línea</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.paymentsThisMonth} pagos este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Stripe</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.stripeRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Comisiones: {formatCurrency(stats.stripeFees)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.netRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Después de comisiones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {successfulPayments.length} de {stripePayments.length} exitosos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>
            Historial de pagos procesados con Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">Todos ({stripePayments.length})</TabsTrigger>
              <TabsTrigger value="succeeded">
                Exitosos ({successfulPayments.length})
              </TabsTrigger>
              <TabsTrigger value="processing">
                Procesando (
                {stripePayments.filter((p) => p.stripePaymentStatus === 'processing').length}
                )
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {stripePayments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pagos con Stripe aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stripePayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{payment.contract.tenant.nombreCompleto}</p>
                          {getStatusBadge(payment.estado, payment.stripePaymentStatus)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {payment.contract.unit.building.nombre} - Unidad{' '}
                          {payment.contract.unit.numero} - {payment.periodo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(payment.monto)}</p>
                        {payment.stripeFee && (
                          <p className="text-xs text-gray-500">
                            Comisión: {formatCurrency(payment.stripeFee)}
                          </p>
                        )}
                        {payment.stripeNetAmount && (
                          <p className="text-xs text-green-600 font-medium">
                            Neto: {formatCurrency(payment.stripeNetAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="succeeded" className="space-y-4 mt-4">
              <div className="space-y-3">
                {successfulPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{payment.contract.tenant.nombreCompleto}</p>
                        {getStatusBadge(payment.estado, payment.stripePaymentStatus)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {payment.contract.unit.building.nombre} - Unidad{' '}
                        {payment.contract.unit.numero} - {payment.periodo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(payment.monto)}</p>
                      {payment.stripeFee && (
                        <p className="text-xs text-gray-500">
                          Comisión: {formatCurrency(payment.stripeFee)}
                        </p>
                      )}
                      {payment.stripeNetAmount && (
                        <p className="text-xs text-green-600 font-medium">
                          Neto: {formatCurrency(payment.stripeNetAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="processing" className="space-y-4 mt-4">
              <div className="space-y-3">
                {stripePayments
                  .filter((p) => p.stripePaymentStatus === 'processing')
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{payment.contract.tenant.nombreCompleto}</p>
                          {getStatusBadge(payment.estado, payment.stripePaymentStatus)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {payment.contract.unit.building.nombre} - Unidad{' '}
                          {payment.contract.unit.numero} - {payment.periodo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(payment.monto)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
