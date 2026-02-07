import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = {
  companyId?: string;
};

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const profiles = await prisma.colivingProfile.findMany({
      where: { companyId: user.companyId },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
          },
        },
      },
      orderBy: { puntosReputacion: 'desc' },
      take: 10,
    });

    const leaderboard = profiles.map((profile, index) => ({
      id: profile.id,
      name: profile.tenant.nombreCompleto,
      avatar: undefined,
      points: profile.puntosReputacion,
      rank: index + 1,
      badges: parseStringArray(profile.badges),
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    logger.error('Error fetching coliving leaderboard', error);
    return NextResponse.json(
      { error: 'Error al obtener leaderboard' },
      { status: 500 }
    );
  }
}
