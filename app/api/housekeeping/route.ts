import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar tareas de housekeeping asociadas a las propiedades del usuario
    const tasks = await prisma.maintenanceRequest.findMany({
      where: {
        companyId: session.user.companyId,
        categoria: {
          in: ['limpieza', 'housekeeping', 'checkout', 'checkin', 'deep_clean'],
        },
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
      orderBy: {
        fechaSolicitud: 'desc',
      },
    });

    // Transformar los datos al formato esperado
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      property: task.unit?.building?.nombre || 'Sin edificio',
      address: task.unit?.building?.direccion || 'Sin dirección',
      type: task.categoria || 'checkout',
      status: task.estado?.toLowerCase() || 'pending',
      scheduledDate: task.fechaSolicitud?.toISOString() || new Date().toISOString(),
      assignedTo: task.asignadoA || 'Sin asignar',
      estimatedDuration: 2,
      unitId: task.unitId,
      buildingId: task.unit?.buildingId,
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    logger.error('Error fetching housekeeping tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const task = await prisma.maintenanceRequest.create({
      data: {
        titulo: `Tarea de limpieza - ${data.type}`,
        descripcion: `Tarea de ${data.type} programada`,
        categoria: data.type,
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        fechaSolicitud: new Date(data.scheduledDate),
        asignadoA: data.assignedTo,
        unitId: data.unitId,
        companyId: session.user.companyId,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    logger.error('Error creating housekeeping task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
