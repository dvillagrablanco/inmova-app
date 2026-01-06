/**
 * SERVICIO DE COBROS RECURRENTES - STRIPE
 * 
 * Gestión de pagos automáticos para contratos de media estancia
 */

import Stripe from 'stripe';
import { prisma } from '../db';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { sendNotification } from './notification-service';

// ==========================================
// INICIALIZACIÓN STRIPE
// ==========================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// ==========================================
// TIPOS
// ==========================================

export interface PaymentSchedule {
  contractId: string;
  tenantId: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'biweekly' | 'weekly';
  startDate: Date;
  endDate: Date;
  dayOfMonth: number;
  autoRetry: boolean;
  retryAttempts: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'sepa_debit' | 'bank_transfer';
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  isDefault: boolean;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'requires_action';
  error?: string;
  receiptUrl?: string;
}

export interface InvoiceData {
  contractId: string;
  tenantId: string;
  items: {
    description: string;
    amount: number;
    quantity: number;
  }[];
  dueDate: Date;
  notes?: string;
}

// ==========================================
// GESTIÓN DE CLIENTES
// ==========================================

/**
 * Crea o recupera un cliente de Stripe
 */
export async function getOrCreateStripeCustomer(
  tenantId: string
): Promise<{ customerId: string; isNew: boolean }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error('Inquilino no encontrado');
  }

  // Verificar si ya tiene Stripe customer ID
  if (tenant.stripeCustomerId) {
    return { customerId: tenant.stripeCustomerId, isNew: false };
  }

  // Crear nuevo cliente en Stripe
  const customer = await stripe.customers.create({
    email: tenant.email,
    name: tenant.nombre,
    phone: tenant.telefono || undefined,
    metadata: {
      tenantId: tenant.id,
      source: 'inmova_medium_term',
    },
  });

  // Guardar ID en base de datos
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { stripeCustomerId: customer.id },
  });

  return { customerId: customer.id, isNew: true };
}

/**
 * Añade un método de pago al cliente
 */
export async function addPaymentMethod(
  tenantId: string,
  paymentMethodId: string,
  setAsDefault: boolean = true
): Promise<PaymentMethod> {
  const { customerId } = await getOrCreateStripeCustomer(tenantId);

  // Adjuntar método de pago al cliente
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Establecer como predeterminado si aplica
  if (setAsDefault) {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // Guardar en base de datos
  await prisma.paymentMethod.create({
    data: {
      tenantId,
      stripePaymentMethodId: paymentMethodId,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4 || paymentMethod.sepa_debit?.last4,
      expiryMonth: paymentMethod.card?.exp_month,
      expiryYear: paymentMethod.card?.exp_year,
      brand: paymentMethod.card?.brand,
      isDefault: setAsDefault,
    },
  });

  return {
    id: paymentMethodId,
    type: paymentMethod.type as 'card' | 'sepa_debit' | 'bank_transfer',
    last4: paymentMethod.card?.last4 || paymentMethod.sepa_debit?.last4,
    expiryMonth: paymentMethod.card?.exp_month,
    expiryYear: paymentMethod.card?.exp_year,
    isDefault: setAsDefault,
  };
}

/**
 * Obtiene los métodos de pago de un inquilino
 */
export async function getPaymentMethods(
  tenantId: string
): Promise<PaymentMethod[]> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant?.stripeCustomerId) {
    return [];
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: tenant.stripeCustomerId,
    type: 'card',
  });

  const sepaPaymentMethods = await stripe.paymentMethods.list({
    customer: tenant.stripeCustomerId,
    type: 'sepa_debit',
  });

  return [
    ...paymentMethods.data.map(pm => ({
      id: pm.id,
      type: 'card' as const,
      last4: pm.card?.last4,
      expiryMonth: pm.card?.exp_month,
      expiryYear: pm.card?.exp_year,
      isDefault: false, // TODO: Verificar con invoice_settings
    })),
    ...sepaPaymentMethods.data.map(pm => ({
      id: pm.id,
      type: 'sepa_debit' as const,
      last4: pm.sepa_debit?.last4,
      bankName: pm.sepa_debit?.bank_code,
      isDefault: false,
    })),
  ];
}

// ==========================================
// PAGOS ÚNICOS
// ==========================================

/**
 * Procesa un pago único (fianza, primer mes, etc.)
 */
export async function processOneTimePayment(
  contractId: string,
  amount: number,
  description: string,
  paymentMethodId?: string
): Promise<PaymentResult> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { tenant: true },
  });

  if (!contract) {
    throw new Error('Contrato no encontrado');
  }

  const { customerId } = await getOrCreateStripeCustomer(contract.tenantId);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Centavos
      currency: 'eur',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: !!paymentMethodId,
      automatic_payment_methods: paymentMethodId ? undefined : {
        enabled: true,
        allow_redirects: 'never',
      },
      description,
      metadata: {
        contractId,
        tenantId: contract.tenantId,
        type: 'one_time',
      },
    });

    // Registrar pago en base de datos
    const payment = await prisma.payment.create({
      data: {
        contractId,
        tenantId: contract.tenantId,
        amount,
        currency: 'EUR',
        status: paymentIntent.status === 'succeeded' ? 'pagado' : 'pendiente',
        type: 'manual',
        stripePaymentIntentId: paymentIntent.id,
        description,
        fecha: new Date(),
      },
    });

    return {
      success: paymentIntent.status === 'succeeded',
      paymentId: payment.id,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency: 'eur',
      status: paymentIntent.status as PaymentResult['status'],
      receiptUrl: paymentIntent.latest_charge 
        ? (await stripe.charges.retrieve(paymentIntent.latest_charge as string)).receipt_url || undefined
        : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      amount,
      currency: 'eur',
      status: 'failed',
      error: error.message,
    };
  }
}

