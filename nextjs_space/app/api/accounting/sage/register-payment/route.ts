import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSageService } from '@/lib/sage-integration-service';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';

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

    // Obtener pagos del mes actual
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
      take: 10, // Limitar para demo
    });

    const sageService = getSageService();
    const results = [];

    for (const payment of payments) {
      try {
        const registeredPayment = await sageService.syncPaymentDemo(payment);
        results.push({
          paymentId: payment.id,
          tenantName: payment.contract.tenant.nombreCompleto,
          success: true,
          amount: payment.monto,
          sagePaymentId: registeredPayment.id,
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
      message: `${results.filter(r => r.success).length}/${results.length} pagos registrados en Sage`,
      results,
    });
  } catch (error) {
    console.error('Error registering payments in Sage:', error);
    return NextResponse.json(
      { error: 'Error al registrar pagos en Sage' },
      { status: 500 }
    );
  }
}
