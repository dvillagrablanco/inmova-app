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

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        units: {
          include: {
            building: true,
          },
        },
        contracts: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
            payments: true,
          },
          orderBy: { fechaInicio: 'desc' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Error al obtener inquilino' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nombreCompleto, dni, email, telefono, fechaNacimiento, scoring, nivelRiesgo, notas } = body;

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        nombreCompleto,
        dni,
        email,
        telefono,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        scoring: scoring ? parseInt(scoring) : undefined,
        nivelRiesgo,
        notas,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Error al actualizar inquilino' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.tenant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Inquilino eliminado' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Error al eliminar inquilino' }, { status: 500 });
  }
}