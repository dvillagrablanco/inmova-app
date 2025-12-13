import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getZucchettiService } from '@/lib/zucchetti-integration-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/accounting/zucchetti/payments
 * Registra un pago de INMOVA en Zucchetti
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Se requiere paymentId' },
        { status: 400 }
      );
    }

    // Obtener datos del pago
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
      },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (
      !payment ||
      payment.contract?.unit?.building?.companyId !== session?.user?.companyId
    ) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    // Registrar pago en Zucchetti (modo demo)
    const zucchettiService = getZucchettiService();
    const result = await zucchettiService.syncPaymentDemo(payment);

    return NextResponse.json({
      success: true,
      message: `Pago registrado: ${payment.monto}€`,
      data: result,
    });
  } catch (error) {
    logger.error('Error al registrar pago en Zucchetti:', error);
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    );
  }
}
