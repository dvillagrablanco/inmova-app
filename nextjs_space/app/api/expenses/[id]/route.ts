import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
        provider: { select: { nombre: true, telefono: true } },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Error al obtener gasto' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { buildingId, unitId, providerId, concepto, categoria, monto, fecha, facturaPdfPath, notas } = body;

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        buildingId: buildingId || null,
        unitId: unitId || null,
        providerId: providerId || null,
        concepto,
        categoria,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        facturaPdfPath: facturaPdfPath || null,
        notas: notas || null,
      },
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
        provider: { select: { nombre: true } },
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Error al actualizar gasto' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Gasto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 });
  }
}