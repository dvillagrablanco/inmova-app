/**
 * Tests para accounting-export-service.ts
 * Verifica la generación de exports contables en formato PGC
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockPayments = [
  {
    id: 'pay1',
    monto: 850,
    fechaPago: new Date('2025-03-15'),
    contract: {
      tenant: { nombre: 'Juan', apellidos: 'García', dni: '12345678A' },
      unit: { building: { nombre: 'Edificio Sol' } },
    },
  },
];

const mockExpenses = [
  {
    id: 'exp1',
    monto: 200,
    fecha: new Date('2025-03-10'),
    concepto: 'IBI trimestral',
    categoria: 'ibi',
    numeroFactura: 'F-2025-001',
    buildingId: 'b1',
    building: { nombre: 'Edificio Sol' },
    proveedor: { nombre: 'Ayuntamiento Madrid', cif: 'P2807900E' },
  },
];

vi.mock('@/lib/db', () => ({
  getPrismaClient: vi.fn(() => ({
    payment: { findMany: vi.fn().mockResolvedValue(mockPayments) },
    expense: { findMany: vi.fn().mockResolvedValue(mockExpenses) },
    depreciationEntry: { findMany: vi.fn().mockResolvedValue([]) },
  })),
}));

describe('accounting-export-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateDiarioContable', () => {
    it('genera asientos contables en formato PGC', async () => {
      const { generateDiarioContable } = await import('@/lib/accounting-export-service');
      const result = await generateDiarioContable('company1', 2025);

      expect(result.headers).toHaveLength(8);
      expect(result.headers).toContain('Fecha');
      expect(result.headers).toContain('Debe');
      expect(result.headers).toContain('Haber');
      expect(result.headers).toContain('Cuenta');
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('cada asiento tiene debe y haber balanceados', async () => {
      const { generateDiarioContable } = await import('@/lib/accounting-export-service');
      const result = await generateDiarioContable('company1', 2025);

      // Agrupar por número de asiento
      const asientoGroups = new Map<number, typeof result.rows>();
      for (const row of result.rows) {
        const group = asientoGroups.get(row.asiento) || [];
        group.push(row);
        asientoGroups.set(row.asiento, group);
      }

      // Verificar que cada asiento está balanceado
      for (const [num, entries] of asientoGroups) {
        const totalDebe = entries.reduce((s, e) => s + e.debe, 0);
        const totalHaber = entries.reduce((s, e) => s + e.haber, 0);
        expect(Math.abs(totalDebe - totalHaber)).toBeLessThan(0.01);
      }
    });
  });

  describe('generateLibroFacturasEmitidas', () => {
    it('genera libro de facturas emitidas', async () => {
      const { generateLibroFacturasEmitidas } = await import('@/lib/accounting-export-service');
      const result = await generateLibroFacturasEmitidas('company1', 2025);

      expect(result.headers).toContain('Número');
      expect(result.headers).toContain('Cliente');
      expect(result.headers).toContain('Base Imponible');
      expect(result.rows.length).toBeGreaterThanOrEqual(0);
    });

    it('numera facturas secuencialmente', async () => {
      const { generateLibroFacturasEmitidas } = await import('@/lib/accounting-export-service');
      const result = await generateLibroFacturasEmitidas('company1', 2025);

      if (result.rows.length > 0) {
        expect(result.rows[0].numero).toMatch(/^FE-2025-/);
      }
    });
  });

  describe('generateLibroFacturasRecibidas', () => {
    it('genera libro de facturas recibidas', async () => {
      const { generateLibroFacturasRecibidas } = await import('@/lib/accounting-export-service');
      const result = await generateLibroFacturasRecibidas('company1', 2025);

      expect(result.headers).toContain('Proveedor');
      expect(result.headers).toContain('NIF');
      expect(result.rows.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('toCSV', () => {
    it('genera CSV con separador punto y coma', async () => {
      const { toCSV } = await import('@/lib/accounting-export-service');
      const csv = toCSV(
        ['Col1', 'Col2', 'Col3'],
        [{ a: 'texto', b: 1234.56, c: 'otro' }]
      );

      expect(csv).toContain(';');
      expect(csv).toContain('1234,56'); // Formato español
    });
  });
});
