import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notification-rules
 * Obtiene todas las reglas de notificación de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const rules = await prisma.notificationRule.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        template: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(rules);
  } catch (error: any) {
    logger.error('Error al obtener reglas de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener reglas de notificación' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notification-rules
 * Crea una nueva regla de notificación
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const rule = await prisma.notificationRule.create({
      data: {
        companyId: user.companyId,
        nombre: body.nombre,
        descripcion: body.descripcion,
        activa: body.activa ?? true,
        tipoEvento: body.tipoEvento,
        condiciones: body.condiciones || {},
        diasAnticipo: body.diasAnticipo,
        canales: body.canales || { email: true, push: false, sms: false },
        rolesDestinatarios: body.rolesDestinatarios || [],
        usuariosEspecificos: body.usuariosEspecificos || [],
        templateId: body.templateId,
        asunto: body.asunto,
        mensaje: body.mensaje,
        prioridad: body.prioridad || 'bajo',
        creadoPor: user.id,
      },
      include: {
        template: true,
      },
    });

    logger.info(`Regla de notificación creada: ${rule.id}`, { userId: user.id });

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    logger.error('Error al crear regla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al crear regla de notificación' },
      { status: 500 }
    );
  }
}