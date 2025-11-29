import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// PATCH /api/ordenes-trabajo/[id] - Actualizar orden de trabajo
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
    const {
      estado,
      fechaInicio,
      fechaCompletado,
      fotosAntes,
      fotosDespues,
      materialesUsados,
      horasTrabajadas,
      costoMateriales,
      costoManoObra,
      costoTotal,
      firmadoPor,
      firmaDigital,
      valoracion,
      comentarios,
    } = body;

    const updateData: any = {
      ...(estado && {
        estado,
        ...(estado === 'en_progreso' && fechaInicio
          ? { fechaInicio: new Date(fechaInicio) }
          : {}),
        ...(estado === 'completada' && fechaCompletado
          ? { fechaCompletado: new Date(fechaCompletado), fechaFirma: new Date() }
          : {}),
      }),
      ...(fotosAntes && { fotosAntes }),
      ...(fotosDespues && { fotosDespues }),
      ...(materialesUsados && { materialesUsados }),
      ...(horasTrabajadas !== undefined && { horasTrabajadas }),
      ...(costoMateriales !== undefined && { costoMateriales }),
      ...(costoManoObra !== undefined && { costoManoObra }),
      ...(costoTotal !== undefined && { costoTotal }),
      ...(firmadoPor && { firmadoPor }),
      ...(firmaDigital && { firmaDigital }),
      ...(valoracion !== undefined && { valoracion }),
      ...(comentarios && { comentarios }),
    };

    const orden = await prisma.providerWorkOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        provider: true,
        building: true,
        unit: true,
      },
    });

    return NextResponse.json(orden);
  } catch (error) {
    console.error('Error updating orden:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de trabajo' },
      { status: 500 }
    );
  }
}