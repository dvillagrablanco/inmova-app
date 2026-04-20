import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const updateSchema = z.object({
  paymentRemindersEnabled: z.boolean().optional(),
  paymentRemindersOverdueEnabled: z.boolean().optional(),
  paymentRemindersPreventiveEnabled: z.boolean().optional(),
  paymentRemindersSendToTenant: z.boolean().optional(),
  paymentRemindersSendToAdmin: z.boolean().optional(),
  paymentRemindersMinDaysOverdue: z.number().int().min(1).max(90).optional(),
  paymentRemindersPreventiveDays: z.array(z.number().int().min(0).max(30)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    if (!['administrador', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const prisma = await getPrisma();
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        paymentRemindersEnabled: true,
        paymentRemindersOverdueEnabled: true,
        paymentRemindersPreventiveEnabled: true,
        paymentRemindersSendToTenant: true,
        paymentRemindersSendToAdmin: true,
        paymentRemindersMinDaysOverdue: true,
        paymentRemindersPreventiveDays: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    logger.error('Error obteniendo config de recordatorios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    if (!['administrador', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const prisma = await getPrisma();
    const updated = await prisma.company.update({
      where: { id: user.companyId },
      data: validated,
      select: {
        paymentRemindersEnabled: true,
        paymentRemindersOverdueEnabled: true,
        paymentRemindersPreventiveEnabled: true,
        paymentRemindersSendToTenant: true,
        paymentRemindersSendToAdmin: true,
        paymentRemindersMinDaysOverdue: true,
        paymentRemindersPreventiveDays: true,
      },
    });

    logger.info(
      `Config recordatorios actualizada para empresa ${user.companyId} por usuario ${user.id}`
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Error actualizando config de recordatorios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
