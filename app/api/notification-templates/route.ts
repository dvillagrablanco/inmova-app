import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notification-templates
 * Obtiene todas las plantillas de notificación (globales y de la empresa)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const templates = await prisma.notificationTemplate.findMany({
      where: {
        OR: [
          { companyId: user.companyId },
          { esPlantillaGlobal: true, companyId: null },
        ],
        activa: true,
      },
      orderBy: [
        { esPlantillaGlobal: 'desc' },
        { categoria: 'asc' },
        { nombre: 'asc' },
      ],
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al obtener plantillas de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener plantillas de notificación' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notification-templates
 * Crea una nueva plantilla de notificación personalizada
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const template = await prisma.notificationTemplate.create({
      data: {
        companyId: user.companyId,
        nombre: body.nombre,
        categoria: body.categoria,
        asuntoEmail: body.asuntoEmail,
        mensajeEmail: body.mensajeEmail,
        mensajePush: body.mensajePush,
        mensajeSMS: body.mensajeSMS,
        variables: body.variables || [],
        esPlantillaGlobal: false,
        activa: body.activa ?? true,
      },
    });

    logger.info(`Plantilla de notificación creada: ${template.id}`, { userId: user.id });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al crear plantilla de notificación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al crear plantilla de notificación' },
      { status: 500 }
    );
  }
}