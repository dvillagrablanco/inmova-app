/**
 * API para gestionar add-ons de una empresa
 * 
 * GET /api/billing/addons - Lista add-ons disponibles y contratados
 * POST /api/billing/addons - Comprar un add-on
 * DELETE /api/billing/addons - Cancelar un add-on
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Lista add-ons disponibles y los contratados por la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener empresa del usuario
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

    // Obtener plan actual para filtrar add-ons disponibles
    const planTier = user.company.subscriptionPlan?.tier || 'STARTER';

    // Obtener todos los add-ons disponibles para el plan
    const availableAddons = await prisma.addOn.findMany({
      where: { activo: true },
      orderBy: [{ destacado: 'desc' }, { orden: 'asc' }],
    });

    // Filtrar por disponibilidad para el plan
    const filteredAddons = availableAddons.filter((addon: any) => {
      const disponiblePara = addon.disponiblePara as string[];
      const incluidoEn = (addon.incluidoEn as string[]) || [];
      return disponiblePara.includes(planTier) || incluidoEn.includes(planTier);
    });

    // IDs de add-ons ya contratados
    const contratadosIds = user.company.addOns.map((ca: any) => ca.addOnId);

    // Formatear respuesta
    const addons = filteredAddons.map((addon: any) => {
      const incluidoEn = (addon.incluidoEn as string[]) || [];
      const isIncluded = incluidoEn.includes(planTier);
      const isContratado = contratadosIds.includes(addon.id);

      return {
        id: addon.id,
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        categoria: addon.categoria,
        precio: {
          mensual: addon.precioMensual,
          anual: addon.precioAnual,
        },
        unidades: addon.unidades,
        tipoUnidad: addon.tipoUnidad,
        destacado: addon.destacado,
        estado: isIncluded ? 'incluido' : isContratado ? 'contratado' : 'disponible',
        stripePriceId: addon.stripePriceIdMonthly,
      };
    });

    return NextResponse.json({
      success: true,
      plan: {
        id: user.company.subscriptionPlan?.id,
        nombre: user.company.subscriptionPlan?.nombre,
        tier: planTier,
      },
      addons,
      contratados: user.company.addOns.map((ca: any) => ({
        id: ca.id,
        addOnId: ca.addOnId,
        nombre: ca.addOn.nombre,
        fechaActivacion: ca.fechaActivacion,
        usoAcumulado: ca.usoAcumulado,
      })),
    });
  } catch (error: any) {
    logger.error('[Billing Addons GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo add-ons' },
      { status: 500 }
    );
  }
}

/**
 * POST: Comprar un add-on
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      addOnId: z.string().min(1),
      interval: z.enum(['monthly', 'annual']).default('monthly'),
    });
    const validated = schema.parse(body);
    const stripeService = null as any;

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

    // Verificar que no tiene ya el add-on
    const existingAddOn = await prisma.companyAddOn.findFirst({
      where: {
        companyId: user.company.id,
        addOnId: validated.addOnId,
        activo: true,
      },
    });

    if (existingAddOn) {
      return NextResponse.json(
        { error: 'Ya tienes este add-on contratado' },
        { status: 400 }
      );
    }

    // Obtener add-on
    const addon = await prisma.addOn.findUnique({
      where: { id: validated.addOnId },
    });

    if (!addon || !addon.activo) {
      return NextResponse.json(
        { error: 'Add-on no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Sincronizar add-on con Stripe
    const stripeIds = await stripeService.syncAddOnToStripe({
      id: addon.id,
      codigo: addon.codigo,
      nombre: addon.nombre,
      descripcion: addon.descripcion,
      precioMensual: addon.precioMensual,
      precioAnual: addon.precioAnual || undefined,
      categoria: addon.categoria,
    });

    if (!stripeIds) {
      return NextResponse.json(
        { error: 'Error sincronizando con Stripe' },
        { status: 500 }
      );
    }

    // Actualizar add-on con IDs de Stripe
    await prisma.addOn.update({
      where: { id: addon.id },
      data: {
        stripePriceIdMonthly: stripeIds.priceIdMonthly,
        stripePriceIdAnnual: stripeIds.priceIdAnnual,
      },
    });

    const stripePriceId = validated.interval === 'annual'
      ? stripeIds.priceIdAnnual || stripeIds.priceIdMonthly
      : stripeIds.priceIdMonthly;

    // Crear o recuperar cliente de Stripe
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

    // Construir URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const successUrl = `${baseUrl}/dashboard/billing?addon_success=true&addon=${addon.codigo}`;
    const cancelUrl = `${baseUrl}/dashboard/billing?addon_canceled=true`;

    // Crear sesión de checkout
    const checkoutUrl = await stripeService.createCheckoutSession({
      customerId,
      priceId: stripePriceId,
      successUrl,
      cancelUrl,
      metadata: {
        companyId: user.company.id,
        addOnId: addon.id,
        userId: user.id,
        type: 'addon',
      },
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
      addon: {
        id: addon.id,
        nombre: addon.nombre,
        precio: validated.interval === 'annual'
          ? addon.precioAnual || addon.precioMensual * 10
          : addon.precioMensual,
        interval: validated.interval,
      },
    });
  } catch (error: any) {
    logger.error('[Billing Addons POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error procesando compra de add-on' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Cancelar un add-on
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addOnId = searchParams.get('addOnId');

    if (!addOnId) {
      return NextResponse.json(
        { error: 'addOnId requerido' },
        { status: 400 }
      );
    }
    const stripeService = null as any;

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

    // Buscar add-on contratado
    const companyAddOn = await prisma.companyAddOn.findFirst({
      where: {
        companyId: user.company.id,
        addOnId,
        activo: true,
      },
    });

    if (!companyAddOn) {
      return NextResponse.json(
        { error: 'Add-on no encontrado o ya cancelado' },
        { status: 404 }
      );
    }

    // Cancelar en Stripe si tiene suscripción
    if (companyAddOn.stripeSubscriptionId) {
      await stripeService.cancelSubscription(companyAddOn.stripeSubscriptionId, false);
    }

    // Marcar como inactivo en BD
    await prisma.companyAddOn.update({
      where: { id: companyAddOn.id },
      data: {
        activo: false,
        fechaCancelacion: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Add-on cancelado. Se mantendrá activo hasta fin del período de facturación.',
    });
  } catch (error: any) {
    logger.error('[Billing Addons DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Error cancelando add-on' },
      { status: 500 }
    );
  }
}
