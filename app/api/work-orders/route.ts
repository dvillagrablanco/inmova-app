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

    const orders = await prisma.maintenanceRequest.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar los datos al formato esperado
    const formattedOrders = orders.map((order) => ({
      id: order.id.substring(0, 8).toUpperCase(),
      title: order.titulo,
      description: order.descripcion || '',
      property: order.unit?.building?.nombre || 'Sin propiedad',
      address: order.unit?.building?.direccion || 'Sin dirección',
      priority: order.prioridad?.toLowerCase() || 'medium',
      status: order.estado?.toLowerCase().replace(' ', '_') || 'pending',
      assignedTo: order.asignadoA || '',
      createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      dueDate: order.fechaEstimadaResolucion?.toISOString() || '',
      estimatedCost: order.costoEstimado || 0,
      actualCost: order.costoFinal || undefined,
      category: order.categoria?.toLowerCase() || 'general',
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    logger.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const order = await prisma.maintenanceRequest.create({
      data: {
        titulo: data.title,
        descripcion: data.description,
        categoria: data.category,
        prioridad: data.priority?.toUpperCase() || 'MEDIA',
        estado: 'PENDIENTE',
        asignadoA: data.assignedTo,
        fechaEstimadaResolucion: data.dueDate ? new Date(data.dueDate) : null,
        costoEstimado: data.estimatedCost || 0,
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

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    logger.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
