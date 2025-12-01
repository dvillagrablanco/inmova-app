import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getA3Service } from '@/lib/a3-integration-service';
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

    const a3Service = getA3Service();
    const results = [];

    for (const payment of payments) {
      try {
        const registeredPayment = await a3Service.syncPaymentDemo(payment);
        results.push({
          paymentId: payment.id,
          tenantName: payment.contract.tenant.nombreCompleto,
          success: true,
          amount: payment.monto,
          a3PaymentId: registeredPayment.id,
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
      message: `${results.filter(r => r.success).length}/${results.length} pagos registrados en A3`,
      results,
    });
  } catch (error) {
    console.error('Error registering payments in A3:', error);
    return NextResponse.json(
      { error: 'Error al registrar pagos en A3' },
      { status: 500 }
    );
  }
}
