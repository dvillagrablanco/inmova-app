/**
 * API para gestionar una reserva específica del marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';

const mapReservationStatus = (estado: string): ReservationStatus => {
  switch (estado) {
    case 'confirmada':
      return 'confirmed';
    case 'completada':
      return 'completed';
    case 'cancelada':
    case 'rechazada':
      return 'cancelled';
    case 'disputada':
      return 'disputed';
    case 'pendiente':
    default:
      return 'pending';
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const reservation = await prisma.marketplaceBooking.findUnique({
      where: { id: params.id },
      include: {
        service: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            provider: { select: { id: true, nombre: true, email: true } },
          },
        },
        tenant: { select: { nombreCompleto: true, email: true } },
        unit: { include: { building: { select: { nombre: true } } } },
        company: { select: { nombre: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, message: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: reservation.id,
        servicio: reservation.service.nombre,
        categoria: reservation.service.categoria,
        proveedor: reservation.service.provider?.nombre || 'Sin proveedor',
        cliente: {
          empresa: reservation.company.nombre || 'Empresa',
          contacto: reservation.tenant.nombreCompleto,
          email: reservation.tenant.email,
        },
        propiedad: reservation.unit?.building?.nombre || reservation.unit?.numero || null,
        fechaSolicitud: reservation.fechaSolicitud.toISOString(),
        fechaServicio: reservation.fechaServicio ? reservation.fechaServicio.toISOString() : null,
        precio: reservation.precioTotal,
        comision: reservation.comision,
        estado: mapReservationStatus(reservation.estado),
        notas: reservation.notasCliente || reservation.notasInternas || null,
      },
    });
  } catch (error: unknown) {
    logger.error('[API Error] Get marketplace reservation:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH para cambiar estado de reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const action = typeof body === 'object' && body !== null ? (body as { action?: string }).action : undefined; // 'confirm' | 'cancel' | 'complete'

    let message = '';
    let newStatus: string = '';

    switch (action) {
      case 'confirm':
        newStatus = 'confirmada';
        message = 'Reserva confirmada correctamente';
        break;
      case 'cancel':
        newStatus = 'cancelada';
        message = 'Reserva cancelada';
        break;
      case 'complete':
        newStatus = 'completada';
        message = 'Reserva marcada como completada';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const reservation = await prisma.marketplaceBooking.update({
      where: { id: params.id },
      data: { estado: newStatus },
    });

    return NextResponse.json({
      success: true,
      data: { id: reservation.id, estado: mapReservationStatus(reservation.estado) },
      message,
    });
  } catch (error: unknown) {
    logger.error('[API Error] Patch marketplace reservation:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.marketplaceBooking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada correctamente',
    });
  } catch (error: unknown) {
    logger.error('[API Error] Delete marketplace reservation:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
