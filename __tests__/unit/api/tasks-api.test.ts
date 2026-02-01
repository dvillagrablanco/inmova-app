/**
 * TASKS API - COMPREHENSIVE UNIT TESTS
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks
vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/permissions', () => ({
  requireAuth: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/validations', () => ({
  taskCreateSchema: {
    parse: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { taskCreateSchema } from '@/lib/validations';
import { GET, POST } from '@/app/api/tasks/route';

describe('✅ Tasks API - GET', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const mockTasks = [
    {
      id: 'task-1',
      titulo: 'Revisar contrato',
      descripcion: 'Revisar contrato del edificio A',
      estado: 'pendiente',
      prioridad: 'alta',
      fechaLimite: new Date('2026-02-15'),
      asignadoA: 'user-2',
      creadoPor: 'user-123',
      companyId: 'company-123',
      asignadoUser: {
        id: 'user-2',
        name: 'Juan Pérez',
        email: 'juan@example.com',
      },
      creadorUser: {
        id: 'user-123',
        name: 'Admin',
        email: 'admin@example.com',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
  });

  test('✅ Debe retornar lista de tareas', async () => {
    (prisma.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
    (prisma.task.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const req = new NextRequest('http://localhost:3000/api/tasks');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.meta).toBeDefined();
  });

  test('✅ Debe filtrar por estado', async () => {
    (prisma.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
    (prisma.task.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const req = new NextRequest('http://localhost:3000/api/tasks?estado=pendiente');
    await GET(req);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estado: 'pendiente' }),
      })
    );
  });

  test('✅ Debe filtrar por prioridad', async () => {
    (prisma.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
    (prisma.task.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const req = new NextRequest('http://localhost:3000/api/tasks?prioridad=alta');
    await GET(req);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ prioridad: 'alta' }),
      })
    );
  });

  test('✅ Debe filtrar por asignadoA', async () => {
    (prisma.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
    (prisma.task.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const req = new NextRequest('http://localhost:3000/api/tasks?asignadoA=user-2');
    await GET(req);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ asignadoA: 'user-2' }),
      })
    );
  });

  test('✅ Debe soportar paginación', async () => {
    (prisma.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
    (prisma.task.count as ReturnType<typeof vi.fn>).mockResolvedValue(50);

    const req = new NextRequest('http://localhost:3000/api/tasks?limit=10&offset=20');
    const response = await GET(req);
    const data = await response.json();

    expect(data.meta.limit).toBe(10);
    expect(data.meta.offset).toBe(20);
    expect(data.meta.total).toBe(50);
  });

  test('✅ Debe ordenar por prioridad y fecha límite', async () => {
    (prisma.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
    (prisma.task.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const req = new NextRequest('http://localhost:3000/api/tasks');
    await GET(req);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ prioridad: 'desc' }, { fechaLimite: 'asc' }],
      })
    );
  });

  test('❌ Sin autenticación retorna 401', async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No autenticado'));

    const req = new NextRequest('http://localhost:3000/api/tasks');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  test('⚠️ Debe manejar lista vacía', async () => {
    (prisma.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.task.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const req = new NextRequest('http://localhost:3000/api/tasks');
    const response = await GET(req);
    const data = await response.json();

    expect(data.data.length).toBe(0);
  });
});

describe('✅ Tasks API - POST', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    role: 'ADMIN',
  };

  const validTaskData = {
    titulo: 'Nueva tarea',
    descripcion: 'Descripción de la tarea',
    estado: 'pendiente',
    prioridad: 'media',
    fechaLimite: new Date('2026-03-01'),
    asignadoA: 'user-2',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (requirePermission as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (taskCreateSchema.parse as ReturnType<typeof vi.fn>).mockReturnValue(validTaskData);
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: validTaskData.asignadoA,
      companyId: mockUser.companyId,
    });
  });

  test('✅ Debe crear tarea exitosamente', async () => {
    const createdTask = { id: 'task-new', ...validTaskData };
    (prisma.task.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdTask);

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify(validTaskData),
    });

    const response = await POST(req);

    expect([200, 201]).toContain(response.status);
  });

  test('❌ Debe rechazar datos inválidos', async () => {
    (taskCreateSchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({
      success: false,
      error: { errors: [{ path: ['titulo'], message: 'Required' }] },
    });

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  test('❌ Sin permisos retorna 401/403', async () => {
    (requirePermission as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Forbidden'));

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify(validTaskData),
    });

    const response = await POST(req);

    expect([401, 403]).toContain(response.status);
  });
});
