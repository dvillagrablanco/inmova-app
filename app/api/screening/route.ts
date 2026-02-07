import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = {
  id?: string;
  companyId?: string;
};

const createScreeningSchema = z.object({
  candidateId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const screenings = await prisma.screeningCandidato.findMany({
      where: { companyId: user.companyId },
      include: {
        candidate: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(screenings);
  } catch (error) {
    logger.error('Error obteniendo screenings', error);
    return NextResponse.json(
      { error: 'Error al obtener screenings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createScreeningSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: parsed.data.candidateId },
      include: {
        unit: {
          select: {
            building: {
              select: { companyId: true },
            },
          },
        },
      },
    });

    if (!candidate || candidate.unit.building.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    const existing = await prisma.screeningCandidato.findUnique({
      where: { candidateId: candidate.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El screening ya existe' },
        { status: 400 }
      );
    }

    const screening = await prisma.screeningCandidato.create({
      data: {
        companyId: user.companyId,
        candidateId: candidate.id,
        documentosRequeridos: [],
      },
      include: {
        candidate: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    return NextResponse.json(screening, { status: 201 });
  } catch (error) {
    logger.error('Error creando screening', error);
    return NextResponse.json(
      { error: 'Error al crear screening' },
      { status: 500 }
    );
  }
}
