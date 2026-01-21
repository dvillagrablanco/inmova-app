import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/construction/gantt', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let companyId = '';
  let userId = '';
  let buildingId = '';
  let projectId = '';
  let permitId = '';
  let taskId = '';
  let handler: Handler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Gantt ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `gantt-${Date.now()}@inmova.app`,
        name: 'User Gantt',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const building = await prisma.building.create({
      data: {
        companyId: company.id,
        nombre: 'Edificio Gantt',
        direccion: 'Calle Gantt 123',
        tipo: 'residencial',
        anoConstructor: 2020,
        numeroUnidades: 10,
      },
    });

    const project = await prisma.constructionProject.create({
      data: {
        companyId: company.id,
        buildingId: building.id,
        nombre: 'Proyecto Gantt',
        descripcion: 'Descripcion proyecto',
        tipoProyecto: 'obra_nueva',
        direccion: 'Calle Gantt 123',
        presupuestoTotal: 100000,
        fechaInicio: new Date('2026-01-01'),
        fechaFinPrevista: new Date('2026-06-01'),
        duracionMeses: 6,
        faseActual: 'PLANIFICACION',
        porcentajeAvance: 10,
      },
    });

    const permit = await prisma.constructionPermit.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        nombre: 'Licencia de obra',
        tipo: 'Construccion',
        estado: 'pending',
        requerido: true,
        fechaLimite: new Date('2026-02-01'),
        emisor: 'Ayuntamiento',
        costo: 5000,
      },
    });

    const task = await prisma.constructionWorkOrder.create({
      data: {
        projectId: project.id,
        fase: 'PLANIFICACION',
        titulo: 'Planificacion inicial',
        descripcion: 'Detalle',
        subcontratista: 'Equipo A',
        presupuesto: 10000,
        costoReal: 2000,
        fechaInicio: new Date('2026-01-05'),
        fechaFin: new Date('2026-01-20'),
        estado: 'pendiente',
        porcentajeAvance: 25,
      },
    });

    companyId = company.id;
    userId = user.id;
    buildingId = building.id;
    projectId = project.id;
    permitId = permit.id;
    taskId = task.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const routeModule = await import('@/app/api/construction/gantt/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    await prisma.constructionWorkOrder.deleteMany({ where: { id: taskId } });
    await prisma.constructionPermit.deleteMany({ where: { id: permitId } });
    await prisma.constructionProject.deleteMany({ where: { id: projectId } });
    await prisma.building.deleteMany({ where: { id: buildingId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('retorna resumen, permisos y fases', async () => {
    const response = await handler(new NextRequest('http://localhost/api/construction/gantt'));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      summary: { projectId: string };
      permits: Array<{ id: string }>;
      phases: Array<{ id: string; progress: number; status: string }>;
    };

    expect(data.summary.projectId).toBe(projectId);
    expect(data.permits.length).toBe(1);
    expect(data.phases.length).toBe(1);
    expect(data.phases[0].progress).toBe(25);
    expect(['not_started', 'in_progress', 'completed', 'delayed']).toContain(
      data.phases[0].status
    );
  });
});
