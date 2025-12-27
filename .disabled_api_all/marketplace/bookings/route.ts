import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId } = body;

    // TODO: Implementar creación real de reserva en base de datos
    logger.info(`Creating booking for service ${serviceId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Reserva creada correctamente',
      bookingId: `bk_${Date.now()}`,
    });
  } catch (error) {
    logger.error('Error creating marketplace booking:', error);
    return NextResponse.json(
      { error: 'Error al crear reserva' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Implementar consulta real de reservas
    const bookings = [
      {
        id: 'bk_1',
        serviceId: 's1',
        serviceName: 'Limpieza Profesional Express',
        providerName: 'CleanPro Services',
        status: 'completed',
        date: '2024-12-20',
        amount: 45,
      },
      {
        id: 'bk_2',
        serviceId: 's2',
        serviceName: 'Reparación de Averías 24/7',
        providerName: 'Fix It Now',
        status: 'confirmed',
        date: '2024-12-28',
        amount: 120,
      },
    ];

    return NextResponse.json(bookings);
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}
