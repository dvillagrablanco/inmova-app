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

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    // Obtener la empresa con su plan de suscripción
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionPlanId: true,
        subscriptionPlan: {
          select: {
            id: true,
            nombre: true,
            tier: true,
            precioMensual: true,
            maxUsuarios: true,
            maxPropiedades: true,
            modulosIncluidos: true
          }
        }
      }
    });

    if (!company || !company.subscriptionPlan) {
      return NextResponse.json({ currentPlan: null });
    }

    return NextResponse.json({ 
      currentPlan: {
        ...company.subscriptionPlan,
        modulosIncluidos: company.subscriptionPlan.modulosIncluidos as string[]
      }
    });
  } catch (error: any) {
    logger.error('Error al obtener plan actual:', error);
    return NextResponse.json(
      { error: 'Error al obtener plan actual' },
      { status: 500 }
    );
  }
}
