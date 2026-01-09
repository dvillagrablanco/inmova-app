/**
 * API: Aplicar cupón de descuento
 * 
 * POST /api/coupons/apply
 * Body: { codigo: string, subscriptionId?: string, checkoutSessionId?: string }
 * 
 * Aplica un cupón validado a una suscripción o sesión de checkout de Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { applyCouponToSubscription, validateStripeCoupon } from '@/lib/stripe-coupon-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const applySchema = z.object({
  codigo: z.string().min(1).max(50),
  subscriptionId: z.string().optional(),
  checkoutSessionId: z.string().optional(),
});

// Singleton de Stripe
let stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripe;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { codigo, subscriptionId, checkoutSessionId } = applySchema.parse(body);

    // 1. Validar cupón primero
    const dbCoupon = await prisma.discountCoupon.findFirst({
      where: {
        codigo: codigo.toUpperCase(),
        activo: true,
        estado: 'activo',
        fechaExpiracion: { gte: new Date() },
      },
    });

    if (!dbCoupon) {
      return NextResponse.json(
        { success: false, error: 'Cupón no válido o expirado' },
        { status: 400 }
      );
    }

    // 2. Verificar usos máximos
    if (dbCoupon.usosMaximos && dbCoupon.usosActuales >= dbCoupon.usosMaximos) {
      return NextResponse.json(
        { success: false, error: 'Cupón agotado' },
        { status: 400 }
      );
    }

    // 3. Verificar usos por usuario
    const userUsages = await prisma.couponUsage.count({
      where: {
        couponId: dbCoupon.id,
        usuarioId: session.user.id,
      },
    });

    if (userUsages >= dbCoupon.usosPorUsuario) {
      return NextResponse.json(
        { success: false, error: 'Ya has usado este cupón el máximo permitido' },
        { status: 400 }
      );
    }

    const stripeClient = getStripe();

    // 4. Aplicar a suscripción existente
    if (subscriptionId && stripeClient) {
      if (!dbCoupon.stripeCouponId) {
        return NextResponse.json(
          { success: false, error: 'Cupón no sincronizado con Stripe' },
          { status: 400 }
        );
      }

      try {
        const subscription = await stripeClient.subscriptions.update(subscriptionId, {
          coupon: dbCoupon.stripeCouponId,
        });

        // Registrar uso
        await prisma.couponUsage.create({
          data: {
            couponId: dbCoupon.id,
            usuarioId: session.user.id,
            montoOriginal: 0, // Se actualiza después
            montoDescuento: 0,
            montoFinal: 0,
          },
        });

        // Incrementar contador
        await prisma.discountCoupon.update({
          where: { id: dbCoupon.id },
          data: { usosActuales: { increment: 1 } },
        });

        return NextResponse.json({
          success: true,
          message: 'Cupón aplicado a la suscripción',
          subscription: {
            id: subscription.id,
            status: subscription.status,
            discount: subscription.discount,
          },
        });
      } catch (stripeError: any) {
        return NextResponse.json(
          { success: false, error: stripeError.message },
          { status: 400 }
        );
      }
    }

    // 5. Retornar datos del cupón para uso en checkout
    // (El cupón se aplicará cuando se cree la sesión de checkout)
    return NextResponse.json({
      success: true,
      message: 'Cupón validado, listo para aplicar en checkout',
      coupon: {
        id: dbCoupon.id,
        codigo: dbCoupon.codigo,
        tipo: dbCoupon.tipo,
        valor: dbCoupon.valor,
        descripcion: dbCoupon.descripcion,
        stripeCouponId: dbCoupon.stripeCouponId,
        stripePromotionCodeId: dbCoupon.stripePromotionCodeId,
      },
      aplicar: {
        // Instrucciones para aplicar en checkout de Stripe
        tipo: 'stripe_checkout',
        parametro: dbCoupon.stripePromotionCodeId 
          ? { promotion_code: dbCoupon.stripePromotionCodeId }
          : dbCoupon.stripeCouponId 
            ? { discounts: [{ coupon: dbCoupon.stripeCouponId }] }
            : null,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[API Apply Coupon] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error aplicando cupón' },
      { status: 500 }
    );
  }
}
