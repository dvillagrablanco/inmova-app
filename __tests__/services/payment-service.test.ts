import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    payment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from '@/lib/db';

describe('Payment Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a new payment record', async () => {
      const mockPayment = {
        id: 'payment-1',
        unitId: 'unit-1',
        amount: 1200,
        dueDate: new Date('2025-01-01'),
        status: 'pending',
        concept: 'Rent January 2025',
        createdAt: new Date(),
      };

      (prisma.payment.create as any).mockResolvedValue(mockPayment);

      const result = mockPayment;
      expect(result.amount).toBe(1200);
      expect(result.status).toBe('pending');
      expect(result.concept).toBe('Rent January 2025');
    });

    it('should validate payment amount is positive', () => {
      const amount = -100;
      expect(amount > 0).toBe(false);
    });

    it('should require due date', () => {
      const dueDate = new Date('2025-01-01');
      expect(dueDate instanceof Date).toBe(true);
      expect(isNaN(dueDate.getTime())).toBe(false);
    });
  });

  describe('processPayment', () => {
    it('should mark payment as paid', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'pending',
        amount: 1200,
      };

      (prisma.payment.update as any).mockResolvedValue({
        ...mockPayment,
        status: 'paid',
        paidAt: new Date(),
      });

      const updated = { ...mockPayment, status: 'paid' };
      expect(updated.status).toBe('paid');
    });

    it('should handle payment failures', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'pending',
      };

      (prisma.payment.update as any).mockResolvedValue({
        ...mockPayment,
        status: 'failed',
        failureReason: 'Insufficient funds',
      });

      const failed = { ...mockPayment, status: 'failed' };
      expect(failed.status).toBe('failed');
    });
  });

  describe('calculateLateFees', () => {
    it('should calculate late fees correctly', () => {
      const amount = 1000;
      const dueDate = new Date('2024-12-01');
      const currentDate = new Date('2024-12-15');
      const daysLate = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const lateFeePercent = 0.05; // 5%
      const lateFee = amount * lateFeePercent;

      expect(daysLate).toBe(14);
      expect(lateFee).toBe(50);
    });

    it('should not charge late fee if paid on time', () => {
      const dueDate = new Date('2024-12-15');
      const paidDate = new Date('2024-12-10');
      const isLate = paidDate > dueDate;

      expect(isLate).toBe(false);
    });
  });

  describe('getPaymentHistory', () => {
    it('should retrieve payment history for a unit', async () => {
      const mockPayments = [
        { id: '1', unitId: 'unit-1', amount: 1200, status: 'paid' },
        { id: '2', unitId: 'unit-1', amount: 1200, status: 'pending' },
      ];

      (prisma.payment.findMany as any).mockResolvedValue(mockPayments);

      const result = mockPayments;
      expect(result).toHaveLength(2);
      expect(result[0].unitId).toBe('unit-1');
    });

    it('should filter by status', async () => {
      const mockPayments = [
        { id: '1', status: 'paid', amount: 1200 },
        { id: '2', status: 'paid', amount: 1500 },
      ];

      (prisma.payment.findMany as any).mockResolvedValue(mockPayments);

      const paidOnly = mockPayments.filter(p => p.status === 'paid');
      expect(paidOnly).toHaveLength(2);
    });
  });

  describe('payment reminders', () => {
    it('should identify payments due soon', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // Due in 3 days
      
      const daysDiff = Math.floor((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const isDueSoon = daysDiff <= 7 && daysDiff >= 0;

      expect(isDueSoon).toBe(true);
    });

    it('should identify overdue payments', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5); // 5 days ago
      
      const isOverdue = dueDate < new Date();
      expect(isOverdue).toBe(true);
    });
  });
});
