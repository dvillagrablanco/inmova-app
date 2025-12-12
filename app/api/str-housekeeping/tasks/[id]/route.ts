import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
import logger from '@/lib/logger';

// GET - Obtener tarea específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const task = await prisma.sTRHousekeepingTask.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        listing: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
        booking: true,
        staff: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    logger.error('Error al obtener tarea:', error);
    return NextResponse.json(
      { error: 'Error al obtener tarea' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar tarea
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

    // Verificar que la tarea pertenece a la compañía
    const existingTask = await prisma.sTRHousekeepingTask.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    const updateData: any = {};

    // Campos actualizables
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'completado') {
        updateData.fechaFin = new Date();
      }
      if (body.status === 'verificado') {
        updateData.fechaFin = new Date();
      }
    }
    if (body.asignadoA !== undefined) updateData.asignadoA = body.asignadoA;
    if (body.prioridad !== undefined) updateData.prioridad = body.prioridad;
    if (body.instruccionesEspeciales !== undefined) updateData.instruccionesEspeciales = body.instruccionesEspeciales;
    if (body.checklistCompletado !== undefined) updateData.checklistCompletado = body.checklistCompletado;
    if (body.fotosAntes !== undefined) updateData.fotosAntes = body.fotosAntes;
    if (body.fotosDespues !== undefined) updateData.fotosDespues = body.fotosDespues;
    if (body.tiempoRealMin !== undefined) updateData.tiempoRealMin = body.tiempoRealMin;
    if (body.costoMateriales !== undefined) updateData.costoMateriales = body.costoMateriales;
    if (body.costoManoObra !== undefined) updateData.costoManoObra = body.costoManoObra;
    if (body.incidencias !== undefined) updateData.incidencias = body.incidencias;
    if (body.requiereAtencion !== undefined) updateData.requiereAtencion = body.requiereAtencion;
    if (body.notas !== undefined) updateData.notas = body.notas;
    if (body.fechaProgramada !== undefined) updateData.fechaProgramada = new Date(body.fechaProgramada);
    if (body.tiempoEstimadoMin !== undefined) updateData.tiempoEstimadoMin = body.tiempoEstimadoMin;
    if (body.fechaInicio !== undefined) updateData.fechaInicio = new Date(body.fechaInicio);
    if (body.fechaFin !== undefined) updateData.fechaFin = new Date(body.fechaFin);

    const task = await prisma.sTRHousekeepingTask.update({
      where: { id: params.id },
      data: updateData,
      include: {
        listing: {
          select: {
            titulo: true,
          },
        },
        staff: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    logger.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que la tarea pertenece a la compañía
    const existingTask = await prisma.sTRHousekeepingTask.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    await prisma.sTRHousekeepingTask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar tarea:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}
