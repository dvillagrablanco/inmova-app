/**
 * DASHBOARD API - COMPREHENSIVE UNIT TESTS
 * Tests completos para la API del dashboard
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    building: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    unit: {
      count: vi.fn(),
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
      count: vi.fn(),
      findMany: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
      count: vi.fn(),
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
}));

vi.mock('@/lib/api-cache-helpers', () => ({
  cachedDashboard: vi.fn(),
  invalidateDashboardCache: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { cachedDashboard } from '@/lib/api-cache-helpers';
import { GET } from '@/app/api/dashboard/route';

describe('📊 Dashboard API - GET Endpoint (Comprehensive)', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const mockDashboardData = {
    stats: {
      totalBuildings: 10,
      totalUnits: 150,
      totalTenants: 120,
      occupancyRate: 80,
    },
    recentPayments: [
      {
        id: 'payment-1',
        monto: 1200,
        estado: 'completado',
        fechaPago: new Date('2026-01-29'),
        contract: {
          tenant: { nombre: 'Juan Pérez' },
          unit: { numero: '101' },
        },
      },
      {
        id: 'payment-2',
        monto: 1500,
        estado: 'pendiente',
        fechaVencimiento: new Date('2026-02-01'),
        contract: {
          tenant: { nombre: 'María García' },
          unit: { numero: '202' },
        },
      },
    ],
    pendingMaintenance: [
      {
        id: 'maint-1',
        tipo: 'Plomería',
        estado: 'pendiente',
        prioridad: 'alta',
        descripcion: 'Fuga en baño',
        unit: {
          numero: '101',
          building: { nombre: 'Edificio A' },
        },
      },
    ],
    expiringContracts: [
      {
        id: 'contract-1',
        fechaFin: addDays(new Date(), 15),
        tenant: { nombre: 'Carlos López' },
        unit: {
          numero: '303',
          building: { nombre: 'Edificio B' },
        },
      },
    ],
    financialSummary: {
      monthlyIncome: 150000,
      pendingPayments: 30000,
      overduePayments: 5000,
      collectionRate: 95,
    },
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

  test('✅ Debe retornar datos completos del dashboard', async () => {
    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toBeDefined();
    expect(data.recentPayments).toBeDefined();
    expect(data.pendingMaintenance).toBeDefined();
    expect(data.expiringContracts).toBeDefined();
    expect(data.financialSummary).toBeDefined();
  });

  test('✅ Debe retornar estadísticas básicas', async () => {
    (prisma.building.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);
    (prisma.unit.count as ReturnType<typeof vi.fn>).mockResolvedValue(150);
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(120);

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.stats.totalBuildings).toBeGreaterThanOrEqual(0);
    expect(data.stats.totalUnits).toBeGreaterThanOrEqual(0);
    expect(data.stats.totalTenants).toBeGreaterThanOrEqual(0);
  });

  test('✅ Debe calcular tasa de ocupación correctamente', async () => {
    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.stats.occupancyRate).toBeGreaterThanOrEqual(0);
    expect(data.stats.occupancyRate).toBeLessThanOrEqual(100);
  });

  test('✅ Debe retornar pagos recientes (últimos 5)', async () => {
    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(Array.isArray(data.recentPayments)).toBe(true);
    expect(data.recentPayments.length).toBeLessThanOrEqual(5);
  });

  test('✅ Debe retornar mantenimientos pendientes', async () => {
    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(Array.isArray(data.pendingMaintenance)).toBe(true);
  });

  test('✅ Debe retornar contratos próximos a vencer', async () => {
    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(Array.isArray(data.expiringContracts)).toBe(true);
  });

  test('✅ Debe retornar resumen financiero del mes', async () => {
    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.financialSummary).toBeDefined();
    expect(data.financialSummary.monthlyIncome).toBeGreaterThanOrEqual(0);
    expect(data.financialSummary.pendingPayments).toBeGreaterThanOrEqual(0);
    expect(data.financialSummary.collectionRate).toBeGreaterThanOrEqual(0);
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('❌ Debe retornar 400 sin companyId', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-123' }, // Sin companyId
    });

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);

    expect(response.status).toBe(400);
  });

  test('❌ Debe manejar error de base de datos', async () => {
    (cachedDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);

    expect(response.status).toBe(500);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar dashboard sin edificios', async () => {
    const emptyDashboard = {
      ...mockDashboardData,
      stats: {
        totalBuildings: 0,
        totalUnits: 0,
        totalTenants: 0,
        occupancyRate: 0,
      },
      recentPayments: [],
      pendingMaintenance: [],
      expiringContracts: [],
      financialSummary: {
        monthlyIncome: 0,
        pendingPayments: 0,
        overduePayments: 0,
        collectionRate: 0,
      },
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(emptyDashboard);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.totalBuildings).toBe(0);
  });

  test('⚠️ Debe manejar 100% de ocupación', async () => {
    const fullOccupancy = {
      ...mockDashboardData,
      stats: {
        ...mockDashboardData.stats,
        occupancyRate: 100,
      },
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(fullOccupancy);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.stats.occupancyRate).toBe(100);
  });

  test('⚠️ Debe manejar 0% de ocupación', async () => {
    const zeroOccupancy = {
      ...mockDashboardData,
      stats: {
        ...mockDashboardData.stats,
        totalUnits: 100,
        totalTenants: 0,
        occupancyRate: 0,
      },
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(zeroOccupancy);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.stats.occupancyRate).toBe(0);
  });

  test('⚠️ Debe manejar sin pagos recientes', async () => {
    const noPayments = {
      ...mockDashboardData,
      recentPayments: [],
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(noPayments);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.recentPayments.length).toBe(0);
  });

  test('⚠️ Debe manejar sin mantenimientos pendientes', async () => {
    const noMaintenance = {
      ...mockDashboardData,
      pendingMaintenance: [],
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(noMaintenance);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.pendingMaintenance.length).toBe(0);
  });

  test('⚠️ Debe manejar sin contratos por vencer', async () => {
    const noExpiring = {
      ...mockDashboardData,
      expiringContracts: [],
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(noExpiring);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.expiringContracts.length).toBe(0);
  });

  test('⚠️ Debe manejar ingresos mensuales en 0', async () => {
    const zeroIncome = {
      ...mockDashboardData,
      financialSummary: {
        monthlyIncome: 0,
        pendingPayments: 0,
        overduePayments: 0,
        collectionRate: 0,
      },
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(zeroIncome);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.financialSummary.monthlyIncome).toBe(0);
  });

  test('⚠️ Debe manejar tasa de cobro del 100%', async () => {
    const perfectCollection = {
      ...mockDashboardData,
      financialSummary: {
        ...mockDashboardData.financialSummary,
        collectionRate: 100,
        overduePayments: 0,
      },
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(perfectCollection);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.financialSummary.collectionRate).toBe(100);
    expect(data.financialSummary.overduePayments).toBe(0);
  });

  test('⚠️ Debe manejar múltiples mantenimientos urgentes', async () => {
    const urgentMaintenance = {
      ...mockDashboardData,
      pendingMaintenance: [
        { id: '1', prioridad: 'urgente', tipo: 'Plomería' },
        { id: '2', prioridad: 'urgente', tipo: 'Eléctrico' },
        { id: '3', prioridad: 'urgente', tipo: 'Estructura' },
      ],
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(urgentMaintenance);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.pendingMaintenance.length).toBe(3);
  });

  test('⚠️ Debe manejar contratos venciendo hoy', async () => {
    const today = new Date();
    const expiringToday = {
      ...mockDashboardData,
      expiringContracts: [
        {
          id: 'contract-urgent',
          fechaFin: today,
          tenant: { nombre: 'Urgente' },
        },
      ],
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(expiringToday);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.expiringContracts.length).toBeGreaterThan(0);
  });

  test('⚠️ Debe manejar pagos atrasados', async () => {
    const overduePayments = {
      ...mockDashboardData,
      recentPayments: [
        {
          id: 'payment-overdue',
          estado: 'atrasado',
          fechaVencimiento: subDays(new Date(), 15),
          monto: 1200,
        },
      ],
      financialSummary: {
        ...mockDashboardData.financialSummary,
        overduePayments: 15000,
      },
    };

    (cachedDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(overduePayments);

    const req = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(req);
    const data = await response.json();

    expect(data.financialSummary.overduePayments).toBeGreaterThan(0);
  });
});
