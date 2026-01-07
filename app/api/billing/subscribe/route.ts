/**
 * API para suscribirse a planes INMOVA
 * 
 * POST /api/billing/subscribe
 * Crea una sesión de checkout de Stripe para suscribirse a un plan
 * 
 * Body:
 * - planId: ID del plan de suscripción
 * - interval: 'monthly' | 'annual'
 * - addOnIds?: Array de IDs de add-ons a incluir
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const subscribeSchema = z.object({
  planId: z.string().min(1),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
  addOnIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    // Lazy load services
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const stripeService = await import('@/lib/stripe-subscription-service');

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

    // Obtener plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: validated.planId },
    });

    if (!plan || !plan.activo) {
      return NextResponse.json(
        { error: 'Plan no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Sincronizar plan con Stripe si no tiene precio
    let stripePriceId: string | undefined;

    // Buscar precio en Stripe
    const stripeIds = await stripeService.syncPlanToStripe({
      id: plan.id,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precioMensual: plan.precioMensual,
      precioAnual: plan.precioMensual * 10,
      tier: plan.tier,
    });

    if (!stripeIds) {
      return NextResponse.json(
        { error: 'Error sincronizando con Stripe' },
        { status: 500 }
      );
    }

    stripePriceId = validated.interval === 'annual' 
      ? stripeIds.priceIdAnnual || stripeIds.priceIdMonthly
      : stripeIds.priceIdMonthly;

    // Crear o recuperar cliente de Stripe
    const customerId = await stripeService.getOrCreateCustomer({
      email: user.email,
      name: user.name || user.company.nombre,
      companyId: user.company.id,
    });

    if (!customerId) {
      return NextResponse.json(
        { error: 'Error creando cliente en Stripe' },
        { status: 500 }
      );
    }

    // Actualizar empresa con Stripe Customer ID
    if (!user.company.stripeCustomerId) {
      await prisma.company.update({
        where: { id: user.company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Construir URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const successUrl = `${baseUrl}/dashboard/billing?success=true&plan=${plan.tier}`;
    const cancelUrl = `${baseUrl}/dashboard/billing?canceled=true`;

    // Crear sesión de checkout
    const checkoutUrl = await stripeService.createCheckoutSession({
      customerId,
      priceId: stripePriceId,
      successUrl,
      cancelUrl,
      metadata: {
        companyId: user.company.id,
        planId: plan.id,
        userId: user.id,
      },
      trialDays: 14, // 14 días de prueba
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Error creando sesión de checkout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      plan: {
        id: plan.id,
        nombre: plan.nombre,
        precio: validated.interval === 'annual' 
          ? plan.precioMensual * 10 
          : plan.precioMensual,
        interval: validated.interval,
      },
    });
  } catch (error: any) {
    console.error('[Subscribe API Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error procesando suscripción' },
      { status: 500 }
    );
  }
}
