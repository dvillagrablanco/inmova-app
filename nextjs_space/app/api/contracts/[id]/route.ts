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

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        tenant: true,
        payments: {
          orderBy: { fechaVencimiento: 'desc' },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Error al obtener contrato' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { fechaInicio, fechaFin, rentaMensual, deposito, estado, tipo } = body;

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        rentaMensual: rentaMensual ? parseFloat(rentaMensual) : undefined,
        deposito: deposito ? parseFloat(deposito) : undefined,
        estado,
        tipo,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Error al actualizar contrato' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.contract.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Contrato eliminado' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Error al eliminar contrato' }, { status: 500 });
  }
}