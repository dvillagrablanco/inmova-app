// @ts-nocheck
/**
 * Coupon Tracking Service
 *
 * Tracks coupon usage, conversion rates, and revenue impact.
 */

import logger from '@/lib/logger';

export interface CouponMetrics {
  code: string;
  totalUses: number;
  totalRevenue: number;
  totalDiscount: number;
  conversionRate: number; // % of views that applied the coupon
  avgOrderValue: number;
  lastUsed: string | null;
}

/**
 * Track a coupon application
 */
export async function trackCouponUsage(
  couponCode: string,
  userId: string,
  orderAmount: number,
  discountAmount: number
): Promise<void> {
  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Update coupon usage count
    await prisma.promoCoupon.updateMany({
      where: { code: couponCode },
      data: {
        usedCount: { increment: 1 },
      },
    });

    logger.info(
      `[CouponTracking] ${couponCode} used by ${userId}: order ${orderAmount}€, discount ${discountAmount}€`
    );
  } catch (err: any) {
    logger.error('[CouponTracking] Error:', err.message);
  }
}

/**
 * Get metrics for all active coupons
 */
export async function getCouponMetrics(): Promise<CouponMetrics[]> {
  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const coupons = await prisma.promoCoupon.findMany({
      select: {
        code: true,
        usedCount: true,
        maxUses: true,
        discount: true,
        discountType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { usedCount: 'desc' },
    });

    return coupons.map((c) => ({
      code: c.code,
      totalUses: c.usedCount || 0,
      totalRevenue: 0, // Would need join with subscriptions
      totalDiscount: (c.usedCount || 0) * (c.discount || 0),
      conversionRate: c.maxUses ? ((c.usedCount || 0) / c.maxUses) * 100 : 0,
      avgOrderValue: 0,
      lastUsed: c.updatedAt?.toISOString() || null,
    }));
  } catch (err: any) {
    logger.error('[CouponTracking] Error getting metrics:', err.message);
    return [];
  }
}
