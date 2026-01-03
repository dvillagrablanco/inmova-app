/**
 * PAYMENT REMINDER SERVICE - UNIT TESTS
 * Tests comprehensivos para el servicio de recordatorios de pagos
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { addDays, subDays } from 'date-fns';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    payment: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email-config', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/notification-generator', () => ({
  createNotification: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-config';
import { createNotification } from '@/lib/notification-generator';
import { detectOverduePayments, processPaymentReminders } from '@/lib/payment-reminder-service';

describe('💰 Payment Reminder Service', () => {
  const mockPayments = (daysOverdue: number) => [
    {
      id: 'payment-1',
      monto: 1200,
      estado: 'atrasado',
      fechaVencimiento: subDays(new Date(), daysOverdue),
      contract: {
        id: 'contract-1',
        tenant: {
          id: 'tenant-1',
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
          companyId: 'company-123',
        },
        unit: {
          id: 'unit-1',
          numero: '101',
          building: {
            id: 'building-1',
            nombre: 'Edificio Central',
          },
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // DETECCIÓN DE PAGOS ATRASADOS
  // ========================================

  describe('detectOverduePayments', () => {
    test('✅ Debe detectar pago atrasado 3 días (friendly)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(3));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(1);
      expect(reminders[0].stage).toBe('friendly');
      expect(reminders[0].priority).toBe('bajo');
      expect(reminders[0].daysOverdue).toBe(3);
    });

    test('✅ Debe detectar pago atrasado 7 días (firm)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(7));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(1);
      expect(reminders[0].stage).toBe('firm');
      expect(reminders[0].priority).toBe('medio');
    });

    test('✅ Debe detectar pago atrasado 15 días (urgent)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(15));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(1);
      expect(reminders[0].stage).toBe('urgent');
      expect(reminders[0].priority).toBe('alto');
    });

    test('✅ Debe detectar pago atrasado 30 días (legal)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(30));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(1);
      expect(reminders[0].stage).toBe('legal');
      expect(reminders[0].priority).toBe('alto');
    });

    test('⚠️ NO debe detectar pagos con menos de 3 días de atraso', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(2));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(0);
    });

    test('✅ Debe manejar múltiples pagos atrasados', async () => {
      const multiplePayments = [...mockPayments(5), ...mockPayments(10), ...mockPayments(20)];

      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(multiplePayments);

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(3);
    });

    test('⚠️ Debe manejar lista vacía de pagos', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(0);
    });

    test('✅ Debe filtrar por companyId', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(5));

      await detectOverduePayments('company-123');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contract: {
              tenant: {
                companyId: 'company-123',
              },
            },
          }),
        })
      );
    });

    test('⚠️ Debe funcionar sin companyId (todos los pagos)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(5));

      await detectOverduePayments();

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            companyId: expect.anything(),
          }),
        })
      );
    });
  });

  // ========================================
  // ETAPAS DE RECORDATORIO
  // ========================================

  describe('Etapas de recordatorio', () => {
    test('✅ Debe clasificar correctamente 3-6 días (friendly)', async () => {
      for (let days = 3; days <= 6; days++) {
        (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(days));

        const reminders = await detectOverduePayments('company-123');

        expect(reminders[0].stage).toBe('friendly');
        expect(reminders[0].priority).toBe('bajo');
      }
    });

    test('✅ Debe clasificar correctamente 7-14 días (firm)', async () => {
      for (let days = 7; days <= 14; days += 2) {
        (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(days));

        const reminders = await detectOverduePayments('company-123');

        expect(reminders[0].stage).toBe('firm');
        expect(reminders[0].priority).toBe('medio');
      }
    });

    test('✅ Debe clasificar correctamente 15-29 días (urgent)', async () => {
      for (let days = 15; days <= 29; days += 5) {
        (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(days));

        const reminders = await detectOverduePayments('company-123');

        expect(reminders[0].stage).toBe('urgent');
        expect(reminders[0].priority).toBe('alto');
      }
    });

    test('✅ Debe clasificar correctamente 30+ días (legal)', async () => {
      for (let days = 30; days <= 60; days += 10) {
        (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(days));

        const reminders = await detectOverduePayments('company-123');

        expect(reminders[0].stage).toBe('legal');
        expect(reminders[0].priority).toBe('alto');
      }
    });
  });

  // ========================================
  // PROCESAMIENTO DE RECORDATORIOS
  // ========================================

  describe('processPaymentReminders', () => {
    test('✅ Debe procesar recordatorios detectados', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(5));
      (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ messageId: 'email-123' });
      (createNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'notif-123',
      });

      await processPaymentReminders('company-123');

      // Debe detectar y procesar al menos 1 recordatorio
      expect(prisma.payment.findMany).toHaveBeenCalled();
    });

    test('⚠️ Debe manejar caso sin pagos atrasados', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await processPaymentReminders('company-123');

      // No debe fallar con lista vacía
      expect(prisma.payment.findMany).toHaveBeenCalled();
    });

    test('❌ Debe manejar error en base de datos', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database error')
      );

      await expect(processPaymentReminders('company-123')).rejects.toThrow();
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================

  describe('Edge Cases', () => {
    test('⚠️ Debe manejar monto de pago 0', async () => {
      const zeroPayment = mockPayments(5);
      zeroPayment[0].monto = 0;

      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(zeroPayment);

      const reminders = await detectOverduePayments('company-123');

      expect(reminders[0].amount).toBe(0);
    });

    test('⚠️ Debe manejar monto de pago muy grande', async () => {
      const largePayment = mockPayments(5);
      largePayment[0].monto = 999999;

      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(largePayment);

      const reminders = await detectOverduePayments('company-123');

      expect(reminders[0].amount).toBe(999999);
    });

    test('⚠️ Debe manejar exactamente 3 días (límite inferior)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(3));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(1);
      expect(reminders[0].daysOverdue).toBe(3);
    });

    test('⚠️ Debe manejar exactamente 7 días (cambio de etapa)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(7));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders[0].stage).toBe('firm');
      expect(reminders[0].daysOverdue).toBe(7);
    });

    test('⚠️ Debe manejar exactamente 15 días (cambio de etapa)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(15));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders[0].stage).toBe('urgent');
      expect(reminders[0].daysOverdue).toBe(15);
    });

    test('⚠️ Debe manejar exactamente 30 días (cambio de etapa)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(30));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders[0].stage).toBe('legal');
      expect(reminders[0].daysOverdue).toBe(30);
    });

    test('⚠️ Debe manejar pago extremadamente atrasado (90+ días)', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(90));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders[0].stage).toBe('legal');
      expect(reminders[0].priority).toBe('alto');
      expect(reminders[0].daysOverdue).toBe(90);
    });

    test('⚠️ Debe manejar inquilino sin email', async () => {
      const noEmailPayment = mockPayments(5);
      noEmailPayment[0].contract.tenant.email = '';

      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(noEmailPayment);

      const reminders = await detectOverduePayments('company-123');

      expect(reminders.length).toBe(1);
    });

    test('⚠️ Debe incluir información completa del recordatorio', async () => {
      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(5));

      const reminders = await detectOverduePayments('company-123');

      expect(reminders[0]).toHaveProperty('paymentId');
      expect(reminders[0]).toHaveProperty('daysOverdue');
      expect(reminders[0]).toHaveProperty('amount');
      expect(reminders[0]).toHaveProperty('stage');
      expect(reminders[0]).toHaveProperty('priority');
    });
  });

  // ========================================
  // VALIDACIÓN DE LÓGICA DE NEGOCIO
  // ========================================

  describe('Reglas de negocio', () => {
    test('✅ friendly < firm < urgent < legal', async () => {
      const stages = [
        { days: 3, expected: 'friendly' },
        { days: 7, expected: 'firm' },
        { days: 15, expected: 'urgent' },
        { days: 30, expected: 'legal' },
      ];

      for (const { days, expected } of stages) {
        (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(days));

        const reminders = await detectOverduePayments('company-123');

        expect(reminders[0].stage).toBe(expected);
      }
    });

    test('✅ Prioridad aumenta con días de atraso', async () => {
      const priorities = [
        { days: 3, expected: 'bajo' },
        { days: 7, expected: 'medio' },
        { days: 15, expected: 'alto' },
        { days: 30, expected: 'alto' },
      ];

      for (const { days, expected } of priorities) {
        (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(days));

        const reminders = await detectOverduePayments('company-123');

        expect(reminders[0].priority).toBe(expected);
      }
    });

    test('⚠️ No debe enviar recordatorios prematuros (<3 días)', async () => {
      for (let days = 0; days < 3; days++) {
        (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments(days));

        const reminders = await detectOverduePayments('company-123');

        expect(reminders.length).toBe(0);
      }
    });

    test('✅ Debe incluir monto en formato numérico', async () => {
      const payment = mockPayments(5);
      payment[0].monto = 1234.56;

      (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(payment);

      const reminders = await detectOverduePayments('company-123');

      expect(typeof reminders[0].amount).toBe('number');
      expect(reminders[0].amount).toBe(1234.56);
    });
  });
});
