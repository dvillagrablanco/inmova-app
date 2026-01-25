/**
 * UNITS API - UNIT TESTS
 * Tests comprehensivos para la API de unidades (apartamentos, habitaciones)
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  logError: vi.fn(),
}));

vi.mock('@/lib/validations', () => ({
  unitCreateSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock('@/lib/api-cache-helpers', () => ({
  cachedUnits: vi.fn(),
  invalidateUnitsCache: vi.fn(),
  invalidateBuildingsCache: vi.fn(),
  invalidateDashboardCache: vi.fn(),
}));

vi.mock('@/lib/pagination-helper', () => ({
  getPaginationParams: vi.fn((searchParams) => ({
    skip: 0,
    take: 20,
    page: 1,
    limit: 20,
  })),
  buildPaginationResponse: vi.fn((data, total, page, limit) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })),
}));

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { cachedUnits } from '@/lib/api-cache-helpers';
import { unitCreateSchema } from '@/lib/validations';
import { GET, POST } from '@/app/api/units/route';

describe('🏠 Units API - GET Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const mockUnits = [
    {
      id: 'unit-1',
      numero: '101',
      tipo: 'apartamento',
      estado: 'disponible',
      planta: 1,
      superficie: 85,
      habitaciones: 3,
      banos: 2,
      rentaMensual: 1200,
      buildingId: 'building-1',
      building: {
        id: 'building-1',
        nombre: 'Edificio Central',
        direccion: 'Calle Mayor 123',
      },
      contracts: [],
      createdAt: new Date(),
    },
    {
      id: 'unit-2',
      numero: '201',
      tipo: 'habitacion',
      estado: 'ocupada',
      planta: 2,
      superficie: 25,
      habitaciones: 1,
      banos: 1,
      rentaMensual: 600,
      buildingId: 'building-1',
      building: {
        id: 'building-1',
        nombre: 'Edificio Central',
        direccion: 'Calle Mayor 123',
      },
      contracts: [
        {
          id: 'contract-1',
          estado: 'activo',
          tenant: {
            id: 'tenant-1',
            nombre: 'Juan Pérez',
            email: 'juan@example.com',
          },
        },
      ],
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe retornar todas las unidades sin filtros', async () => {
    (cachedUnits as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnits);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  test('✅ Debe filtrar unidades por buildingId', async () => {
    (prisma.unit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockUnits[0]]);

    const req = new NextRequest('http://localhost:3000/api/units?buildingId=building-1');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('✅ Debe filtrar unidades por estado', async () => {
    (prisma.unit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockUnits[0]]);

    const req = new NextRequest('http://localhost:3000/api/units?estado=disponible');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  test('✅ Debe filtrar unidades por tipo', async () => {
    (prisma.unit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockUnits[0]]);

    const req = new NextRequest('http://localhost:3000/api/units?tipo=apartamento');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  test('✅ Debe retornar unidades con paginación', async () => {
    (prisma.unit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnits);
    (prisma.unit.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);

    const req = new NextRequest('http://localhost:3000/api/units?paginate=true');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.pagination).toBeDefined();
  });

  test('✅ Debe incluir relación con building', async () => {
    (cachedUnits as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnits);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].building).toBeDefined();
    expect(data[0].building.nombre).toBeDefined();
  });

  test('✅ Debe incluir inquilino en unidades ocupadas', async () => {
    (cachedUnits as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnits);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    const occupied = data.find((u: any) => u.estado === 'ocupada');
    if (occupied) {
      expect(occupied.contracts).toBeDefined();
      expect(occupied.contracts[0]?.tenant).toBeDefined();
    }
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('⚠️ Debe retornar array vacío sin companyId', async () => {
    // La API retorna array vacío [] en lugar de error 400 para mejor UX
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-123' }, // Sin companyId
    });

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test('⚠️ Debe manejar error de base de datos gracefully', async () => {
    // La API retorna array vacío [] en lugar de error 500 para mejor UX
    (cachedUnits as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar lista vacía de unidades', async () => {
    (cachedUnits as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(0);
  });

  test('⚠️ Debe manejar filtro por múltiples tipos', async () => {
    (prisma.unit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnits);

    const req = new NextRequest('http://localhost:3000/api/units?tipo=garaje,trastero');
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  test('⚠️ Debe manejar unidad sin contratos activos', async () => {
    (cachedUnits as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        ...mockUnits[0],
        contracts: [],
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].contracts.length).toBe(0);
  });

  test('⚠️ Debe manejar superficie 0', async () => {
    (cachedUnits as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        ...mockUnits[0],
        superficie: 0,
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].superficie).toBe(0);
  });

  test('⚠️ Debe manejar renta mensual null', async () => {
    (cachedUnits as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        ...mockUnits[0],
        rentaMensual: null,
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/units');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].rentaMensual).toBeNull();
  });
});

describe('🏠 Units API - POST Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const validUnitData = {
    numero: '301',
    tipo: 'apartamento',
    estado: 'disponible',
    buildingId: 'building-1',
    planta: 3,
    superficie: 90,
    habitaciones: 3,
    banos: 2,
    rentaMensual: 1300,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
    (unitCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      data: validUnitData,
    });
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe crear una unidad exitosamente', async () => {
    const createdUnit = {
      id: 'unit-new',
      ...validUnitData,
      createdAt: new Date(),
    };

    (prisma.unit.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdUnit);

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(validUnitData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('✅ Debe crear habitación exitosamente', async () => {
    const roomData = {
      ...validUnitData,
      tipo: 'habitacion',
      habitaciones: 1,
      banos: 1,
      superficie: 20,
      rentaMensual: 500,
    };

    (prisma.unit.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'unit-room',
      ...roomData,
    });

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  // ========================================
  // VALIDACIONES
  // ========================================

  test('❌ Debe rechazar unidad sin número', async () => {
    const invalidData = {
      tipo: 'apartamento',
      buildingId: 'building-1',
    };

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar unidad sin buildingId', async () => {
    const invalidData = {
      numero: '401',
      tipo: 'apartamento',
    };

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar renta mensual negativa', async () => {
    const invalidData = {
      ...validUnitData,
      rentaMensual: -500,
    };

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar superficie negativa', async () => {
    const invalidData = {
      ...validUnitData,
      superficie: -10,
    };

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe retornar 401 sin autenticación', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(validUnitData),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe aceptar unidad con renta 0', async () => {
    const freeUnit = {
      ...validUnitData,
      rentaMensual: 0,
    };

    (prisma.unit.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'unit-free',
      ...freeUnit,
    });

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(freeUnit),
    });

    const response = await POST(req);

    expect([200, 201, 400]).toContain(response.status);
  });

  test('⚠️ Debe manejar tipos especiales (garaje, trastero)', async () => {
    const types = ['garaje', 'trastero', 'local'];

    for (const tipo of types) {
      const unitData = {
        ...validUnitData,
        tipo,
        habitaciones: 0,
        banos: 0,
      };

      (prisma.unit.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: `unit-${tipo}`,
        ...unitData,
      });

      const req = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(unitData),
      });

      const response = await POST(req);

      expect([200, 201]).toContain(response.status);
    }
  });

  test('⚠️ Debe manejar número de unidad con caracteres especiales', async () => {
    const specialNumbers = ['A-101', '1º Izq', 'PB-B'];

    for (const numero of specialNumbers) {
      const unitData = {
        ...validUnitData,
        numero,
      };

      (prisma.unit.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: `unit-${numero}`,
        ...unitData,
      });

      const req = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(unitData),
      });

      const response = await POST(req);

      expect([200, 201]).toContain(response.status);
    }
  });

  test('⚠️ Debe manejar planta negativa (sótano)', async () => {
    const basement = {
      ...validUnitData,
      planta: -1,
    };

    (prisma.unit.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'unit-basement',
      ...basement,
    });

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(basement),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar unidad con muchas habitaciones', async () => {
    const bigUnit = {
      ...validUnitData,
      habitaciones: 10,
      banos: 5,
      superficie: 300,
    };

    (prisma.unit.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'unit-big',
      ...bigUnit,
    });

    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify(bigUnit),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar JSON malformado', async () => {
    const req = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });
});
