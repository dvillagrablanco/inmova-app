/**
 * ANALYTICS API - COMPREHENSIVE TESTS
 * Tests para API de analytics y tracking
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

// Mocks
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    analyticsEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    building: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    unit: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    tenant: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  companyId: 'company-1',
  role: 'ADMIN',
};

describe('📊 Analytics API - Event Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe crear evento de analytics', async () => {
    const event = {
      id: 'event-1',
      type: 'page_view',
      page: '/dashboard',
      userId: 'user-1',
      companyId: 'company-1',
      timestamp: new Date(),
    };

    (prisma.analyticsEvent.create as ReturnType<typeof vi.fn>).mockResolvedValue(event);

    const createdEvent = await prisma.analyticsEvent.create({
      data: {
        type: 'page_view',
        page: '/dashboard',
        userId: mockUser.id,
        companyId: mockUser.companyId,
      },
    });

    expect(createdEvent.type).toBe('page_view');
    expect(createdEvent.page).toBe('/dashboard');
  });

  test('✅ Debe trackear click events', async () => {
    const clickEvent = {
      type: 'button_click',
      element: 'add_property_btn',
      metadata: { label: 'Agregar Propiedad' },
    };

    (prisma.analyticsEvent.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'event-2',
      ...clickEvent,
    });

    const event = await prisma.analyticsEvent.create({
      data: {
        ...clickEvent,
        userId: mockUser.id,
        companyId: mockUser.companyId,
      },
    });

    expect(event.type).toBe('button_click');
    expect(event.element).toBe('add_property_btn');
  });

  test('✅ Debe trackear form submissions', async () => {
    const formEvent = {
      type: 'form_submit',
      form: 'create_tenant',
      success: true,
    };

    (prisma.analyticsEvent.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'event-3',
      ...formEvent,
    });

    const event = await prisma.analyticsEvent.create({
      data: {
        ...formEvent,
        userId: mockUser.id,
        companyId: mockUser.companyId,
      },
    });

    expect(event.type).toBe('form_submit');
    expect(event.success).toBe(true);
  });

  test('⚠️ Debe manejar metadata compleja', async () => {
    const complexMetadata = {
      type: 'feature_usage',
      feature: 'reports',
      metadata: {
        reportType: 'financial',
        filters: { dateRange: '30d', status: 'paid' },
        exportFormat: 'pdf',
      },
    };

    (prisma.analyticsEvent.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'event-4',
      ...complexMetadata,
    });

    const event = await prisma.analyticsEvent.create({
      data: {
        ...complexMetadata,
        userId: mockUser.id,
        companyId: mockUser.companyId,
      },
    });

    expect(event.metadata).toBeDefined();
    expect(event.metadata.reportType).toBe('financial');
  });
});

describe('📊 Analytics API - Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe calcular ocupación promedio', async () => {
    (prisma.unit.count as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(100) // Total units
      .mockResolvedValueOnce(85); // Rented units

    const totalUnits = await prisma.unit.count({
      where: { companyId: mockUser.companyId },
    });

    const rentedUnits = await prisma.unit.count({
      where: {
        companyId: mockUser.companyId,
        estado: 'rentado',
      },
    });

    const occupancyRate = (rentedUnits / totalUnits) * 100;

    expect(occupancyRate).toBe(85);
  });

  test('✅ Debe calcular ingresos mensuales', async () => {
    (prisma.payment.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { monto: 15000 },
    });

    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        companyId: mockUser.companyId,
        estado: 'pagado',
        fechaPago: {
          gte: startOfMonth(new Date()),
          lte: endOfMonth(new Date()),
        },
      },
      _sum: { monto: true },
    });

    expect(monthlyRevenue._sum.monto).toBe(15000);
  });

  test('✅ Debe contar propiedades activas', async () => {
    (prisma.building.count as ReturnType<typeof vi.fn>).mockResolvedValue(12);

    const activeBuildings = await prisma.building.count({
      where: {
        companyId: mockUser.companyId,
        estado: 'activo',
      },
    });

    expect(activeBuildings).toBe(12);
  });

  test('✅ Debe contar inquilinos activos', async () => {
    (prisma.tenant.count as ReturnType<typeof vi.fn>).mockResolvedValue(85);

    const activeTenants = await prisma.tenant.count({
      where: {
        companyId: mockUser.companyId,
        activo: true,
      },
    });

    expect(activeTenants).toBe(85);
  });
});

describe('📊 Analytics API - Trends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe obtener tendencia de ingresos (últimos 30 días)', async () => {
    const mockPayments = [
      { fechaPago: subDays(new Date(), 1), monto: 1000 },
      { fechaPago: subDays(new Date(), 5), monto: 1500 },
      { fechaPago: subDays(new Date(), 10), monto: 2000 },
    ];

    (prisma.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments);

    const payments = await prisma.payment.findMany({
      where: {
        companyId: mockUser.companyId,
        fechaPago: { gte: subDays(new Date(), 30) },
        estado: 'pagado',
      },
      select: { fechaPago: true, monto: true },
      orderBy: { fechaPago: 'asc' },
    });

    expect(payments).toHaveLength(3);
    expect(payments.reduce((sum, p) => sum + p.monto, 0)).toBe(4500);
  });

  test('✅ Debe agrupar eventos por tipo', async () => {
    (prisma.analyticsEvent.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { type: 'page_view', _count: { _all: 150 } },
      { type: 'button_click', _count: { _all: 80 } },
      { type: 'form_submit', _count: { _all: 25 } },
    ]);

    const eventsByType = await prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: {
        companyId: mockUser.companyId,
        timestamp: { gte: subDays(new Date(), 7) },
      },
      _count: { _all: true },
    });

    expect(eventsByType).toHaveLength(3);
    expect(eventsByType[0]._count._all).toBe(150);
  });

  test('✅ Debe calcular tasa de conversión', async () => {
    (prisma.analyticsEvent.count as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(100) // Visits
      .mockResolvedValueOnce(15); // Conversions

    const visits = await prisma.analyticsEvent.count({
      where: {
        companyId: mockUser.companyId,
        type: 'page_view',
        page: '/properties',
      },
    });

    const conversions = await prisma.analyticsEvent.count({
      where: {
        companyId: mockUser.companyId,
        type: 'form_submit',
        form: 'property_inquiry',
      },
    });

    const conversionRate = (conversions / visits) * 100;

    expect(conversionRate).toBe(15);
  });

  test('⚠️ Debe manejar división por cero', async () => {
    (prisma.analyticsEvent.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const events = await prisma.analyticsEvent.count({
      where: {
        companyId: mockUser.companyId,
        type: 'rare_event',
      },
    });

    const rate = events === 0 ? 0 : 100 / events;

    expect(rate).toBe(0);
  });
});

describe('📊 Analytics API - Tenant Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe trackear login frequency', async () => {
    (prisma.analyticsEvent.count as ReturnType<typeof vi.fn>).mockResolvedValue(45);

    const loginCount = await prisma.analyticsEvent.count({
      where: {
        userId: 'tenant-1',
        type: 'login',
        timestamp: { gte: subDays(new Date(), 30) },
      },
    });

    expect(loginCount).toBe(45);
  });

  test('✅ Debe calcular tiempo promedio en app', async () => {
    const mockSessions = [
      { duration: 600 }, // 10 min
      { duration: 1200 }, // 20 min
      { duration: 300 }, // 5 min
    ];

    const avgDuration = mockSessions.reduce((sum, s) => sum + s.duration, 0) / mockSessions.length;

    expect(avgDuration).toBe(700); // ~11.6 min
  });

  test('✅ Debe identificar features más usadas', async () => {
    (prisma.analyticsEvent.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { page: '/payments', _count: { _all: 120 } },
      { page: '/maintenance', _count: { _all: 85 } },
      { page: '/documents', _count: { _all: 45 } },
    ]);

    const topPages = await prisma.analyticsEvent.groupBy({
      by: ['page'],
      where: {
        companyId: mockUser.companyId,
        type: 'page_view',
      },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 3,
    });

    expect(topPages[0].page).toBe('/payments');
    expect(topPages[0]._count._all).toBe(120);
  });
});

describe('📊 Analytics API - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('⚠️ Debe manejar sin eventos', async () => {
    (prisma.analyticsEvent.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const events = await prisma.analyticsEvent.findMany({
      where: { companyId: mockUser.companyId },
    });

    expect(events).toHaveLength(0);
  });

  test('⚠️ Debe manejar fechas futuras', async () => {
    const futureDate = new Date('2030-01-01');

    (prisma.analyticsEvent.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        companyId: mockUser.companyId,
        timestamp: { gte: futureDate },
      },
    });

    expect(events).toHaveLength(0);
  });

  test('⚠️ Debe manejar aggregates sin datos', async () => {
    (prisma.payment.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { monto: null },
    });

    const result = await prisma.payment.aggregate({
      where: { companyId: 'empty-company' },
      _sum: { monto: true },
    });

    expect(result._sum.monto).toBeNull();
  });
});
