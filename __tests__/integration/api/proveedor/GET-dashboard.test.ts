import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest) => Promise<Response>;

describe('API: /api/proveedor/dashboard', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let providerId = '';
  let buildingId = '';
  let handler: RouteHandler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa Proveedor ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `proveedor-${Date.now()}@inmova.app`,
        name: 'Proveedor Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const provider = await prisma.provider.create({
      data: {
        companyId: company.id,
        nombre: 'Proveedor Demo',
        tipo: 'mantenimiento',
        telefono: '600000000',
        email: user.email,
      },
    });

    const building = await prisma.building.create({
      data: {
        companyId: company.id,
        nombre: `Edificio Proveedor ${Date.now()}`,
        direccion: 'Calle Test 123',
        tipo: 'residencial',
        anoConstructor: 2020,
        numeroUnidades: 10,
      },
    });

    userId = user.id;
    companyId = company.id;
    providerId = provider.id;
    buildingId = building.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const routeModule = await import('@/app/api/proveedor/dashboard/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    await prisma.providerWorkOrder.deleteMany({ where: { providerId } });
    await prisma.provider.delete({ where: { id: providerId } });
    await prisma.building.delete({ where: { id: buildingId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('retorna estadisticas y reservas recientes', async () => {
    const now = new Date();
    const baseData = {
      companyId,
      providerId,
      buildingId,
      titulo: 'Orden Test',
      descripcion: 'Trabajo de prueba',
      tipo: 'correctivo',
      asignadoPor: userId,
    };

    await prisma.providerWorkOrder.create({
      data: {
        ...baseData,
        estado: 'pendiente',
        fechaAsignacion: now,
        costoTotal: 0,
      },
    });

    await prisma.providerWorkOrder.create({
      data: {
        ...baseData,
        estado: 'asignada',
        fechaAsignacion: now,
        costoTotal: 0,
      },
    });

    await prisma.providerWorkOrder.create({
      data: {
        ...baseData,
        estado: 'completada',
        fechaAsignacion: now,
        fechaCompletado: now,
        costoTotal: 100,
        valoracion: 4,
      },
    });

    const request = new NextRequest('http://localhost/api/proveedor/dashboard');
    const response = await handler(request);
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      stats: {
        serviciosActivos: number;
        reservasEsteMes: number;
        reservasPendientes: number;
        ingresosMes: number;
        valoracionMedia: number;
        totalValoraciones: number;
      };
      recentBookings: Array<{ id: string }>;
    };

    expect(data.stats.serviciosActivos).toBe(2);
    expect(data.stats.reservasEsteMes).toBe(3);
    expect(data.stats.reservasPendientes).toBe(2);
    expect(data.stats.ingresosMes).toBe(100);
    expect(data.stats.valoracionMedia).toBe(4);
    expect(data.stats.totalValoraciones).toBe(1);
    expect(data.recentBookings.length).toBeGreaterThan(0);
  });
});