// ==========================================
// PAGOS RECURRENTES
// ==========================================

/**
 * Configura pagos recurrentes para un contrato
 */
export async function setupRecurringPayments(
  schedule: PaymentSchedule
): Promise<{ subscriptionId: string; nextPaymentDate: Date }> {
  const contract = await prisma.contract.findUnique({
    where: { id: schedule.contractId },
    include: { tenant: true, unit: true },
  });

  if (!contract) {
    throw new Error('Contrato no encontrado');
  }

  const { customerId } = await getOrCreateStripeCustomer(schedule.tenantId);

  // Crear producto si no existe
  const productId = await getOrCreateProduct(contract.unit.id, contract.unit.direccion || '');

  // Crear precio recurrente
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: Math.round(schedule.amount * 100),
    currency: schedule.currency.toLowerCase(),
    recurring: {
      interval: schedule.frequency === 'monthly' ? 'month' : 
                schedule.frequency === 'biweekly' ? 'week' : 'week',
      interval_count: schedule.frequency === 'biweekly' ? 2 : 1,
    },
    metadata: {
      contractId: schedule.contractId,
      type: 'rent',
    },
  });

  // Crear suscripción
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    billing_cycle_anchor: Math.floor(schedule.startDate.getTime() / 1000),
    cancel_at: Math.floor(schedule.endDate.getTime() / 1000),
    payment_settings: {
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      save_default_payment_method: 'on_subscription',
    },
    metadata: {
      contractId: schedule.contractId,
      tenantId: schedule.tenantId,
    },
  });

  // Guardar en base de datos
  await prisma.contract.update({
    where: { id: schedule.contractId },
    data: {
      stripeSubscriptionId: subscription.id,
      autoPaymentEnabled: true,
      paymentDayOfMonth: schedule.dayOfMonth,
    },
  });

  const nextPayment = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000)
    : addMonths(schedule.startDate, 1);

  return {
    subscriptionId: subscription.id,
    nextPaymentDate: nextPayment,
  };
}

/**
 * Cancela pagos recurrentes
 */
export async function cancelRecurringPayments(
  contractId: string
): Promise<boolean> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract?.stripeSubscriptionId) {
    throw new Error('No hay suscripción activa');
  }

  await stripe.subscriptions.cancel(contract.stripeSubscriptionId);

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      stripeSubscriptionId: null,
      autoPaymentEnabled: false,
    },
  });

  return true;
}

/**
 * Pausa pagos recurrentes
 */
export async function pauseRecurringPayments(
  contractId: string,
  resumeDate?: Date
): Promise<boolean> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract?.stripeSubscriptionId) {
    throw new Error('No hay suscripción activa');
  }

  await stripe.subscriptions.update(contract.stripeSubscriptionId, {
    pause_collection: {
      behavior: 'void',
      resumes_at: resumeDate ? Math.floor(resumeDate.getTime() / 1000) : undefined,
    },
  });

  return true;
}

// ==========================================
// FACTURAS
// ==========================================

/**
 * Genera una factura
 */
export async function generateInvoice(
  data: InvoiceData
): Promise<{ invoiceId: string; invoiceUrl: string; invoicePdf: string }> {
  const contract = await prisma.contract.findUnique({
    where: { id: data.contractId },
    include: { tenant: true },
  });

  if (!contract) {
    throw new Error('Contrato no encontrado');
  }

  const { customerId } = await getOrCreateStripeCustomer(data.tenantId);

  // Crear items de factura
  for (const item of data.items) {
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(item.amount * 100),
      currency: 'eur',
      description: item.description,
      metadata: {
        contractId: data.contractId,
      },
    });
  }

  // Crear factura
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: Math.max(1, Math.ceil((data.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    metadata: {
      contractId: data.contractId,
      tenantId: data.tenantId,
    },
  });

  // Finalizar factura
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

  // Guardar en base de datos
  await prisma.invoice.create({
    data: {
      contractId: data.contractId,
      tenantId: data.tenantId,
      stripeInvoiceId: finalizedInvoice.id,
      amount: data.items.reduce((s, i) => s + i.amount, 0),
      status: 'pending',
      dueDate: data.dueDate,
      items: data.items,
    },
  });

  return {
    invoiceId: finalizedInvoice.id,
    invoiceUrl: finalizedInvoice.hosted_invoice_url || '',
    invoicePdf: finalizedInvoice.invoice_pdf || '',
  };
}

