/**
 * Componente Wrapper: Stripe Elements Provider
 * Provee el contexto de Stripe Elements
 */

'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { StripeCheckoutForm } from './StripeCheckoutForm';

// Cargar Stripe con la public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface StripePaymentWrapperProps {
  amount: number;
  currency?: string;
  description?: string;
  contractId?: string;
  propertyId?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function StripePaymentWrapper({
  amount,
  currency = 'eur',
  description,
  contractId,
  propertyId,
  onSuccess,
  onError,
}: StripePaymentWrapperProps) {
  const options: StripeElementsOptions = {
    mode: 'payment',
    amount,
    currency,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm
        amount={amount}
        currency={currency}
        description={description}
        contractId={contractId}
        propertyId={propertyId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
