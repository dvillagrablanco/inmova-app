import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest) => Promise<Response>;

describe('API: /api/edificios', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let handler: RouteHandler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Edificios ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `edificios-${Date.now()}@inmova.app`,
        name: 'Edificios Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    userId = user.id;
    companyId = company.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      user: { email: user.email },
    });

    const routeModule = await import('@/app/api/edificios/route');
    handler = routeModule.POST;
  });

  afterAll(async () => {
    await prisma.unit.deleteMany({
      where: { building: { companyId } },
    });
    await prisma.building.deleteMany({ where: { companyId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea edificio y unidad en DB', async () => {
    const payload = {
      direccion: 'Calle Test 123',
      ciudad: 'Madrid',
      provincia: 'Madrid',
      codigoPostal: '28001',
      tipo: 'residencial',
      referencia: 'REF-01',
      superficie: '80',
      habitaciones: '3',
      banos: '2',
      planta: '2',
      ascensor: 'true',
      parking: 'false',
    };

    const request = new NextRequest('http://localhost/api/edificios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handler(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as { building: { id: string }; unit: { id: string } };
    expect(data.building.id).toBeTruthy();
    expect(data.unit.id).toBeTruthy();

    const building = await prisma.building.findUnique({
      where: { id: data.building.id },
      include: { units: true },
    });

    expect(building).not.toBeNull();
    expect(building?.units.length).toBe(1);
    expect(building?.units[0].numero).toBe('REF-01');
    expect(building?.ascensor).toBe(true);
    expect(building?.garaje).toBe(false);
  });
});
