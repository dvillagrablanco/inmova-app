'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './components/StripePaymentForm';
import logger, { logError } from '@/lib/logger';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Payment {
  id: string;
  periodo: string;
  monto: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  estado: string;
  metodoPago: string | null;
  stripePaymentIntentId: string | null;
  stripePaymentStatus: string | null;
  contract: {
    unit: {
      numero: string;
      building: {
        nombre: string;
      };
    };
  };
}

export default function TenantPaymentsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal-inquilino/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchPayments();
    }
  }, [session]);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/portal-inquilino/payments');
      if (!response.ok) throw new Error('Error al cargar pagos');
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      logger.error('Error fetching payments:', error);
      toast.error('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (payment: Payment) => {
    setProcessingPayment(true);
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear intención de pago');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setSelectedPayment(payment);
    } catch (error: any) {
      logger.error('Error creating payment intent:', error);
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setSelectedPayment(null);
    fetchPayments();
    toast.success('¡Pago procesado exitosamente!');
  };

  const handlePaymentCancel = () => {
    setClientSecret(null);
    setSelectedPayment(null);
  };

  const handleDownloadReceipt = async (paymentId: string, periodo: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/receipt`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al descargar recibo');
      }

      // Crear un blob del PDF
      const blob = await response.blob();

      // Crear un link temporal y hacer click para descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo_${periodo.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Recibo descargado exitosamente');
    } catch (error: any) {
      logger.error('Error downloading receipt:', error);
      toast.error(error.message || 'Error al descargar el recibo');
    }
  };

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/receipt`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar recibo');
      }

      // Crear un blob del PDF
      const blob = await response.blob();

      // Abrir en nueva pestaña
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      // El URL se limpiará automáticamente cuando se cierre la pestaña
    } catch (error: any) {
      logger.error('Error viewing receipt:', error);
      toast.error(error.message || 'Error al visualizar el recibo');
    }
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Show payment form if payment is selected
  if (clientSecret && selectedPayment) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Button variant="ghost" onClick={handlePaymentCancel} className="mb-4">
          ← Volver a mis pagos
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Pagar con Tarjeta</CardTitle>
            <CardDescription>
              {selectedPayment.contract.unit.building.nombre} - Unidad{' '}
              {selectedPayment.contract.unit.numero}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Período</p>
                  <p className="font-semibold">{selectedPayment.periodo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Monto</p>
                  <p className="text-2xl font-bold">€{selectedPayment.monto.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#000000',
                  },
                },
              }}
            >
              <StripePaymentForm onSuccess={handlePaymentSuccess} onCancel={handlePaymentCancel} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingPayments = payments.filter((p) => p.estado !== 'pagado');
  const paidPayments = payments.filter((p) => p.estado === 'pagado');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mis Pagos</h1>
        <p className="text-gray-600">Gestiona tus pagos de renta</p>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Pagos Pendientes
          </h2>
          <div className="grid gap-4">
            {pendingPayments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{payment.periodo}</h3>
                        {getStatusBadge(payment.estado, payment.stripePaymentStatus)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {payment.contract.unit.building.nombre} - Unidad{' '}
                        {payment.contract.unit.numero}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Vence: {new Date(payment.fechaVencimiento).toLocaleDateString('es-ES')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />€{payment.monto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePayNow(payment)}
                        disabled={processingPayment || payment.stripePaymentStatus === 'processing'}
                        className="bg-black hover:bg-gray-800"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {processingPayment ? 'Procesando...' : 'Pagar Ahora'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Paid Payments */}
      {paidPayments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Historial de Pagos
          </h2>
          <div className="grid gap-4">
            {paidPayments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{payment.periodo}</h3>
                        {getStatusBadge(payment.estado, payment.stripePaymentStatus)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {payment.contract.unit.building.nombre} - Unidad{' '}
                        {payment.contract.unit.numero}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Pagado:{' '}
                          {payment.fechaPago
                            ? new Date(payment.fechaPago).toLocaleDateString('es-ES')
                            : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />€{payment.monto.toFixed(2)}
                        </span>
                        {payment.metodoPago && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            {payment.metodoPago}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReceipt(payment.id)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Recibo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment.id, payment.periodo)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No hay pagos registrados</h3>
            <p className="text-gray-600">Tus pagos aparecerán aquí cuando estén disponibles</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
