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
        licenciaTuristica: true,
        licenciaFechaExpiracion: true,
        activo: true,
      },
    });

    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const licenses = listings.map((l: any) => {
      let status = 'sin_licencia';
      let daysUntilExpiry: number | null = null;

      if (l.licenciaTuristica) {
        if (l.licenciaFechaExpiracion) {
          const expiry = new Date(l.licenciaFechaExpiracion);
          daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

          if (daysUntilExpiry < 0) {
            status = 'vencida';
          } else if (daysUntilExpiry <= 30) {
            status = 'proximo_vencimiento';
          } else {
            status = 'vigente';
          }
        } else {
          status = 'vigente';
        }
      }

      return {
        id: l.id,
        property: l.titulo,
        licenseNumber: l.licenciaTuristica || 'Pendiente',
        expiryDate: l.licenciaFechaExpiracion?.toISOString().split('T')[0] || null,
        status,
        daysUntilExpiry,
      };
    });

    return NextResponse.json({ data: licenses });
  } catch (error: any) {
    logger.error('[STR Legal GET]:', error);
    return NextResponse.json({ error: 'Error al obtener licencias' }, { status: 500 });
  }
}
