import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obtener preferencias del dashboard del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;

    let preference = await prisma.userDashboardPreference.findUnique({
      where: { userId },
      include: { widgets: true }
    });

    // Si no existe, crear preferencias por defecto
    if (!preference) {
      preference = await prisma.userDashboardPreference.create({
        data: {
          userId,
          layout: 'grid',
          theme: 'light',
          defaultView: 'overview',
          activeWidgets: ['kpi-payments', 'kpi-contracts', 'kpi-maintenance', 'chart-occupancy']
        },
        include: { widgets: true }
      });
    }

    return NextResponse.json(preference);
  } catch (error) {
    console.error('Error al obtener preferencias:', error);
    return NextResponse.json({ error: 'Error al obtener preferencias' }, { status: 500 });
  }
}

// PATCH - Actualizar preferencias
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const body = await req.json();

    const { layout, theme, defaultView, activeWidgets, widgetPositions, defaultFilters } = body;

    const preference = await prisma.userDashboardPreference.upsert({
      where: { userId },
      update: {
        layout,
        theme,
        defaultView,
        activeWidgets,
        widgetPositions,
        defaultFilters
      },
      create: {
        userId,
        layout: layout || 'grid',
        theme: theme || 'light',
        defaultView: defaultView || 'overview',
        activeWidgets: activeWidgets || []
      }
    });

    return NextResponse.json(preference);
  } catch (error) {
    console.error('Error al actualizar preferencias:', error);
    return NextResponse.json({ error: 'Error al actualizar preferencias' }, { status: 500 });
  }
}
