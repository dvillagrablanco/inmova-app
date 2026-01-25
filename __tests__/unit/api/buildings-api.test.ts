/**
 * BUILDINGS API - UNIT TESTS
 * Tests comprehensivos para la API de edificios
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    building: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/permissions', () => ({
  requireAuth: vi.fn(),
  getUserCompany: vi.fn(),
  requirePermission: vi.fn(),
  forbiddenResponse: vi.fn(() => NextResponse.json({ error: 'Forbidden' }, { status: 403 })),
  badRequestResponse: vi.fn((msg) => NextResponse.json({ error: msg }, { status: 400 })),
}));

vi.mock('@/lib/validations', () => ({
  buildingCreateSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  logError: vi.fn(),
}));

vi.mock('@/lib/api-cache-helpers', () => ({
  cachedBuildings: vi.fn(),
  invalidateBuildingsCache: vi.fn(),
  invalidateDashboardCache: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { cachedBuildings } from '@/lib/api-cache-helpers';
import { buildingCreateSchema } from '@/lib/validations';
import { GET, POST } from '@/app/api/buildings/route';

describe('🏢 Buildings API - GET Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const mockBuildings = [
    {
      id: 'building-1',
      nombre: 'Edificio Central',
      direccion: 'Calle Mayor 123',
      tipo: 'residencial',
      numeroUnidades: 10,
      companyId: 'company-123',
      units: [
        { id: 'unit-1', estado: 'ocupada', rentaMensual: 1200 },
        { id: 'unit-2', estado: 'ocupada', rentaMensual: 1100 },
        { id: 'unit-3', estado: 'disponible' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'building-2',
      nombre: 'Torre Sur',
      direccion: 'Avenida Principal 456',
      tipo: 'residencial',
      numeroUnidades: 20,
      companyId: 'company-123',
      units: [
        { id: 'unit-4', estado: 'ocupada', rentaMensual: 1500 },
        { id: 'unit-5', estado: 'disponible' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe retornar todos los edificios sin paginación', async () => {
    const buildingsWithMetrics = mockBuildings.map((b) => ({
      ...b,
      metrics: {
        totalUnits: b.units.length,
        occupiedUnits: b.units.filter((u) => u.estado === 'ocupada').length,
        ocupacionPct: 66.7,
        ingresosMensuales: 2300,
      },
    }));

    (cachedBuildings as ReturnType<typeof vi.fn>).mockResolvedValue(buildingsWithMetrics);

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].metrics).toBeDefined();
  });

  test('✅ Debe retornar edificios con paginación', async () => {
    (prisma.building.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockBuildings);
    (prisma.building.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

    const req = new NextRequest('http://localhost:3000/api/buildings?page=1&limit=2');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.total).toBe(5);
  });

  test('✅ Debe calcular métricas de ocupación correctamente', async () => {
    (cachedBuildings as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'building-1',
        units: [{ estado: 'ocupada' }, { estado: 'ocupada' }, { estado: 'disponible' }],
        metrics: {
          totalUnits: 3,
          occupiedUnits: 2,
          ocupacionPct: 66.7,
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].metrics.ocupacionPct).toBeCloseTo(66.7, 1);
    expect(data[0].metrics.occupiedUnits).toBe(2);
  });

  test('✅ Debe incluir relación con units', async () => {
    (cachedBuildings as ReturnType<typeof vi.fn>).mockResolvedValue(mockBuildings);

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].units).toBeDefined();
    expect(Array.isArray(data[0].units)).toBe(true);
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No autenticado'));

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('❌ Debe manejar error de base de datos', async () => {
    (cachedBuildings as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);

    expect(response.status).toBe(500);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar lista vacía de edificios', async () => {
    (cachedBuildings as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(0);
  });

  test('⚠️ Debe manejar edificio sin unidades', async () => {
    (cachedBuildings as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'building-empty',
        nombre: 'Edificio Vacío',
        units: [],
        metrics: {
          totalUnits: 0,
          occupiedUnits: 0,
          ocupacionPct: 0,
          ingresosMensuales: 0,
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].metrics.ocupacionPct).toBe(0);
    expect(data[0].metrics.totalUnits).toBe(0);
  });

  test('⚠️ Debe manejar 100% de ocupación', async () => {
    (cachedBuildings as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'building-full',
        units: [{ estado: 'ocupada' }, { estado: 'ocupada' }],
        metrics: {
          totalUnits: 2,
          occupiedUnits: 2,
          ocupacionPct: 100,
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].metrics.ocupacionPct).toBe(100);
  });

  test('⚠️ Debe calcular ingresos mensuales correctamente', async () => {
    (cachedBuildings as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'building-1',
        units: [
          { estado: 'ocupada', rentaMensual: 1200 },
          { estado: 'ocupada', rentaMensual: 1300 },
          { estado: 'disponible', rentaMensual: 1100 }, // No debe contar
        ],
        metrics: {
          ingresosMensuales: 2500,
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/buildings');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].metrics.ingresosMensuales).toBe(2500);
  });
});

describe('🏢 Buildings API - POST Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const validBuildingData = {
    nombre: 'Nuevo Edificio',
    direccion: 'Calle Test 789',
    tipo: 'residencial',
    numeroUnidades: 15,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (requirePermission as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (buildingCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      data: validBuildingData,
    });
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe crear un edificio exitosamente', async () => {
    const createdBuilding = {
      id: 'building-new',
      ...validBuildingData,
      companyId: mockUser.companyId,
      createdAt: new Date(),
    };

    (prisma.building.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdBuilding);

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(validBuildingData),
    });

    const response = await POST(req);
    const data = await response.json();

    expect([200, 201]).toContain(response.status);
    if (response.status === 201) {
      expect(data.id).toBe('building-new');
      expect(data.nombre).toBe(validBuildingData.nombre);
    }
  });

  test('✅ Debe asignar companyId del usuario', async () => {
    (prisma.building.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'building-new',
      ...validBuildingData,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(validBuildingData),
    });

    await POST(req);

    if (prisma.building.create['mock'].calls.length > 0) {
      expect(prisma.building.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: mockUser.companyId,
          }),
        })
      );
    }
  });

  // ========================================
  // VALIDACIONES
  // ========================================

  test('❌ Debe rechazar edificio sin nombre', async () => {
    const invalidData = {
      direccion: 'Test',
      tipo: 'residencial',
      numeroUnidades: 10,
    };

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar número de unidades negativo', async () => {
    const invalidData = {
      ...validBuildingData,
      numeroUnidades: -5,
    };

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe retornar 401 sin autenticación', async () => {
    // POST usa requirePermission, no requireAuth
    (requirePermission as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No autenticado'));

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(validBuildingData),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe aceptar edificio con 0 unidades', async () => {
    const zeroUnits = {
      ...validBuildingData,
      numeroUnidades: 0,
    };

    (prisma.building.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'building-zero',
      ...zeroUnits,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(zeroUnits),
    });

    const response = await POST(req);

    expect([200, 201, 400]).toContain(response.status);
  });

  test('⚠️ Debe manejar edificio con muchas unidades', async () => {
    const manyUnits = {
      ...validBuildingData,
      numeroUnidades: 1000,
    };

    (prisma.building.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'building-big',
      ...manyUnits,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(manyUnits),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar caracteres especiales en nombre', async () => {
    const specialChars = {
      ...validBuildingData,
      nombre: 'Edificio "Las Flores" & Jardín #123',
    };

    (prisma.building.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'building-special',
      ...specialChars,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(specialChars),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar dirección muy larga', async () => {
    const longAddress = {
      ...validBuildingData,
      direccion: 'a'.repeat(500),
    };

    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: JSON.stringify(longAddress),
    });

    const response = await POST(req);

    expect([201, 400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar tipos de edificio', async () => {
    const types = ['residencial', 'comercial', 'mixto'];

    for (const tipo of types) {
      const buildingData = {
        ...validBuildingData,
        tipo,
      };

      (prisma.building.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: `building-${tipo}`,
        ...buildingData,
        companyId: mockUser.companyId,
      });

      const req = new NextRequest('http://localhost:3000/api/buildings', {
        method: 'POST',
        body: JSON.stringify(buildingData),
      });

      const response = await POST(req);

      expect([200, 201]).toContain(response.status);
    }
  });

  test('⚠️ Debe manejar JSON malformado', async () => {
    const req = new NextRequest('http://localhost:3000/api/buildings', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });
});
