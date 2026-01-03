/**
 * Componente: Stripe Checkout Form
 * Usa Stripe Elements para pagos seguros
 */

'use client';

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface StripeCheckoutFormProps {
  amount: number;
  currency?: string;
  description?: string;
  contractId?: string;
  propertyId?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function StripeCheckoutForm({
  amount,
  currency = 'eur',
  description,
  contractId,
  propertyId,
  onSuccess,
  onError,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');

  // Crear Payment Intent al montar
  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description,
          contractId,
          propertyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error creando payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);

    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        onSuccess?.(paymentIntent.id);
      }

    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (succeeded) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-6 text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-green-900">
            ¡Pago exitoso!
          </h3>
          <p className="text-sm text-green-700 mt-2">
            Tu pago de {(amount / 100).toFixed(2)}€ ha sido procesado correctamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumen del pago */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Monto:</span>
          <span className="text-lg font-semibold">
            {(amount / 100).toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
        {description && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Concepto:</span>
            <span className="text-sm">{description}</span>
          </div>
        )}
      </div>

      {/* Payment Element de Stripe */}
      <div className="border rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex items-start space-x-3">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error en el pago</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || processing}
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Procesando pago...
          </>
        ) : (
          `Pagar ${(amount / 100).toFixed(2)}€`
        )}
      </Button>

      {/* Security info */}
      <p className="text-xs text-center text-gray-500">
        Pagos seguros procesados por Stripe. No guardamos tu información de pago.
      </p>
    </form>
  );
}
