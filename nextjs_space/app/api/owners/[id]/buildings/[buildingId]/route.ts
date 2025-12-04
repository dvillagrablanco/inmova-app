import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// PUT /api/owners/[id]/buildings/[buildingId] - Actualizar asignación de edificio
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; buildingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar permisos
    if (!['super_admin', 'administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar asignaciones' },
        { status: 403 }
      );
    }

    // Verificar que la asignación existe
    const assignment = await prisma.ownerBuilding.findFirst({
      where: {
        ownerId: params.id,
        buildingId: params.buildingId,
        companyId: session.user.companyId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      porcentajePropiedad,
      verIngresos,
      verGastos,
      verOcupacion,
      verMantenimiento,
      verDocumentos,
    } = body;

    // Actualizar asignación
    const updatedAssignment = await prisma.ownerBuilding.update({
      where: { id: assignment.id },
      data: {
        porcentajePropiedad,
        verIngresos,
        verGastos,
        verOcupacion,
        verMantenimiento,
        verDocumentos,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            tipo: true,
          },
        },
      },
    });

    logger.info(
      `Asignación actualizada: propietario ${params.id}, edificio ${params.buildingId} por usuario ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: 'Asignación actualizada exitosamente',
    });
  } catch (error) {
    logger.error('Error al actualizar asignación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar asignación' },
      { status: 500 }
    );
  }
}

// DELETE /api/owners/[id]/buildings/[buildingId] - Eliminar asignación de edificio
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; buildingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar permisos
    if (!['super_admin', 'administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar asignaciones' },
        { status: 403 }
      );
    }

    // Verificar que la asignación existe
    const assignment = await prisma.ownerBuilding.findFirst({
      where: {
        ownerId: params.id,
        buildingId: params.buildingId,
        companyId: session.user.companyId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar asignación
    await prisma.ownerBuilding.delete({
      where: { id: assignment.id },
    });

    logger.info(
      `Asignación eliminada: propietario ${params.id}, edificio ${params.buildingId} por usuario ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Asignación eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar asignación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar asignación' },
      { status: 500 }
    );
  }
}
