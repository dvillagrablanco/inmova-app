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
    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: {
        maintenanceRequests: {
          include: {
            unit: {
              select: { numero: true, building: { select: { nombre: true } } },
            },
          },
          orderBy: { fechaSolicitud: 'desc' },
        },
        expenses: {
          include: {
            building: { select: { nombre: true } },
            unit: { select: { numero: true } },
          },
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Error al obtener proveedor' }, { status: 500 });
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
    const { nombre, tipo, telefono, email, direccion, rating, notas } = body;

    const provider = await prisma.provider.update({
      where: { id: params.id },
      data: {
        nombre,
        tipo,
        telefono,
        email: email || null,
        direccion: direccion || null,
        rating: rating || null,
        notas: notas || null,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Error al actualizar proveedor' }, { status: 500 });
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
    await prisma.provider.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 });
  }
}