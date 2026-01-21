import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createCampaignSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(5),
  type: z.enum(['email', 'sms', 'push', 'in_app']),
  targetAudience: z.string().min(1),
  scheduleEnabled: z.boolean().optional(),
  scheduledAt: z.string().optional(),
  sendNow: z.boolean().optional(),
});

const resolveRecipientCount = async (segmentId: string) => {
  const now = new Date();
  const activeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  switch (segmentId) {
    case 'all':
      return prisma.company.count({ where: { activo: true } });
    case 'active':
      return prisma.company.count({
        where: { activo: true, estadoCliente: 'activo', updatedAt: { gte: activeThreshold } },
      });
    case 'trial':
      return prisma.company.count({ where: { OR: [{ estadoCliente: 'prueba' }, { esEmpresaPrueba: true }] } });
    case 'inactive':
      return prisma.company.count({ where: { activo: true, updatedAt: { lt: activeThreshold } } });
    case 'enterprise':
      return prisma.company.count({ where: { subscriptionPlan: { tier: 'ENTERPRISE' } } });
    case 'expiring':
      return 0;
    default:
      return 0;
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const campaigns = await prisma.notificationCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: { select: { name: true } },
      },
    });

    const formatted = campaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      message: campaign.message,
      type: campaign.type,
      status: campaign.status,
      targetAudience: campaign.targetAudience,
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount || undefined,
      openRate: campaign.openRate ?? undefined,
      clickRate: campaign.clickRate ?? undefined,
      scheduledAt: campaign.scheduledAt?.toISOString(),
      sentAt: campaign.sentAt?.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
      createdBy: campaign.createdByUser?.name || 'Admin',
    }));

    return NextResponse.json({ campaigns: formatted });
  } catch (error) {
    logger.error('[Notification Campaigns] Error loading campaigns', error);
    return NextResponse.json({ error: 'Error al cargar campañas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createCampaignSchema.parse(body);

    const recipientCount = await resolveRecipientCount(data.targetAudience);
    const sendNow = Boolean(data.sendNow);
    const scheduleEnabled = Boolean(data.scheduleEnabled);
    const scheduledAt = scheduleEnabled && data.scheduledAt ? new Date(data.scheduledAt) : null;

    const status = sendNow
      ? 'sent'
      : scheduleEnabled && scheduledAt
        ? 'scheduled'
        : 'draft';

    const sentAt = sendNow ? new Date() : null;

    const campaign = await prisma.notificationCampaign.create({
      data: {
        companyId: session.user.companyId,
        title: data.title,
        message: data.message,
        type: data.type,
        status,
        targetAudience: data.targetAudience,
        recipientCount,
        sentCount: sendNow ? recipientCount : 0,
        scheduledAt,
        sentAt,
        createdBy: session.user.id,
      },
      include: { createdByUser: { select: { name: true } } },
    });

    return NextResponse.json(
      {
        campaign: {
          id: campaign.id,
          title: campaign.title,
          message: campaign.message,
          type: campaign.type,
          status: campaign.status,
          targetAudience: campaign.targetAudience,
          recipientCount: campaign.recipientCount,
          sentCount: campaign.sentCount || undefined,
          scheduledAt: campaign.scheduledAt?.toISOString(),
          sentAt: campaign.sentAt?.toISOString(),
          createdAt: campaign.createdAt.toISOString(),
          createdBy: campaign.createdByUser?.name || 'Admin',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[Notification Campaigns] Error creating campaign', error);
    return NextResponse.json({ error: 'Error al crear campaña' }, { status: 500 });
  }
}
