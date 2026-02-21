import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { stripeSubscriptionService } from '@/lib/stripe-subscription-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/addons/sync-stripe
 * Sincroniza todos los add-ons activos con Stripe
 * Solo accesible por super_admin / administrador
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY no configurada' }, { status: 503 });
    }

    const prisma = await getPrisma();
    const addons = await prisma.addOn.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });

    const results = [];
    let synced = 0;
    let failed = 0;

    for (const addon of addons) {
      const stripeIds = await stripeSubscriptionService.syncAddOnToStripe({
        id: addon.id,
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual || undefined,
        categoria: addon.categoria,
      });

      if (stripeIds) {
        await prisma.addOn.update({
          where: { id: addon.id },
          data: {
            stripeProductId: stripeIds.productId,
            stripePriceIdMonthly: stripeIds.priceIdMonthly,
            stripePriceIdAnnual: stripeIds.priceIdAnnual,
          },
        });
        synced++;
        results.push({ codigo: addon.codigo, status: 'synced', productId: stripeIds.productId });
      } else {
        failed++;
        results.push({ codigo: addon.codigo, status: 'failed' });
      }
    }

    return NextResponse.json({
      success: true,
      total: addons.length,
      synced,
      failed,
      results,
    });
  } catch (error: any) {
    logger.error('[Addons Sync Stripe Error]:', error);
    return NextResponse.json(
      { error: 'Error sincronizando add-ons con Stripe', message: error.message },
      { status: 500 }
    );
  }
}
