"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentDetail {
  id: string;
  monto: number;
  estado: string;
  periodo?: string;
  fechaPago: string | null;
  fechaVencimiento: string;
  metodoPago?: string | null;
  reciboPdfPath?: string | null;
  contract?: {
    id: string;
    tenant: { nombreCompleto: string; email?: string };
    unit: { numero: string; building: { nombre: string; direccion?: string } };
  };
}

const getEstadoBadge = (estado: string) => {
  const normalized = estado?.toLowerCase();
  if (normalized === 'pagado') return { label: 'Pagado', variant: 'default', icon: CheckCircle };
  if (normalized === 'pendiente') return { label: 'Pendiente', variant: 'outline', icon: Clock };
  if (normalized === 'vencido' || normalized === 'atrasado')
    return { label: 'Vencido', variant: 'destructive', icon: XCircle };
  return { label: estado, variant: 'secondary', icon: CreditCard };
};

export default function PagoDetallePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPayment();
    }
  }, [status, router, paymentId]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/${paymentId}`);
      if (!response.ok) throw new Error('Error cargando pago');
      const data = await response.json();
      setPayment(data);
    } catch (error) {
      logger.error('Error fetching payment:', error);
      toast.error('No se pudo cargar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!payment) return;
    try {
      setUpdating(true);
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'pagado' }),
      });
      if (!response.ok) {
        throw new Error('No se pudo actualizar el pago');
      }
      const updated = await response.json();
      setPayment(updated);
      toast.success('Pago marcado como pagado');
    } catch (error) {
      logger.error('Error updating payment:', error);
      toast.error('No se pudo actualizar el pago');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!payment) return;
    window.open(`/api/payments/${payment.id}/receipt`, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!payment) return null;

  const badge = getEstadoBadge(payment.estado);
  const StatusIcon = badge.icon;

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Detalle de Pago</h1>
            <p className="text-muted-foreground">Información completa del pago</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/pagos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              {badge.label}
              <Badge variant={badge.variant as any}>{badge.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Monto</p>
                <p className="text-xl font-bold">
                  €{payment.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-base font-medium">{payment.periodo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencimiento</p>
                <p className="text-base font-medium">
                  {format(new Date(payment.fechaVencimiento), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
              {payment.fechaPago && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de pago</p>
                  <p className="text-base font-medium">
                    {format(new Date(payment.fechaPago), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
              )}
              {payment.metodoPago && (
                <div>
                  <p className="text-sm text-muted-foreground">Método</p>
                  <p className="text-base font-medium capitalize">{payment.metodoPago}</p>
                </div>
              )}
            </div>

            {payment.contract && (
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Contrato</p>
                  <p className="font-semibold">{payment.contract.tenant.nombreCompleto}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.contract.unit.building.nombre} · Unidad {payment.contract.unit.numero}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/contratos/${payment.contract?.id}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Ver contrato
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-2">
              {payment.estado !== 'pagado' && (
                <Button onClick={handleMarkAsPaid} disabled={updating}>
                  {updating ? 'Actualizando...' : 'Marcar como pagado'}
                </Button>
              )}
              {payment.estado === 'pagado' && (
                <Button variant="outline" onClick={handleDownloadReceipt}>
                  Descargar recibo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
