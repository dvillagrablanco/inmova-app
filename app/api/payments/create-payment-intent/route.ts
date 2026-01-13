/**
 * API Route: Crear Payment Intent de Stripe
 * POST /api/payments/create-payment-intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe-config';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validación
const paymentSchema = z.object({
  amount: z.number().positive().min(50), // Mínimo 0.50€
  currency: z.string().default('eur'),
  description: z.string().optional(),
  contractId: z.string().optional(),
  propertyId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Parsear y validar body
    const body = await req.json();
    const validation = paymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error },
        { status: 400 }
      );
    }

    const { amount, currency, description, contractId, propertyId, metadata } = validation.data;

    // 3. Obtener cliente Stripe
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no está configurado' },
        { status: 503 }
      );
    }

    // 4. Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe espera centavos
      currency,
      description: description || 'Pago de alquiler',
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email,
        companyId: session.user.companyId || '',
        contractId: contractId || '',
        propertyId: propertyId || '',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 4. Guardar en BD
    const payment = await prisma.payment.create({
      data: {
        amount: amount / 100, // Guardar en euros
        currency,
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
        userId: session.user.id,
        contractId: contractId,
        description: description || 'Pago de alquiler',
      },
    });

    // 5. Respuesta
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      amount,
      currency,
    });

  } catch (error: any) {
    console.error('[Create Payment Intent Error]:', error);
    
    return NextResponse.json(
      {
        error: 'Error creando payment intent',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
