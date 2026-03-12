import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockGetServerSession,
  mockCheckAILimit,
  mockLogUsageWarning,
  mockTrackUsage,
  mockGetAggregatedMarketData,
  mockAnalyzeAndValuateProperty,
  mockResolveCompanyScope,
  mockCreateUnifiedValuation,
  mockPrisma,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockCheckAILimit: vi.fn(),
  mockLogUsageWarning: vi.fn(),
  mockTrackUsage: vi.fn(),
  mockGetAggregatedMarketData: vi.fn(),
  mockAnalyzeAndValuateProperty: vi.fn(),
  mockResolveCompanyScope: vi.fn(),
  mockCreateUnifiedValuation: vi.fn(),
  mockPrisma: {
    unit: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    propertyValuation: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

vi.mock('@/lib/usage-limits', () => ({
  checkAILimit: mockCheckAILimit,
  createLimitExceededResponse: vi.fn(),
  logUsageWarning: mockLogUsageWarning,
}));

vi.mock('@/lib/usage-tracking-service', () => ({
  trackUsage: mockTrackUsage,
}));

vi.mock('@/lib/external-platform-data-service', () => ({
  getAggregatedMarketData: mockGetAggregatedMarketData,
  formatPlatformDataForPrompt: vi.fn(() => 'platform data'),
}));

vi.mock('@/lib/ai-property-analysis', () => ({
  analyzeAndValuateProperty: mockAnalyzeAndValuateProperty,
}));

vi.mock('@/lib/company-scope', () => ({
  resolveCompanyScope: mockResolveCompanyScope,
}));

vi.mock('@/lib/claude-ai-service', () => ({
  isClaudeConfigured: vi.fn(() => true),
}));

vi.mock('@/lib/unified-valuation-service', () => ({
  createUnifiedValuation: mockCreateUnifiedValuation,
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

describe('POST /api/ai/valuate', () => {
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

    mockCheckAILimit.mockResolvedValue({ allowed: true });
    mockGetAggregatedMarketData.mockResolvedValue({
      sourcesUsed: ['internal_db'],
      allComparables: [],
      platformData: [],
      sourcesFailed: [],
      overallReliability: 70,
      weightedSalePricePerM2: 3500,
      weightedRentPricePerM2: 14,
      marketTrend: 'STABLE',
      trendPercentage: 0,
      demandLevel: 'media',
      avgDaysOnMarket: 60,
      dataFreshness: 'current',
    });
    mockAnalyzeAndValuateProperty.mockResolvedValue({
      estimatedValue: 250000,
      minValue: 230000,
      maxValue: 270000,
      precioM2: 5000,
      confidenceScore: 82,
      reasoning: 'ok',
      analisisMercado: 'ok',
      metodologiaUsada: 'ok',
      tendenciaMercado: 'estable',
      porcentajeTendencia: 0,
      tiempoEstimadoVenta: '3 meses',
      alquilerEstimado: 1200,
      rentabilidadAlquiler: 5,
      capRate: 4.5,
      alquilerMediaEstancia: null,
      alquilerMediaEstanciaMin: null,
      alquilerMediaEstanciaMax: null,
      rentabilidadMediaEstancia: null,
      perfilInquilinoMediaEstancia: null,
      ocupacionEstimadaMediaEstancia: null,
      factoresPositivos: [],
      factoresNegativos: [],
      recomendaciones: [],
      comparables: [],
      phase1Summary: 'ok',
      sourcesUsed: ['internal_db', 'claude_ai'],
    });
    mockTrackUsage.mockResolvedValue(undefined);
    mockCreateUnifiedValuation.mockResolvedValue({ id: 'valuation-1' });
    mockPrisma.propertyValuation.create.mockResolvedValue(undefined);
    mockPrisma.auditLog.create.mockResolvedValue(undefined);
  });

  it('enriquece desde la unidad y usa el tipo real del activo', async () => {
    mockPrisma.unit.findFirst.mockResolvedValueOnce({
      id: 'unit-1',
      tipo: 'local',
      superficie: 95,
      habitaciones: 0,
      banos: 1,
      planta: 0,
      orientacion: null,
      referenciaCatastral: '0742703VK4704B0002DF',
      precioCompra: 180000,
      valorMercado: 210000,
      rentaMensual: 1350,
      aireAcondicionado: true,
      calefaccion: false,
      terraza: false,
      buildingId: 'building-1',
      building: {
        companyId: 'rovida1',
        direccion: 'Calle Prado 10, Madrid 28014',
        referenciaCatastral: '0742703VK4704B',
        anoConstructor: 1910,
        ascensor: false,
        garaje: false,
        trastero: false,
        piscina: false,
        jardin: false,
        tipo: 'comercial',
      },
    });
    mockPrisma.unit.findMany.mockResolvedValue([
      {
        id: 'unit-2',
        numero: 'B',
        superficie: 90,
        rentaMensual: 1400,
        precioCompra: 175000,
        valorMercado: 220000,
        habitaciones: 0,
        banos: 1,
        building: { direccion: 'Calle Prado 10, Madrid 28014' },
      },
    ]);

    const { POST } = await import('@/app/api/ai/valuate/route');
    const response = await POST(
      new NextRequest('http://localhost:3000/api/ai/valuate', {
        method: 'POST',
        body: JSON.stringify({
          unitId: 'unit-1',
          superficie: 95,
          habitaciones: 0,
          banos: 1,
          tipoActivo: 'vivienda',
          direccion: '',
          ciudad: '',
          codigoPostal: '',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mockGetAggregatedMarketData).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'rovida1',
        city: 'Madrid',
        postalCode: '28014',
        address: 'Calle Prado 10, Madrid 28014',
        propertyType: 'local_comercial',
      })
    );
    expect(mockAnalyzeAndValuateProperty).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyType: 'local_comercial',
        city: 'Madrid',
        postalCode: '28014',
        address: 'Calle Prado 10, Madrid 28014',
        squareMeters: 95,
        bathrooms: 1,
        yearBuilt: 1910,
      }),
      expect.anything(),
      expect.anything(),
      expect.stringContaining('220000€')
    );
  });
});
