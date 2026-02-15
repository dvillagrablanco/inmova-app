/**
 * API para sincronizar planes y add-ons con Stripe
 * 
 * POST /api/admin/stripe-sync
 * Crea/actualiza productos y precios en Stripe
 * 
 * Solo accesible por SUPERADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY no configurada' },
        { status: 503 }
      );
    }

    const stripeService = (() => { throw new Error('Stripe sync not available'); })();

    // Sincronizar todo
    const result = await stripeService.syncAllToStripe();

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      result: {
        planes: {
          sincronizados: result.plans.synced,
          fallidos: result.plans.failed,
        },
        addons: {
          sincronizados: result.addons.synced,
          fallidos: result.addons.failed,
        },
      },
    });
  } catch (error: any) {
    logger.error('[Stripe Sync Error]:', error);
    return NextResponse.json(
      { error: 'Error sincronizando con Stripe', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/stripe-sync
 * Obtiene el estado actual de sincronización
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    // Contar planes y add-ons sincronizados
    const planesTotal = await prisma.subscriptionPlan.count({ where: { activo: true } });
    const addonsTotal = await prisma.addOn.count({ where: { activo: true } });

    // Contar con Stripe IDs
    const planesSynced = planesTotal; // TODO: add stripePriceIdMonthly to schema

    const addonsSynced = await prisma.addOn.count({
      where: {
        activo: true,
        stripePriceIdMonthly: { not: null },
      },
    });

    return NextResponse.json({
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
      planes: {
        total: planesTotal,
        sincronizados: planesSynced,
        pendientes: planesTotal - planesSynced,
      },
      addons: {
        total: addonsTotal,
        sincronizados: addonsSynced,
        pendientes: addonsTotal - addonsSynced,
      },
    });
  } catch (error: any) {
    logger.error('[Stripe Sync Status Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado' },
      { status: 500 }
    );
  }
}
