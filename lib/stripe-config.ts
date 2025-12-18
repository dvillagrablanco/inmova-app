import Stripe from 'stripe';

// Lazy initialization to prevent build errors when Stripe is not configured
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (stripeInstance) {
    return stripeInstance;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not defined. Stripe functionality will be disabled.');
    return null;
  }

  try {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
    return stripeInstance;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
}

// Export legacy stripe for backward compatibility (will be null if not configured)
export const stripe = getStripe();

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Helper function to format amount for Stripe (convert to cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (convert from cents)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
