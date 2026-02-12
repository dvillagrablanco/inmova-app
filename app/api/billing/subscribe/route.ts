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

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const subscribeSchema = z.object({
  planId: z.string().min(1),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
  addOnIds: z.array(z.string()).optional(),
  couponCode: z.string().optional(), // Código de cupón promocional
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

    // ════════════════════════════════════════════════════════════════
    // VALIDACIÓN DE CUPÓN PROMOCIONAL
    // ════════════════════════════════════════════════════════════════
    let promoCoupon = null;
    let discountInfo = null;

    if (validated.couponCode) {
      promoCoupon = await prisma.promoCoupon.findUnique({
        where: { codigo: validated.couponCode.toUpperCase() },
        include: {
          _count: { select: { usos: true } },
          usos: {
            where: { companyId: user.company.id },
          },
        },
      });

      if (!promoCoupon) {
        return NextResponse.json(
          { error: 'Cupón no encontrado' },
          { status: 400 }
        );
      }

      // Verificar estado del cupón
      if (promoCoupon.estado !== 'ACTIVE' || !promoCoupon.activo) {
        return NextResponse.json(
          { error: 'Este cupón no está activo' },
          { status: 400 }
        );
      }

      // Verificar expiración
      if (new Date(promoCoupon.fechaExpiracion) < new Date()) {
        return NextResponse.json(
          { error: 'Este cupón ha expirado' },
          { status: 400 }
        );
      }

      // Verificar si no ha empezado
      if (new Date(promoCoupon.fechaInicio) > new Date()) {
        return NextResponse.json(
          { error: 'Este cupón aún no está disponible' },
          { status: 400 }
        );
      }

      // Verificar límite de usos totales
      if (promoCoupon.usosMaximos && promoCoupon._count.usos >= promoCoupon.usosMaximos) {
        return NextResponse.json(
          { error: 'Este cupón ha alcanzado su límite de usos' },
          { status: 400 }
        );
      }

      // Verificar usos por usuario
      if (promoCoupon.usos.length >= promoCoupon.usosPorUsuario) {
        return NextResponse.json(
          { error: 'Ya has utilizado este cupón' },
          { status: 400 }
        );
      }

      // Verificar plan permitido
      if (promoCoupon.planesPermitidos.length > 0) {
        if (!promoCoupon.planesPermitidos.includes(plan.tier)) {
          return NextResponse.json(
            { error: `Este cupón no es válido para el plan ${plan.nombre}. Planes válidos: ${promoCoupon.planesPermitidos.join(', ')}` },
            { status: 400 }
          );
        }
      }

      // Calcular descuento
      let descuentoMensual = 0;
      let ahorroTotal = 0;

      switch (promoCoupon.tipo) {
        case 'PERCENTAGE':
          descuentoMensual = (plan.precioMensual * promoCoupon.valor) / 100;
          ahorroTotal = descuentoMensual * promoCoupon.duracionMeses;
          break;
        case 'FIXED_AMOUNT':
          descuentoMensual = promoCoupon.valor;
          ahorroTotal = descuentoMensual * promoCoupon.duracionMeses;
          break;
        case 'FREE_MONTHS':
          descuentoMensual = plan.precioMensual;
          ahorroTotal = plan.precioMensual * promoCoupon.valor; // valor = meses gratis
          break;
        case 'TRIAL_EXTENSION':
          // Se maneja como días de prueba adicionales
          break;
      }

      discountInfo = {
        codigo: promoCoupon.codigo,
        tipo: promoCoupon.tipo,
        valor: promoCoupon.valor,
        descuentoMensual: Math.round(descuentoMensual * 100) / 100,
        ahorroTotal: Math.round(ahorroTotal * 100) / 100,
        duracionMeses: promoCoupon.duracionMeses,
        precioConDescuento: Math.round((plan.precioMensual - descuentoMensual) * 100) / 100,
      };

      console.log(`[Subscribe] Cupón ${promoCoupon.codigo} aplicado:`, discountInfo);
    }

    // ════════════════════════════════════════════════════════════════
    // SINCRONIZACIÓN CON STRIPE
    // ════════════════════════════════════════════════════════════════

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
    const successUrl = `${baseUrl}/dashboard/billing?success=true&plan=${plan.tier}${promoCoupon ? `&coupon=${promoCoupon.codigo}` : ''}`;
    const cancelUrl = `${baseUrl}/dashboard/billing?canceled=true`;

    // Determinar días de prueba
    let trialDays = 14; // Default
    if (promoCoupon?.tipo === 'TRIAL_EXTENSION') {
      trialDays = 14 + promoCoupon.valor; // Añadir días extras de prueba
    } else if (promoCoupon?.tipo === 'FREE_MONTHS') {
      trialDays = 14 + (promoCoupon.valor * 30); // Convertir meses gratis a días de prueba
    }

    // Crear sesión de checkout con cupón de Stripe si existe
    const checkoutOptions: any = {
      customerId,
      priceId: stripePriceId,
      successUrl,
      cancelUrl,
      metadata: {
        companyId: user.company.id,
        planId: plan.id,
        userId: user.id,
        promoCouponCode: promoCoupon?.codigo || null,
        promoCouponId: promoCoupon?.id || null,
      },
      trialDays,
    };

    // Si hay cupón de descuento porcentual, crear cupón en Stripe
    if (promoCoupon && promoCoupon.tipo === 'PERCENTAGE' && promoCoupon.stripeCouponId) {
      checkoutOptions.stripeCouponId = promoCoupon.stripeCouponId;
    }

    const checkoutUrl = await stripeService.createCheckoutSession(checkoutOptions);

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Error creando sesión de checkout' },
        { status: 500 }
      );
    }

    // ════════════════════════════════════════════════════════════════
    // REGISTRAR USO DEL CUPÓN (pendiente de confirmación de pago)
    // ════════════════════════════════════════════════════════════════
    // El uso final se registra en el webhook de Stripe cuando el pago se confirma

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
      discount: discountInfo,
    });
  } catch (error: any) {
    logger.error('[Subscribe API Error]:', error);

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
