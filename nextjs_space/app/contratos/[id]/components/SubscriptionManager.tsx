'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, XCircle, Calendar, DollarSign, AlertCircle } from 'lucide-react';

interface SubscriptionManagerProps {
  contractId: string;
  subscription: {
    id: string;
    stripeSubscriptionId: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
  } | null;
  rentaMensual: number;
  onUpdate: () => void;
}

export default function SubscriptionManager({
  contractId,
  subscription,
  rentaMensual,
  onUpdate,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);

  const handleCreateSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear suscripción');
      }

      const data = await response.json();
      toast.success('¡Suscripción creada exitosamente!');
      onUpdate();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || 'Error al crear suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (immediately: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription?.id,
          cancelImmediately: immediately,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cancelar suscripción');
      }

      const data = await response.json();
      toast.success(data.message);
      onUpdate();
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error(error.message || 'Error al cancelar suscripción');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Activa
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      case 'past_due':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencida
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagos Recurrentes
          </CardTitle>
          <CardDescription>
            Configura pagos automáticos mensuales con Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Beneficios de los Pagos Recurrentes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Cobros automáticos cada mes</li>
                <li>• Reduce la morosidad</li>
                <li>• Ahorra tiempo en gestión</li>
                <li>• Notificaciones automáticas al inquilino</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Monto mensual</p>
                <p className="text-2xl font-bold">€{rentaMensual.toFixed(2)}</p>
              </div>
              <Button
                onClick={handleCreateSubscription}
                disabled={loading}
                className="bg-black hover:bg-gray-800"
              >
                {loading ? 'Creando...' : 'Activar Pagos Recurrentes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Suscripción de Pagos
        </CardTitle>
        <CardDescription>
          Gestión de pagos recurrentes automáticos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estado de la suscripción</p>
              {getStatusBadge(subscription.status)}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Monto mensual</p>
              <p className="text-2xl font-bold">€{rentaMensual.toFixed(2)}</p>
            </div>
          </div>

          {/* Period Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                Inicio del período
              </div>
              <p className="font-semibold">
                {new Date(subscription.currentPeriodStart).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                Próximo cobro
              </div>
              <p className="font-semibold">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {/* Cancellation Warning */}
          {subscription.cancelAtPeriodEnd && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Cancelación programada</p>
                  <p className="text-sm text-yellow-800">
                    Esta suscripción se cancelará al final del período actual (
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES')})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1" disabled={loading}>
                    Cancelar al Final del Período
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                    <AlertDialogDescription>
                      La suscripción se cancelará al final del período actual. El inquilino
                      podrá seguir usando el servicio hasta el{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES')}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelSubscription(false)}
                      className="bg-black hover:bg-gray-800"
                    >
                      Confirmar Cancelación
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1" disabled={loading}>
                    Cancelar Inmediatamente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar inmediatamente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción cancelará la suscripción de inmediato. No se realizarán más
                      cobros automáticos. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelSubscription(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Cancelar Ahora
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Stripe Link */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              ID de Suscripción: {subscription.stripeSubscriptionId}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
