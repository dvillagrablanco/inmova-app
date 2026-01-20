/**
 * API: Sincronizar cupones con Stripe
 * 
 * POST /api/admin/coupons/sync-stripe
 * - Sincroniza todos los cupones pendientes con Stripe
 * 
 * POST /api/admin/coupons/sync-stripe?id=xxx
 * - Sincroniza un cupón específico
 * 
 * Solo para SUPERADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncCouponToStripe, syncAllCouponsToStripe, validateStripeCoupon } from '@/lib/stripe-coupon-service';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar si Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { 
          error: 'Stripe no configurado',
          message: 'Configure STRIPE_SECRET_KEY en las variables de entorno',
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('id');

    if (couponId) {
      // Sincronizar un cupón específico
      const result = await syncCouponToStripe(couponId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Cupón sincronizado con Stripe',
        data: {
          stripeCouponId: result.stripeCouponId,
          stripePromotionCodeId: result.stripePromotionCodeId,
        },
      });
    }

    // Sincronizar todos los cupones pendientes
    const result = await syncAllCouponsToStripe();

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${result.synced}/${result.total} cupones`,
      data: {
        total: result.total,
        synced: result.synced,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    logger.error('[API Sync Stripe] Error:', error);
    return NextResponse.json(
      { error: 'Error en sincronización', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/coupons/sync-stripe
 * - Obtiene el estado de sincronización de cupones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener estadísticas de cupones
    const total = await prisma.discountCoupon.count({
      where: { activo: true },
    });

    const sincronizados = await prisma.discountCoupon.count({
      where: {
        activo: true,
        stripeCouponId: { not: null },
      },
    });

    const pendientes = await prisma.discountCoupon.findMany({
      where: {
        activo: true,
        stripeCouponId: null,
      },
      select: {
        id: true,
        codigo: true,
        tipo: true,
        valor: true,
      },
    });

    // Verificar configuración de Stripe
    const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

    return NextResponse.json({
      stripeConfigured,
      total,
      sincronizados,
      pendientes: pendientes.length,
      detallePendientes: pendientes,
    });
  } catch (error: any) {
    logger.error('[API Sync Stripe] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado' },
      { status: 500 }
    );
  }
}
