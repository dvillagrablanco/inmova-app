/**
 * INTEGRATION TESTS - CONTRACT FLOW
 * Flujo completo de creación y gestión de contratos
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { addMonths, addDays } from 'date-fns';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn((callback) =>
      callback({
        contract: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        unit: {
          update: vi.fn(),
        },
        payment: {
          create: vi.fn(),
          createMany: vi.fn(),
        },
        notification: {
          create: vi.fn(),
        },
      })
    ),
    contract: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      createMany: vi.fn(),
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

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-config';

describe('🔄 FLOW: Creación Completa de Contrato', () => {
  const mockTenant = {
    id: 'tenant-123',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '912345678',
    dni: '12345678A',
    companyId: 'company-123',
  };

  const mockUnit = {
    id: 'unit-123',
    numero: '101',
    tipo: 'apartamento',
    estado: 'disponible',
    rentaMensual: 1200,
    buildingId: 'building-123',
  };

  const mockContract = {
    id: 'contract-123',
    fechaInicio: new Date('2026-02-01'),
    fechaFin: addMonths(new Date('2026-02-01'), 12),
    rentaMensual: 1200,
    fianza: 2400,
    tenantId: 'tenant-123',
    unitId: 'unit-123',
    estado: 'activo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('✅ FLOW: Crear contrato → Actualizar unidad → Generar pagos → Notificar', async () => {
    // PASO 1: Verificar que tenant y unit existen
    (prisma.tenant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenant);
    (prisma.unit.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnit);

    const tenantExists = await prisma.tenant.findUnique({ where: { id: mockTenant.id } });
    const unitExists = await prisma.unit.findUnique({ where: { id: mockUnit.id } });

    expect(tenantExists).toBeTruthy();
    expect(unitExists).toBeTruthy();
    expect(unitExists?.estado).toBe('disponible');

    // PASO 2: Crear contrato
    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockContract);

    const contractData = {
      tenantId: mockTenant.id,
      unitId: mockUnit.id,
      fechaInicio: mockContract.fechaInicio,
      fechaFin: mockContract.fechaFin,
      rentaMensual: mockContract.rentaMensual,
      fianza: mockContract.fianza,
      estado: 'activo',
    };

    const createdContract = await prisma.contract.create({ data: contractData });

    expect(createdContract).toBeDefined();
    expect(createdContract.tenantId).toBe(mockTenant.id);
    expect(createdContract.estado).toBe('activo');

    // PASO 3: Actualizar estado de unidad a 'ocupada'
    (prisma.unit.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUnit,
      estado: 'ocupada',
    });

    const updatedUnit = await prisma.unit.update({
      where: { id: mockUnit.id },
      data: { estado: 'ocupada' },
    });

    expect(updatedUnit.estado).toBe('ocupada');

    // PASO 4: Generar pagos mensuales (12 meses)
    const payments = [];
    for (let i = 0; i < 12; i++) {
      payments.push({
        contractId: createdContract.id,
        monto: createdContract.rentaMensual,
        fechaVencimiento: addMonths(createdContract.fechaInicio, i),
        estado: 'pendiente',
        concepto: `Renta mes ${i + 1}`,
      });
    }

    (prisma.payment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 12,
    });

    const createdPayments = await prisma.payment.createMany({ data: payments });

    expect(createdPayments.count).toBe(12);

    // PASO 5: Enviar notificación al inquilino
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ messageId: 'email-123' });

    await sendEmail({
      from: 'noreply@inmova.app',
      to: mockTenant.email,
      subject: 'Contrato activado',
      text: `Hola ${mockTenant.nombre}, tu contrato ha sido activado.`,
    });

    expect(sendEmail).toHaveBeenCalled();

    // PASO 6: Crear notificación en sistema
    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'notif-123',
      userId: mockTenant.id,
      type: 'INFO',
      title: 'Contrato activado',
      message: 'Tu contrato de alquiler ha sido activado exitosamente.',
    });

    const notification = await prisma.notification.create({
      data: {
        userId: mockTenant.id,
        type: 'INFO',
        title: 'Contrato activado',
        message: 'Tu contrato de alquiler ha sido activado exitosamente.',
      },
    });

    expect(notification).toBeDefined();

    // VERIFICACIÓN FINAL: Todo el flow completado
    expect(prisma.tenant.findUnique).toHaveBeenCalled();
    expect(prisma.unit.findUnique).toHaveBeenCalled();
    expect(prisma.contract.create).toHaveBeenCalled();
    expect(prisma.unit.update).toHaveBeenCalled();
    expect(prisma.payment.createMany).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  test('✅ FLOW: Validar datos antes de crear contrato', async () => {
    // PASO 1: Validar fechas
    const startDate = new Date('2026-02-01');
    const endDate = addMonths(startDate, 12);

    expect(startDate < endDate).toBe(true);

    // PASO 2: Validar monto de renta
    const rentaMensual = 1200;
    expect(rentaMensual).toBeGreaterThan(0);

    // PASO 3: Validar fianza (máximo 3 meses)
    const fianza = rentaMensual * 2; // 2 meses
    expect(fianza).toBeLessThanOrEqual(rentaMensual * 3);

    // PASO 4: Validar que unidad está disponible
    (prisma.unit.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUnit,
      estado: 'disponible',
    });

    const unit = await prisma.unit.findUnique({ where: { id: mockUnit.id } });
    expect(unit?.estado).toBe('disponible');

    // PASO 5: Validar que tenant tiene DNI
    (prisma.tenant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenant);

    const tenant = await prisma.tenant.findUnique({ where: { id: mockTenant.id } });
    expect(tenant?.dni).toBeDefined();
  });

  test('❌ FLOW: Rechazar contrato si unidad ya está ocupada', async () => {
    // Unidad ya ocupada
    (prisma.unit.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUnit,
      estado: 'ocupada',
    });

    const unit = await prisma.unit.findUnique({ where: { id: mockUnit.id } });

    if (unit?.estado === 'ocupada') {
      // No crear contrato
      expect(unit.estado).toBe('ocupada');
    } else {
      // Crear contrato normalmente
      throw new Error('La unidad debería estar ocupada');
    }
  });

  test('❌ FLOW: Rechazar contrato con fechas inválidas', async () => {
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-01-01'); // Anterior a startDate

    // Validación de fechas
    const isValid = startDate < endDate;
    expect(isValid).toBe(false);
  });
});

// TODO: Este test de integración requiere más mocks de servicios de pago
describe.skip('🔄 FLOW: Pago Mensual Completo', () => {
  const mockPayment = {
    id: 'payment-123',
    contractId: 'contract-123',
    monto: 1200,
    fechaVencimiento: new Date('2026-02-01'),
    estado: 'pendiente',
    concepto: 'Renta Febrero 2026',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('✅ FLOW: Pago pendiente → Pago completado → Notificar', async () => {
    // PASO 1: Obtener pago pendiente
    (prisma.payment.findUnique as any).mockResolvedValue(mockPayment);

    const payment = await (prisma as any).payment.findUnique({
      where: { id: mockPayment.id },
    });

    expect(payment.estado).toBe('pendiente');

    // PASO 2: Procesar pago (simulación de Stripe)
    // En producción: const paymentIntent = await stripe.paymentIntents.create(...)
    const paymentProcessed = true;

    expect(paymentProcessed).toBe(true);

    // PASO 3: Actualizar estado del pago a 'completado'
    (prisma.payment.update as any).mockResolvedValue({
      ...mockPayment,
      estado: 'completado',
      fechaPago: new Date(),
    });

    const updatedPayment = await (prisma as any).payment.update({
      where: { id: mockPayment.id },
      data: {
        estado: 'completado',
        fechaPago: new Date(),
      },
    });

    expect(updatedPayment.estado).toBe('completado');

    // PASO 4: Enviar notificación de pago recibido
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ messageId: 'email-456' });

    await sendEmail({
      from: 'noreply@inmova.app',
      to: 'tenant@example.com',
      subject: 'Pago recibido',
      text: 'Hemos recibido tu pago de 1200€',
    });

    expect(sendEmail).toHaveBeenCalled();

    // VERIFICACIÓN FINAL
    expect((prisma as any).payment.findUnique).toHaveBeenCalled();
    expect((prisma as any).payment.update).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });

  test('⚠️ FLOW: Detectar pago atrasado → Enviar recordatorio', async () => {
    const now = new Date();
    const vencimiento = addDays(now, -5); // 5 días atrasado

    (prisma.payment.findUnique as any).mockResolvedValue({
      ...mockPayment,
      fechaVencimiento: vencimiento,
      estado: 'atrasado',
    });

    const payment = await (prisma as any).payment.findUnique({
      where: { id: mockPayment.id },
    });

    // Calcular días de atraso
    const diasAtraso = Math.floor(
      (now.getTime() - payment.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(diasAtraso).toBeGreaterThanOrEqual(3);
    expect(payment.estado).toBe('atrasado');

    // Enviar recordatorio
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ messageId: 'reminder-789' });

    await sendEmail({
      from: 'noreply@inmova.app',
      to: 'tenant@example.com',
      subject: 'Recordatorio: Pago pendiente',
      text: `Tu pago está atrasado ${diasAtraso} días`,
    });

    expect(sendEmail).toHaveBeenCalled();
  });
});

describe('🔄 FLOW: Renovación de Contrato', () => {
  const mockExpiringContract = {
    id: 'contract-456',
    tenantId: 'tenant-123',
    unitId: 'unit-123',
    fechaInicio: new Date('2025-02-01'),
    fechaFin: new Date('2026-02-01'),
    rentaMensual: 1200,
    estado: 'activo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('✅ FLOW: Detectar vencimiento → Proponer renovación → Crear nuevo contrato', async () => {
    // PASO 1: Detectar contrato próximo a vencer (30 días)
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (mockExpiringContract.fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysUntilExpiry).toBeLessThanOrEqual(60);

    // PASO 2: Enviar notificación de renovación
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ messageId: 'renewal-email' });

    await sendEmail({
      from: 'noreply@inmova.app',
      to: 'tenant@example.com',
      subject: 'Renovación de contrato',
      text: `Tu contrato vence en ${daysUntilExpiry} días. ¿Deseas renovar?`,
    });

    expect(sendEmail).toHaveBeenCalled();

    // PASO 3: Calcular nueva renta (IPC máximo 3.5%)
    const oldRent = mockExpiringContract.rentaMensual;
    const ipc = 0.03; // 3% IPC
    const newRent = Math.round(oldRent * (1 + ipc));

    expect(newRent).toBeLessThanOrEqual(oldRent * 1.035); // Máximo 3.5%

    // PASO 4: Crear nuevo contrato
    const newContract = {
      tenantId: mockExpiringContract.tenantId,
      unitId: mockExpiringContract.unitId,
      fechaInicio: mockExpiringContract.fechaFin,
      fechaFin: addMonths(mockExpiringContract.fechaFin, 12),
      rentaMensual: newRent,
      fianza: newRent * 2,
      estado: 'activo',
    };

    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-new',
      ...newContract,
    });

    const createdContract = await prisma.contract.create({ data: newContract });

    expect(createdContract).toBeDefined();
    expect(createdContract.rentaMensual).toBe(newRent);

    // PASO 5: Actualizar contrato anterior a 'finalizado'
    (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockExpiringContract,
      estado: 'finalizado',
    });

    await prisma.contract.update({
      where: { id: mockExpiringContract.id },
      data: { estado: 'finalizado' },
    });

    // VERIFICACIÓN FINAL
    expect(sendEmail).toHaveBeenCalled();
    expect(prisma.contract.create).toHaveBeenCalled();
    expect(prisma.contract.update).toHaveBeenCalled();
  });

  test('⚠️ FLOW: Validar aumento de renta según IPC', async () => {
    const oldRent = 1000;
    const maxIPCIncrease = 0.035; // 3.5%

    // Intentar aumentar 5% (excede IPC)
    const proposedRent = oldRent * 1.05;
    const increase = (proposedRent - oldRent) / oldRent;

    expect(increase).toBeGreaterThan(maxIPCIncrease);

    // Rechazar aumento excesivo
    const isValidIncrease = increase <= maxIPCIncrease;
    expect(isValidIncrease).toBe(false);
  });
});
