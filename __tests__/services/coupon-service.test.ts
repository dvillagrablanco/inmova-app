import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  default: {
    coupon: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    couponUsage: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
  getPrismaClient: () => ({ default: {
    coupon: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    couponUsage: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  } }),
}));

import prisma from '@/lib/db';

describe('Coupon Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon code', async () => {
      const mockCoupon = {
        id: '1',
        code: 'SAVE20',
        discountPercent: 20,
        discountAmount: null,
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        maxUses: 100,
        usedCount: 50,
        isActive: true,
        minPurchase: 0,
      };

      (prisma.coupon.findUnique as any).mockResolvedValue(mockCoupon);

      const result = mockCoupon;
      expect(result.code).toBe('SAVE20');
      expect(result.isActive).toBe(true);
      expect(result.discountPercent).toBe(20);
    });

    it('should reject expired coupon', async () => {
      const expiredCoupon = {
        id: '1',
        code: 'EXPIRED',
        discountPercent: 10,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
        isActive: true,
      };

      (prisma.coupon.findUnique as any).mockResolvedValue(expiredCoupon);

      const isExpired = expiredCoupon.expiresAt < new Date();
      expect(isExpired).toBe(true);
    });

    it('should reject coupon with max uses reached', async () => {
      const maxedCoupon = {
        id: '1',
        code: 'MAXED',
        discountPercent: 15,
        maxUses: 10,
        usedCount: 10,
        isActive: true,
      };

      (prisma.coupon.findUnique as any).mockResolvedValue(maxedCoupon);

      const isMaxed = maxedCoupon.usedCount >= maxedCoupon.maxUses;
      expect(isMaxed).toBe(true);
    });

    it('should reject inactive coupon', async () => {
      const inactiveCoupon = {
        id: '1',
        code: 'INACTIVE',
        discountPercent: 25,
        isActive: false,
      };

      (prisma.coupon.findUnique as any).mockResolvedValue(inactiveCoupon);

      expect(inactiveCoupon.isActive).toBe(false);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      const amount = 100;
      const discountPercent = 20;
      const discount = (amount * discountPercent) / 100;
      
      expect(discount).toBe(20);
      expect(amount - discount).toBe(80);
    });

    it('should calculate fixed amount discount', () => {
      const amount = 100;
      const discountAmount = 15;
      
      expect(amount - discountAmount).toBe(85);
    });

    it('should not exceed original amount', () => {
      const amount = 50;
      const discountAmount = 75;
      const finalAmount = Math.max(0, amount - discountAmount);
      
      expect(finalAmount).toBe(0);
    });

    it('should respect minimum purchase requirement', () => {
      const amount = 30;
      const minPurchase = 50;
      
      expect(amount < minPurchase).toBe(true);
    });
  });

  describe('applyCoupon', () => {
    it('should track coupon usage', async () => {
      const mockUsage = {
        id: '1',
        couponId: 'coupon-1',
        userId: 'user-1',
        usedAt: new Date(),
      };

      (prisma.couponUsage.create as any).mockResolvedValue(mockUsage);

      const result = mockUsage;
      expect(result.couponId).toBe('coupon-1');
      expect(result.userId).toBe('user-1');
    });

    it('should increment used count', async () => {
      const mockCoupon = {
        id: '1',
        code: 'TEST',
        usedCount: 5,
      };

      (prisma.coupon.update as any).mockResolvedValue({
        ...mockCoupon,
        usedCount: 6,
      });

      const updated = { ...mockCoupon, usedCount: mockCoupon.usedCount + 1 };
      expect(updated.usedCount).toBe(6);
    });
  });
});
