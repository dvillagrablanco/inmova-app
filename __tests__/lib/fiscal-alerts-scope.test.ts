import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = {
  company: {
    findUnique: vi.fn(),
  },
  mortgage: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('fiscal-alerts-service scope filial->grupo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T10:00:00Z'));

    mockPrisma.company.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === 'viroda1') {
          return {
            id: 'viroda1',
            nombre: 'Viroda Inversiones S.L.U.',
            parentCompanyId: 'vidaro1',
            childCompanies: [],
          };
        }

        if (where.id === 'vidaro1') {
          return {
            id: 'vidaro1',
            nombre: 'Vidaro Inversiones S.L.',
            childCompanies: [
              { id: 'viroda1', nombre: 'Viroda Inversiones S.L.U.' },
              { id: 'rovida1', nombre: 'Rovida S.L.' },
            ],
          };
        }

        return null;
      }
    );

    mockPrisma.mortgage.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('si la sociedad activa es filial, incluye la matriz y las hermanas', async () => {
    const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');

    const alerts = await getFiscalAlerts('viroda1');
    const companyIds = new Set(alerts.map((alert) => alert.companyId));

    expect(companyIds).toEqual(new Set(['vidaro1', 'viroda1', 'rovida1']));
  });
});
