import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    // Obtener listings con datos de licencia
    const listings = await prisma.sTRListing.findMany({
      where: { companyId },
      select: {
        id: true,
        titulo: true,
        activo: true,
      },
    });

    const licenses = listings.map((l: any) => {
      return {
        id: l.id,
        property: l.titulo,
        licenseNumber: 'Pendiente',
        expiryDate: null,
        status: l.activo ? 'sin_licencia' : 'inactiva',
        daysUntilExpiry: null,
      };
    });

    return NextResponse.json({ data: licenses });
  } catch (error: any) {
    logger.error('[STR Legal GET]:', error);
    return NextResponse.json({ error: 'Error al obtener licencias' }, { status: 500 });
  }
}
