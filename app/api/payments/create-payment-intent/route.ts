/**
 * API Route: Crear Payment Intent de Stripe
 * POST /api/payments/create-payment-intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe-config';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

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
  const prisma = await getPrisma();
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

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId es requerido' },
        { status: 400 }
      );
    }

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

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    const now = new Date();
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fechaVencimiento = new Date(now);
    fechaVencimiento.setDate(now.getDate() + 7);

    // 4. Guardar en BD
    const payment = await prisma.payment.create({
      data: {
        contractId: contract.id,
        periodo,
        monto: amount / 100, // Guardar en euros
        fechaVencimiento,
        estado: 'pendiente',
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: 'pending',
        stripeClientSecret: paymentIntent.client_secret || undefined,
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
    logger.error('[Create Payment Intent Error]:', error);
    
    return NextResponse.json(
      {
        error: 'Error creando payment intent',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
