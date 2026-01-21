import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/iot/metrics', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let deviceId = '';
  let temperatureReadingId = '';
  let energyReadingId = '';
  let energyReadingPrevId = '';
  let handler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { nombre: `Empresa IoT ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `iot-${Date.now()}@inmova.app`,
        name: 'User IoT',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const device = await prisma.ioTDevice.create({
      data: {
        companyId: company.id,
        nombre: 'Sensor IoT',
        tipo: 'sensor',
        estado: 'activo',
        conectado: true,
      },
    });

    const temperatureReading = await prisma.ioTReading.create({
      data: {
        deviceId: device.id,
        metrica: 'temperatura',
        valor: 22.5,
        unidad: 'C',
        timestamp: new Date(),
      },
    });

    const energyReading = await prisma.ioTReading.create({
      data: {
        deviceId: device.id,
        metrica: 'energia',
        valor: 10,
        unidad: 'kWh',
        timestamp: new Date(),
      },
    });

    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 8);
    const energyReadingPrev = await prisma.ioTReading.create({
      data: {
        deviceId: device.id,
        metrica: 'energia',
        valor: 20,
        unidad: 'kWh',
        timestamp: previousDate,
      },
    });

    companyId = company.id;
    userId = user.id;
    deviceId = device.id;
    temperatureReadingId = temperatureReading.id;
    energyReadingId = energyReading.id;
    energyReadingPrevId = energyReadingPrev.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { companyId: company.id },
      }
    );

    const routeModule = await import('@/app/api/iot/metrics/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    await prisma.ioTReading.deleteMany({ where: { id: temperatureReadingId } });
    await prisma.ioTReading.deleteMany({ where: { id: energyReadingId } });
    await prisma.ioTReading.deleteMany({ where: { id: energyReadingPrevId } });
    await prisma.ioTDevice.deleteMany({ where: { id: deviceId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('retorna series de temperatura y energia', async () => {
    const response = await handler(new NextRequest('http://localhost/api/iot/metrics'));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      temperatureSeries: Array<{ time: string; temp: number }>;
      energySeries: Array<{ day: string; consumption: number }>;
      energySavings: number;
    };

    expect(data.temperatureSeries.length).toBeGreaterThan(0);
    expect(data.energySeries.length).toBe(7);
    expect(data.energySavings).toBeGreaterThanOrEqual(0);
  });
});
