import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/owners/[id]/buildings - Asignar edificio a propietario
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
        { error: 'No tienes permisos para asignar edificios' },
        { status: 403 }
      );
    }

    // Verificar que el propietario existe y pertenece a la empresa
    const owner = await prisma.owner.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Propietario no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      buildingId,
      porcentajePropiedad = 100,
      verIngresos = true,
      verGastos = true,
      verOcupacion = true,
      verMantenimiento = true,
      verDocumentos = false,
    } = body;

    if (!buildingId) {
      return NextResponse.json(
        { error: 'buildingId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el edificio existe y pertenece a la empresa
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        companyId: session?.user?.companyId,
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no existe ya la asignación
    const existingAssignment = await prisma.ownerBuilding.findFirst({
      where: {
        ownerId: params.id,
        buildingId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'El edificio ya está asignado a este propietario' },
        { status: 400 }
      );
    }

    // Crear asignación
    const assignment = await prisma.ownerBuilding.create({
      data: {
        ownerId: params.id,
        buildingId,
        companyId: session?.user?.companyId,
        porcentajePropiedad,
        verIngresos,
        verGastos,
        verOcupacion,
        verMantenimiento,
        verDocumentos,
        asignadoPor: session?.user?.id
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
      `Edificio ${buildingId} asignado al propietario ${params.id} por usuario ${session?.user?.id}`
    );

    return NextResponse.json({
      success: true,
      assignment,
      message: 'Edificio asignado exitosamente',
    });
  } catch (error) {
    logger.error('Error al asignar edificio:', error);
    return NextResponse.json(
      { error: 'Error al asignar edificio' },
      { status: 500 }
    );
  }
}
