import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetServerSession, mockResolveFamilyOfficeScope, mockPrisma } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockResolveFamilyOfficeScope: vi.fn(),
  mockPrisma: {
    financialAccount: {
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

vi.mock('@/lib/family-office-scope', () => ({
  resolveFamilyOfficeScope: mockResolveFamilyOfficeScope,
}));

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

describe('GET /api/family-office/bank-status', () => {
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
  });

  it('incluye entidades dinámicas no contempladas en el catálogo fijo', async () => {
    mockPrisma.financialAccount.findMany.mockResolvedValue([
      {
        id: 'acc-bankinter',
        entidad: 'Bankinter',
        tipoEntidad: 'banca_comercial',
        numeroCuenta: 'ES11',
        alias: 'Bankinter Principal',
        divisa: 'EUR',
        saldoActual: 1000,
        valorMercado: 500,
        conexionTipo: 'psd2',
        ultimaSync: new Date('2026-03-12T08:00:00.000Z'),
        apiConfig: { entityId: 'bankinter' },
        _count: { positions: 1, transactions: 2 },
      },
      {
        id: 'acc-andbank',
        entidad: 'AndBank',
        tipoEntidad: 'banca_privada',
        numeroCuenta: 'ES22',
        alias: 'AndBank Wealth',
        divisa: 'EUR',
        saldoActual: 2000,
        valorMercado: 1500,
        conexionTipo: 'swift',
        ultimaSync: null,
        apiConfig: null,
        _count: { positions: 0, transactions: 0 },
      },
    ]);

    const { GET } = await import('@/app/api/family-office/bank-status/route');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/family-office/bank-status')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.resumen.cuentasTotales).toBe(2);
    expect(payload.resumen.saldoTotal).toBe(3000);
    expect(payload.resumen.valorMercadoTotal).toBe(2000);
    expect(payload.resumen.entidadesConectadas).toBe(2);
    expect(payload.resumen.entidadesTotales).toBeGreaterThan(9);

    const bankinter = payload.entidades.find((entity: { id: string }) => entity.id === 'bankinter');
    const andbank = payload.entidades.find((entity: { name: string }) => entity.name === 'AndBank');

    expect(bankinter).toBeDefined();
    expect(bankinter.accounts).toHaveLength(1);
    expect(andbank).toBeDefined();
    expect(andbank.connected).toBe(true);
    expect(andbank.accounts).toHaveLength(1);
  });
});
