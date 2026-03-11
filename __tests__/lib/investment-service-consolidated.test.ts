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
});
