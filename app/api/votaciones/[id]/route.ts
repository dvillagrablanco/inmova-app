import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';

import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type SessionUser = {
  id?: string;
  companyId?: string;
};

type VoteOption = {
  id: string;
  texto: string;
  votos: number;
};

const updateVoteSchema = z.object({
  titulo: z.string().min(1).optional(),
  descripcion: z.string().min(1).optional(),
  tipo: z.enum(['decision_comunidad', 'mejora', 'gasto', 'normativa', 'otro']).optional(),
  opciones: z.array(z.string().min(1)).min(2).optional(),
  fechaCierre: z.string().datetime().optional(),
  quorumRequerido: z.number().min(0).max(100).optional(),
  totalVotantes: z.number().min(0).optional(),
  estado: z.enum(['activa', 'cerrada', 'cancelada']).optional(),
});

function normalizeOptions(value: unknown): VoteOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.every((item) => typeof item === 'string')) {
    return (value as string[]).map((texto, index) => ({
      id: `opt-${index + 1}`,
      texto,
      votos: 0,
    }));
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      const texto = typeof record.texto === 'string' ? record.texto : null;
      if (!texto) {
        return null;
      }
      const id =
        typeof record.id === 'string' && record.id.length > 0
          ? record.id
          : `opt-${crypto.randomUUID()}`;
      const votos = typeof record.votos === 'number' ? record.votos : 0;
      return { id, texto, votos };
    })
    .filter((item): item is VoteOption => item !== null);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const vote = await prisma.communityVote.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: {
        building: { select: { id: true, nombre: true } },
        votos: true,
      },
    });

    if (!vote) {
      return NextResponse.json({ error: 'Votación no encontrada' }, { status: 404 });
    }

    const opciones = normalizeOptions(vote.opciones);
    const totalVotos = vote.votos.length;
    const totalVotantes = vote.totalElegibles;
    const resultados = opciones.map((option) => {
      const votos = vote.votos.filter(
        (record) => record.opcionSeleccionada === option.texto
      ).length;
      const porcentaje =
        totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
      return { opcion: option.texto, votos, porcentaje };
    });

    const opcionGanadora =
      resultados.length > 0
        ? resultados.reduce((prev, current) =>
            current.votos > prev.votos ? current : prev
          )
        : null;

    const quorumAlcanzado =
      totalVotantes > 0
        ? (totalVotos / totalVotantes) * 100 >= vote.quorumRequerido
        : false;

    return NextResponse.json({
      id: vote.id,
      titulo: vote.titulo,
      descripcion: vote.descripcion,
      tipo: vote.tipo,
      opciones: opciones.map((option) => option.texto),
      estado: vote.estado,
      quorumRequerido: vote.quorumRequerido,
      totalVotantes,
      fechaCierre: vote.fechaCierre.toISOString(),
      fechaResultado: null,
      resultado: vote.opcionGanadora,
      building: {
        id: vote.building.id,
        nombre: vote.building.nombre,
      },
      votos: vote.votos,
      createdAt: vote.createdAt.toISOString(),
      totalVotos,
      resultados,
      quorumAlcanzado,
      opcionGanadora,
    });
  } catch (error) {
    logger.error('Error al obtener votación', error);
    return NextResponse.json(
      { error: 'Error al obtener votación' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = updateVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const existing = await prisma.communityVote.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: { votos: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Votación no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.titulo) updateData.titulo = parsed.data.titulo;
    if (parsed.data.descripcion) updateData.descripcion = parsed.data.descripcion;
    if (parsed.data.tipo) updateData.tipo = parsed.data.tipo;
    if (parsed.data.fechaCierre) {
      updateData.fechaCierre = new Date(parsed.data.fechaCierre);
    }
    if (parsed.data.quorumRequerido !== undefined) {
      updateData.quorumRequerido = parsed.data.quorumRequerido;
      updateData.requiereQuorum = parsed.data.quorumRequerido > 0;
    }
    if (parsed.data.totalVotantes !== undefined) {
      updateData.totalElegibles = parsed.data.totalVotantes;
    }
    if (parsed.data.estado) {
      updateData.estado = parsed.data.estado;
    }

    if (parsed.data.opciones) {
      const previousOptions = normalizeOptions(existing.opciones);
      const votosPorTexto = new Map(
        previousOptions.map((option) => [option.texto, option.votos])
      );
      updateData.opciones = parsed.data.opciones.map((texto, index) => ({
        id: previousOptions.find((opt) => opt.texto === texto)?.id ?? `opt-${index + 1}`,
        texto,
        votos: votosPorTexto.get(texto) ?? 0,
      }));
    }

    const updated = await prisma.communityVote.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        building: { select: { id: true, nombre: true } },
        votos: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      titulo: updated.titulo,
      descripcion: updated.descripcion,
      tipo: updated.tipo,
      opciones: normalizeOptions(updated.opciones).map((option) => option.texto),
      estado: updated.estado,
      quorumRequerido: updated.quorumRequerido,
      totalVotantes: updated.totalElegibles,
      fechaCierre: updated.fechaCierre.toISOString(),
      building: {
        id: updated.building.id,
        nombre: updated.building.nombre,
      },
      votos: updated.votos,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error al actualizar votación', error);
    return NextResponse.json(
      { error: 'Error al actualizar votación' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existing = await prisma.communityVote.findFirst({
      where: { id: params.id, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Votación no encontrada' }, { status: 404 });
    }

    await prisma.communityVote.update({
      where: { id: existing.id },
      data: { estado: 'cancelada' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error al cancelar votación', error);
    return NextResponse.json(
      { error: 'Error al cancelar votación' },
      { status: 500 }
    );
  }
}
