/**
 * API Routes for STR Housekeeping Tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createHousekeepingTask,
  getHousekeepingTasks,
  getHousekeepingStats,
  generateAutomaticTasks
} from '@/lib/str-housekeeping-service';
import { HousekeepingStatus, TurnoverType } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtiene tareas de housekeeping
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Generar tareas automáticas
    if (action === 'generate-automatic') {
      const dias = parseInt(searchParams.get('days') || '7');
      const tasks = await generateAutomaticTasks(session.user.companyId, dias);
      return NextResponse.json({
        success: true,
        message: `${tasks.length} tareas creadas automáticamente`,
        tasks
      });
    }

    // Obtener estadísticas
    if (action === 'stats') {
      const fechaInicio = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const fechaFin = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const stats = await getHousekeepingStats(session.user.companyId, fechaInicio, fechaFin);
      return NextResponse.json(stats);
    }

    // Obtener lista de tareas
    const filters: any = {};

    const status = searchParams.get('status');
    if (status) filters.status = status as HousekeepingStatus;

    const staffId = searchParams.get('staffId');
    if (staffId) filters.staffId = staffId;

    const listingId = searchParams.get('listingId');
    if (listingId) filters.listingId = listingId;

    const prioridad = searchParams.get('priority');
    if (prioridad) filters.prioridad = prioridad;

    const fechaInicio = searchParams.get('startDate');
    if (fechaInicio) filters.fechaInicio = new Date(fechaInicio);

    const fechaFin = searchParams.get('endDate');
    if (fechaFin) filters.fechaFin = new Date(fechaFin);

    const tasks = await getHousekeepingTasks(session.user.companyId, filters);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching housekeeping tasks:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crea una nueva tarea de housekeeping
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar campos requeridos
    if (!body.listingId || !body.tipoTurnover || !body.fechaProgramada) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const task = await createHousekeepingTask({
      companyId: session.user.companyId,
      listingId: body.listingId,
      tipoTurnover: body.tipoTurnover as TurnoverType,
      fechaProgramada: new Date(body.fechaProgramada),
      horaInicio: body.horaInicio ? new Date(body.horaInicio) : undefined,
      horaFin: body.horaFin ? new Date(body.horaFin) : undefined,
      staffId: body.staffId,
      checklistId: body.checklistId,
      prioridad: body.prioridad || 'media',
      instruccionesEspeciales: body.instruccionesEspeciales,
      bookingCheckOutId: body.bookingCheckOutId,
      bookingCheckInId: body.bookingCheckInId
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error creating housekeeping task:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear tarea' },
      { status: 500 }
    );
  }
}
