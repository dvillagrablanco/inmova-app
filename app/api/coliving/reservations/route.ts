import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = {
  companyId?: string;
};

function mapReservationStatus(status: string): string {
  switch (status) {
    case 'pendiente':
      return 'pendiente';
    case 'cancelado':
      return 'cancelada';
    case 'vencido':
      return 'completada';
    case 'activo':
      return 'confirmada';
    default:
      return status;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contratos = await prisma.roomContract.findMany({
      where: { companyId: user.companyId },
      include: {
        tenant: { select: { nombreCompleto: true, email: true } },
        room: {
          select: {
            numero: true,
            unit: {
              select: {
                building: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reservas = contratos.map((contract) => ({
      id: contract.id,
      huespedNombre: contract.tenant.nombreCompleto,
      huespedEmail: contract.tenant.email,
      habitacionNumero: contract.room.numero,
      propiedad: contract.room.unit.building.nombre,
      fechaEntrada: contract.fechaInicio.toISOString(),
      fechaSalida: contract.fechaFin.toISOString(),
      estado: mapReservationStatus(contract.estado),
      precioTotal: contract.rentaMensual,
      paqueteId: null,
      paqueteNombre: null,
    }));

    return NextResponse.json(reservas);
  } catch (error) {
    logger.error('Error fetching coliving reservations', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}
