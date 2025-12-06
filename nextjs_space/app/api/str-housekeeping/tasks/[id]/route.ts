/**
 * API Routes for Individual Housekeeping Task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateHousekeepingTask } from '@/lib/str-housekeeping-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtiene una tarea específica
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

    const task = await prisma.sTRHousekeepingTask.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        listing: {
          include: {
            unit: { include: { building: true } }
          }
        },
        staff: true,
        bookingCheckOut: true,
        bookingCheckIn: true
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching housekeeping task:', error);
    return NextResponse.json(
      { error: 'Error al obtener tarea' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Actualiza una tarea
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

    const body = await request.json();

    const task = await updateHousekeepingTask(
      params.id,
      session.user.companyId,
      body
    );

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error updating housekeeping task:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Elimina una tarea
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la tarea pertenece a la compañía
    const task = await prisma.sTRHousekeepingTask.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    await prisma.sTRHousekeepingTask.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'Tarea eliminada' });
  } catch (error) {
    console.error('Error deleting housekeeping task:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}
