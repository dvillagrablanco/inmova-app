/**
 * API Endpoint: Suscripción Push
 * 
 * POST /api/v1/push/subscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { savePushSubscription } from '@/lib/push-notification-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const subscription = await savePushSubscription(
      session.user.id,
      companyId,
      validation.data
    );

    return NextResponse.json({
      success: true,
      message: 'Suscripción guardada exitosamente',
      data: { id: subscription.id },
    });

  } catch (error: any) {
    logger.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Error guardando suscripción', message: error.message },
      { status: 500 }
    );
  }
}
