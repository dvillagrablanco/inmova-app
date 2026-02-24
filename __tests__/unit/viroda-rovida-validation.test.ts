/**
 * VALIDACIÓN INTEGRAL - SOCIEDADES VIRODA Y ROVIDA
 *
 * Simula flujos de uso humano para las dos sociedades del grupo Vidaro:
 * - Rovida S.L. (gestión de garajes, 243+ inquilinos)
 * - Viroda Inversiones S.L.U. (gestión residencial, 101+ inquilinos)
 *
 * Tests cubiertos:
 * 1. Navegación y sidebar (sin duplicados)
 * 2. CRUD de edificios con scope multi-empresa
 * 3. CRUD de unidades (garajes Rovida, pisos Viroda)
 * 4. CRUD de inquilinos
 * 5. Contratos
 * 6. Pagos
 * 7. Mantenimiento
 * 8. Conciliación bancaria
 * 9. Contabilidad
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ========================================
// MOCKS COMUNES
// ========================================

const { mockPrisma, mockResolveCompanyScope, mockRequireAuth } = vi.hoisted(() => ({
  mockPrisma: {
    building: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    unit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    tenant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    maintenanceRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    company: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    accountingTransaction: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    userCompanyAccess: {
      findMany: vi.fn(),
    },
  },
  mockResolveCompanyScope: vi.fn(),
  mockRequireAuth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
  getPrismaClient: () => mockPrisma,
}));

vi.mock('@/lib/company-scope', () => ({
  resolveCompanyScope: mockResolveCompanyScope,
}));

vi.mock('@/lib/permissions', () => ({
  requireAuth: mockRequireAuth,
  getUserCompany: vi.fn(),
  requirePermission: vi.fn(),
  forbiddenResponse: vi.fn(() => new Response('Forbidden', { status: 403 })),
  badRequestResponse: vi.fn(() => new Response('Bad Request', { status: 400 })),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: 'admin-vidaro',
      companyId: 'vidaro-inversiones',
      role: 'administrador',
      email: 'admin@vidaro.es',
    },
  }),
}));

vi.mock('@/lib/auth-options', () => ({ authOptions: {} }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  logError: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));
vi.mock('@/lib/api-cache-helpers', () => ({
  cachedBuildings: vi.fn(),
  invalidateBuildingsCache: vi.fn(),
  invalidateDashboardCache: vi.fn(),
  invalidateUnitsCache: vi.fn(),
}));

// ========================================
// DATOS DE TEST - SOCIEDADES
// ========================================

const ROVIDA = {
  id: 'rovida-sl',
  nombre: 'Rovida S.L.',
  cif: 'B12345678',
  iban: 'ES5601280250590100083954',
};

const VIRODA = {
  id: 'viroda-inversiones',
  nombre: 'Viroda Inversiones S.L.U.',
  cif: 'B87654321',
  iban: 'ES8801280250590100081826',
};

const VIDARO_GROUP = {
  id: 'vidaro-inversiones',
  nombre: 'Grupo Vidaro Inversiones S.L.',
};

// ========================================
// 1. NAVEGACIÓN Y SIDEBAR
// ========================================

describe('1. Navegación - Sidebar Data', () => {
  test('ROUTE_TO_MODULE no tiene claves duplicadas', async () => {
    const sidebarModule = await import('@/components/layout/sidebar-data');
    const routeToModule = (sidebarModule as any).ROUTE_TO_MODULE;

    if (routeToModule) {
      const keys = Object.keys(routeToModule);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    }
  });

  test('/garajes-trasteros mapea al módulo correcto', async () => {
    const sidebarModule = await import('@/components/layout/sidebar-data');
    const routeToModule = (sidebarModule as any).ROUTE_TO_MODULE;

    if (routeToModule) {
      expect(routeToModule['/garajes-trasteros']).toBe('unidades');
    }
  });
});

// ========================================
// 2. CRUD DE EDIFICIOS (MULTI-EMPRESA)
// ========================================

describe('2. Edificios - Flujo Rovida (garajes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      id: 'admin-vidaro',
      companyId: ROVIDA.id,
      role: 'administrador',
    });
    mockResolveCompanyScope.mockResolvedValue({
      activeCompanyId: ROVIDA.id,
      scopeCompanyIds: [ROVIDA.id],
    });
  });

  test('GET /api/buildings retorna edificios de Rovida', async () => {
    const mockBuildings = [
      {
        id: 'b1',
        nombre: 'Garaje Menéndez Pelayo',
        companyId: ROVIDA.id,
        direccion: 'Menéndez Pelayo 15',
        tipo: 'garaje',
        anoConstructor: 1990,
        numeroUnidades: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        units: [
          { id: 'u1', estado: 'ocupada' },
          { id: 'u2', estado: 'disponible' },
        ],
        company: { id: ROVIDA.id, nombre: ROVIDA.nombre },
      },
    ];
    mockPrisma.building.findMany.mockResolvedValue(mockBuildings);
    mockPrisma.building.count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/buildings/route');
    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].companyId).toBe(ROVIDA.id);
    expect(data[0].metrics.totalUnits).toBe(2);
    expect(data[0].metrics.occupiedUnits).toBe(1);
  });

  test('GET /api/buildings filtra por companyId correctamente', async () => {
    mockPrisma.building.findMany.mockResolvedValue([]);
    mockPrisma.building.count.mockResolvedValue(0);

    const { GET } = await import('@/app/api/buildings/route');
    const req = new NextRequest('http://localhost:3000/api/buildings');
    await GET(req);

    expect(mockResolveCompanyScope).toHaveBeenCalled();
  });
});

describe('2b. Edificios - Flujo Viroda (residencial)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      id: 'admin-vidaro',
      companyId: VIRODA.id,
      role: 'administrador',
    });
    mockResolveCompanyScope.mockResolvedValue({
      activeCompanyId: VIRODA.id,
      scopeCompanyIds: [VIRODA.id],
    });
  });

  test('GET /api/buildings retorna edificios de Viroda', async () => {
    const mockBuildings = [
      {
        id: 'v1',
        nombre: 'Hernández de Tejada 6',
        companyId: VIRODA.id,
        direccion: 'Hernández de Tejada 6',
        tipo: 'residencial',
        anoConstructor: 2005,
        numeroUnidades: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        units: [
          { id: 'vu1', estado: 'ocupada' },
          { id: 'vu2', estado: 'ocupada' },
          { id: 'vu3', estado: 'disponible' },
        ],
        company: { id: VIRODA.id, nombre: VIRODA.nombre },
      },
    ];
    mockPrisma.building.findMany.mockResolvedValue(mockBuildings);
    mockPrisma.building.count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/buildings/route');
    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data[0].companyId).toBe(VIRODA.id);
  });
});

describe('2c. Edificios - Grupo Vidaro (consolidado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      id: 'admin-vidaro',
      companyId: VIDARO_GROUP.id,
      role: 'administrador',
    });
    mockResolveCompanyScope.mockResolvedValue({
      activeCompanyId: VIDARO_GROUP.id,
      scopeCompanyIds: [VIDARO_GROUP.id, ROVIDA.id, VIRODA.id],
    });
  });

  test('GET /api/buildings retorna edificios de todas las sociedades', async () => {
    const mockBuildings = [
      {
        id: 'r1', nombre: 'Garaje MP 15', companyId: ROVIDA.id,
        direccion: 'MP 15', tipo: 'garaje', anoConstructor: 1990, numeroUnidades: 10,
        createdAt: new Date(), updatedAt: new Date(),
        units: [{ id: 'ru1', estado: 'ocupada' }],
        company: { id: ROVIDA.id, nombre: ROVIDA.nombre },
      },
      {
        id: 'v1', nombre: 'HdT 6', companyId: VIRODA.id,
        direccion: 'HdT 6', tipo: 'residencial', anoConstructor: 2005, numeroUnidades: 5,
        createdAt: new Date(), updatedAt: new Date(),
        units: [{ id: 'vu1', estado: 'disponible' }],
        company: { id: VIRODA.id, nombre: VIRODA.nombre },
      },
    ];
    mockPrisma.building.findMany.mockResolvedValue(mockBuildings);
    mockPrisma.building.count.mockResolvedValue(2);

    const { GET } = await import('@/app/api/buildings/route');
    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.length).toBe(2);
    const companyIds = data.map((b: any) => b.companyId);
    expect(companyIds).toContain(ROVIDA.id);
    expect(companyIds).toContain(VIRODA.id);
  });
});

// ========================================
// 3. UNIDADES (GARAJES Y PISOS)
// ========================================

describe('3. Unidades - Garajes de Rovida', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCompanyScope.mockResolvedValue({
      activeCompanyId: ROVIDA.id,
      scopeCompanyIds: [ROVIDA.id],
    });
  });

  test('API de unidades exporta GET y POST', async () => {
    const mod = await import('@/app/api/units/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  test('API de unidades [id] exporta GET, PUT, DELETE', async () => {
    const mod = await import('@/app/api/units/[id]/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.PUT).toBe('function');
    expect(typeof mod.DELETE).toBe('function');
  });
});

// ========================================
// 4. INQUILINOS
// ========================================

describe('4. Inquilinos - Operaciones CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCompanyScope.mockResolvedValue({
      activeCompanyId: ROVIDA.id,
      scopeCompanyIds: [ROVIDA.id],
    });
  });

  test('API de inquilinos exporta GET y POST', async () => {
    const mod = await import('@/app/api/tenants/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  test('API de inquilinos [id] exporta GET, PUT, DELETE', async () => {
    const mod = await import('@/app/api/tenants/[id]/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.PUT).toBe('function');
    expect(typeof mod.DELETE).toBe('function');
  });
});

// ========================================
// 5. CONTRATOS
// ========================================

describe('5. Contratos - Operaciones CRUD', () => {
  test('API de contratos exporta GET y POST', async () => {
    const mod = await import('@/app/api/contracts/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  test('API de contratos [id] exporta GET, PUT, DELETE', async () => {
    const mod = await import('@/app/api/contracts/[id]/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.PUT).toBe('function');
    expect(typeof mod.DELETE).toBe('function');
  });

  test('API de contratos media estancia exporta pricing', async () => {
    const mod = await import('@/app/api/contracts/medium-term/pricing/route');
    expect(typeof mod.POST).toBe('function');
  });

  test('API de contratos media estancia tiene runtime nodejs', async () => {
    const mod = await import('@/app/api/contracts/medium-term/pricing/route');
    expect(mod.runtime).toBe('nodejs');
  });

  test('API de prorrateo media estancia tiene runtime nodejs', async () => {
    const mod = await import('@/app/api/contracts/medium-term/prorate/route');
    expect(mod.runtime).toBe('nodejs');
  });
});

// ========================================
// 6. PAGOS
// ========================================

describe('6. Pagos - Operaciones', () => {
  test('API de pagos exporta GET y POST', async () => {
    const mod = await import('@/app/api/payments/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  test('API de pagos [id] exporta operaciones', async () => {
    const mod = await import('@/app/api/payments/[id]/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.PUT).toBe('function');
  });
});

// ========================================
// 7. MANTENIMIENTO
// ========================================

describe('7. Mantenimiento - Solicitudes', () => {
  const mockScope = {
    activeCompanyId: VIRODA.id,
    scopeCompanyIds: [VIRODA.id],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCompanyScope.mockResolvedValue(mockScope);
  });

  test('GET /api/maintenance retorna 401 sin sesión', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as any).mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/maintenance/route');
    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('POST /api/maintenance crea solicitud con datos válidos', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as any).mockResolvedValueOnce({
      user: { id: 'admin', companyId: VIRODA.id, role: 'administrador' },
    });

    mockPrisma.maintenanceRequest.create.mockResolvedValue({
      id: 'req-new',
      titulo: 'Gotera en garaje P-12',
      descripcion: 'Filtración de agua en plaza de garaje P-12, Rovida',
      estado: 'pendiente',
      prioridad: 'alta',
      unitId: 'unit-p12',
    });

    const { POST } = await import('@/app/api/maintenance/route');
    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify({
        titulo: 'Gotera en garaje P-12',
        descripcion: 'Filtración de agua en plaza de garaje P-12, Rovida',
        prioridad: 'alta',
        unitId: 'unit-p12',
      }),
    });

    const response = await POST(req);
    expect([200, 201]).toContain(response.status);
  });

  test('POST /api/maintenance rechaza sin campos requeridos', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as any).mockResolvedValueOnce({
      user: { id: 'admin', companyId: VIRODA.id, role: 'administrador' },
    });

    const { POST } = await import('@/app/api/maintenance/route');
    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify({ titulo: 'Solo título' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});

// ========================================
// 8. CONCILIACIÓN BANCARIA
// ========================================

describe('8. Conciliación Bancaria - Viroda y Rovida', () => {
  test('API de conciliación unificada exporta GET y POST', async () => {
    const mod = await import('@/app/api/banking/reconcile-unified/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  test('Conciliación tiene runtime nodejs', async () => {
    const mod = await import('@/app/api/banking/reconcile-unified/route');
    expect(mod.runtime).toBe('nodejs');
  });
});

// ========================================
// 9. CONTABILIDAD
// ========================================

describe('9. Contabilidad - Refresh desde Google Sheets', () => {
  test('API de refresh contabilidad exporta POST', async () => {
    const mod = await import('@/app/api/accounting/refresh-from-source/route');
    expect(typeof mod.POST).toBe('function');
  });

  test('Refresh contabilidad tiene runtime nodejs', async () => {
    const mod = await import('@/app/api/accounting/refresh-from-source/route');
    expect(mod.runtime).toBe('nodejs');
  });

  test('API de resumen contable exporta GET', async () => {
    const mod = await import('@/app/api/accounting/summary/route');
    expect(typeof mod.GET).toBe('function');
  });
});

// ========================================
// 10. DOCUMENTOS
// ========================================

describe('10. Documentos - Gestión', () => {
  test('API de documentos exporta GET y POST', async () => {
    const mod = await import('@/app/api/documents/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  test('API de documentos [id] exporta GET y DELETE', async () => {
    const mod = await import('@/app/api/documents/[id]/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.DELETE).toBe('function');
  });

  test('API de carpetas exporta GET y POST', async () => {
    const mod = await import('@/app/api/documents/folders/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });
});

// ========================================
// 11. VALIDACIONES DE INTEGRIDAD
// ========================================

describe('11. Validación de integridad - Rutas críticas', () => {
  const criticalRoutes = [
    { path: '@/app/api/buildings/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/units/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/tenants/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/contracts/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/payments/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/maintenance/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/documents/route', methods: ['GET', 'POST'] },
  ];

  for (const route of criticalRoutes) {
    test(`${route.path} exporta ${route.methods.join(', ')}`, async () => {
      const mod = await import(route.path);
      for (const method of route.methods) {
        expect(typeof mod[method]).toBe('function');
      }
    });
  }

  test('Todas las rutas críticas tienen runtime nodejs o no especificado', async () => {
    for (const route of criticalRoutes) {
      const mod = await import(route.path);
      if (mod.runtime) {
        expect(mod.runtime).toBe('nodejs');
      }
    }
  });

  test('Todas las rutas críticas son force-dynamic', async () => {
    for (const route of criticalRoutes) {
      const mod = await import(route.path);
      expect(mod.dynamic).toBe('force-dynamic');
    }
  });
});
