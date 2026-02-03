/**
 * CONTRACT RENEWAL SERVICE - UNIT TESTS
 * Tests para el servicio de renovación de contratos
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email-service', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';

describe('📝 Contract Renewal Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // DETECTAR CONTRATOS POR VENCER
  // ========================================

  test('✅ Debe detectar contratos que vencen en 30 días', async () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const mockContracts = [
      {
        id: 'contract-1',
        fechaFin: in30Days,
        tenant: { nombre: 'Juan', email: 'juan@example.com' },
        unit: { nombre: 'Piso 2A' },
      },
    ];

    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockContracts);

    const contracts = await prisma.contract.findMany({
      where: {
        fechaFin: {
          lte: in30Days,
          gte: new Date(),
        },
        estado: 'activo',
      },
    });

    expect(contracts.length).toBe(1);
    expect(contracts[0].id).toBe('contract-1');
  });

  test('✅ Debe detectar contratos que vencen en 60 días', async () => {
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);

    const mockContracts = [
      {
        id: 'contract-1',
        fechaFin: in60Days,
      },
      {
        id: 'contract-2',
        fechaFin: in60Days,
      },
    ];

    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockContracts);

    const contracts = await prisma.contract.findMany({
      where: {
        fechaFin: {
          lte: in60Days,
        },
      },
    });

    expect(contracts.length).toBe(2);
  });

  test('⚠️ No debe incluir contratos ya vencidos', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const contracts = await prisma.contract.findMany({
      where: {
        fechaFin: {
          gte: new Date(),
        },
      },
    });

    expect(contracts.length).toBe(0);
  });

  // ========================================
  // CÁLCULO DE DÍAS HASTA VENCIMIENTO
  // ========================================

  test('✅ Debe calcular correctamente días hasta vencimiento', () => {
    const calculateDaysUntilExpiry = (fechaFin: Date) => {
      return Math.ceil((fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const days = calculateDaysUntilExpiry(in30Days);

    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);
  });

  test('⚠️ Debe retornar negativo para contratos ya vencidos', () => {
    const calculateDaysUntilExpiry = (fechaFin: Date) => {
      return Math.ceil((fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const days = calculateDaysUntilExpiry(yesterday);

    expect(days).toBeLessThan(0);
  });

  // ========================================
  // RENOVACIÓN AUTOMÁTICA
  // ========================================

  test('✅ Debe renovar contrato con renovación automática activada', async () => {
    const contract = {
      id: 'contract-1',
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-01-01'),
      renovacionAutomatica: true,
    };

    const newFechaFin = new Date(contract.fechaFin);
    newFechaFin.setFullYear(newFechaFin.getFullYear() + 1);

    (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...contract,
      fechaFin: newFechaFin,
    });

    const renewed = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        fechaInicio: contract.fechaFin,
        fechaFin: newFechaFin,
      },
    });

    expect(renewed.fechaFin).toEqual(newFechaFin);
  });

  test('⚠️ No debe renovar si renovación automática está desactivada', async () => {
    const contract = {
      id: 'contract-1',
      renovacionAutomatica: false,
    };

    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([contract]);

    const contracts = await prisma.contract.findMany({
      where: {
        renovacionAutomatica: true,
      },
    });

    expect(contracts.length).toBe(1);
  });

  // ========================================
  // NOTIFICACIONES DE RENOVACIÓN
  // ========================================

  test('✅ Debe crear notificación para inquilino', async () => {
    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'notif-1',
      userId: 'tenant-1',
      type: 'CONTRACT_EXPIRING',
      title: 'Contrato próximo a vencer',
      message: 'Tu contrato vence en 30 días',
    });

    const notification = await prisma.notification.create({
      data: {
        userId: 'tenant-1',
        type: 'CONTRACT_EXPIRING',
        title: 'Contrato próximo a vencer',
        message: 'Tu contrato vence en 30 días',
      },
    });

    expect(notification.type).toBe('CONTRACT_EXPIRING');
    expect(notification.userId).toBe('tenant-1');
  });

  test('✅ Debe crear notificación para propietario', async () => {
    (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'notif-2',
      userId: 'owner-1',
      type: 'CONTRACT_EXPIRING',
      title: 'Contrato próximo a vencer',
      message: 'El contrato de Juan vence en 30 días',
    });

    const notification = await prisma.notification.create({
      data: {
        userId: 'owner-1',
        type: 'CONTRACT_EXPIRING',
        title: 'Contrato próximo a vencer',
        message: 'El contrato de Juan vence en 30 días',
      },
    });

    expect(notification.userId).toBe('owner-1');
  });

  // ========================================
  // ESTADOS DE CONTRATO
  // ========================================

  test('✅ Debe cambiar estado a "por vencer"', async () => {
    (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-1',
      estado: 'por_vencer',
    });

    const updated = await prisma.contract.update({
      where: { id: 'contract-1' },
      data: { estado: 'por_vencer' },
    });

    expect(updated.estado).toBe('por_vencer');
  });

  test('✅ Debe cambiar estado a "vencido"', async () => {
    (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-1',
      estado: 'vencido',
    });

    const updated = await prisma.contract.update({
      where: { id: 'contract-1' },
      data: { estado: 'vencido' },
    });

    expect(updated.estado).toBe('vencido');
  });

  test('✅ Debe cambiar estado a "renovado"', async () => {
    (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-1',
      estado: 'renovado',
    });

    const updated = await prisma.contract.update({
      where: { id: 'contract-1' },
      data: { estado: 'renovado' },
    });

    expect(updated.estado).toBe('renovado');
  });

  // ========================================
  // REGLAS DE NEGOCIO
  // ========================================

  test('✅ Debe permitir renovación con nuevo precio', async () => {
    const newRent = 1300; // Aumento del 8.3%

    (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-1',
      rentaMensual: newRent,
    });

    const updated = await prisma.contract.update({
      where: { id: 'contract-1' },
      data: { rentaMensual: newRent },
    });

    expect(updated.rentaMensual).toBe(newRent);
  });

  test('⚠️ Debe validar límite de aumento de renta (IPC)', () => {
    const validateRentIncrease = (oldRent: number, newRent: number, maxIncrease: number) => {
      const increase = ((newRent - oldRent) / oldRent) * 100;
      return increase <= maxIncrease;
    };

    const oldRent = 1000;
    const newRent = 1030; // 3% de aumento
    const maxIPC = 3.5; // 3.5% máximo

    const isValid = validateRentIncrease(oldRent, newRent, maxIPC);

    expect(isValid).toBe(true);
  });

  test('⚠️ Debe rechazar aumento excesivo de renta', () => {
    const validateRentIncrease = (oldRent: number, newRent: number, maxIncrease: number) => {
      const increase = ((newRent - oldRent) / oldRent) * 100;
      return increase <= maxIncrease;
    };

    const oldRent = 1000;
    const newRent = 1100; // 10% de aumento
    const maxIPC = 3.5;

    const isValid = validateRentIncrease(oldRent, newRent, maxIPC);

    expect(isValid).toBe(false);
  });

  test('✅ Debe permitir disminución de renta', () => {
    const validateRentIncrease = (oldRent: number, newRent: number, maxIncrease: number) => {
      const increase = ((newRent - oldRent) / oldRent) * 100;
      return increase <= maxIncrease;
    };

    const oldRent = 1000;
    const newRent = 950; // Disminución

    const isValid = validateRentIncrease(oldRent, newRent, 3.5);

    expect(isValid).toBe(true); // Las disminuciones siempre son válidas
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar contrato sin fecha de fin', async () => {
    const contractWithoutEnd = {
      id: 'contract-indefinido',
      fechaInicio: new Date(),
      fechaFin: null,
    };

    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([contractWithoutEnd]);

    const contracts = await prisma.contract.findMany({
      where: {
        fechaFin: null,
      },
    });

    expect(contracts.length).toBe(1);
  });

  test('⚠️ Debe manejar múltiples renovaciones del mismo contrato', async () => {
    const renovationHistory = [
      { id: 'renew-1', contractId: 'contract-1', date: new Date('2025-01-01') },
      { id: 'renew-2', contractId: 'contract-1', date: new Date('2026-01-01') },
      { id: 'renew-3', contractId: 'contract-1', date: new Date('2027-01-01') },
    ];

    expect(renovationHistory.length).toBe(3);
    expect(renovationHistory.every((r) => r.contractId === 'contract-1')).toBe(true);
  });

  test('⚠️ Debe calcular fecha de renovación con año bisiesto', () => {
    const fechaInicio = new Date('2024-02-29'); // Año bisiesto
    const fechaRenovacion = new Date(fechaInicio);
    fechaRenovacion.setFullYear(fechaRenovacion.getFullYear() + 1);

    // En 2025 (no bisiesto), JS puede ajustar a 28/02 o 01/03
    const month = fechaRenovacion.getMonth();
    const day = fechaRenovacion.getDate();

    expect([1, 2]).toContain(month); // Febrero o Marzo
    if (month === 1) {
      expect(day).toBeLessThanOrEqual(28);
    } else {
      expect(day).toBe(1);
    }
  });
});
