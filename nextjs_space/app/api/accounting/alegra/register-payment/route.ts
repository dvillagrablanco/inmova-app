// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAlegraService } from '@/lib/alegra-integration-service';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = session.user;
    if (role !== 'administrador' && role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const now = new Date();
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          tenant: { companyId },
        },
        estado: 'pagado',
        fechaPago: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
      },
      include: {
        contract: {
          include: {
            tenant: true,
          },
        },
      },
      take: 10,
    });

    const alegraService = getAlegraService();
    const results = [];

    for (const payment of payments) {
      try {
        const registeredPayment = await alegraService.syncPayment(payment);
        results.push({
          paymentId: payment.id,
          tenantName: payment.contract.tenant.nombreCompleto,
          success: true,
          amount: payment.monto,
          alegraPaymentId: registeredPayment.id,
        });
      } catch (error) {
        results.push({
          paymentId: payment.id,
          tenantName: payment.contract.tenant.nombreCompleto,
          success: false,
          error: 'Error al registrar pago',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.filter(r => r.success).length}/${results.length} pagos registrados en Alegra`,
      results,
    });
  } catch (error) {
    console.error('Error registering payments in Alegra:', error);
    return NextResponse.json(
      { error: 'Error al registrar pagos en Alegra' },
      { status: 500 }
    );
  }
}
