import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session?.user?.companyId;

    // Get all payments for this company
    const allPayments = await prisma.payment.findMany({
      where: {
        contract: {
          tenant: {
            companyId,
          },
        },
      },
      include: {
        contract: {
          include: {
            tenant: true,
          },
        },
      },
    });

    // Calculate stats
    const totalCollected = allPayments
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);

    const totalPending = allPayments
      .filter((p) => p.estado === 'pendiente')
      .reduce((sum, p) => sum + p.monto, 0);

    const totalOverdue = allPayments
      .filter((p) => p.estado === 'atrasado')
      .reduce((sum, p) => sum + p.monto, 0);

    // Stripe-specific stats
    const stripePayments = allPayments.filter((p) => p.stripePaymentIntentId);
    const successfulStripePayments = stripePayments.filter(
      (p) => p.stripePaymentStatus === 'succeeded'
    );

    const stripeRevenue = successfulStripePayments.reduce((sum, p) => sum + p.monto, 0);
    const stripeFees = successfulStripePayments.reduce((sum, p) => sum + (p.stripeFee || 0), 0);
    const netRevenue = successfulStripePayments.reduce(
      (sum, p) => sum + (p.stripeNetAmount || p.monto),
      0
    );

    // Payments this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paymentsThisMonth = allPayments.filter(
      (p) => p.estado === 'pagado' && p.fechaPago && new Date(p.fechaPago) >= startOfMonth
    ).length;

    // Success rate
    const successRate =
      stripePayments.length > 0
        ? (successfulStripePayments.length / stripePayments.length) * 100
        : 0;

    return NextResponse.json({
      totalCollected,
      totalPending,
      totalOverdue,
      stripeRevenue,
      stripeFees,
      netRevenue,
      paymentsThisMonth,
      successRate,
    });
  } catch (error: any) {
    logger.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}
