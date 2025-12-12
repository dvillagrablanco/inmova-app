import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { verticalId, email, name } = body;

    // Validate input
    if (!verticalId || !email) {
      return NextResponse.json(
        { error: 'verticalId y email son requeridos' },
        { status: 400 }
      );
    }

    // Find all super admin users
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'super_admin',
        activo: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
      },
    });

    if (superAdmins.length === 0) {
      logger.warn('No se encontraron super administradores activos');
    }

    // Create notifications for all super admins
    const notifications = await Promise.all(
      superAdmins.map((admin) =>
        prisma.notification.create({
          data: {
            companyId: admin.companyId,
            userId: admin.id,
            tipo: 'info',
            titulo: '🎯 Nueva Solicitud de Demo',
            mensaje: `${name || email} ha solicitado una demo del vertical: ${getVerticalName(verticalId)}. Email: ${email}${name ? `, Nombre: ${name}` : ''}`,
            prioridad: 'medio',
            leida: false,
          },
        })
      )
    );

    logger.info('Notificaciones de demo enviadas a super admins', {
      verticalId,
      email,
      notificationsCount: notifications.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Notificaciones enviadas correctamente',
      notificationsCount: notifications.length,
    });
  } catch (error) {
    logger.error('Error al procesar solicitud de demo', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function getVerticalName(verticalId: string): string {
  const verticals: Record<string, string> = {
    alquiler_tradicional: 'Alquiler Tradicional',
    coliving: 'Coliving / Habitaciones',
    str_vacacional: 'STR / Alquiler Vacacional',
    flipping: 'House Flipping',
    servicios_profesionales: 'Servicios Profesionales',
    mixto: 'Multi-Vertical',
    hoteles: 'Hoteles/Apart-hotels',
  };

  return verticals[verticalId] || verticalId;
}
