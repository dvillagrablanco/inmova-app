/**
 * API de Recordatorios Automáticos
 * Ejecuta recordatorios de pagos, contratos y mantenimiento
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { runAllReminders, sendPaymentReminders, sendContractExpirationAlerts, sendMaintenanceNotifications } from '@/lib/reminder-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administradores pueden ejecutar recordatorios manualmente
    if (session.user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No tienes permisos para ejecutar recordatorios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, companyId } = body;

    const targetCompanyId = companyId || session.user.companyId;

    let results;

    switch (type) {
      case 'payment':
        results = await sendPaymentReminders(targetCompanyId);
        break;
      case 'contract':
        results = await sendContractExpirationAlerts(targetCompanyId);
        break;
      case 'maintenance':
        results = await sendMaintenanceNotifications(targetCompanyId);
        break;
      case 'all':
      default:
        results = await runAllReminders(targetCompanyId);
        break;
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Error ejecutando recordatorios:', error);
    return NextResponse.json(
      { error: 'Error ejecutando recordatorios' },
      { status: 500 }
    );
  }
}

// GET para obtener el estado de recordatorios pendientes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || session.user.companyId;

    // Aquí podríamos agregar lógica para obtener estadísticas
    // de cuántos recordatorios hay pendientes de enviar

    return NextResponse.json({
      message: 'Endpoint de estadísticas de recordatorios',
      companyId,
    });
  } catch (error) {
    logger.error('Error obteniendo estado de recordatorios:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado' },
      { status: 500 }
    );
  }
}
