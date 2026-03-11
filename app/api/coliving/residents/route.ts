import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

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
  companyId?: string;
};

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
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
            id: true,
            nombreCompleto: true,
            email: true,
            telefono: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tenantIds = profiles.map((profile) => profile.tenantId);

    const contracts = await prisma.roomContract.findMany({
      where: { tenantId: { in: tenantIds }, estado: 'activo' },
      include: {
        room: {
          select: {
            numero: true,
            unit: { select: { building: { select: { nombre: true } } } },
          },
        },
      },
    });

    const contractByTenant = new Map(
      contracts.map((contract) => [contract.tenantId, contract])
    );

    const residents = profiles.map((profile) => {
      const contract = contractByTenant.get(profile.tenantId);
      return {
        id: profile.id,
        name: profile.tenant.nombreCompleto,
        avatar: undefined,
        room: contract?.room.numero || '',
        property: contract?.room.unit.building.nombre || '',
        moveInDate: (contract?.fechaInicio || profile.tenant.createdAt).toISOString(),
        profession: profile.profesion || undefined,
        interests: parseStringArray(profile.intereses),
        bio: profile.bio || undefined,
        isOnline: false,
      };
    });

    return NextResponse.json(residents);
  } catch (error) {
    logger.error('Error fetching coliving residents', error);
    return NextResponse.json(
      { error: 'Error al obtener residentes' },
      { status: 500 }
    );
  }
}
