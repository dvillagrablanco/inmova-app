import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { ADDONS_CATALOG } from '../route';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que es admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { addonId, plan } = body; // plan: 'mensual' o 'anual'

    if (!addonId || !plan) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const addon = ADDONS_CATALOG.find(a => a.id === addonId);
    if (!addon) {
      return NextResponse.json({ error: 'Add-on no encontrado' }, { status: 404 });
    }

    // Verificar si Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      // Modo demo sin Stripe
      return NextResponse.json({
        success: true,
        mode: 'demo',
        message: 'Stripe no configurado - activando en modo demo',
        addon: addon,
      });
    }

    // Obtener o crear customer de Stripe
    let stripeCustomerId: string;
    try {
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { stripeCustomerId: true, name: true },
      });

      if (company?.stripeCustomerId) {
        stripeCustomerId = company.stripeCustomerId;
      } else {
        // Crear customer en Stripe
        const customer = await stripe.customers.create({
          email: session.user.email || undefined,
          name: company?.name || `Company ${session.user.companyId}`,
          metadata: {
            companyId: session.user.companyId,
            userId: session.user.id,
          },
        });
        stripeCustomerId = customer.id;

        // Guardar el customer ID
        await prisma.company.update({
          where: { id: session.user.companyId },
          data: { stripeCustomerId },
        });
      }
    } catch (dbError: any) {
      console.warn('[Checkout] Error obteniendo customer:', dbError.message);
      // Si no existe el campo, crear customer sin guardar
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: {
          companyId: session.user.companyId,
          userId: session.user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Determinar el precio según el plan
    const precio = plan === 'anual' ? addon.precioAnual : addon.precioMensual;
    const priceId = plan === 'anual' ? addon.stripePriceIdAnual : addon.stripePriceIdMensual;

    // Crear sesión de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: addon.nombre,
              description: addon.descripcion,
              metadata: {
                addonId: addon.id,
              },
            },
            unit_amount: precio * 100, // Stripe usa centavos
            recurring: {
              interval: plan === 'anual' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/admin/addons?success=true&addon=${addonId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/admin/addons?canceled=true`,
      metadata: {
        addonId: addon.id,
        companyId: session.user.companyId,
        userId: session.user.id,
        plan,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('[Checkout] Error:', error);
    
    // Si es error de Stripe, dar más info
    if (error.type?.startsWith('Stripe')) {
      return NextResponse.json({ 
        error: 'Error con Stripe',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 });
  }
}

// Endpoint para verificar estado de suscripciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        mode: 'demo',
        subscriptions: [],
        message: 'Stripe no configurado',
      });
    }

    // Obtener customer de Stripe
    try {
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { stripeCustomerId: true },
      });

      if (!company?.stripeCustomerId) {
        return NextResponse.json({ subscriptions: [] });
      }

      // Obtener suscripciones activas
      const subscriptions = await stripe.subscriptions.list({
        customer: company.stripeCustomerId,
        status: 'active',
      });

      const suscripcionesFormateadas = subscriptions.data.map(sub => ({
        id: sub.id,
        addonId: sub.metadata?.addonId,
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        plan: sub.items.data[0]?.price?.recurring?.interval || 'month',
        precio: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
      }));

      return NextResponse.json({ subscriptions: suscripcionesFormateadas });
    } catch (dbError) {
      return NextResponse.json({ subscriptions: [] });
    }
  } catch (error: any) {
    console.error('[Checkout GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
  }
}
