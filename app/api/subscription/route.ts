/**
 * API de Gestión de Suscripción
 * 
 * GET /api/subscription - Obtener suscripción actual
 * PUT /api/subscription - Cambiar de plan
 * DELETE /api/subscription - Cancelar suscripción
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Obtener información de la suscripción actual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Obtener usuario con empresa y plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: {
            subscriptionPlan: true,
            addOns: {
              include: { addOn: true },
              where: { activo: true },
            },
          },
        },
      },
    });

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Usuario no tiene empresa asociada' },
        { status: 400 }
      );
    }

    // Calcular uso actual
    const [propiedadesCount, usuariosCount, inquilinosCount] = await Promise.all([
      prisma.building.count({ where: { companyId: user.company.id } }),
      prisma.user.count({ where: { companyId: user.company.id } }),
      prisma.tenant.count({ where: { companyId: user.company.id } }),
    ]);

    const plan = user.company.subscriptionPlan;

    return NextResponse.json({
      success: true,
      subscription: {
        plan: plan ? {
          id: plan.id,
          nombre: plan.nombre,
          tier: plan.tier,
          precioMensual: plan.precioMensual,
          maxUsuarios: plan.maxUsuarios,
          maxPropiedades: plan.maxPropiedades,
          signaturesIncludedMonth: plan.signaturesIncludedMonth,
          storageIncludedGB: plan.storageIncludedGB,
          aiTokensIncludedMonth: plan.aiTokensIncludedMonth,
        } : null,
        estado: user.company.estadoCliente,
        stripeCustomerId: user.company.stripeCustomerId,
      },
      usage: {
        propiedades: {
          used: propiedadesCount,
          limit: user.company.maxPropiedades || plan?.maxPropiedades || 0,
        },
        usuarios: {
          used: usuariosCount,
          limit: user.company.maxUsuarios || plan?.maxUsuarios || 0,
        },
        inquilinos: {
          used: inquilinosCount,
          limit: null, // Según plan
        },
      },
      addons: user.company.addOns.map(ca => ({
        id: ca.id,
        addOnId: ca.addOn.id,
        codigo: ca.addOn.codigo,
        nombre: ca.addOn.nombre,
        categoria: ca.addOn.categoria,
        fechaActivacion: ca.fechaActivacion,
        usoAcumulado: ca.usoAcumulado,
      })),
    });
  } catch (error: any) {
    logger.error('[Subscription API] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo suscripción' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Cambiar de plan
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      planId: z.string().min(1),
      interval: z.enum(['monthly', 'annual']).default('monthly'),
    });
    const validated = schema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const stripeService = await import('@/lib/stripe-subscription-service');

    // Obtener usuario y empresa
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: { subscriptionPlan: true },
        },
      },
    });

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Usuario no tiene empresa asociada' },
        { status: 400 }
      );
    }

    // Obtener nuevo plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: validated.planId },
    });

    if (!newPlan || !newPlan.activo) {
      return NextResponse.json(
        { error: 'Plan no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Si ya tiene el mismo plan
    if (user.company.subscriptionPlanId === newPlan.id) {
      return NextResponse.json(
        { error: 'Ya tienes este plan' },
        { status: 400 }
      );
    }

    // Sincronizar plan con Stripe
    const stripeIds = await stripeService.syncPlanToStripe({
      id: newPlan.id,
      nombre: newPlan.nombre,
      descripcion: newPlan.descripcion,
      precioMensual: newPlan.precioMensual,
      precioAnual: newPlan.precioMensual * 10,
      tier: newPlan.tier,
    });

    if (!stripeIds) {
      return NextResponse.json(
        { error: 'Error sincronizando con Stripe' },
        { status: 500 }
      );
    }

    const stripePriceId = validated.interval === 'annual'
      ? stripeIds.priceIdAnnual || stripeIds.priceIdMonthly
      : stripeIds.priceIdMonthly;

    // Crear o recuperar cliente
    let customerId = user.company.stripeCustomerId;

    if (!customerId) {
      customerId = await stripeService.getOrCreateCustomer({
        email: user.email,
        name: user.name || user.company.nombre,
        companyId: user.company.id,
      });

      if (customerId) {
        await prisma.company.update({
          where: { id: user.company.id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Error creando cliente en Stripe' },
        { status: 500 }
      );
    }

    // Crear sesión de checkout para cambio de plan
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const successUrl = `${baseUrl}/facturacion?plan_changed=true&plan=${newPlan.tier}`;
    const cancelUrl = `${baseUrl}/facturacion?plan_change_canceled=true`;

    const checkoutUrl = await stripeService.createCheckoutSession({
      customerId,
      priceId: stripePriceId,
      successUrl,
      cancelUrl,
      metadata: {
        companyId: user.company.id,
        planId: newPlan.id,
        userId: user.id,
        action: 'change_plan',
        previousPlanId: user.company.subscriptionPlanId || '',
      },
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Error creando sesión de checkout' },
        { status: 500 }
      );
    }

    // Registrar intento de cambio
    await prisma.subscriptionChange.create({
      data: {
        companyId: user.company.id,
        accion: 'cambio_pendiente',
        planAnteriorId: user.company.subscriptionPlanId,
        planNuevoId: newPlan.id,
        detalles: {
          initiatedAt: new Date().toISOString(),
          interval: validated.interval,
        },
      },
    });

    logger.info(`[Subscription] Cambio de plan iniciado para empresa ${user.company.id}: ${newPlan.nombre}`);

    return NextResponse.json({
      success: true,
      checkoutUrl,
      newPlan: {
        id: newPlan.id,
        nombre: newPlan.nombre,
        tier: newPlan.tier,
        precio: validated.interval === 'annual'
          ? newPlan.precioMensual * 10
          : newPlan.precioMensual,
        interval: validated.interval,
      },
    });
  } catch (error: any) {
    logger.error('[Subscription API] Error cambiando plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error procesando cambio de plan' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Cancelar suscripción
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const immediately = searchParams.get('immediately') === 'true';

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const stripeService = await import('@/lib/stripe-subscription-service');

    // Obtener usuario y empresa
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: { subscriptionPlan: true },
        },
      },
    });

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Usuario no tiene empresa asociada' },
        { status: 400 }
      );
    }

    if (!user.company.subscriptionPlanId) {
      return NextResponse.json(
        { error: 'No tienes una suscripción activa' },
        { status: 400 }
      );
    }

    // TODO: Buscar y cancelar suscripción en Stripe si existe
    // const stripeSubscription = await findStripeSubscription(user.company.stripeCustomerId);
    // if (stripeSubscription) {
    //   await stripeService.cancelSubscription(stripeSubscription.id, immediately);
    // }

    // Registrar cancelación
    await prisma.subscriptionChange.create({
      data: {
        companyId: user.company.id,
        accion: 'cancelacion',
        planAnteriorId: user.company.subscriptionPlanId,
        detalles: {
          canceledAt: new Date().toISOString(),
          immediately,
          canceledBy: user.id,
        },
      },
    });

    // Si es cancelación inmediata, actualizar empresa
    if (immediately) {
      await prisma.company.update({
        where: { id: user.company.id },
        data: {
          subscriptionPlanId: null,
          estadoCliente: 'suspendido',
        },
      });
    } else {
      // Marcar para cancelación al final del período
      await prisma.company.update({
        where: { id: user.company.id },
        data: {
          estadoCliente: 'cancelacion_pendiente',
        },
      });
    }

    logger.info(`[Subscription] Suscripción cancelada para empresa ${user.company.id} (inmediata: ${immediately})`);

    return NextResponse.json({
      success: true,
      message: immediately
        ? 'Suscripción cancelada inmediatamente'
        : 'Suscripción programada para cancelación al final del período de facturación',
    });
  } catch (error: any) {
    logger.error('[Subscription API] Error cancelando:', error);
    return NextResponse.json(
      { error: 'Error cancelando suscripción' },
      { status: 500 }
    );
  }
}
