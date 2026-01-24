import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/iot/automations', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let deviceId = '';
  let automationId = '';
  let handler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { nombre: `Empresa IoT Auto ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `iot-auto-${Date.now()}@inmova.app`,
        name: 'User IoT Auto',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const device = await prisma.ioTDevice.create({
      data: {
        companyId: company.id,
        nombre: 'Dispositivo Auto',
        tipo: 'sensor',
        estado: 'activo',
        conectado: true,
      },
    });

    const automation = await prisma.ioTAutomation.create({
      data: {
        companyId: company.id,
        deviceId: device.id,
        nombre: 'Apagar luces',
        descripcion: 'Cuando no haya movimiento',
        tipo: 'motion',
        condiciones: { trigger: 'sin_movimiento' },
        acciones: { accion: 'apagar_luces' },
        activa: true,
      },
    });

    companyId = company.id;
    userId = user.id;
    deviceId = device.id;
    automationId = automation.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { companyId: company.id },
      }
    );

    const routeModule = await import('@/app/api/iot/automations/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    await prisma.ioTAutomation.deleteMany({ where: { id: automationId } });
    await prisma.ioTDevice.deleteMany({ where: { id: deviceId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('retorna automatizaciones', async () => {
    const response = await handler(new NextRequest('http://localhost/api/iot/automations'));
    expect(response.status).toBe(200);
    const data = (await response.json()) as { automations: Array<{ id: string; name: string }> };
    expect(data.automations.length).toBe(1);
    expect(data.automations[0].name).toBe('Apagar luces');
  });
});
