import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/proyectos/construccion', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let companyId = '';
  let userId = '';
  let projectId = '';
  let taskId = '';
  let projectsHandler: {
    GET: Handler;
    POST: Handler;
    PUT: Handler;
    DELETE: Handler;
  };
  let tasksHandler: {
    POST: Handler;
    PUT: Handler;
    DELETE: Handler;
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Construccion ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `construccion-${Date.now()}@inmova.app`,
        name: 'User Construccion',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    companyId = company.id;
    userId = user.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    projectsHandler = await import('@/app/api/proyectos/construccion/route');
    tasksHandler = await import('@/app/api/proyectos/construccion/tasks/route');
  });

  afterAll(async () => {
    if (taskId) {
      await prisma.constructionWorkOrder.deleteMany({ where: { id: taskId } });
    }
    if (projectId) {
      await prisma.constructionProject.deleteMany({ where: { id: projectId } });
    }
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea, actualiza y elimina proyectos y tareas', async () => {
    const createRequest = new NextRequest('http://localhost/api/proyectos/construccion', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Proyecto Demo',
        description: 'Descripcion demo',
        address: 'Calle Test 123',
        type: 'reforma_integral',
        status: 'planificacion',
        startDate: '2026-01-01',
        endDate: '2026-03-01',
        budget: 120000,
        client: 'Cliente Demo',
        contractor: 'Constructora Demo',
      }),
    });

    const createResponse = await projectsHandler.POST(createRequest);
    expect(createResponse.status).toBe(201);
    const createData = (await createResponse.json()) as { project: { id: string } };
    projectId = createData.project.id;
    expect(projectId).toBeTruthy();

    const updateRequest = new NextRequest(
      `http://localhost/api/proyectos/construccion?id=${projectId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Proyecto Actualizado',
          description: 'Descripcion actualizada',
          address: 'Calle Test 456',
          type: 'reforma_integral',
          status: 'en_curso',
          startDate: '2026-01-01',
          endDate: '2026-04-01',
          budget: 130000,
          client: 'Cliente Demo',
          contractor: 'Constructora Demo',
        }),
      }
    );

    const updateResponse = await projectsHandler.PUT(updateRequest);
    expect(updateResponse.status).toBe(200);

    const taskCreateRequest = new NextRequest(
      `http://localhost/api/proyectos/construccion/tasks?projectId=${projectId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Tarea Demo',
          description: 'Tarea demo',
          startDate: '2026-01-05',
          endDate: '2026-01-20',
          status: 'pendiente',
          progress: 10,
          assignee: 'Equipo A',
          estimatedCost: 5000,
        }),
      }
    );

    const taskCreateResponse = await tasksHandler.POST(taskCreateRequest);
    expect(taskCreateResponse.status).toBe(201);
    const taskData = (await taskCreateResponse.json()) as { task: { id: string } };
    taskId = taskData.task.id;

    const taskUpdateRequest = new NextRequest(
      `http://localhost/api/proyectos/construccion/tasks?projectId=${projectId}&taskId=${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ progress: 50, status: 'en_progreso' }),
      }
    );

    const taskUpdateResponse = await tasksHandler.PUT(taskUpdateRequest);
    expect(taskUpdateResponse.status).toBe(200);

    const taskDeleteRequest = new NextRequest(
      `http://localhost/api/proyectos/construccion/tasks?projectId=${projectId}&taskId=${taskId}`,
      { method: 'DELETE' }
    );

    const taskDeleteResponse = await tasksHandler.DELETE(taskDeleteRequest);
    expect(taskDeleteResponse.status).toBe(200);

    const deleteRequest = new NextRequest(
      `http://localhost/api/proyectos/construccion?id=${projectId}`,
      { method: 'DELETE' }
    );

    const deleteResponse = await projectsHandler.DELETE(deleteRequest);
    expect(deleteResponse.status).toBe(200);
  });
});
