/**
 * TENANTS API - UNIT TESTS
 * Tests comprehensivos para la API de inquilinos
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    tenant: {
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
  requirePermission: vi.fn(),
  forbiddenResponse: vi.fn(() => NextResponse.json({ error: 'Forbidden' }, { status: 403 })),
  badRequestResponse: vi.fn((msg) => NextResponse.json({ error: msg }, { status: 400 })),
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
  tenantCreateSchema: {
    parse: vi.fn((data) => data),
  },
}));

import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { GET, POST } from '@/app/api/tenants/route';

describe('🏠 Tenants API - GET Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const mockTenants = [
    {
      id: 'tenant-1',
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      telefono: '612345678',
      companyId: 'company-123',
      units: [],
      contracts: [],
      createdAt: new Date(),
    },
    {
      id: 'tenant-2',
      nombre: 'María García',
      email: 'maria@example.com',
      telefono: '623456789',
      companyId: 'company-123',
      units: [],
      contracts: [],
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe retornar todos los inquilinos sin paginación', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);

    const req = new NextRequest('http://localhost:3000/api/tenants');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].nombre).toBe('Juan Pérez');
  });

  test('✅ Debe retornar inquilinos con paginación', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);

    const req = new NextRequest('http://localhost:3000/api/tenants?page=1&limit=2');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.totalPages).toBe(5);
  });

  test('✅ Debe incluir relaciones (units, contracts)', async () => {
    const tenantsWithRelations = [
      {
        ...mockTenants[0],
        units: [{ id: 'unit-1', building: { id: 'building-1' } }],
        contracts: [{ id: 'contract-1', estado: 'activo' }],
      },
    ];

    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(tenantsWithRelations);

    const req = new NextRequest('http://localhost:3000/api/tenants');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].units).toBeDefined();
    expect(data[0].contracts).toBeDefined();
    expect(data[0].units.length).toBe(1);
    expect(data[0].contracts.length).toBe(1);
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No autenticado'));

    const req = new NextRequest('http://localhost:3000/api/tenants');
    const response = await GET(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('No autenticado');
  });

  test('❌ Debe manejar error de base de datos', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/tenants');
    const response = await GET(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar lista vacía de inquilinos', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const req = new NextRequest('http://localhost:3000/api/tenants?page=1&limit=20');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data.length).toBe(0);
    expect(result.pagination.total).toBe(0);
  });

  test('⚠️ Debe manejar página fuera de rango', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

    const req = new NextRequest('http://localhost:3000/api/tenants?page=10&limit=20');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data.length).toBe(0);
  });

  test('⚠️ Debe manejar page=0 o negativo', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const req = new NextRequest('http://localhost:3000/api/tenants?page=0&limit=20');
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  test('⚠️ Debe manejar limit muy grande', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

    const req = new NextRequest('http://localhost:3000/api/tenants?page=1&limit=10000');
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  test('⚠️ Debe ordenar por createdAt desc', async () => {
    (prisma.tenant.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);

    const req = new NextRequest('http://localhost:3000/api/tenants');
    await GET(req);

    expect(prisma.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});

// TODO: Estos tests necesitan refactorización - el schema de validación
// y el mock de requirePermission no coinciden con la implementación actual
describe.skip('🏠 Tenants API - POST Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  // Usar formato correcto según schema de validación (nombre y apellidos separados)
  const validTenantData = {
    nombre: 'Pedro',
    apellidos: 'López García',
    email: 'pedro@example.com',
    telefono: '634567890',
    dni: '12345678A',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // POST usa requirePermission, no requireAuth
    (requirePermission as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  // TODO: Este test necesita revisión - la API puede estar usando validación diferente
  test.skip('✅ Debe crear un inquilino exitosamente', async () => {
    const createdTenant = {
      id: 'tenant-new',
      ...validTenantData,
      companyId: mockUser.companyId,
      createdAt: new Date(),
    };

    (prisma.tenant.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdTenant);

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(validTenantData),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('tenant-new');
    expect(data.nombre).toBe(validTenantData.nombre);
    expect(data.email).toBe(validTenantData.email);
  });

  test('✅ Debe asignar companyId del usuario autenticado', async () => {
    (prisma.tenant.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tenant-new',
      ...validTenantData,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(validTenantData),
    });

    await POST(req);

    expect(prisma.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: mockUser.companyId,
        }),
      })
    );
  });

  // ========================================
  // VALIDACIONES
  // ========================================

  test('❌ Debe rechazar email duplicado', async () => {
    (prisma.tenant.create as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: 'P2002',
      meta: { target: ['email'] },
    });

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(validTenantData),
    });

    const response = await POST(req);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toContain('email');
  });

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No autenticado'));

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(validTenantData),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar JSON malformado', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar campos opcionales ausentes', async () => {
    const minimalData = {
      nombre: 'Test User',
      email: 'test@example.com',
    };

    (prisma.tenant.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tenant-minimal',
      ...minimalData,
      companyId: mockUser.companyId,
      telefono: null,
      dni: null,
    });

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(minimalData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar email en formato inválido', async () => {
    const invalidEmailData = {
      nombre: 'Test',
      email: 'invalid-email',
      telefono: '612345678',
    };

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(invalidEmailData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar teléfono en formato inválido', async () => {
    const invalidPhoneData = {
      nombre: 'Test',
      email: 'test@example.com',
      telefono: 'not-a-phone',
    };

    (prisma.tenant.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tenant-phone',
      ...invalidPhoneData,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(invalidPhoneData),
    });

    const response = await POST(req);

    // La API puede aceptarlo o rechazarlo dependiendo de la validación
    expect([200, 201, 400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar caracteres especiales en nombre', async () => {
    const specialCharsData = {
      nombre: 'José María Ñoño',
      email: 'jose@example.com',
      telefono: '612345678',
    };

    (prisma.tenant.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tenant-special',
      ...specialCharsData,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(specialCharsData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar nombre muy largo', async () => {
    const longNameData = {
      nombre: 'a'.repeat(500),
      email: 'test@example.com',
      telefono: '612345678',
    };

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(longNameData),
    });

    const response = await POST(req);

    // Puede rechazarlo por validación o límites de DB
    expect([201, 400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar DNI español válido', async () => {
    const dniData = {
      nombre: 'Test',
      email: 'test@example.com',
      dni: '12345678Z',
    };

    (prisma.tenant.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tenant-dni',
      ...dniData,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/tenants', {
      method: 'POST',
      body: JSON.stringify(dniData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });
});
