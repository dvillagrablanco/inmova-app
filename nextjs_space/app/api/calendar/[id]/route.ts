import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/calendar/[id]
 * Actualiza un evento del calendario
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;

    // Verificar que el evento pertenece a la empresa del usuario
    const evento = await prisma.calendarEvent.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el evento
    const eventoActualizado = await prisma.calendarEvent.update({
      where: { id },
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion,
        prioridad: body.prioridad,
        fechaInicio: body.fechaInicio ? new Date(body.fechaInicio) : undefined,
        fechaFin: body.fechaFin ? new Date(body.fechaFin) : undefined,
        todoElDia: body.todoElDia,
        ubicacion: body.ubicacion,
        color: body.color,
        completado: body.completado,
        cancelado: body.cancelado,
        motivoCancelacion: body.motivoCancelacion,
        notas: body.notas,
        recordatorioActivo: body.recordatorioActivo,
        recordatorioMinutos: body.recordatorioMinutos
      },
      include: {
        building: true,
        unit: true,
        tenant: true,
        contract: true
      }
    });

    return NextResponse.json(eventoActualizado);
  } catch (error) {
    logger.error('Error actualizando evento:', error);
    return NextResponse.json(
      { error: 'Error actualizando evento' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/[id]
 * Elimina un evento del calendario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar que el evento pertenece a la empresa del usuario
    const evento = await prisma.calendarEvent.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el evento
    await prisma.calendarEvent.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Evento eliminado' });
  } catch (error) {
    logger.error('Error eliminando evento:', error);
    return NextResponse.json(
      { error: 'Error eliminando evento' },
      { status: 500 }
    );
  }
}
