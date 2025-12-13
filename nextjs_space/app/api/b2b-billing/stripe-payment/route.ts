/**
 * API de integración con Stripe para pagos B2B
 * Crea payment intents y procesa pagos de facturas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { registerInvoicePayment } from '@/lib/b2b-billing-service';
import Stripe from 'stripe';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

/**
 * POST: Crear Payment Intent para una factura
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, returnUrl } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID requerido' },
        { status: 400 }
      );
    }

    // Obtener factura
    const invoice = await prisma.b2BInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.role !== 'super_admin' && invoice.companyId !== user?.companyId) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    // Verificar que la factura está pendiente
    if (invoice.estado === 'PAGADA') {
      return NextResponse.json(
        { error: 'La factura ya ha sido pagada' },
        { status: 400 }
      );
    }

    // Crear o recuperar Stripe Customer
    let stripeCustomerId = invoice.company.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: invoice.company.nombre,
        email: invoice.company.email || undefined,
        metadata: {
          companyId: invoice.company.id,
        },
      });

      stripeCustomerId = customer.id;

      // Guardar el customer ID en la empresa
      await prisma.company.update({
        where: { id: invoice.company.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.total * 100), // Convertir a centavos
      currency: 'eur',
      customer: stripeCustomerId,
      description: `Pago de factura ${invoice.numeroFactura}`,
      metadata: {
        invoiceId: invoice.id,
        companyId: invoice.companyId,
        numeroFactura: invoice.numeroFactura,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Actualizar factura con el payment intent ID
    await prisma.b2BInvoice.update({
      where: { id: invoice.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    logger.error('Error al crear payment intent:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT: Confirmar pago exitoso (webhook o manual)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID requerido' },
        { status: 400 }
      );
    }

    // Buscar factura por payment intent ID
    const invoice = await prisma.b2BInvoice.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar el estado del payment intent en Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });

    if (paymentIntent.status === 'succeeded') {
      // Registrar el pago
      const charge = paymentIntent.latest_charge as Stripe.Charge | null;
      const stripeFee = charge?.balance_transaction 
        ? (await stripe.balanceTransactions.retrieve(
            charge.balance_transaction as string
          )).fee / 100
        : 0;

      await registerInvoicePayment(invoice.id, {
        monto: invoice.total,
        metodoPago: 'stripe',
        stripePaymentId: paymentIntent.id,
        stripeChargeId: charge?.id,
        stripeFee,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Pago registrado correctamente' 
      });
    }

    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
      message: 'El pago no ha sido completado',
    });
  } catch (error: any) {
    logger.error('Error al confirmar pago:', error);
    return NextResponse.json(
      { error: 'Error al confirmar el pago', details: error.message },
      { status: 500 }
    );
  }
}
