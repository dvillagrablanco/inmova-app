import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/notification-preferences
 * Obtiene las preferencias de notificación del usuario
 */
export async function GET(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();

    let preferences = await prisma.notificationPreference.findUnique({
      where: {
        userId: user.id,
      },
    });

    // Si no existen preferencias, crear con valores por defecto
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          emailPagoAtrasado: true,
          emailContratoVencimiento: true,
          emailMantenimiento: true,
          emailDocumento: true,
          pushPagoAtrasado: true,
          pushContratoVencimiento: true,
          pushMantenimiento: true,
          pushDocumento: false,
          frecuenciaResumen: 'semanal',
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al obtener preferencias:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener preferencias de notificación' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notification-preferences
 * Actualiza las preferencias de notificación del usuario
 */
export async function PUT(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const body = await request.json();

    const preferences = await prisma.notificationPreference.upsert({
      where: {
        userId: user.id,
      },
      update: {
        emailPagoAtrasado: body.emailPagoAtrasado,
        emailContratoVencimiento: body.emailContratoVencimiento,
        emailMantenimiento: body.emailMantenimiento,
        emailDocumento: body.emailDocumento,
        pushPagoAtrasado: body.pushPagoAtrasado,
        pushContratoVencimiento: body.pushContratoVencimiento,
        pushMantenimiento: body.pushMantenimiento,
        pushDocumento: body.pushDocumento,
        frecuenciaResumen: body.frecuenciaResumen,
      },
      create: {
        userId: user.id,
        emailPagoAtrasado: body.emailPagoAtrasado ?? true,
        emailContratoVencimiento: body.emailContratoVencimiento ?? true,
        emailMantenimiento: body.emailMantenimiento ?? true,
        emailDocumento: body.emailDocumento ?? true,
        pushPagoAtrasado: body.pushPagoAtrasado ?? true,
        pushContratoVencimiento: body.pushContratoVencimiento ?? true,
        pushMantenimiento: body.pushMantenimiento ?? true,
        pushDocumento: body.pushDocumento ?? false,
        frecuenciaResumen: body.frecuenciaResumen || 'semanal',
      },
    });

    return NextResponse.json(preferences);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al actualizar preferencias:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar preferencias de notificación' },
      { status: 500 }
    );
  }
}
