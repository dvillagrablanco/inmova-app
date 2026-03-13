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

  it('consolida datos financieros, PE y tesorería en patrimonioTotal', async () => {
    // Vidaro tiene cuentas financieras y participaciones PE
    mockPrisma.financialAccount.findMany.mockImplementation(async ({ where }: any) => {
      const companyIds = where?.companyId?.in || [where?.companyId];
      if (companyIds.includes('vidaro1')) {
        return [{ saldoActual: 500000, valorMercado: 2000000 }];
      }
      return [];
    });

    mockPrisma.financialPosition.findMany.mockImplementation(async ({ where }: any) => {
      // Positions linked to Vidaro's accounts
      const companyIds = where?.account?.companyId?.in || [where?.account?.companyId];
      if (companyIds.includes('vidaro1')) {
        return [
          { valorActual: 1200000, costeTotal: 1000000, pnlNoRealizado: 200000 },
          { valorActual: 800000, costeTotal: 750000, pnlNoRealizado: 50000 },
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

    // Vidaro's portfolio should have financial data
    const vidaro = report.companies.find((c) => c.companyId === 'vidaro1');
    expect(vidaro).toBeDefined();
    expect(vidaro!.portfolio.totalTesoreria).toBe(500000);
    expect(vidaro!.portfolio.totalFinanciero).toBe(2000000); // 1.2M + 800K
    expect(vidaro!.portfolio.pnlFinanciero).toBe(250000); // 200K + 50K
    expect(vidaro!.portfolio.totalPE).toBe(450000); // valorEstimado
    expect(vidaro!.portfolio.totalCapitalPendientePE).toBe(200000);

    // Consolidated should aggregate correctly
    expect(report.consolidated.totalTesoreria).toBe(500000);
    expect(report.consolidated.totalFinanciero).toBe(2000000);
    expect(report.consolidated.totalPE).toBe(450000);
    // patrimonioTotal = equity(0) + tesoreria(500K) + financiero(2M) + PE(450K)
    expect(report.consolidated.patrimonioTotal).toBe(2950000);
  });
});
