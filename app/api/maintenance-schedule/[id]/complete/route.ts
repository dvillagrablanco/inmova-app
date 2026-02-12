import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

async function calculateNextDate(currentDate: Date, frecuencia: string): Date {
  const prisma = await getPrisma();
  const nextDate = new Date(currentDate);

  switch (frecuencia) {
    case 'mensual':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'trimestral':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semestral':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'anual':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: params.id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Mantenimiento programado no encontrado' },
        { status: 404 }
      );
    }

    // Calcular la próxima fecha basándose en la frecuencia
    const currentProximaFecha = new Date(schedule.proximaFecha);
    const nextDate = calculateNextDate(currentProximaFecha, schedule.frecuencia);

    // Actualizar el mantenimiento programado
    const updatedSchedule = await prisma.maintenanceSchedule.update({
      where: { id: params.id },
      data: {
        ultimaFecha: currentProximaFecha,
        proximaFecha: nextDate,
      },
      include: {
        building: true,
        unit: {
          include: {
            building: true,
          },
        },
        provider: true,
      },
    });

    return NextResponse.json({
      message: 'Mantenimiento marcado como completado',
      schedule: updatedSchedule,
    });
  } catch (error) {
    logger.error('Error completing maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Error al completar mantenimiento programado' },
      { status: 500 }
    );
  }
}
