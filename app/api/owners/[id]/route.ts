import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/owners/[id] - Obtener propietario específico
export async function GET(
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

    const owner = await prisma.owner.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
      include: {
        ownerBuildings: {
          include: {
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                tipo: true,
                imagenes: true,
              },
            },
          },
        },
        ownerNotifications: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        ownerAlerts: {
          where: {
            activa: true,
          },
        },
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Propietario no encontrado' },
        { status: 404 }
      );
    }

    // No exponer la contraseña
    const { password, resetToken, resetTokenExpiry, ...ownerData } = owner;

    return NextResponse.json(ownerData);
  } catch (error) {
    logger.error('Error al obtener propietario:', error);
    return NextResponse.json(
      { error: 'Error al obtener propietario' },
      { status: 500 }
    );
  }
}

// PUT /api/owners/[id] - Actualizar propietario
export async function PUT(
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

    // Verificar que el usuario tenga permisos
    if (!['super_admin', 'administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar propietarios' },
        { status: 403 }
      );
    }

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
      nombreCompleto,
      email,
      telefono,
      dni,
      direccion,
      password,
      activo,
      notificarPagos,
      notificarOcupacion,
      notificarMantenimiento,
      notificarVencimientos,
    } = body;

    // Verificar que el email no esté en uso por otro propietario
    if (email && email !== owner.email) {
      const existingOwner = await prisma.owner.findUnique({
        where: { email },
      });

      if (existingOwner) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Verificar que el DNI no esté en uso por otro propietario
    if (dni && dni !== owner.dni) {
      const existingDni = await prisma.owner.findUnique({
        where: { dni },
      });

      if (existingDni) {
        return NextResponse.json(
          { error: 'El DNI ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      nombreCompleto,
      email,
      telefono,
      dni,
      direccion,
      activo,
      notificarPagos,
      notificarOcupacion,
      notificarMantenimiento,
      notificarVencimientos,
    };

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar propietario
    const updatedOwner = await prisma.owner.update({
      where: { id: params.id },
      data: updateData,
      include: {
        ownerBuildings: {
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
        },
      },
    });

    // No exponer la contraseña
    const { password: _, resetToken, resetTokenExpiry, ...ownerData } = updatedOwner;

    logger.info(`Propietario actualizado: ${params.id} por usuario: ${session?.user?.id}`);

    return NextResponse.json({
      success: true,
      owner: ownerData,
      message: 'Propietario actualizado exitosamente',
    });
  } catch (error) {
    logger.error('Error al actualizar propietario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar propietario' },
      { status: 500 }
    );
  }
}

// DELETE /api/owners/[id] - Eliminar propietario
export async function DELETE(
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

    // Verificar que el usuario tenga permisos de administrador
    if (!['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar propietarios' },
        { status: 403 }
      );
    }

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

    // Eliminar propietario (cascade eliminará las relaciones)
    await prisma.owner.delete({
      where: { id: params.id },
    });

    logger.info(`Propietario eliminado: ${params.id} por usuario: ${session?.user?.id}`);

    return NextResponse.json({
      success: true,
      message: 'Propietario eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar propietario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar propietario' },
      { status: 500 }
    );
  }
}
