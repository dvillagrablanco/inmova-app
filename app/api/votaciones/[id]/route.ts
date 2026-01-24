import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const voteTypeSchema = z.enum([
  'decision_comunidad',
  'mejora',
  'gasto',
  'normativa',
  'otro',
]);

const voteStatusSchema = z.enum(['activa', 'cerrada', 'cancelada']);

const voteUpdateSchema = z.object({
  buildingId: z.string().min(1).optional(),
  titulo: z.string().min(1).trim().optional(),
  descripcion: z.string().min(1).trim().optional(),
  tipo: voteTypeSchema.optional(),
  opciones: z.array(z.string().trim().min(1)).min(2).optional(),
  fechaCierre: z.string().min(1).optional(),
  quorumRequerido: z.number().min(0).max(100).optional(),
  totalVotantes: z.number().min(0).optional(),
  estado: voteStatusSchema.optional(),
});

type VoteUpdateInput = z.infer<typeof voteUpdateSchema>;

interface VoteDetailResult {
  opcion: string;
  votos: number;
  porcentaje: number;
}

interface VoteDetailResponse {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: z.infer<typeof voteTypeSchema>;
  opciones: string[];
  estado: z.infer<typeof voteStatusSchema>;
  quorumRequerido: number;
  totalVotantes: number;
  fechaCierre: string;
  building: {
    id: string;
    nombre: string;
  };
  votos: Array<{ id: string; opcionSeleccionada: string }>;
  createdAt: string;
  totalVotos: number;
  resultados: VoteDetailResult[];
  quorumAlcanzado: boolean;
  opcionGanadora: VoteDetailResult | null;
}

const buildResults = (
  opciones: string[],
  votos: Array<{ opcionSeleccionada: string }>
): VoteDetailResult[] => {
  const totalVotos = votos.length;
  return opciones.map((opcion) => {
    const count = votos.filter((v) => v.opcionSeleccionada === opcion).length;
    const porcentaje = totalVotos > 0 ? (count / totalVotos) * 100 : 0;
    return { opcion, votos: count, porcentaje };
  });
};

const resolveWinner = (resultados: VoteDetailResult[]): VoteDetailResult | null => {
  if (resultados.length === 0) return null;
  const max = resultados.reduce((prev, current) => (current.votos > prev.votos ? current : prev));
  return max.votos > 0 ? max : null;
};

