import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/votaciones/[id] - Obtener detalle de votación con resultados
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const votacion = await prisma.communityVote.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        building: true,
        votos: true,
      },
    });

    if (!votacion) {
      return NextResponse.json(
        { error: 'Votación no encontrada' },
        { status: 404 }
      );
    }

    // Calcular estadísticas de resultados
    const totalVotos = votacion.votos.length;
    const opciones = votacion.opciones as string[];
    const resultados = opciones.map((opcion) => {
      const votos = votacion.votos.filter(
        (v) => v.opcionSeleccionada === opcion
      ).length;
      const porcentaje = totalVotos > 0 ? (votos / totalVotos) * 100 : 0;
      return {
        opcion,
        votos,
        porcentaje: Math.round(porcentaje * 100) / 100,
      };
    });

    const quorumAlcanzado =
      votacion.totalElegibles > 0
        ? totalVotos >= (votacion.totalElegibles * votacion.quorumRequerido) / 100
        : false;

    const opcionGanadora =
      resultados.length > 0
        ? resultados.reduce((prev, current) =>
            prev.votos > current.votos ? prev : current
          )
        : null;

    return NextResponse.json({
      ...votacion,
      totalVotos,
      resultados,
      quorumAlcanzado,
      opcionGanadora,
    });
  } catch (error) {
    logger.error('Error al obtener votación:', error);
    return NextResponse.json(
      { error: 'Error al obtener votación' },
      { status: 500 }
    );
  }
}

// PATCH /api/votaciones/[id] - Actualizar estado de votación (cerrar)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administrador o gestor pueden cerrar votaciones
    if (!['administrador', 'gestor'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para cerrar votaciones' },
        { status: 403 }
      );
    }

    const { estado } = await req.json();

    // Verificar que la votación existe y pertenece a la empresa
    const votacionExistente = await prisma.communityVote.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        votos: true,
      },
    });

    if (!votacionExistente) {
      return NextResponse.json(
        { error: 'Votación no encontrada' },
        { status: 404 }
      );
    }

    // Si se está cerrando, calcular resultados
    let updateData: any = { estado };

    if (estado === 'cerrada') {
      const totalVotos = votacionExistente.votos.length;
      const opciones = votacionExistente.opciones as string[];
      const resultados = opciones.map((opcion) => {
        const votos = votacionExistente.votos.filter(
          (v) => v.opcionSeleccionada === opcion
        ).length;
        return { opcion, votos };
      });

      const opcionGanadora =
        resultados.length > 0
          ? resultados.reduce((prev, current) =>
              prev.votos > current.votos ? prev : current
            ).opcion
          : null;

      updateData = {
        ...updateData,
        opcionGanadora,
      };
    }

    const votacion = await prisma.communityVote.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(votacion);
  } catch (error) {
    logger.error('Error al actualizar votación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar votación' },
      { status: 500 }
    );
  }
}

// DELETE /api/votaciones/[id] - Cancelar votación
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administrador puede cancelar
    if (session.user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar votaciones' },
        { status: 403 }
      );
    }

    // Verificar que la votación existe
    const votacionExistente = await prisma.communityVote.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!votacionExistente) {
      return NextResponse.json(
        { error: 'Votación no encontrada' },
        { status: 404 }
      );
    }

    // Cambiar estado a cancelada en lugar de eliminar
    const votacion = await prisma.communityVote.update({
      where: { id: params.id },
      data: { estado: 'cancelada' },
    });

    return NextResponse.json(votacion);
  } catch (error) {
    logger.error('Error al cancelar votación:', error);
    return NextResponse.json(
      { error: 'Error al cancelar votación' },
      { status: 500 }
    );
  }
}
