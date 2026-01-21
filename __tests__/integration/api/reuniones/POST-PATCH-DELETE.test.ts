import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest, ctx?: { params: { id: string } }) => Promise<Response>;

describe('API: /api/reuniones', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let buildingId = '';
  let reunionId = '';
  let postHandler: RouteHandler;
  let patchHandler: RouteHandler;
  let deleteHandler: RouteHandler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Reuniones ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `reuniones-${Date.now()}@inmova.app`,
        name: 'Reuniones Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const building = await prisma.building.create({
      data: {
        companyId: company.id,
        nombre: `Edificio Reuniones ${Date.now()}`,
        direccion: 'Calle Test 123',
        tipo: 'residencial',
        anoConstructor: 2020,
        numeroUnidades: 10,
      },
    });

    userId = user.id;
    companyId = company.id;
    buildingId = building.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const postModule = await import('@/app/api/reuniones/route');
    postHandler = postModule.POST;

    const detailModule = await import('@/app/api/reuniones/[id]/route');
    patchHandler = detailModule.PATCH;
    deleteHandler = detailModule.DELETE;
  });

  afterAll(async () => {
    await prisma.communityMeeting.deleteMany({ where: { buildingId } });
    await prisma.building.delete({ where: { id: buildingId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea una reunion en DB', async () => {
    const payload = {
      buildingId,
      titulo: 'Reunion de propietarios',
      descripcion: 'Revision de presupuestos',
      fecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      lugar: 'Sala de juntas',
      ordenDia: [{ titulo: 'Aprobacion de cuentas' }],
      asistentes: [{ nombre: 'Juan Perez' }],
    };

    const request = new NextRequest('http://localhost/api/reuniones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await postHandler(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as { id: string };
    expect(data.id).toBeTruthy();
    reunionId = data.id;

    const meeting = await prisma.communityMeeting.findUnique({
      where: { id: reunionId },
    });

    expect(meeting).not.toBeNull();
    expect(meeting?.titulo).toBe(payload.titulo);
    expect(typeof meeting?.ordenDel).toBe('string');
  });

  it('actualiza una reunion existente', async () => {
    const payload = {
      titulo: 'Reunion extraordinaria',
      descripcion: 'Revision de obra',
      lugar: 'Sala B',
    };

    const request = new NextRequest(`http://localhost/api/reuniones/${reunionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await patchHandler(request, { params: { id: reunionId } });
    expect(response.status).toBe(200);

    const meeting = await prisma.communityMeeting.findUnique({
      where: { id: reunionId },
    });

    expect(meeting?.titulo).toBe(payload.titulo);
    expect(meeting?.ubicacion).toBe(payload.lugar);
  });

  it('elimina una reunion existente', async () => {
    const request = new NextRequest(`http://localhost/api/reuniones/${reunionId}`, {
      method: 'DELETE',
    });

    const response = await deleteHandler(request, { params: { id: reunionId } });
    expect(response.status).toBe(200);

    const meeting = await prisma.communityMeeting.findUnique({
      where: { id: reunionId },
    });

    expect(meeting).toBeNull();
  });
});