const buildDetailResponse = (vote: {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: z.infer<typeof voteTypeSchema>;
  opciones: unknown;
  estado: z.infer<typeof voteStatusSchema>;
  quorumRequerido: number;
  totalElegibles: number;
  fechaCierre: Date;
  building: { id: string; nombre: string };
  votos: Array<{ id: string; opcionSeleccionada: string }>;
  createdAt: Date;
}): VoteDetailResponse => {
  const opciones = Array.isArray(vote.opciones) ? (vote.opciones as string[]) : [];
  const resultados = buildResults(opciones, vote.votos);
  const totalVotos = vote.votos.length;
  const totalVotantes = Number(vote.totalElegibles || 0);
  const quorumAlcanzado =
    totalVotantes > 0 ? totalVotos >= (totalVotantes * vote.quorumRequerido) / 100 : false;
  const opcionGanadora = resolveWinner(resultados);

  return {
    id: vote.id,
    titulo: vote.titulo,
    descripcion: vote.descripcion,
    tipo: vote.tipo,
    opciones,
    estado: vote.estado,
    quorumRequerido: Number(vote.quorumRequerido),
    totalVotantes,
    fechaCierre: vote.fechaCierre.toISOString(),
    building: vote.building,
    votos: vote.votos,
    createdAt: vote.createdAt.toISOString(),
    totalVotos,
    resultados,
    quorumAlcanzado,
    opcionGanadora,
  };
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const vote = await prisma.communityVote.findUnique({
      where: { id: params.id },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
        votos: {
          select: {
            id: true,
            opcionSeleccionada: true,
          },
        },
      },
    });

    if (!vote || vote.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Votacion no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      buildDetailResponse({
        id: vote.id,
        titulo: vote.titulo,
        descripcion: vote.descripcion,
        tipo: vote.tipo,
        opciones: vote.opciones,
        estado: vote.estado,
        quorumRequerido: vote.quorumRequerido,
        totalElegibles: vote.totalElegibles,
        fechaCierre: vote.fechaCierre,
        building: vote.building,
        votos: vote.votos,
        createdAt: vote.createdAt,
      })
    );
  } catch (error) {
    logger.error('[Votaciones] Error al obtener votacion', error);
    return NextResponse.json({ error: 'Error al obtener votacion' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('update');
    const companyId = user.companyId;

    const body = (await req.json()) as VoteUpdateInput;
    const validationResult = voteUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Datos invalidos', details: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const existing = await prisma.communityVote.findUnique({
      where: { id: params.id },
      include: {
        votos: { select: { id: true, opcionSeleccionada: true } },
      },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Votacion no encontrada' },
        { status: 404 }
      );
    }

    const updateData: {
      buildingId?: string;
      titulo?: string;
      descripcion?: string;
      tipo?: z.infer<typeof voteTypeSchema>;
      opciones?: string[];
      fechaCierre?: Date;
      quorumRequerido?: number;
      totalElegibles?: number;
      requiereQuorum?: boolean;
      estado?: z.infer<typeof voteStatusSchema>;
      totalVotos?: number;
      opcionGanadora?: string | null;
    } = {};

    if (data.buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: data.buildingId },
        select: { id: true, companyId: true },
      });

      if (!building || building.companyId !== companyId) {
        return NextResponse.json(
          { error: 'Edificio no encontrado' },
          { status: 404 }
        );
      }

      updateData.buildingId = data.buildingId;
    }

    if (data.titulo) updateData.titulo = data.titulo;
    if (data.descripcion) updateData.descripcion = data.descripcion;
    if (data.tipo) updateData.tipo = data.tipo;

    if (data.opciones) {
      const opciones = data.opciones.map((opcion) => opcion.trim()).filter(Boolean);
      if (opciones.length < 2) {
        return NextResponse.json(
          { error: 'Debe haber al menos 2 opciones' },
          { status: 400 }
        );
      }
      updateData.opciones = opciones;
    }

    if (data.fechaCierre) {
      const fechaCierre = new Date(data.fechaCierre);
      if (Number.isNaN(fechaCierre.getTime())) {
        return NextResponse.json(
        { error: 'Fecha de cierre invalida' },
          { status: 400 }
        );
      }
      updateData.fechaCierre = fechaCierre;
    }

    if (typeof data.quorumRequerido === 'number') {
      updateData.quorumRequerido = data.quorumRequerido;
    }

    if (typeof data.totalVotantes === 'number') {
      updateData.totalElegibles = data.totalVotantes;
      updateData.requiereQuorum = data.totalVotantes > 0;
    }

    if (data.estado) {
      updateData.estado = data.estado;

      if (data.estado === 'cerrada') {
        const opciones = Array.isArray(existing.opciones) ? (existing.opciones as string[]) : [];
        const resultados = buildResults(opciones, existing.votos);
        const ganador = resolveWinner(resultados);
        updateData.opcionGanadora = ganador ? ganador.opcion : null;
        updateData.totalVotos = existing.votos.length;
      }
    }

    const updated = await prisma.communityVote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        building: { select: { id: true, nombre: true } },
        votos: { select: { id: true, opcionSeleccionada: true } },
      },
    });

    logger.info('[Votaciones] Votacion actualizada', { voteId: updated.id, companyId });

    return NextResponse.json(
      buildDetailResponse({
        id: updated.id,
        titulo: updated.titulo,
        descripcion: updated.descripcion,
        tipo: updated.tipo,
        opciones: updated.opciones,
        estado: updated.estado,
        quorumRequerido: updated.quorumRequerido,
        totalElegibles: updated.totalElegibles,
        fechaCierre: updated.fechaCierre,
        building: updated.building,
        votos: updated.votos,
        createdAt: updated.createdAt,
      })
    );
  } catch (error: unknown) {
    logger.error('[Votaciones] Error al actualizar votacion', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al actualizar votacion' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('delete');
    const companyId = user.companyId;

    const existing = await prisma.communityVote.findUnique({
      where: { id: params.id },
      select: { id: true, companyId: true },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Votacion no encontrada' },
        { status: 404 }
      );
    }

    await prisma.communityVote.update({
      where: { id: params.id },
      data: { estado: 'cancelada' },
    });

    logger.info('[Votaciones] Votacion cancelada', { voteId: params.id, companyId });

    return NextResponse.json({ message: 'Votacion cancelada correctamente' });
  } catch (error: unknown) {
    logger.error('[Votaciones] Error al cancelar votacion', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al cancelar votacion' }, { status: 500 });
  }
}
