import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest) => Promise<Response>;

describe('API: /api/valoraciones (POST)', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let buildingId = '';
  let unitId = '';
  let handler: RouteHandler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Valoraciones ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `valoraciones-${Date.now()}@inmova.app`,
        name: 'Valoraciones Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const building = await prisma.building.create({
      data: {
        companyId: company.id,
        nombre: 'Edificio Test',
        direccion: 'Calle Test 1',
        tipo: 'residencial',
        anoConstructor: 2000,
        numeroUnidades: 1,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        buildingId: building.id,
        numero: 'A1',
        tipo: 'vivienda',
        estado: 'ocupada',
        superficie: 80,
        habitaciones: 3,
        banos: 2,
        rentaMensual: 950,
      },
    });

    userId = user.id;
    companyId = company.id;
    buildingId = building.id;
    unitId = unit.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      user: { email: user.email },
    });

    const routeModule = await import('@/app/api/valoraciones/route');
    handler = routeModule.POST;
  });

  afterAll(async () => {
    await prisma.valoracionPropiedad.deleteMany({ where: { companyId } });
    await prisma.unit.deleteMany({ where: { buildingId } });
    await prisma.building.delete({ where: { id: buildingId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea valoración y persiste en DB', async () => {
    const payload = {
      unitId,
      direccion: 'Calle Test 1',
      municipio: 'Madrid',
      provincia: 'Madrid',
      codigoPostal: '28001',
      metrosCuadrados: '80',
      habitaciones: '3',
      banos: '2',
      garajes: '1',
      ascensor: true,
      terraza: false,
      piscina: false,
      estadoConservacion: 'bueno',
      finalidad: 'venta',
    };

    const request = new NextRequest('http://localhost/api/valoraciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handler(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as { id: string };
    expect(data.id).toBeTruthy();

    const saved = await prisma.valoracionPropiedad.findUnique({
      where: { id: data.id },
    });

    expect(saved).not.toBeNull();
    expect(saved?.unitId).toBe(unitId);
    expect(saved?.valorEstimado).toBeGreaterThan(0);
  });
});
