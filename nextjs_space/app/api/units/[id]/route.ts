import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const unit = await prisma.unit.findUnique({
      where: { id: params.id },
      include: {
        building: true,
        tenant: true,
        contracts: {
          include: {
            tenant: true,
            payments: true,
          },
          orderBy: { fechaInicio: 'desc' },
        },
        maintenanceRequests: {
          orderBy: { fechaSolicitud: 'desc' },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    return NextResponse.json({ error: 'Error al obtener unidad' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { numero, tipo, estado, superficie, habitaciones, banos, rentaMensual, tenantId } = body;

    const unit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        numero,
        tipo,
        estado,
        superficie: superficie ? parseFloat(superficie) : undefined,
        habitaciones: habitaciones ? parseInt(habitaciones) : null,
        banos: banos ? parseInt(banos) : null,
        rentaMensual: rentaMensual ? parseFloat(rentaMensual) : undefined,
        tenantId: tenantId === '' ? null : tenantId,
      },
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json({ error: 'Error al actualizar unidad' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.unit.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Unidad eliminada' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    return NextResponse.json({ error: 'Error al eliminar unidad' }, { status: 500 });
  }
}