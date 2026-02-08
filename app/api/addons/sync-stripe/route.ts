import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/addons/sync-stripe
 * Sincroniza todos los add-ons con Stripe (solo super_admin)
 * 
 * Crea/actualiza productos y precios en Stripe para cada add-on activo
 * y guarda los IDs de Stripe en la base de datos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar Stripe está configurado
    const { getStripe } = await import('@/lib/stripe-config');
    const stripe = getStripe();
    
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: 'Stripe no está configurado. Verifica STRIPE_SECRET_KEY.',
      }, { status: 400 });
    }

    // Obtener todos los add-ons activos
    const addons = await prisma.addOn.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });

    const { syncAddOnToStripe } = await import('@/lib/stripe-subscription-service');

    const results = {
      total: addons.length,
      synced: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{
        id: string;
        codigo: string;
        nombre: string;
        status: 'synced' | 'failed' | 'skipped';
        stripeProductId?: string;
        stripePriceIdMonthly?: string;
        stripePriceIdAnnual?: string;
        error?: string;
      }>,
    };

    for (const addon of addons) {
      try {
        // Sincronizar con Stripe
        const stripeIds = await syncAddOnToStripe({
          id: addon.id,
          codigo: addon.codigo,
          nombre: addon.nombre,
          descripcion: addon.descripcion,
          precioMensual: addon.precioMensual,
          precioAnual: addon.precioAnual || undefined,
          categoria: addon.categoria,
        });

        if (stripeIds) {
          // Actualizar BD con IDs de Stripe
          await prisma.addOn.update({
            where: { id: addon.id },
            data: {
              stripeProductId: stripeIds.productId,
              stripePriceIdMonthly: stripeIds.priceIdMonthly,
              stripePriceIdAnnual: stripeIds.priceIdAnnual,
            },
          });

          results.synced++;
          results.details.push({
            id: addon.id,
            codigo: addon.codigo,
            nombre: addon.nombre,
            status: 'synced',
            stripeProductId: stripeIds.productId,
            stripePriceIdMonthly: stripeIds.priceIdMonthly,
            stripePriceIdAnnual: stripeIds.priceIdAnnual,
          });
        } else {
          results.skipped++;
          results.details.push({
            id: addon.id,
            codigo: addon.codigo,
            nombre: addon.nombre,
            status: 'skipped',
            error: 'syncAddOnToStripe retornó null',
          });
        }
      } catch (error: any) {
        results.failed++;
        results.details.push({
          id: addon.id,
          codigo: addon.codigo,
          nombre: addon.nombre,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Log de auditoría (solo si hay companyId)
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyId: true },
      });
      
      if (user?.companyId) {
        await prisma.auditLog.create({
          data: {
            companyId: user.companyId,
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'SYSTEM',
            entityId: 'stripe-sync',
            entityName: 'Stripe Add-ons Sync',
            changes: JSON.stringify({
              total: results.total,
              synced: results.synced,
              failed: results.failed,
              skipped: results.skipped,
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      logger.warn('[Audit Log Warning]:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${results.synced}/${results.total} add-ons sincronizados`,
      results,
    });
  } catch (error: any) {
    logger.error('[Stripe Sync Error]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error en sincronización',
      message: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/addons/sync-stripe
 * Obtiene el estado de sincronización de add-ons con Stripe
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Obtener todos los add-ons
    const addons = await prisma.addOn.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        precioMensual: true,
        precioAnual: true,
        stripeProductId: true,
        stripePriceIdMonthly: true,
        stripePriceIdAnnual: true,
      },
      orderBy: { orden: 'asc' },
    });

    const syncStatus = addons.map(addon => ({
      id: addon.id,
      codigo: addon.codigo,
      nombre: addon.nombre,
      precioMensual: addon.precioMensual,
      precioAnual: addon.precioAnual,
      stripe: {
        synced: !!addon.stripeProductId,
        productId: addon.stripeProductId,
        priceIdMonthly: addon.stripePriceIdMonthly,
        priceIdAnnual: addon.stripePriceIdAnnual,
      },
    }));

    const synced = syncStatus.filter(a => a.stripe.synced).length;
    const notSynced = syncStatus.filter(a => !a.stripe.synced).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: addons.length,
        synced,
        notSynced,
        percentage: addons.length > 0 ? Math.round((synced / addons.length) * 100) : 0,
      },
      addons: syncStatus,
    });
  } catch (error: any) {
    logger.error('[Stripe Sync Status Error]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo estado de sincronización',
      message: error.message,
    }, { status: 500 });
  }
}
