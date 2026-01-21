import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

type Handler = (req: NextRequest) => Promise<Response>;

describe('API: /api/admin/notification-campaigns', () => {
  const prisma = new PrismaClient();
  let companyId = '';
  let userId = '';
  let campaignId = '';
  let getHandler: Handler;
  let postHandler: Handler;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { nombre: `Empresa Campañas ${Date.now()}` },
    });

    const user = await prisma.user.create({
      data: {
        email: `campaign-${Date.now()}@inmova.app`,
        name: 'User Campaign',
        password: 'test-password-hash',
        role: 'super_admin',
        companyId: company.id,
      },
    });

    companyId = company.id;
    userId = user.id;

    (getServerSession as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      {
        user: { role: 'super_admin', companyId: company.id, id: user.id },
      }
    );

    const routeModule = await import('@/app/api/admin/notification-campaigns/route');
    getHandler = routeModule.GET;
    postHandler = routeModule.POST;
  });

  afterAll(async () => {
    if (campaignId) {
      await prisma.notificationCampaign.deleteMany({ where: { id: campaignId } });
    }
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  it('crea una campaña y la lista', async () => {
    const postResponse = await postHandler(
      new NextRequest('http://localhost/api/admin/notification-campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Aviso',
          message: 'Mensaje de prueba',
          type: 'email',
          targetAudience: 'all',
          scheduleEnabled: false,
          sendNow: true,
        }),
      })
    );

    expect(postResponse.status).toBe(201);
    const postData = (await postResponse.json()) as { campaign: { id: string; status: string } };
    campaignId = postData.campaign.id;
    expect(postData.campaign.status).toBe('sent');

    const getResponse = await getHandler(
      new NextRequest('http://localhost/api/admin/notification-campaigns')
    );
    expect(getResponse.status).toBe(200);
    const getData = (await getResponse.json()) as { campaigns: Array<{ id: string }> };
    expect(getData.campaigns.some((c) => c.id === campaignId)).toBe(true);
  });
});
