import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetServerSession, mockResolveCompanyScope, mockCreateUnifiedValuation, mockPrisma } =
  vi.hoisted(() => ({
    mockGetServerSession: vi.fn(),
    mockResolveCompanyScope: vi.fn(),
    mockCreateUnifiedValuation: vi.fn(),
    mockPrisma: {
      propertyValuation: {
        findMany: vi.fn(),
      },
      valoracionPropiedad: {
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

vi.mock('@/lib/company-scope', () => ({
  resolveCompanyScope: mockResolveCompanyScope,
}));

vi.mock('@/lib/rate-limiting', () => ({
  withRateLimit: (_req: unknown, handler: () => Promise<Response>) => handler(),
}));

vi.mock('@/lib/unified-valuation-service', () => ({
  createUnifiedValuation: mockCreateUnifiedValuation,
  normalizeLegacyValuation: (record: any) => ({
    id: record.id,
    address: record.direccion,
    city: record.municipio,
    createdAt: record.fechaValoracion,
    estimatedValue: record.valorEstimado,
    confidenceScore: record.confianzaValoracion,
    sourceModel: 'legacy',
  }),
  normalizeModernValuation: (record: any) => ({
    ...record,
    sourceModel: 'modern',
  }),
}));

vi.mock('@/lib/db', () => ({
  getPrismaClient: () => mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('/api/valuations route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-1',
        companyId: 'vidaro1',
        role: 'super_admin',
      },
    });

    mockResolveCompanyScope.mockResolvedValue({
      activeCompanyId: 'vidaro1',
      accessibleCompanyIds: ['vidaro1', 'rovida1'],
      scopeCompanyIds: ['vidaro1', 'rovida1'],
      isConsolidated: true,
    });
  });

  it('mezcla valoraciones modernas y legacy en el historial', async () => {
    mockPrisma.propertyValuation.findMany.mockResolvedValue([
      {
        id: 'new-1',
        address: 'Calle Nueva 1',
        city: 'Madrid',
        createdAt: '2026-03-12T10:00:00.000Z',
        estimatedValue: 300000,
        confidenceScore: 80,
      },
    ]);
    mockPrisma.valoracionPropiedad.findMany.mockResolvedValue([
      {
        id: 'old-1',
        direccion: 'Calle Antigua 2',
        municipio: 'Madrid',
        fechaValoracion: '2026-03-11T10:00:00.000Z',
        valorEstimado: 250000,
        confianzaValoracion: 72,
      },
    ]);

    const { GET } = await import('@/app/api/valuations/route');
    const response = await GET(new NextRequest('http://localhost:3000/api/valuations?limit=10'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(2);
    expect(payload.data[0].sourceModel).toBe('modern');
    expect(payload.data[1].sourceModel).toBe('legacy');
  });

  it('usa la persistencia unificada al guardar', async () => {
    mockCreateUnifiedValuation.mockResolvedValue({ id: 'valuation-1' });

    const { POST } = await import('@/app/api/valuations/route');
    const response = await POST(
      new NextRequest('http://localhost:3000/api/valuations', {
        method: 'POST',
        body: JSON.stringify({
          direccion: 'Calle Prado 10',
          ciudad: 'Madrid',
          superficie: 100,
          resultado: {
            valorEstimado: 500000,
            valorMinimo: 450000,
            valorMaximo: 550000,
            precioM2: 5000,
            confianza: 82,
          },
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateUnifiedValuation).toHaveBeenCalledOnce();
    expect(payload.data.id).toBe('valuation-1');
  });
});
