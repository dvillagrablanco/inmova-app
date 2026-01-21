import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest) => Promise<Response>;

describe('API: /api/room-rental/properties', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let handler: RouteHandler;
  let unitId = '';
  let buildingId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Empresa RoomRental ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `roomrental-${Date.now()}@inmova.app`,
        name: 'RoomRental Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    userId = user.id;
    companyId = company.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { email: user.email },
      }
    );

    const routeModule = await import('@/app/api/room-rental/properties/route');
    handler = routeModule.POST;
  });

  afterAll(async () => {
    if (unitId) {
      await prisma.roomRentalProperty.deleteMany({ where: { unitId } });
      await prisma.roomSharedSpace.deleteMany({ where: { unitId } });
      await prisma.room.deleteMany({ where: { unitId } });
      await prisma.unit.deleteMany({ where: { id: unitId } });
    }
    if (buildingId) {
      await prisma.building.deleteMany({ where: { id: buildingId } });
    }
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('crea propiedad coliving con habitaciones y configuracion', async () => {
    const payload = {
      propertyName: 'Coliving Test',
      address: 'Calle Test 123',
      totalRooms: 2,
      rooms: [
        { id: 'r1', name: 'Habitacion 1', size: 12, basePrice: 450 },
        { id: 'r2', name: 'Habitacion 2', size: 10, basePrice: 420 },
      ],
      utilities: [
        { id: 'u1', name: 'Agua', amount: 60, prorate: true, method: 'equal' },
      ],
      commonAreas: ['Cocina', 'Salon'],
      quietHours: '22:00-08:00',
      cleaningSchedule: 'weekly',
      petsAllowed: false,
      smokingAllowed: false,
    };

    const request = new NextRequest('http://localhost/api/room-rental/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handler(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as {
      propertyId: string;
      unitId: string;
      buildingId: string;
      roomIds: string[];
      configId: string;
    };

    unitId = data.unitId;
    buildingId = data.buildingId;

    expect(data.propertyId).toBeTruthy();
    expect(data.unitId).toBeTruthy();
    expect(data.buildingId).toBeTruthy();
    expect(data.roomIds.length).toBe(2);

    const building = await prisma.building.findUnique({
      where: { id: data.buildingId },
    });

    expect(building?.nombre).toBe(payload.propertyName);
    expect(building?.direccion).toBe(payload.address);

    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId },
    });

    expect(unit?.habitaciones).toBe(2);
    expect(unit?.rentaMensual).toBe(870);

    const rooms = await prisma.room.findMany({
      where: { unitId: data.unitId },
    });

    expect(rooms.length).toBe(2);

    const sharedSpaces = await prisma.roomSharedSpace.findMany({
      where: { unitId: data.unitId },
    });

    expect(sharedSpaces.length).toBe(2);

    const config = await prisma.roomRentalProperty.findUnique({
      where: { unitId: data.unitId },
    });

    expect(config?.utilities).toBeTruthy();
    expect(config?.quietHours).toBe(payload.quietHours);
    expect(config?.cleaningSchedule).toBe(payload.cleaningSchedule);
  });
});
