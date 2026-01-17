/**
 * API: Compra de Add-ons
 * Integración con Stripe para procesar pagos de módulos adicionales
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (!['administrador', 'super_admin', 'propietario'].includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para comprar add-ons' }, { status: 403 });
    }

    const { addOnCodigo, precio } = await request.json();

    if (!addOnCodigo || precio === undefined) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // En producción: crear sesión de Stripe Checkout
    // Por ahora simulamos la compra exitosa para desarrollo
    
    const stripeEnabled = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_...';

    if (stripeEnabled && precio > 0) {
      // Integración real con Stripe
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-12-18.acacia',
        });

        const checkoutSession = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `Add-on: ${addOnCodigo}`,
                  description: `Módulo adicional para tu plan INMOVA`,
                },
                recurring: {
                  interval: 'month',
                },
                unit_amount: Math.round(precio * 100), // Stripe usa centavos
              },
              quantity: 1,
            },
          ],
          success_url: `${process.env.NEXTAUTH_URL}/empresa/modulos?purchase=success&addon=${addOnCodigo}`,
          cancel_url: `${process.env.NEXTAUTH_URL}/empresa/modulos?purchase=cancelled`,
          customer_email: session.user.email || undefined,
          metadata: {
            addOnCodigo,
            userId: (session.user as any).id,
            companyId: (session.user as any).companyId,
          },
        });

        return NextResponse.json({
          success: true,
          requiresPayment: true,
          checkoutUrl: checkoutSession.url,
        });
      } catch (stripeError: any) {
        console.error('[Stripe Error]:', stripeError);
        return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
      }
    }

    // Modo desarrollo o add-on gratuito
    // Simular compra exitosa
    return NextResponse.json({
      success: true,
      requiresPayment: false,
      message: 'Add-on activado correctamente (modo desarrollo)',
    });
  } catch (error: any) {
    console.error('[API Error] /api/addons/purchase:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
