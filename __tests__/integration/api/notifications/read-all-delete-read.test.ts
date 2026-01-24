import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type RouteHandler = (req: NextRequest) => Promise<Response>;

describe('API: /api/notifications/read-all y delete-read', () => {
  const prisma = new PrismaClient();
  const originalNodeEnv = process.env.NODE_ENV;
  let userId = '';
  let companyId = '';
  let readAllHandler: RouteHandler;
  let deleteReadHandler: RouteHandler;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const company = await prisma.company.create({
      data: { nombre: `Test Notifications ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `notifications-${Date.now()}@inmova.app`,
        name: 'Notifications Test',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    userId = user.id;
    companyId = company.id;

    await prisma.inAppNotification.createMany({
      data: [
        {
          userId,
          companyId,
          type: 'info',
          title: 'Test 1',
          message: 'Mensaje 1',
          read: false,
        },
        {
          userId,
          companyId,
          type: 'info',
          title: 'Test 2',
          message: 'Mensaje 2',
          read: false,
        },
        {
          userId,
          companyId,
          type: 'info',
          title: 'Test 3',
          message: 'Mensaje 3',
          read: true,
          readAt: new Date(),
        },
      ],
    });

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      user: { id: userId, companyId },
    });

    const readAllModule = await import('@/app/api/notifications/read-all/route');
    const deleteReadModule = await import('@/app/api/notifications/delete-read/route');

    readAllHandler = readAllModule.PATCH;
    deleteReadHandler = deleteReadModule.DELETE;
  });

  afterAll(async () => {
    await prisma.inAppNotification.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('marca todas como leídas y elimina las leídas', async () => {
    const readAllRequest = new NextRequest('http://localhost/api/notifications/read-all', {
      method: 'PATCH',
    });
    const readAllResponse = await readAllHandler(readAllRequest);

    expect(readAllResponse.status).toBe(200);

    const unreadCount = await prisma.inAppNotification.count({
      where: { userId, read: false },
    });
    expect(unreadCount).toBe(0);

    const deleteReadRequest = new NextRequest('http://localhost/api/notifications/delete-read', {
      method: 'DELETE',
    });
    const deleteReadResponse = await deleteReadHandler(deleteReadRequest);

    expect(deleteReadResponse.status).toBe(200);

    const remainingCount = await prisma.inAppNotification.count({
      where: { userId },
    });
    expect(remainingCount).toBe(0);
  });
});
