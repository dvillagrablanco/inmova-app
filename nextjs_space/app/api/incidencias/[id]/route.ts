import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/incidencias/[id] - Actualizar incidencia
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { estado, asignadoA, solucion, costoFinal } = body;

    const incidencia = await prisma.communityIncident.update({
      where: { id: params.id },
      data: {
        ...(estado && {
          estado,
          ...(estado === 'resuelta' || estado === 'cerrada'
            ? { fechaResolucion: new Date() }
            : {}),
        }),
        ...(asignadoA !== undefined && { asignadoA }),
        ...(solucion && { solucion }),
        ...(costoFinal !== undefined && { costoFinal }),
      },
      include: {
        building: true,
        unit: true,
      },
    });

    return NextResponse.json(incidencia);
  } catch (error) {
    console.error('Error updating incidencia:', error);
    return NextResponse.json(
      { error: 'Error al actualizar incidencia' },
      { status: 500 }
    );
  }
}

// DELETE /api/incidencias/[id] - Eliminar incidencia
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.communityIncident.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting incidencia:', error);
    return NextResponse.json(
      { error: 'Error al eliminar incidencia' },
      { status: 500 }
    );
  }
}