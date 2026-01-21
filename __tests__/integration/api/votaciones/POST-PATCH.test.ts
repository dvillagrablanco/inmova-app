import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest, ctx?: { params: { id: string } }) => Promise<Response>;

describe('API: /api/votaciones', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let buildingId = '';
  let voteId = '';
  let postHandler: RouteHandler;
  let patchHandler: RouteHandler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Votaciones ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `votaciones-${Date.now()}@inmova.app`,
        name: 'Votaciones Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const building = await prisma.building.create({
      data: {
        companyId: company.id,
        nombre: `Edificio Votaciones ${Date.now()}`,
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

    const postModule = await import('@/app/api/votaciones/route');
    postHandler = postModule.POST;

    const patchModule = await import('@/app/api/votaciones/[id]/route');
    patchHandler = patchModule.PATCH;
  });

  afterAll(async () => {
    await prisma.voteRecord.deleteMany({
      where: { vote: { buildingId } },
    });
    await prisma.communityVote.deleteMany({ where: { buildingId } });
    await prisma.building.delete({ where: { id: buildingId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea una votación en DB', async () => {
    const payload = {
      buildingId,
      titulo: 'Renovacion del portal',
      descripcion: 'Votacion para aprobar la renovacion del portal.',
      tipo: 'decision_comunidad',
      opciones: ['Si', 'No'],
      fechaCierre: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quorumRequerido: 50,
      totalVotantes: 20,
    };

    const request = new NextRequest('http://localhost/api/votaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await postHandler(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as { id: string };
    expect(data.id).toBeTruthy();

    voteId = data.id;

    const vote = await prisma.communityVote.findUnique({
      where: { id: voteId },
    });

    expect(vote).not.toBeNull();
    expect(vote?.titulo).toBe(payload.titulo);
    expect(vote?.opciones).toEqual(payload.opciones);
  });

  it('cierra una votación existente', async () => {
    const request = new NextRequest(`http://localhost/api/votaciones/${voteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cerrada' }),
    });

    const response = await patchHandler(request, { params: { id: voteId } });
    expect(response.status).toBe(200);

    const updated = await prisma.communityVote.findUnique({
      where: { id: voteId },
    });

    expect(updated?.estado).toBe('cerrada');
  });
});
