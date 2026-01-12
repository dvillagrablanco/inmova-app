import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/votaciones/[id]/votar - Registrar voto de inquilino
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { opcionSeleccionada, comentario } = await req.json();

    // Obtener datos del inquilino desde el email de sesión
    const tenant = await prisma.tenant.findFirst({
      where: { email: session.user.email },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'No se encontró inquilino asociado a esta cuenta' },
        { status: 404 }
      );
    }

    // Verificar que la votación existe y está activa
    const votacion = await prisma.communityVote.findUnique({
      where: { id: params.id },
      include: {
        votos: true,
      },
    });

    if (!votacion) {
      return NextResponse.json(
        { error: 'Votación no encontrada' },
        { status: 404 }
      );
    }

    if (votacion.estado !== 'activa') {
      return NextResponse.json(
        { error: 'Esta votación no está activa' },
        { status: 400 }
      );
    }

    // Verificar que no haya votado anteriormente
    const votoExistente = votacion.votos.find((v) => v.tenantId === tenant.id);
    if (votoExistente) {
      return NextResponse.json(
        { error: 'Ya has votado en esta votación' },
        { status: 400 }
      );
    }

    // Verificar que la opción seleccionada es válida
    const opciones = votacion.opciones as string[];
    if (!opciones.includes(opcionSeleccionada)) {
      return NextResponse.json(
        { error: 'Opción seleccionada no válida' },
        { status: 400 }
      );
    }

    // Registrar el voto
    const voto = await prisma.voteRecord.create({
      data: {
        voteId: params.id,
        tenantId: tenant.id,
        opcionSeleccionada,
        comentario,
      },
    });

    // Verificar si se alcanzó el quórum y cerrar automáticamente
    const totalVotos = votacion.votos.length + 1;
    const quorumAlcanzado =
      votacion.totalElegibles > 0
        ? totalVotos >= (votacion.totalElegibles * votacion.quorumRequerido) / 100
        : false;

    // Si se alcanzó el 100% de participación, cerrar automáticamente
    if (votacion.totalElegibles > 0 && totalVotos >= votacion.totalElegibles) {
      // Calcular resultados
      const todosVotos = await prisma.voteRecord.findMany({
        where: { voteId: params.id },
      });

      const resultados = opciones.map((opcion) => {
        const votos = todosVotos.filter(
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

      await prisma.communityVote.update({
        where: { id: params.id },
        data: {
          estado: 'cerrada',
          opcionGanadora,
        },
      });
    }

    return NextResponse.json({
      success: true,
      voto,
      quorumAlcanzado,
      totalVotos,
      message: 'Voto registrado correctamente',
    });
  } catch (error) {
    logger.error('Error al registrar voto:', error);
    return NextResponse.json(
      { error: 'Error al registrar voto' },
      { status: 500 }
    );
  }
}
