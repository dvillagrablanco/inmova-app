import { getStripe } from './stripe-config';
import { prisma } from './db';

export async function getOrCreateStripeCustomer(
  tenantId: string,
  email: string,
  name: string
): Promise<string> {
  const stripe = getStripe();
  // Check if Stripe is configured
  if (!stripe) {
    throw new Error('Stripe no está configurado');
  }

  // Check if customer already exists in our database
  const existingCustomer = await prisma.stripeCustomer.findUnique({
    where: { tenantId },
  });

  if (existingCustomer) {
    return existingCustomer.stripeCustomerId;
  }

  // Create new Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email,
    name,
    metadata: {
      tenantId,
    },
  });

  // Save to database
  await prisma.stripeCustomer.create({
    data: {
      tenantId,
      stripeCustomerId: stripeCustomer.id,
      email,
      name,
    },
  });

  return stripeCustomer.id;
}

export async function deleteStripeCustomer(tenantId: string): Promise<void> {
  const stripe = getStripe();
  // Check if Stripe is configured
  if (!stripe) {
    throw new Error('Stripe no está configurado');
  }

  const customer = await prisma.stripeCustomer.findUnique({
    where: { tenantId },
  });

  if (customer) {
    // Delete from Stripe
    await stripe.customers.del(customer.stripeCustomerId);

    // Delete from database
    await prisma.stripeCustomer.delete({
      where: { tenantId },
    });
  }
}
