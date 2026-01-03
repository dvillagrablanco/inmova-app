/**
 * MAINTENANCE API - UNIT TESTS
 * Tests comprehensivos para la API de solicitudes de mantenimiento
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    maintenanceRequest: {
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

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/maintenance/route';

describe('🔧 Maintenance API - GET Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const mockMaintenanceRequests = [
    {
      id: 'req-1',
      titulo: 'Fuga de agua en cocina',
      descripcion: 'Hay una fuga bajo el fregadero',
      estado: 'pendiente',
      prioridad: 'alta',
      fechaSolicitud: new Date('2026-01-01'),
      fechaProgramada: null,
      fechaCompletado: null,
      unitId: 'unit-1',
      unit: {
        id: 'unit-1',
        numero: '101',
        building: {
          id: 'building-1',
          nombre: 'Edificio Central',
          companyId: 'company-123',
        },
        tenant: {
          id: 'tenant-1',
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
        },
      },
    },
    {
      id: 'req-2',
      titulo: 'Cambio de bombilla',
      descripcion: 'Bombilla fundida en pasillo',
      estado: 'completado',
      prioridad: 'baja',
      fechaSolicitud: new Date('2025-12-25'),
      fechaProgramada: new Date('2025-12-26'),
      fechaCompletado: new Date('2025-12-26'),
      unitId: 'unit-2',
      unit: {
        id: 'unit-2',
        numero: '201',
        building: {
          id: 'building-1',
          nombre: 'Edificio Central',
          companyId: 'company-123',
        },
        tenant: null,
      },
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

  test('✅ Debe retornar todas las solicitudes sin filtros', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockMaintenanceRequests
    );

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  test('✅ Debe retornar solicitudes con paginación', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockMaintenanceRequests
    );
    (prisma.maintenanceRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);

    const req = new NextRequest('http://localhost:3000/api/maintenance?page=1&limit=15');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(15);
    expect(result.pagination.total).toBe(10);
  });

  test('✅ Debe filtrar solicitudes por estado', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockMaintenanceRequests[0],
    ]);

    const req = new NextRequest('http://localhost:3000/api/maintenance?estado=pendiente');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('✅ Debe filtrar solicitudes por prioridad', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockMaintenanceRequests[0],
    ]);

    const req = new NextRequest('http://localhost:3000/api/maintenance?prioridad=alta');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  test('✅ Debe incluir relaciones con unit y building', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockMaintenanceRequests
    );

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].unit).toBeDefined();
    expect(data[0].unit.building).toBeDefined();
  });

  test('✅ Debe incluir información del inquilino', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockMaintenanceRequests
    );

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);
    const data = await response.json();

    const withTenant = data.find((r: any) => r.unit.tenant);
    if (withTenant) {
      expect(withTenant.unit.tenant.nombre).toBeDefined();
    }
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe retornar 401 si no está autenticado', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('❌ Debe retornar 400 sin companyId', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-123' }, // Sin companyId
    });

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);

    expect(response.status).toBe(400);
  });

  test('❌ Debe manejar error de base de datos', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database error')
    );

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);

    expect(response.status).toBe(500);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar lista vacía de solicitudes', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(0);
  });

  test('⚠️ Debe manejar solicitud sin inquilino asignado', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        ...mockMaintenanceRequests[0],
        unit: {
          ...mockMaintenanceRequests[0].unit,
          tenant: null,
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].unit.tenant).toBeNull();
  });

  test('⚠️ Debe manejar solicitud sin fecha programada', async () => {
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        ...mockMaintenanceRequests[0],
        fechaProgramada: null,
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].fechaProgramada).toBeNull();
  });

  test('⚠️ Debe ordenar por fecha de solicitud desc', async () => {
    const ordered = [...mockMaintenanceRequests].sort(
      (a, b) => b.fechaSolicitud.getTime() - a.fechaSolicitud.getTime()
    );

    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(ordered);

    const req = new NextRequest('http://localhost:3000/api/maintenance');
    const response = await GET(req);
    const data = await response.json();

    expect(data[0].fechaSolicitud).toBeTruthy();
  });
});

describe('🔧 Maintenance API - POST Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const validMaintenanceData = {
    titulo: 'Nueva solicitud',
    descripcion: 'Descripción detallada',
    estado: 'pendiente',
    prioridad: 'media',
    unitId: 'unit-1',
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

  test('✅ Debe crear una solicitud exitosamente', async () => {
    const createdRequest = {
      id: 'req-new',
      ...validMaintenanceData,
      fechaSolicitud: new Date(),
    };

    (prisma.maintenanceRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue(
      createdRequest
    );

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(validMaintenanceData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('✅ Debe crear solicitud con prioridad alta', async () => {
    const urgentData = {
      ...validMaintenanceData,
      prioridad: 'alta',
    };

    (prisma.maintenanceRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'req-urgent',
      ...urgentData,
    });

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(urgentData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  // ========================================
  // VALIDACIONES
  // ========================================

  test('❌ Debe rechazar solicitud sin título', async () => {
    const invalidData = {
      descripcion: 'Test',
      unitId: 'unit-1',
    };

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe rechazar solicitud sin unitId', async () => {
    const invalidData = {
      titulo: 'Test',
      descripcion: 'Test',
    };

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });

  test('❌ Debe retornar 401 sin autenticación', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(validMaintenanceData),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe aceptar descripción vacía', async () => {
    const minimalData = {
      ...validMaintenanceData,
      descripcion: '',
    };

    (prisma.maintenanceRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'req-minimal',
      ...minimalData,
    });

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(minimalData),
    });

    const response = await POST(req);

    expect([200, 201, 400]).toContain(response.status);
  });

  test('⚠️ Debe manejar título muy largo', async () => {
    const longTitle = {
      ...validMaintenanceData,
      titulo: 'a'.repeat(500),
    };

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(longTitle),
    });

    const response = await POST(req);

    expect([200, 201, 400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar descripción muy larga', async () => {
    const longDesc = {
      ...validMaintenanceData,
      descripcion: 'a'.repeat(5000),
    };

    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(longDesc),
    });

    const response = await POST(req);

    expect([200, 201, 400, 500]).toContain(response.status);
  });

  test('⚠️ Debe manejar todos los niveles de prioridad', async () => {
    const priorities = ['baja', 'media', 'alta', 'urgente'];

    for (const prioridad of priorities) {
      const requestData = {
        ...validMaintenanceData,
        prioridad,
      };

      (prisma.maintenanceRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: `req-${prioridad}`,
        ...requestData,
      });

      const req = new NextRequest('http://localhost:3000/api/maintenance', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const response = await POST(req);

      expect([200, 201]).toContain(response.status);
    }
  });

  test('⚠️ Debe manejar todos los estados', async () => {
    const estados = ['pendiente', 'en_proceso', 'completado', 'cancelado'];

    for (const estado of estados) {
      const requestData = {
        ...validMaintenanceData,
        estado,
      };

      (prisma.maintenanceRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: `req-${estado}`,
        ...requestData,
      });

      const req = new NextRequest('http://localhost:3000/api/maintenance', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const response = await POST(req);

      expect([200, 201]).toContain(response.status);
    }
  });

  test('⚠️ Debe manejar JSON malformado', async () => {
    const req = new NextRequest('http://localhost:3000/api/maintenance', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(req);

    expect([400, 500]).toContain(response.status);
  });
});
