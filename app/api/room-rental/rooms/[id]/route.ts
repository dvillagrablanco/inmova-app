import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { checkRoomAvailability } from '@/lib/room-rental-service';
import logger, { logError } from '@/lib/logger';
import {
  selectUnitMinimal,
  selectBuildingMinimal,
  selectRoomContractMinimal,
  selectTenantMinimal,
  selectRoomPaymentMinimal,
} from '@/lib/query-optimizer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/room-rental/rooms/[id]
 * Obtiene una habitación específica con detalles completos
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // OPTIMIZADO - Bug Fix Week: Query Optimization
    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        numero: true,
        nombre: true,
        superficie: true,
        tipoHabitacion: true,
        banoPrivado: true,
        tieneBalcon: true,
        escritorio: true,
        armarioEmpotrado: true,
        aireAcondicionado: true,
        calefaccion: true,
        amueblada: true,
        cama: true,
        mesaNoche: true,
        cajonera: true,
        estanteria: true,
        silla: true,
        rentaMensual: true,
        precioPorSemana: true,
        estado: true,
        imagenes: true,
        descripcion: true,
        unitId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        unit: {
          select: {
            ...selectUnitMinimal,
            building: {
              select: selectBuildingMinimal,
            },
          },
        },
        contracts: {
          select: {
            ...selectRoomContractMinimal,
            tenant: {
              select: selectTenantMinimal,
            },
            payments: {
              select: selectRoomPaymentMinimal,
            },
          },
          orderBy: {
            fechaInicio: 'desc',
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Habitación no encontrada' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error: any) {
    logger.error('Error fetching room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/room-rental/rooms/[id]
 * Actualiza una habitación
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // BUG FIX: Validar valores positivos
    if (data.superficie !== undefined) {
      const superficie = parseFloat(data.superficie);
      if (isNaN(superficie) || superficie <= 0) {
        return NextResponse.json(
          { error: 'La superficie debe ser un número positivo' },
          { status: 400 }
        );
      }
    }

    if (data.rentaMensual !== undefined) {
      const rentaMensual = parseFloat(data.rentaMensual);
      if (isNaN(rentaMensual) || rentaMensual <= 0) {
        return NextResponse.json(
          { error: 'La renta mensual debe ser un número positivo' },
          { status: 400 }
        );
      }
    }

    if (data.precioPorSemana !== undefined && data.precioPorSemana !== null) {
      const precioPorSemana = parseFloat(data.precioPorSemana);
      if (isNaN(precioPorSemana) || precioPorSemana <= 0) {
        return NextResponse.json(
          { error: 'El precio por semana debe ser un número positivo' },
          { status: 400 }
        );
      }
    }

    // OPTIMIZADO - Bug Fix Week: Query Optimization + select minimal en response
    const room = await prisma.room.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: {
        nombre: data.nombre,
        superficie: data.superficie ? parseFloat(data.superficie) : undefined,
        tipoHabitacion: data.tipoHabitacion,
        banoPrivado: data.banoPrivado,
        tieneBalcon: data.tieneBalcon,
        escritorio: data.escritorio,
        armarioEmpotrado: data.armarioEmpotrado,
        aireAcondicionado: data.aireAcondicionado,
        calefaccion: data.calefaccion,
        amueblada: data.amueblada,
        cama: data.cama,
        mesaNoche: data.mesaNoche,
        cajonera: data.cajonera,
        estanteria: data.estanteria,
        silla: data.silla,
        rentaMensual: data.rentaMensual ? parseFloat(data.rentaMensual) : undefined,
        precioPorSemana: data.precioPorSemana ? parseFloat(data.precioPorSemana) : undefined,
        estado: data.estado,
        imagenes: data.imagenes,
        descripcion: data.descripcion,
      },
      select: {
        id: true,
        numero: true,
        nombre: true,
        superficie: true,
        tipoHabitacion: true,
        banoPrivado: true,
        tieneBalcon: true,
        rentaMensual: true,
        estado: true,
        unit: {
          select: {
            ...selectUnitMinimal,
            building: {
              select: selectBuildingMinimal,
            },
          },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error: any) {
    logger.error('Error updating room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/room-rental/rooms/[id]
 * Elimina una habitación (solo si no tiene contratos activos)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || session.user.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si tiene contratos activos
    const activeContracts = await prisma.roomContract.count({
      where: {
        roomId: params.id,
        estado: 'activo',
      },
    });

    if (activeContracts > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una habitación con contratos activos' },
        { status: 400 }
      );
    }

    await prisma.room.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json({ message: 'Habitación eliminada correctamente' });
  } catch (error: any) {
    logger.error('Error deleting room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
