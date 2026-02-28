/**
 * Tests para fiscal-models-service.ts
 * Verifica la generación de modelos tributarios españoles (202, 200, 303, 347)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  getPrismaClient: vi.fn(() => ({
    company: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'company1',
        nombre: 'Viroda SL',
        cif: 'B12345678',
      }),
    },
    payment: { findMany: vi.fn().mockResolvedValue([]) },
    commercialPayment: { findMany: vi.fn().mockResolvedValue([]) },
    expense: { findMany: vi.fn().mockResolvedValue([]) },
    depreciationEntry: { findMany: vi.fn().mockResolvedValue([]) },
    mortgagePayment: { findMany: vi.fn().mockResolvedValue([]) },
    building: { findMany: vi.fn().mockResolvedValue([]) },
  })),
}));

// Mock investment service (for calculateFiscalSummary)
vi.mock('@/lib/investment-service', () => ({
  calculateFiscalSummary: vi.fn().mockResolvedValue({
    companyId: 'company1',
    companyName: 'Viroda SL',
    year: 2025,
    ingresosBrutos: 120000,
    gastosDeducibles: 30000,
    amortizaciones: 10000,
    interesesHipoteca: 8000,
    baseImponible: 72000,
    cuotaIS: 18000,
    tipoEfectivo: 15,
    pagosFraccionados: [
      { trimestre: 1, importe: 3240 },
      { trimestre: 2, importe: 3240 },
      { trimestre: 3, importe: 3240 },
    ],
  }),
}));

describe('fiscal-models-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateModelo202', () => {
    it('genera modelo 202 con datos correctos', async () => {
      const { generateModelo202 } = await import('@/lib/fiscal-models-service');
      const result = await generateModelo202('company1', 2026, '1P');

      expect(result.modelo).toBe('202');
      expect(result.companyName).toBe('Viroda SL');
      expect(result.cif).toBe('B12345678');
      expect(result.ejercicio).toBe(2026);
      expect(result.periodo).toBe('1P');
      expect(result.porcentajePagoFraccionado).toBe(18);
      expect(result.baseImponibleUltimoIS).toBeGreaterThanOrEqual(0);
      expect(result.importePagoFraccionado).toBeGreaterThanOrEqual(0);
      expect(result.fechaLimite).toContain('abril');
    });

    it('genera cada periodo correctamente', async () => {
      const { generateModelo202 } = await import('@/lib/fiscal-models-service');

      const p1 = await generateModelo202('company1', 2026, '1P');
      const p2 = await generateModelo202('company1', 2026, '2P');
      const p3 = await generateModelo202('company1', 2026, '3P');

      expect(p1.fechaLimite).toContain('abril');
      expect(p2.fechaLimite).toContain('octubre');
      expect(p3.fechaLimite).toContain('diciembre');
    });
  });

  describe('generateModelo200', () => {
    it('genera modelo 200 con estructura completa', async () => {
      const { generateModelo200 } = await import('@/lib/fiscal-models-service');
      const result = await generateModelo200('company1', 2025);

      expect(result.modelo).toBe('200');
      expect(result.tipoImpositivo).toBe(25);
      expect(result.ejercicio).toBe(2025);
      expect(result.resultadoDeclaracion).toMatch(/a_ingresar|a_devolver|cero/);
      expect(result.importeFinal).toBeGreaterThanOrEqual(0);
      expect(result.fechaLimite).toContain('julio');
    });

    it('calcula base imponible correctamente', async () => {
      const { generateModelo200 } = await import('@/lib/fiscal-models-service');
      const result = await generateModelo200('company1', 2025);

      // Base = ingresos - gastos - amortizaciones - intereses
      expect(result.baseImponible).toBeGreaterThanOrEqual(0);
      expect(result.cuotaIntegra).toBe(
        Math.round(result.baseImponible * result.tipoImpositivo / 100 * 100) / 100
      );
    });
  });

  describe('generateModelo303', () => {
    it('genera modelo 303 para cada trimestre', async () => {
      const { generateModelo303 } = await import('@/lib/fiscal-models-service');

      for (const t of [1, 2, 3, 4] as const) {
        const result = await generateModelo303('company1', 2026, t);
        expect(result.modelo).toBe('303');
        expect(result.trimestre).toBe(t);
        expect(result.tipoIVA).toBe(21);
        expect(result.ivaRepercutido).toBeGreaterThanOrEqual(0);
        expect(result.ivaSoportado).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('generateModelo347', () => {
    it('genera modelo 347 con umbral correcto', async () => {
      const { generateModelo347 } = await import('@/lib/fiscal-models-service');
      const result = await generateModelo347('company1', 2025);

      expect(result.modelo).toBe('347');
      expect(result.umbral).toBe(3005.06);
      expect(Array.isArray(result.operaciones)).toBe(true);
      expect(result.totalOperaciones).toBe(result.operaciones.length);
    });
  });
});
