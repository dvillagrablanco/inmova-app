/**
 * API para pagar una factura B2B
 * POST /api/b2b-billing/invoices/[id]/pay
 * 
 * Crea un PaymentIntent de Stripe para pagar la factura
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Stripe] STRIPE_SECRET_KEY no definida');
    return null;
  }

  try {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
    return stripeInstance;
  } catch (error) {
    console.error('[Stripe] Error inicializando:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Obtener usuario y empresa
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    });

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Usuario no tiene empresa asociada' },
        { status: 400 }
      );
    }

    // Obtener factura
    const invoice = await prisma.b2BInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la factura pertenece a la empresa del usuario
    // (o es super_admin)
    if (user.role !== 'super_admin' && invoice.companyId !== user.company.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para pagar esta factura' },
        { status: 403 }
      );
    }

    // Verificar estado de la factura
    if (invoice.estado === 'PAGADA') {
      return NextResponse.json(
        { error: 'Esta factura ya está pagada' },
        { status: 400 }
      );
    }

    if (invoice.estado === 'CANCELADA') {
      return NextResponse.json(
        { error: 'Esta factura está cancelada' },
        { status: 400 }
      );
    }

    // Inicializar Stripe
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no está configurado' },
        { status: 503 }
      );
    }

    // Crear o recuperar cliente de Stripe
    let stripeCustomerId = invoice.company.stripeCustomerId;

    if (!stripeCustomerId) {
      // Crear cliente en Stripe
      const customer = await stripe.customers.create({
        email: invoice.company.emailContacto || invoice.company.email || undefined,
        name: invoice.company.nombre,
        metadata: {
          companyId: invoice.company.id,
        },
      });

      stripeCustomerId = customer.id;

      // Actualizar empresa con Stripe Customer ID
      await prisma.company.update({
        where: { id: invoice.company.id },
        data: { stripeCustomerId },
      });
    }

    // Crear PaymentIntent
    const amountInCents = Math.round(invoice.total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      customer: stripeCustomerId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.numeroFactura,
        companyId: invoice.companyId,
        type: 'b2b_invoice',
      },
      description: `Factura ${invoice.numeroFactura} - ${invoice.company.nombre}`,
      receipt_email: invoice.company.emailContacto || invoice.company.email || undefined,
    });

    // Actualizar factura con PaymentIntent ID
    await prisma.b2BInvoice.update({
      where: { id: invoiceId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    logger.info(`[B2B Billing] PaymentIntent creado para factura ${invoice.numeroFactura}: ${paymentIntent.id}`);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: invoice.total,
      currency: 'eur',
      invoice: {
        id: invoice.id,
        numeroFactura: invoice.numeroFactura,
        total: invoice.total,
      },
    });
  } catch (error: any) {
    logger.error('[B2B Billing] Error creando PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Error procesando pago', details: error.message },
      { status: 500 }
    );
  }
}
