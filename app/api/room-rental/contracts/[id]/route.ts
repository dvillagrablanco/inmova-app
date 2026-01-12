import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/room-rental/contracts/[id]
 * Obtiene un contrato específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contract = await prisma.roomContract.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        room: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
        tenant: true,
        payments: {
          orderBy: {
            fechaVencimiento: 'desc',
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error: any) {
    logger.error('Error fetching contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/room-rental/contracts/[id]
 * Actualiza un contrato
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    const contract = await prisma.roomContract.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: {
        rentaMensual: data.rentaMensual ? parseFloat(data.rentaMensual) : undefined,
        diaPago: data.diaPago,
        deposito: data.deposito ? parseFloat(data.deposito) : undefined,
        gastosIncluidos: data.gastosIncluidos,
        normasConvivencia: data.normasConvivencia,
        horariosVisitas: data.horariosVisitas,
        permiteMascotas: data.permiteMascotas,
        permiteFumar: data.permiteFumar,
        frecuenciaLimpieza: data.frecuenciaLimpieza,
        rotacionLimpieza: data.rotacionLimpieza,
        estado: data.estado,
        firmadoFecha: data.firmadoFecha ? new Date(data.firmadoFecha) : undefined,
      },
      include: {
        room: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
        tenant: true,
      },
    });

    // Si se cancela el contrato, liberar la habitación
    if (data.estado === 'cancelado') {
      await prisma.room.update({
        where: { id: contract.roomId },
        data: { estado: 'disponible' },
      });
    }

    return NextResponse.json(contract);
  } catch (error: any) {
    logger.error('Error updating contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
