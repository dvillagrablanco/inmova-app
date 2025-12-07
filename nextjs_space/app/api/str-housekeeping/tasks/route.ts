import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obtener tareas de limpieza
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      listing: {
        companyId: session.user.companyId,
      },
    };

    if (listingId) where.listingId = listingId;
    if (status) where.estado = status;
    if (assignedTo) where.asignadoA = assignedTo;
    if (startDate || endDate) {
      where.fechaTarea = {};
      if (startDate) where.fechaTarea.gte = new Date(startDate);
      if (endDate) where.fechaTarea.lte = new Date(endDate);
    }

    const tasks = await prisma.sTRHousekeepingTask.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            titulo: true,
            unit: {
              select: {
                numero: true,
                building: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        },
        booking: {
          select: {
            id: true,
            nombreHuesped: true,
            fechaEntrada: true,
            fechaSalida: true,
          },
        },
        staff: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        fechaTarea: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

// POST - Crear tarea de limpieza
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      listingId,
      bookingId,
      tipo,
      fechaTarea,
      horaEstimada,
      asignadoA,
      prioridad,
      instrucciones,
    } = body;

    // Validar listing pertenece a la company
    const listing = await prisma.sTRListing.findFirst({
      where: {
        id: listingId,
        companyId: session.user.companyId,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing no encontrado' },
        { status: 404 }
      );
    }

    const task = await prisma.sTRHousekeepingTask.create({
      data: {
        listingId,
        bookingId,
        tipo,
        fechaTarea: new Date(fechaTarea),
        horaEstimada: horaEstimada || null,
        estado: 'pendiente',
        asignadoA: asignadoA || null,
        prioridad: prioridad || 'normal',
        instrucciones: instrucciones || null,
        checklistItems: [],
      },
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}
