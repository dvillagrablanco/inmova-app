import { getStripe } from './stripe-config';
import logger from '@/lib/logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function getOrCreateStripeCustomer(
  tenantId: string,
  email: string,
  name: string
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe no está configurado');
  }

  const prisma = await getPrisma();

  const existingCustomer = await prisma.stripeCustomer.findUnique({
    where: { tenantId },
  });

  if (existingCustomer) {
    return existingCustomer.stripeCustomerId;
  }

  const stripeCustomer = await stripe.customers.create({
    email,
    name,
    metadata: {
      tenantId,
    },
  });

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
  if (!stripe) {
    throw new Error('Stripe no está configurado');
  }

  const prisma = await getPrisma();

  const customer = await prisma.stripeCustomer.findUnique({
    where: { tenantId },
  });

  if (customer) {
    await stripe.customers.del(customer.stripeCustomerId);

    await prisma.stripeCustomer.delete({
      where: { tenantId },
    });
  }
}
