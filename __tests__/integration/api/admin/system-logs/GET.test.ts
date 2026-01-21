import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/admin/system-logs', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let apiLogId = '';
  let securityEventId = '';
  let emailLogId = '';
  let notificationLogId = '';
  let handler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { nombre: `Empresa Logs ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `logs-${Date.now()}@inmova.app`,
        name: 'User Logs',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    const apiLog = await prisma.apiLog.create({
      data: {
        companyId: company.id,
        method: 'GET',
        path: '/api/test',
        statusCode: 500,
        responseBody: {},
        responseTime: 120,
        ipAddress: '127.0.0.1',
      },
    });

    const securityEvent = await prisma.securityEvent.create({
      data: {
        companyId: company.id,
        tipo: 'login_failed',
        severidad: 'error',
        descripcion: 'Intento de login fallido',
        userId: user.id,
      },
    });

    const emailLog = await prisma.emailLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        template: 'test',
        subject: 'Prueba',
        to: 'test@example.com',
        status: 'failed',
        error: 'SMTP error',
      },
    });

    const notificationLog = await prisma.notificationLog.create({
      data: {
        companyId: company.id,
        tipo: 'info',
        canal: 'email',
        destinatario: 'test@example.com',
        mensaje: 'Mensaje',
        estado: 'enviado',
        userId: user.id,
      },
    });

    companyId = company.id;
    userId = user.id;
    apiLogId = apiLog.id;
    securityEventId = securityEvent.id;
    emailLogId = emailLog.id;
    notificationLogId = notificationLog.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { role: 'super_admin' },
      }
    );

    const routeModule = await import('@/app/api/admin/system-logs/route');
    handler = routeModule.GET;
  });

  afterAll(async () => {
    await prisma.notificationLog.deleteMany({ where: { id: notificationLogId } });
    await prisma.emailLog.deleteMany({ where: { id: emailLogId } });
    await prisma.securityEvent.deleteMany({ where: { id: securityEventId } });
    await prisma.apiLog.deleteMany({ where: { id: apiLogId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('retorna logs y stats', async () => {
    const response = await handler(
      new NextRequest(
        'http://localhost/api/admin/system-logs?level=all&source=all&timeRange=24h&page=1&limit=20'
      )
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      logs: Array<{ id: string; level: string }>;
      stats: { total: number; errors: number };
    };

    expect(data.logs.length).toBeGreaterThan(0);
    expect(data.stats.total).toBeGreaterThan(0);
    expect(data.stats.errors).toBeGreaterThan(0);
  });
});
