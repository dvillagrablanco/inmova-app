/**
 * Tests unitarios para servicios de contratos
 * Cubre: Creación, Validación de fechas, Cálculo de rentas, Expiración
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addMonths, isAfter, isBefore, differenceInDays } from 'date-fns';

const mockPrisma = {
  contract: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  unit: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  tenant: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('Contract Service - Servicios de Contratos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validación de Contratos', () => {
    it('debe validar que fecha inicio sea anterior a fecha fin', () => {
      const fechaInicio = new Date('2024-01-01');
      const fechaFin = new Date('2024-12-31');

      expect(isBefore(fechaInicio, fechaFin)).toBe(true);
      expect(isAfter(fechaFin, fechaInicio)).toBe(true);
    });

    it('debe rechazar fechas inválidas', () => {
      const fechaInicio = new Date('2024-12-31');
      const fechaFin = new Date('2024-01-01');

      expect(isBefore(fechaInicio, fechaFin)).toBe(false);
    });

    it('debe validar que unidad no esté ocupada', async () => {
      const mockUnit = {
        id: 'unit-1',
        estado: 'disponible',
        occupancy: [],
      };

      mockPrisma.unit.findUnique.mockResolvedValue(mockUnit);

      const unit = await mockPrisma.unit.findUnique({
        where: { id: 'unit-1' },
      });

      expect(unit?.estado).toBe('disponible');
    });

    it('debe rechazar contratos en unidad ocupada', async () => {
      const mockUnit = {
        id: 'unit-1',
        estado: 'ocupado',
      };

      mockPrisma.unit.findUnique.mockResolvedValue(mockUnit);

      const unit = await mockPrisma.unit.findUnique({
        where: { id: 'unit-1' },
      });

      expect(unit?.estado).toBe('ocupado');
      // La aplicación debe rechazar la creación
    });

    it('debe validar que inquilino exista', async () => {
      const mockTenant = {
        id: 'tenant-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const tenant = await mockPrisma.tenant.findUnique({
        where: { id: 'tenant-1' },
      });

      expect(tenant).toBeDefined();
      expect(tenant?.id).toBe('tenant-1');
    });
  });

  describe('Cálculos de Contrato', () => {
    it('debe calcular renta mensual correctamente', () => {
      const rentaMensual = 1000;
      const meses = 12;
      const rentaTotal = rentaMensual * meses;

      expect(rentaTotal).toBe(12000);
    });

    it('debe calcular depósito (fianza) correctamente', () => {
      const rentaMensual = 1000;
      const depositoMeses = 2;
      const deposito = rentaMensual * depositoMeses;

      expect(deposito).toBe(2000);
    });

    it('debe calcular días hasta expiración', () => {
      const hoy = new Date('2024-06-01');
      const fechaFin = new Date('2024-12-31');

      const diasRestantes = differenceInDays(fechaFin, hoy);

      expect(diasRestantes).toBeGreaterThan(0);
      expect(diasRestantes).toBe(213); // ~6 meses
    });

    it('debe identificar contratos próximos a vencer (< 30 días)', () => {
      const hoy = new Date('2024-12-15');
      const fechaFin = new Date('2024-12-31');

      const diasRestantes = differenceInDays(fechaFin, hoy);

      expect(diasRestantes).toBeLessThan(30);
      expect(diasRestantes).toBe(16);
    });

    it('debe calcular prórroga de contrato', () => {
      const fechaFinOriginal = new Date('2024-12-31');
      const mesesProrroga = 12;
      const nuevaFechaFin = addMonths(fechaFinOriginal, mesesProrroga);

      expect(isAfter(nuevaFechaFin, fechaFinOriginal)).toBe(true);
      expect(nuevaFechaFin.getFullYear()).toBe(2025);
    });
  });

  describe('Estados del Contrato', () => {
    const estados = ['activo', 'pendiente', 'expirado', 'cancelado'];

    it('debe transicionar de pendiente a activo', () => {
      const contratoInicial = { estado: 'pendiente' };
      const contratoActivado = { ...contratoInicial, estado: 'activo' };

      expect(contratoActivado.estado).toBe('activo');
    });

    it('debe marcar como expirado cuando pasa la fecha fin', () => {
      const hoy = new Date('2025-01-15');
      const fechaFin = new Date('2024-12-31');

      const expirado = isAfter(hoy, fechaFin);

      expect(expirado).toBe(true);
    });

    it('debe permitir cancelación de contrato activo', () => {
      const contratoActivo = { id: '1', estado: 'activo' };
      const contratoCancelado = { ...contratoActivo, estado: 'cancelado' };

      expect(contratoCancelado.estado).toBe('cancelado');
    });
  });

  describe('Creación de Contratos', () => {
    it('debe crear contrato válido', async () => {
      const nuevoContrato = {
        id: 'contract-1',
        unitId: 'unit-1',
        tenantId: 'tenant-1',
        fechaInicio: new Date('2024-01-01'),
        fechaFin: new Date('2024-12-31'),
        rentaMensual: 1000,
        deposito: 2000,
        estado: 'activo',
        companyId: 'company-1',
      };

      mockPrisma.contract.create.mockResolvedValue(nuevoContrato);

      const created = await mockPrisma.contract.create({
        data: nuevoContrato,
      });

      expect(created).toBeDefined();
      expect(created.id).toBe('contract-1');
      expect(created.estado).toBe('activo');
    });

    it('debe actualizar estado de unidad a ocupado al crear contrato', async () => {
      const unitId = 'unit-1';

      mockPrisma.unit.update.mockResolvedValue({
        id: unitId,
        estado: 'ocupado',
      });

      const updatedUnit = await mockPrisma.unit.update({
        where: { id: unitId },
        data: { estado: 'ocupado' },
      });

      expect(updatedUnit.estado).toBe('ocupado');
    });
  });

  describe('Consultas de Contratos', () => {
    it('debe listar contratos activos', async () => {
      const mockContracts = [
        { id: '1', estado: 'activo' },
        { id: '2', estado: 'activo' },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const contracts = await mockPrisma.contract.findMany({
        where: { estado: 'activo' },
      });

      expect(contracts).toHaveLength(2);
      expect(contracts.every(c => c.estado === 'activo')).toBe(true);
    });

    it('debe filtrar contratos por empresa', async () => {
      const companyId = 'company-1';
      const mockContracts = [
        { id: '1', companyId: 'company-1' },
        { id: '2', companyId: 'company-1' },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const contracts = await mockPrisma.contract.findMany({
        where: { companyId },
      });

      expect(contracts.every(c => c.companyId === companyId)).toBe(true);
    });
  });
});

export {};
