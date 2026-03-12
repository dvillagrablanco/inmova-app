import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetServerSession, mockResolveFamilyOfficeScope, mockPrisma } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockResolveFamilyOfficeScope: vi.fn(),
  mockPrisma: {
    financialAccount: {
      findMany: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    mortgage: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

vi.mock('@/lib/family-office-scope', async () => {
  const actual = await vi.importActual<typeof import('@/lib/family-office-scope')>(
    '@/lib/family-office-scope'
  );

  return {
    ...actual,
    resolveFamilyOfficeScope: mockResolveFamilyOfficeScope,
  };
});

vi.mock('@/lib/db', () => ({
  getPrismaClient: () => mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GET /api/family-office/treasury-forecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-1',
        companyId: 'vidaro1',
        role: 'super_admin',
      },
    });

    mockResolveFamilyOfficeScope.mockResolvedValue({
      activeCompanyId: 'vidaro1',
      rootCompanyId: 'vidaro1',
      rootCompanyName: 'Vidaro Inversiones S.L.',
      groupCompanyIds: ['vidaro1', 'rovida1', 'viroda1'],
    });

    mockPrisma.contract.findMany.mockResolvedValue([{ rentaMensual: 1000 }]);
    mockPrisma.expense.findMany.mockResolvedValue([{ monto: 300 }]);
    mockPrisma.mortgage.findMany.mockResolvedValue([{ cuotaMensual: 200 }]);
  });

  it('excluye de la liquidez el saldo que duplica el NAV de posiciones', async () => {
    mockPrisma.financialAccount.findMany.mockResolvedValue([
      {
        saldoActual: 100000,
        entidad: 'Custodio',
        alias: 'Cuenta cartera',
        positions: [{ valorActual: 98000 }],
      },
      {
        saldoActual: 25000,
        entidad: 'Banco Operativo',
        alias: 'Cuenta corriente',
        positions: [],
      },
    ]);

    const { GET } = await import('@/app/api/family-office/treasury-forecast/route');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/family-office/treasury-forecast')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.saldoActual).toBe(25000);
    expect(payload.porEntidad).toEqual([{ entidad: 'Banco Operativo', saldo: 25000 }]);
    expect(payload.flujosMensuales.netoMensual).toBe(750);
    expect(payload.forecast[0].saldoProyectado).toBe(25750);
  });
});
