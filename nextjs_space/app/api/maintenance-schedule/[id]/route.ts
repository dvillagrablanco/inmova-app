import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: params.id },
      include: {
        building: true,
        unit: {
          include: {
            building: true,
          },
        },
        provider: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Mantenimiento programado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Error al obtener mantenimiento programado' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo,
      descripcion,
      tipo,
      buildingId,
      unitId,
      frecuencia,
      proximaFecha,
      ultimaFecha,
      diasAnticipacion,
      activo,
      providerId,
      costoEstimado,
      notas,
    } = body;

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (buildingId !== undefined) updateData.buildingId = buildingId;
    if (unitId !== undefined) updateData.unitId = unitId;
    if (frecuencia !== undefined) updateData.frecuencia = frecuencia;
    if (proximaFecha !== undefined) updateData.proximaFecha = new Date(proximaFecha);
    if (ultimaFecha !== undefined) updateData.ultimaFecha = ultimaFecha ? new Date(ultimaFecha) : null;
    if (diasAnticipacion !== undefined) updateData.diasAnticipacion = parseInt(diasAnticipacion);
    if (activo !== undefined) updateData.activo = activo;
    if (providerId !== undefined) updateData.providerId = providerId;
    if (costoEstimado !== undefined) updateData.costoEstimado = costoEstimado ? parseFloat(costoEstimado) : null;
    if (notas !== undefined) updateData.notas = notas;

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id: params.id },
      data: updateData,
      include: {
        building: true,
        unit: {
          include: {
            building: true,
          },
        },
        provider: true,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error updating maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Error al actualizar mantenimiento programado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.maintenanceSchedule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Mantenimiento programado eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Error al eliminar mantenimiento programado' },
      { status: 500 }
    );
  }
}
