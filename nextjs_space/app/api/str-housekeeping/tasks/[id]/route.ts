import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
        listing: {
          companyId: session.user.companyId,
        },
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
    console.error('Error al obtener tarea:', error);
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
        listing: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    const updateData: any = {};

    // Campos actualizables
    if (body.estado !== undefined) {
      updateData.estado = body.estado;
      if (body.estado === 'completada') {
        updateData.fechaCompletado = new Date();
      }
      if (body.estado === 'verificada') {
        updateData.fechaVerificacion = new Date();
      }
    }
    if (body.asignadoA !== undefined) updateData.asignadoA = body.asignadoA;
    if (body.prioridad !== undefined) updateData.prioridad = body.prioridad;
    if (body.instrucciones !== undefined) updateData.instrucciones = body.instrucciones;
    if (body.checklistItems !== undefined) updateData.checklistItems = body.checklistItems;
    if (body.fotosAntes !== undefined) updateData.fotosAntes = body.fotosAntes;
    if (body.fotosDespues !== undefined) updateData.fotosDespues = body.fotosDespues;
    if (body.tiempoEmpleado !== undefined) updateData.tiempoEmpleado = body.tiempoEmpleado;
    if (body.costoTotal !== undefined) updateData.costoTotal = body.costoTotal;
    if (body.incidencias !== undefined) updateData.incidencias = body.incidencias;
    if (body.calificacion !== undefined) updateData.calificacion = body.calificacion;
    if (body.comentarios !== undefined) updateData.comentarios = body.comentarios;
    if (body.fechaTarea !== undefined) updateData.fechaTarea = new Date(body.fechaTarea);
    if (body.horaEstimada !== undefined) updateData.horaEstimada = body.horaEstimada;
    if (body.horaInicio !== undefined) updateData.horaInicio = body.horaInicio;
    if (body.horaFin !== undefined) updateData.horaFin = body.horaFin;

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
    console.error('Error al actualizar tarea:', error);
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
        listing: {
          companyId: session.user.companyId,
        },
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
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}
