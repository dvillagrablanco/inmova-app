import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session?.user?.companyId;

    // Get all Stripe payments for this company
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          tenant: {
            companyId,
          },
        },
        stripePaymentIntentId: {
          not: null,
        },
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to last 100 payments
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    logger.error('Error fetching Stripe payments:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar pagos' },
      { status: 500 }
    );
  }
}
