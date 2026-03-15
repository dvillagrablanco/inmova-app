import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = {
  company: {
    findUnique: vi.fn(),
  },
  assetAcquisition: {
    findMany: vi.fn(),
  },
  building: {
    findMany: vi.fn(),
  },
  unit: {
    findMany: vi.fn(),
  },
  contract: {
    findMany: vi.fn(),
  },
  payment: {
    findMany: vi.fn(),
  },
  expense: {
    findMany: vi.fn(),
  },
  mortgage: {
    findMany: vi.fn(),
  },
  financialAccount: {
    findMany: vi.fn(),
  },
  financialPosition: {
    findMany: vi.fn(),
  },
  participation: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('investment-service consolidated report', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.company.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        const companies: Record<string, any> = {
          vidaro1: {
            id: 'vidaro1',
            nombre: 'Vidaro Inversiones S.L.',
            cif: 'A00000001',
            parentCompanyId: null,
            childCompanies: [
              {
                id: 'viroda1',
                nombre: 'Viroda Inversiones S.L.U.',
                cif: 'B00000002',
              },
              {
                id: 'rovida1',
                nombre: 'Rovida S.L.',
                cif: 'B00000003',
              },
            ],
          },
          viroda1: {
            id: 'viroda1',
            nombre: 'Viroda Inversiones S.L.U.',
            cif: 'B00000002',
            parentCompanyId: 'vidaro1',
            childCompanies: [],
          },
          rovida1: {
            id: 'rovida1',
            nombre: 'Rovida S.L.',
            cif: 'B00000003',
            parentCompanyId: 'vidaro1',
            childCompanies: [],
          },
        };

        return companies[where.id] || null;
      }
    );

    mockPrisma.assetAcquisition.findMany.mockResolvedValue([]);
    mockPrisma.building.findMany.mockResolvedValue([]);
    mockPrisma.unit.findMany.mockResolvedValue([]);
    mockPrisma.contract.findMany.mockResolvedValue([]);
    mockPrisma.payment.findMany.mockResolvedValue([]);
    mockPrisma.expense.findMany.mockResolvedValue([]);
    mockPrisma.mortgage.findMany.mockResolvedValue([]);
    mockPrisma.financialAccount.findMany.mockResolvedValue([]);
    mockPrisma.financialPosition.findMany.mockResolvedValue([]);
    mockPrisma.participation.findMany.mockResolvedValue([]);
  });

  it('si recibe una filial, consolida usando la matriz del grupo', async () => {
    const { getConsolidatedReport } = await import('@/lib/investment-service');

    const report = await getConsolidatedReport('viroda1');

    expect(report.companies.map((company) => company.companyId)).toEqual([
      'vidaro1',
      'viroda1',
      'rovida1',
    ]);
  });

  it('consolida datos financieros con deduplicación ISIN y anti-doble-conteo tesorería', async () => {
    mockPrisma.financialAccount.findMany.mockImplementation(async ({ where }: any) => {
      const companyIds = where?.companyId?.in || [where?.companyId];
      if (companyIds.includes('vidaro1')) {
        return [
          // Cuenta de inversión: saldo ≈ sum posiciones (NAV, NO liquidez)
          {
            id: 'acc1',
            saldoActual: 2000000,
            valorMercado: 2000000,
            positions: [
              { valorActual: 1200000 },
              { valorActual: 800000 },
            ],
          },
          // Cuenta corriente pura (sin posiciones = liquidez real)
          {
            id: 'acc2',
            saldoActual: 150000,
            valorMercado: 0,
            positions: [],
          },
        ];
      }
      return [];
    });

    mockPrisma.financialPosition.findMany.mockImplementation(async ({ where }: any) => {
      const companyIds = where?.account?.companyId?.in || [where?.account?.companyId];
      if (companyIds.includes('vidaro1')) {
        return [
          // Fondo A en cuenta 1
          { isin: 'LU0001', nombre: 'Fondo A', valorActual: 1200000, costeTotal: 1000000, pnlNoRealizado: 200000 },
          // Fondo B en cuenta 1
          { isin: 'LU0002', nombre: 'Fondo B', valorActual: 800000, costeTotal: 750000, pnlNoRealizado: 50000 },
          // Fondo A DUPLICADO en cuenta 2 (mismo ISIN, menor valor → se descarta)
          { isin: 'LU0001', nombre: 'Fondo A', valorActual: 500000, costeTotal: 400000, pnlNoRealizado: 100000 },
        ];
      }
      return [];
    });

    mockPrisma.participation.findMany.mockImplementation(async ({ where }: any) => {
      const companyIds = where?.companyId?.in || [where?.companyId];
      if (companyIds.includes('vidaro1')) {
        return [
          {
            costeAdquisicion: 300000,
            valorEstimado: 450000,
            compromisoTotal: 500000,
            capitalLlamado: 300000,
            capitalPendiente: 200000,
          },
        ];
      }
      return [];
    });

    const { getConsolidatedReport } = await import('@/lib/investment-service');
    const report = await getConsolidatedReport('vidaro1');

    const vidaro = report.companies.find((c) => c.companyId === 'vidaro1');
    expect(vidaro).toBeDefined();

    // Tesorería: solo la cuenta corriente (150K), NO la cuenta de inversión (saldo ≈ posiciones)
    expect(vidaro!.portfolio.totalTesoreria).toBe(150000);

    // Financiero: deduplicado por ISIN: LU0001=1.2M (max) + LU0002=800K = 2M (NO 2.5M)
    expect(vidaro!.portfolio.totalFinanciero).toBe(2000000);

    // PE
    expect(vidaro!.portfolio.totalPE).toBe(450000);

    // Patrimonio total = equity(0) + tesoreria(150K) + financiero(2M) + PE(450K) = 2.6M
    expect(vidaro!.portfolio.patrimonioTotal).toBe(2600000);

    // Consolidated
    expect(report.consolidated.totalTesoreria).toBe(150000);
    expect(report.consolidated.totalFinanciero).toBe(2000000);
    expect(report.consolidated.patrimonioTotal).toBe(2600000);
  });
});