/**
 * Envía recordatorio de factura
 */
export async function sendInvoiceReminder(
  stripeInvoiceId: string
): Promise<boolean> {
  await stripe.invoices.sendInvoice(stripeInvoiceId);
  return true;
}

// ==========================================
// DEVOLUCIONES
// ==========================================

/**
 * Procesa devolución de fianza
 */
export async function processDepositReturn(
  contractId: string,
  amount: number,
  reason: string
): Promise<PaymentResult> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { tenant: true },
  });

  if (!contract) {
    throw new Error('Contrato no encontrado');
  }

  // Buscar el pago original de la fianza
  const depositPayment = await prisma.payment.findFirst({
    where: {
      contractId,
      type: 'deposito',
      status: 'pagado',
    },
  });

  if (!depositPayment?.stripePaymentIntentId) {
    // Si no hay pago en Stripe, crear transferencia manual
    const transfer = await prisma.payment.create({
      data: {
        contractId,
        tenantId: contract.tenantId,
        amount: -amount, // Negativo indica devolución
        currency: 'EUR',
        status: 'pendiente',
        type: 'devolucion_deposito',
        description: `Devolución de fianza: ${reason}`,
        fecha: new Date(),
      },
    });

    return {
      success: true,
      paymentId: transfer.id,
      amount,
      currency: 'eur',
      status: 'pending',
    };
  }

  try {
    // Crear reembolso en Stripe
    const refund = await stripe.refunds.create({
      payment_intent: depositPayment.stripePaymentIntentId,
      amount: Math.round(amount * 100),
      reason: 'requested_by_customer',
      metadata: {
        contractId,
        type: 'deposit_return',
        reason,
      },
    });

    // Registrar en base de datos
    await prisma.payment.create({
      data: {
        contractId,
        tenantId: contract.tenantId,
        amount: -amount,
        currency: 'EUR',
        status: refund.status === 'succeeded' ? 'pagado' : 'pendiente',
        type: 'devolucion_deposito',
        stripeRefundId: refund.id,
        description: `Devolución de fianza: ${reason}`,
        fecha: new Date(),
      },
    });

    return {
      success: refund.status === 'succeeded',
      paymentId: refund.id,
      amount,
      currency: 'eur',
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
    };
  } catch (error: any) {
    return {
      success: false,
      amount,
      currency: 'eur',
      status: 'failed',
      error: error.message,
    };
  }
}

// ==========================================
// WEBHOOKS
// ==========================================

/**
 * Procesa eventos de webhook de Stripe
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoiceFailed(event.data.object as Stripe.Invoice);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
      break;
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const contractId = paymentIntent.metadata.contractId;
  if (!contractId) return;

  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'pagado', paidAt: new Date() },
  });

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { tenant: true },
  });

  if (contract) {
    await sendNotification({
      recipientId: contract.tenantId,
      recipientEmail: contract.tenant.email,
      recipientName: contract.tenant.nombre,
      contractId,
      type: 'payment_due', // Reutilizar como confirmación
      data: {
        rentAmount: paymentIntent.amount / 100,
        status: 'Pagado',
      },
    });
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const contractId = paymentIntent.metadata.contractId;
  if (!contractId) return;

  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'fallido', failureReason: paymentIntent.last_payment_error?.message },
  });

  // Notificar al inquilino y propietario
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { tenant: true },
  });

  if (contract) {
    await sendNotification({
      recipientId: contract.tenantId,
      recipientEmail: contract.tenant.email,
      recipientName: contract.tenant.nombre,
      contractId,
      type: 'payment_overdue',
      data: {
        rentAmount: paymentIntent.amount / 100,
        error: paymentIntent.last_payment_error?.message,
      },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  await prisma.invoice.updateMany({
    where: { stripeInvoiceId: invoice.id },
    data: { status: 'paid', paidAt: new Date() },
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  await prisma.invoice.updateMany({
    where: { stripeInvoiceId: invoice.id },
    data: { status: 'overdue' },
  });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  const contractId = subscription.metadata.contractId;
  if (!contractId) return;

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      stripeSubscriptionId: null,
      autoPaymentEnabled: false,
    },
  });
}

// ==========================================
// UTILIDADES
// ==========================================

async function getOrCreateProduct(
  unitId: string,
  unitName: string
): Promise<string> {
  // Buscar producto existente
  const existingProduct = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { stripeProductId: true },
  });

  if (existingProduct?.stripeProductId) {
    return existingProduct.stripeProductId;
  }

  // Crear nuevo producto
  const product = await stripe.products.create({
    name: `Alquiler: ${unitName}`,
    metadata: { unitId },
  });

  await prisma.unit.update({
    where: { id: unitId },
    data: { stripeProductId: product.id },
  });

  return product.id;
}

export default {
  getOrCreateStripeCustomer,
  addPaymentMethod,
  getPaymentMethods,
  processOneTimePayment,
  setupRecurringPayments,
  cancelRecurringPayments,
  pauseRecurringPayments,
  generateInvoice,
  sendInvoiceReminder,
  processDepositReturn,
  handleStripeWebhook,
};
