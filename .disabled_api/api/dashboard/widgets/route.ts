import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET - Obtener widgets del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;

    const widgets = await prisma.dashboardWidget.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(widgets);
  } catch (error) {
    logger.error('Error al obtener widgets:', error);
    return NextResponse.json({ error: 'Error al obtener widgets' }, { status: 500 });
  }
}

// POST - Crear widget
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const body = await req.json();

    // Buscar o crear preferencia
    let preference = await prisma.userDashboardPreference.findUnique({
      where: { userId }
    });

    if (!preference) {
      preference = await prisma.userDashboardPreference.create({
        data: { userId }
      });
    }

    const widget = await prisma.dashboardWidget.create({
      data: {
        userId,
        preferenceId: preference.id,
        widgetType: body.widgetType,
        title: body.title,
        size: body.size || 'medium',
        refreshRate: body.refreshRate || 'every_15min',
        dataSource: body.dataSource,
        filters: body.filters,
        chartType: body.chartType,
        columns: body.columns || [],
        position: body.position,
        color: body.color,
        icon: body.icon,
        enabled: true
      }
    });

    return NextResponse.json(widget);
  } catch (error) {
    logger.error('Error al crear widget:', error);
    return NextResponse.json({ error: 'Error al crear widget' }, { status: 500 });
  }
}

// DELETE - Eliminar widget
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const widgetId = searchParams.get('id');

    if (!widgetId) {
      return NextResponse.json({ error: 'ID de widget requerido' }, { status: 400 });
    }

    await prisma.dashboardWidget.delete({
      where: { id: widgetId }
    });

    return NextResponse.json({ message: 'Widget eliminado' });
  } catch (error) {
    logger.error('Error al eliminar widget:', error);
    return NextResponse.json({ error: 'Error al eliminar widget' }, { status: 500 });
  }
}
