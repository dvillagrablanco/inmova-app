/**
 * DASHBOARD API - COMPREHENSIVE UNIT TESTS
 * Tests completos para la API del dashboard
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    building: {
      count: vi.fn(),
    },
    unit: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    tenant: {
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    maintenanceRequest: {
      findMany: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    expense: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/permissions', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { GET } from '@/app/api/dashboard/route';

describe('📊 Dashboard API - GET Endpoint (Comprehensive)', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    (prisma.company.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      esEmpresaPrueba: false,
    });
    (prisma.building.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.unit.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.payment.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { monto: 0 },
    });
    (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.payment.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.expense.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { monto: 0 },
    });
    (prisma.expense.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.contract.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.unit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.unit.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  test('✅ Debe retornar estructura completa del dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.kpis).toBeDefined();
    expect(Array.isArray(data.monthlyIncome)).toBe(true);
    expect(Array.isArray(data.occupancyChartData)).toBe(true);
    expect(Array.isArray(data.expensesChartData)).toBe(true);
    expect(Array.isArray(data.pagosPendientes)).toBe(true);
    expect(Array.isArray(data.contractsExpiringSoon)).toBe(true);
    expect(Array.isArray(data.maintenanceRequests)).toBe(true);
    expect(Array.isArray(data.unidadesDisponibles)).toBe(true);
    expect(typeof data.esEmpresaPrueba).toBe('boolean');
  });

  test('✅ Debe calcular tasa de ocupación en rango válido', async () => {
    (prisma.unit.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);
    (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.kpis.tasaOcupacion).toBeGreaterThanOrEqual(0);
    expect(data.kpis.tasaOcupacion).toBeLessThanOrEqual(100);
  });

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No autenticado'));

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('❌ Debe retornar 400 sin companyId', async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-123',
      role: 'ADMIN',
    });

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);

    expect(response.status).toBe(400);
  });

  test('❌ Debe manejar error de base de datos', async () => {
    (prisma.building.count as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);

    expect(response.status).toBe(500);
  });
});
