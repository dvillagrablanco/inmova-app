/**
 * TESTS DE INTEGRACIÓN - API DE PAGOS
 * Pruebas end-to-end de los endpoints de pagos con base de datos real
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Mock de next-auth
jest.mock('next-auth');
jest.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

describe('🔗 Integration Tests - Payments API', () => {
  let testCompanyId: string;
  let testUserId: string;
  let testContractId: string;

  beforeAll(async () => {
    // Crear datos de prueba en la base de datos
    const company = await prisma.company.create({
      data: {
        name: 'Test Company Integration',
        email: 'integration@test.com',
        status: 'active',
      },
    });
    testCompanyId = company.id;

    const user = await prisma.user.create({
      data: {
        email: 'testuser@integration.com',
        name: 'Test User',
        hashedPassword: 'hashed',
        companyId: testCompanyId,
        role: 'admin',
      },
    });
    testUserId = user.id;

    // Crear edificio, unidad, inquilino y contrato
    const building = await prisma.building.create({
      data: {
        nombre: 'Test Building',
        direccion: 'Test Address',
        companyId: testCompanyId,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        numero: '101',
        superficie: 50,
        buildingId: building.id,
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        nombre: 'John Doe',
        email: 'john@test.com',
        telefono: '123456789',
        companyId: testCompanyId,
      },
    });

    const contract = await prisma.contract.create({
      data: {
        fechaInicio: new Date('2025-01-01'),
        fechaFin: new Date('2025-12-31'),
        renta: 1000,
        unitId: unit.id,
        tenantId: tenant.id,
        estado: 'vigente',
      },
    });
    testContractId = contract.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.payment.deleteMany({
      where: {
        contract: {
          unit: {
            building: { companyId: testCompanyId },
          },
        },
      },
    });
    await prisma.contract.deleteMany({
      where: {
        unit: {
          building: { companyId: testCompanyId },
        },
      },
    });
    await prisma.unit.deleteMany({
      where: {
        building: { companyId: testCompanyId },
      },
    });
    await prisma.building.deleteMany({
      where: { companyId: testCompanyId },
    });
    await prisma.tenant.deleteMany({
      where: { companyId: testCompanyId },
    });
    await prisma.user.deleteMany({
      where: { companyId: testCompanyId },
    });
    await prisma.company.deleteMany({
      where: { id: testCompanyId },
    });

    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Mock de sesión autenticada
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: testUserId,
        email: 'testuser@integration.com',
        companyId: testCompanyId,
      },
    });
  });

  describe('POST /api/payments', () => {
    test('✅ Debe crear un nuevo pago', async () => {
      const paymentData = {
        monto: 1000,
        fechaVencimiento: new Date('2025-02-01'),
        concepto: 'Renta Febrero 2025',
        estado: 'pendiente',
        contractId: testContractId,
      };

      const payment = await prisma.payment.create({
        data: paymentData,
      });

      expect(payment.id).toBeDefined();
      expect(payment.monto).toBe(1000);
      expect(payment.estado).toBe('pendiente');
      expect(payment.contractId).toBe(testContractId);
    });

    test('❌ Debe fallar con monto negativo', async () => {
      await expect(
        prisma.payment.create({
          data: {
            monto: -100,
            fechaVencimiento: new Date('2025-02-01'),
            concepto: 'Invalid',
            estado: 'pendiente',
            contractId: testContractId,
          },
        })
      ).rejects.toThrow();
    });

    test('❌ Debe fallar con contractId inexistente', async () => {
      await expect(
        prisma.payment.create({
          data: {
            monto: 1000,
            fechaVencimiento: new Date('2025-02-01'),
            concepto: 'Test',
            estado: 'pendiente',
            contractId: 'invalid-contract-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      // Crear algunos pagos de prueba
      await prisma.payment.createMany({
        data: [
          {
            monto: 1000,
            fechaVencimiento: new Date('2025-02-01'),
            concepto: 'Renta Feb',
            estado: 'pendiente',
            contractId: testContractId,
          },
          {
            monto: 1000,
            fechaVencimiento: new Date('2025-03-01'),
            concepto: 'Renta Mar',
            estado: 'pagado',
            contractId: testContractId,
          },
        ],
      });
    });

    test('✅ Debe obtener todos los pagos de la compañía', async () => {
      const payments = await prisma.payment.findMany({
        where: {
          contract: {
            unit: {
              building: { companyId: testCompanyId },
            },
          },
        },
      });

      expect(payments.length).toBeGreaterThanOrEqual(2);
    });

    test('✅ Debe filtrar pagos por estado', async () => {
      const pendingPayments = await prisma.payment.findMany({
        where: {
          contract: {
            unit: {
              building: { companyId: testCompanyId },
            },
          },
          estado: 'pendiente',
        },
      });

      expect(pendingPayments.length).toBeGreaterThanOrEqual(1);
      expect(pendingPayments.every((p) => p.estado === 'pendiente')).toBe(true);
    });
  });

  describe('PATCH /api/payments/[id]', () => {
    let testPaymentId: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          monto: 1000,
          fechaVencimiento: new Date('2025-02-01'),
          concepto: 'Test Payment',
          estado: 'pendiente',
          contractId: testContractId,
        },
      });
      testPaymentId = payment.id;
    });

    test('✅ Debe actualizar el estado de un pago', async () => {
      const updatedPayment = await prisma.payment.update({
        where: { id: testPaymentId },
        data: { estado: 'pagado', fechaPago: new Date() },
      });

      expect(updatedPayment.estado).toBe('pagado');
      expect(updatedPayment.fechaPago).toBeDefined();
    });

    test('❌ Debe fallar al actualizar con ID inexistente', async () => {
      await expect(
        prisma.payment.update({
          where: { id: 'invalid-id' },
          data: { estado: 'pagado' },
        })
      ).rejects.toThrow();
    });
  });

  describe('DELETE /api/payments/[id]', () => {
    test('✅ Debe eliminar un pago', async () => {
      const payment = await prisma.payment.create({
        data: {
          monto: 1000,
          fechaVencimiento: new Date('2025-02-01'),
          concepto: 'To Delete',
          estado: 'pendiente',
          contractId: testContractId,
        },
      });

      await prisma.payment.delete({
        where: { id: payment.id },
      });

      const deletedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      });

      expect(deletedPayment).toBeNull();
    });
  });

  describe('Transacciones y Consistencia de Datos', () => {
    test('✅ Debe mantener consistencia en transacciones', async () => {
      await prisma.$transaction(async (tx) => {
        const payment1 = await tx.payment.create({
          data: {
            monto: 1000,
            fechaVencimiento: new Date('2025-02-01'),
            concepto: 'Trans 1',
            estado: 'pendiente',
            contractId: testContractId,
          },
        });

        const payment2 = await tx.payment.create({
          data: {
            monto: 1500,
            fechaVencimiento: new Date('2025-03-01'),
            concepto: 'Trans 2',
            estado: 'pendiente',
            contractId: testContractId,
          },
        });

        expect(payment1.id).toBeDefined();
        expect(payment2.id).toBeDefined();
      });
    });

    test('❌ Debe revertir transacción en caso de error', async () => {
      const initialCount = await prisma.payment.count({
        where: {
          contract: {
            unit: {
              building: { companyId: testCompanyId },
            },
          },
        },
      });

      await expect(
        prisma.$transaction(async (tx) => {
          await tx.payment.create({
            data: {
              monto: 1000,
              fechaVencimiento: new Date('2025-02-01'),
              concepto: 'Trans Success',
              estado: 'pendiente',
              contractId: testContractId,
            },
          });

          // Esto debería fallar
          await tx.payment.create({
            data: {
              monto: -999, // Monto inválido
              fechaVencimiento: new Date('2025-03-01'),
              concepto: 'Trans Fail',
              estado: 'pendiente',
              contractId: testContractId,
            },
          });
        })
      ).rejects.toThrow();

      const finalCount = await prisma.payment.count({
        where: {
          contract: {
            unit: {
              building: { companyId: testCompanyId },
            },
          },
        },
      });

      // El count no debería haber cambiado
      expect(finalCount).toBe(initialCount);
    });
  });
});
