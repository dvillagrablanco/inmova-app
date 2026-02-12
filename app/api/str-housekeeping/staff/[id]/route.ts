import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener personal específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const staff = await prisma.sTRHousekeepingStaff.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        tasks: {
          include: {
            listing: {
              select: {
                titulo: true,
              },
            },
          },
          orderBy: {
            fechaProgramada: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Personal no encontrado' }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    logger.error('Error al obtener personal:', error);
    return NextResponse.json(
      { error: 'Error al obtener personal' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar personal
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    // Verificar que el personal pertenece a la compañía
    const existingStaff = await prisma.sTRHousekeepingStaff.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Personal no encontrado' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.telefono !== undefined) updateData.telefono = body.telefono;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.zonasTrabajo !== undefined) updateData.zonasTrabajo = body.zonasTrabajo;
    if (body.activo !== undefined) updateData.activo = body.activo;
    if (body.capacidadDiaria !== undefined) updateData.capacidadDiaria = body.capacidadDiaria;
    if (body.tarifaPorHora !== undefined) updateData.tarifaPorHora = body.tarifaPorHora;
    if (body.tarifaPorTurnover !== undefined) updateData.tarifaPorTurnover = body.tarifaPorTurnover;
    if (body.calificacionPromedio !== undefined) updateData.calificacionPromedio = body.calificacionPromedio;
    if (body.tareasCompletadas !== undefined) updateData.tareasCompletadas = body.tareasCompletadas;
    if (body.diasDisponibles !== undefined) updateData.diasDisponibles = body.diasDisponibles;
    if (body.horaInicio !== undefined) updateData.horaInicio = body.horaInicio;
    if (body.horaFin !== undefined) updateData.horaFin = body.horaFin;

    const staff = await prisma.sTRHousekeepingStaff.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(staff);
  } catch (error) {
    logger.error('Error al actualizar personal:', error);
    return NextResponse.json(
      { error: 'Error al actualizar personal' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar personal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el personal pertenece a la compañía
    const existingStaff = await prisma.sTRHousekeepingStaff.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Personal no encontrado' }, { status: 404 });
    }

    // Verificar que no tiene tareas asignadas activas
    const activeTasks = await prisma.sTRHousekeepingTask.count({
      where: {
        asignadoA: params.id,
        status: {
          in: ['pendiente', 'asignado', 'en_progreso'],
        },
      },
    });

    if (activeTasks > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar personal con tareas activas asignadas' },
        { status: 400 }
      );
    }

    await prisma.sTRHousekeepingStaff.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Personal eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar personal:', error);
    return NextResponse.json(
      { error: 'Error al eliminar personal' },
      { status: 500 }
    );
  }
}
