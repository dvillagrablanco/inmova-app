import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { sendEmail } from '@/lib/email-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = {
  id?: string;
  companyId?: string;
};

const notificationSchema = z.object({
  type: z.string().min(1),
  recipientEmail: z.string().email(),
  contractId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = notificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id: parsed.data.contractId,
        unit: { building: { companyId: user.companyId } },
      },
      include: {
        tenant: { select: { email: true, nombreCompleto: true } },
        unit: {
          select: {
            numero: true,
            building: { select: { nombre: true, direccion: true } },
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    const subject = 'Recordatorio de renovación de contrato';
    const message = `Hola ${contract.tenant.nombreCompleto}, tu contrato de la unidad ${contract.unit.numero} (${contract.unit.building.nombre}) está próximo a vencer.`;

    await prisma.notification.create({
      data: {
        companyId: user.companyId,
        tipo: 'contrato_vencimiento',
        titulo: subject,
        mensaje: message,
        entityId: contract.id,
        entityType: 'contract',
        userId: user.id || null,
      },
    });

    try {
      const emailResult = await sendEmail({
        to: parsed.data.recipientEmail,
        subject,
        text: message,
        html: `<p>${message}</p>`,
      });

      if (!emailResult.success) {
        logger.warn('Notification email not sent', { contractId: contract.id });
      }
    } catch (emailError) {
      logger.error('Error sending notification email', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error sending notification', error);
    return NextResponse.json(
      { error: 'Error al enviar notificación' },
      { status: 500 }
    );
  }
}
