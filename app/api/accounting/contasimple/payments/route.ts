import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getContaSimpleService } from '@/lib/contasimple-integration-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/accounting/contasimple/payments
 * Registra un pago de INMOVA en ContaSimple
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
      return NextResponse.json({ error: 'Se requiere paymentId' }, { status: 400 });
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

    if (!payment || payment.contract?.unit?.building?.companyId !== session?.user?.companyId) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Verificar que el contrato tenga una factura en ContaSimple
    if (!payment.contract?.contasimpleInvoiceId) {
      return NextResponse.json(
        { error: 'El contrato debe tener una factura en ContaSimple primero' },
        { status: 400 }
      );
    }

    // Registrar pago en ContaSimple
    const contaSimpleService = getContaSimpleService();
    const contaSimplePayment = await contaSimpleService.syncPaymentToContaSimple(
      payment,
      payment.contract.contasimpleInvoiceId
    );

    // Guardar referencia del pago
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        contasimplePaymentId: contaSimplePayment.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pago registrado exitosamente: ${payment.monto}€`,
      data: contaSimplePayment,
    });
  } catch (error) {
    logger.error('Error al registrar pago en ContaSimple:', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}
