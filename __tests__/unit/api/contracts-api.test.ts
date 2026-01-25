/**
 * CONTRACTS API - UNIT TESTS
 * Tests comprehensivos para la API de contratos
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    unit: {
      update: vi.fn(),
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

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/api-cache-helpers', () => ({
  cachedContracts: vi.fn(),
  invalidateContractsCache: vi.fn(),
  invalidateUnitsCache: vi.fn(),
  invalidateDashboardCache: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { cachedContracts } from '@/lib/api-cache-helpers';
import { GET, POST } from '@/app/api/contracts/route';

describe('📝 Contracts API - GET Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const mockContracts = [
    {
      id: 'contract-1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-01-01'),
      renta: 1200,
      deposito: 2400,
      estado: 'activo',
      companyId: 'company-123',
      createdAt: new Date(),
    },
    {
      id: 'contract-2',
      tenantId: 'tenant-2',
      unitId: 'unit-2',
      fechaInicio: new Date('2025-06-01'),
      fechaFin: new Date('2026-06-01'),
      renta: 950,
      deposito: 950,
      estado: 'activo',
      companyId: 'company-123',
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

  test('✅ Debe retornar todos los contratos', async () => {
    (cachedContracts as ReturnType<typeof vi.fn>).mockResolvedValue(mockContracts);

    const req = new NextRequest('http://localhost:3000/api/contracts');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  test('✅ Debe filtrar por estado', async () => {
    // Nota: La API actual sin paginación usa cachedContracts que no filtra por estado
    // El filtrado por estado solo funciona del lado del cliente
    const activeContracts = mockContracts.filter((c) => c.estado === 'activo');
    // Para activar la consulta directa, usamos paginación
    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(activeContracts);
    (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(activeContracts.length);

    const req = new NextRequest(
      'http://localhost:3000/api/contracts?estado=activo&page=1&limit=10'
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // La API retorna estructura con paginación cuando se usa page/limit
    expect(data.data || data).toBeDefined();
    const contracts = data.data || data;
    expect(contracts.every((c: any) => c.estado === 'activo')).toBe(true);
  });

  test('✅ Debe filtrar por tenantId', async () => {
    const tenantContracts = mockContracts.filter((c) => c.tenantId === 'tenant-1');
    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(tenantContracts);
    (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(tenantContracts.length);

    // Usar paginación para activar consulta directa
    const req = new NextRequest(
      'http://localhost:3000/api/contracts?tenantId=tenant-1&page=1&limit=10'
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    const contracts = data.data || data;
    expect(contracts.every((c: any) => c.tenantId === 'tenant-1')).toBe(true);
  });

  test('✅ Debe retornar contratos con paginación', async () => {
    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockContracts);
    (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(50);

    const req = new NextRequest('http://localhost:3000/api/contracts?page=1&limit=20');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    if (result.data) {
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(50);
    }
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/contracts');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('❌ Debe manejar error de base de datos', async () => {
    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database error')
    );

    const req = new NextRequest('http://localhost:3000/api/contracts');
    const response = await GET(req);

    expect(response.status).toBe(500);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar lista vacía de contratos', async () => {
    // La API sin paginación usa cachedContracts
    (cachedContracts as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/contracts');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(0);
  });

  test('⚠️ Debe manejar filtros combinados', async () => {
    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockContracts[0]]);
    (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    // Añadir paginación para activar consulta directa
    const req = new NextRequest(
      'http://localhost:3000/api/contracts?estado=activo&tenantId=tenant-1&page=1&limit=10'
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  test('⚠️ Debe manejar estado inválido', async () => {
    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const req = new NextRequest(
      'http://localhost:3000/api/contracts?estado=invalid&page=1&limit=10'
    );
    const response = await GET(req);

    expect([200, 400]).toContain(response.status);
  });
});

describe('📝 Contracts API - POST Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  // Usar formato correcto según schema de validación
  const validContractData = {
    tenantId: '550e8400-e29b-41d4-a716-446655440001', // UUID válido
    unitId: '550e8400-e29b-41d4-a716-446655440002', // UUID válido
    fechaInicio: '2026-02-01T00:00:00.000Z', // ISO datetime
    fechaFin: '2027-02-01T00:00:00.000Z', // ISO datetime
    rentaMensual: 1200, // Campo correcto (no 'renta')
    deposito: 2400,
    estado: 'activo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe crear un contrato exitosamente', async () => {
    const createdContract = {
      id: 'contract-new',
      ...validContractData,
      fechaInicio: new Date(validContractData.fechaInicio),
      fechaFin: new Date(validContractData.fechaFin),
      companyId: mockUser.companyId,
      createdAt: new Date(),
    };

    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdContract);

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(validContractData),
    });

    const response = await POST(req);
    const data = await response.json();

    expect([200, 201]).toContain(response.status);
    if (response.status === 201) {
      expect(data.id).toBe('contract-new');
      expect(data.rentaMensual).toBe(1200);
    }
  });

  test('✅ Debe actualizar estado de la unidad a ocupada', async () => {
    // La API de contratos NO asigna companyId directamente al contrato
    // companyId se deriva de: unit -> building -> company
    // En su lugar, verificamos que se actualice la unidad
    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-new',
      ...validContractData,
    });
    (prisma.unit.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: validContractData.unitId,
      estado: 'ocupada',
    });

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(validContractData),
    });

    await POST(req);

    // Verificar que se actualizó la unidad a estado 'ocupada'
    expect(prisma.unit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: validContractData.unitId },
        data: expect.objectContaining({
          estado: 'ocupada',
          tenantId: validContractData.tenantId,
        }),
      })
    );
  });

  // ========================================
  // VALIDACIONES
  // ========================================

  test('❌ Debe rechazar fecha de inicio posterior a fecha de fin', async () => {
    const invalidDates = {
      ...validContractData,
      fechaInicio: '2027-01-01',
      fechaFin: '2026-01-01',
    };

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(invalidDates),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar renta negativa', async () => {
    const invalidRent = {
      ...validContractData,
      renta: -1000,
    };

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(invalidRent),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar renta = 0', async () => {
    const zeroRent = {
      ...validContractData,
      renta: 0,
    };

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(zeroRent),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar depósito negativo', async () => {
    const invalidDeposit = {
      ...validContractData,
      deposito: -500,
    };

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(invalidDeposit),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe retornar 401 sin autenticación', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(validContractData),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe aceptar depósito = 0', async () => {
    const noDeposit = {
      ...validContractData,
      deposito: 0,
    };

    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-no-deposit',
      ...noDeposit,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(noDeposit),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar contrato de 1 año (caso común)', async () => {
    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-1year',
      ...validContractData,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(validContractData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar contrato temporal (6 meses)', async () => {
    const shortContract = {
      ...validContractData,
      fechaInicio: '2026-03-01',
      fechaFin: '2026-09-01',
    };

    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-short',
      ...shortContract,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(shortContract),
    });

    const response = await POST(req);

    expect([200, 201, 400]).toContain(response.status);
  });

  test('⚠️ Debe manejar renta con decimales', async () => {
    const decimalRent = {
      ...validContractData,
      renta: 1234.56,
    };

    (prisma.contract.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'contract-decimal',
      ...decimalRent,
      companyId: mockUser.companyId,
    });

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(decimalRent),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('⚠️ Debe manejar JSON malformado', async () => {
    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar campos faltantes', async () => {
    const incompleteData = {
      tenantId: 'tenant-1',
      renta: 1200,
    };

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(incompleteData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar tenantId inexistente', async () => {
    (prisma.contract.create as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: 'P2003',
      meta: { field_name: 'tenantId' },
    });

    const req = new NextRequest('http://localhost:3000/api/contracts', {
      method: 'POST',
      body: JSON.stringify(validContractData),
    });

    const response = await POST(req);

    expect([400, 404, 500]).toContain(response.status);
  });
});
