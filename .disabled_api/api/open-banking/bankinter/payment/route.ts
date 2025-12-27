import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { bankinterService, isBankinterConfigured } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/open-banking/bankinter/payment
 * 
 * Inicia un pago SEPA a través de Bankinter
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!isBankinterConfigured()) {
      return NextResponse.json(
        {
          error: 'Integración con Bankinter no configurada'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      debtorIban,
      creditorIban,
      creditorName,
      amount,
      currency,
      concept
    } = body;

    // Validar campos requeridos
    if (!debtorIban || !creditorIban || !creditorName || !amount) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Obtener IP del usuario
    const forwarded = request.headers.get('x-forwarded-for');
    const psuIpAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    // Iniciar pago
    const result = await bankinterService.initiatePayment(
      session.user.companyId,
      session.user.id,
      psuIpAddress,
      {
        instructedAmount: {
          currency: currency || 'EUR',
          amount: amount.toFixed(2)
        },
        debtorAccount: {
          iban: debtorIban,
          currency: currency || 'EUR'
        },
        creditorAccount: {
          iban: creditorIban
        },
        creditorName,
        remittanceInformationUnstructured: concept
      }
    );

    logger.info(`💸 Pago iniciado con Bankinter: ${result.paymentId}`);

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      authUrl: result.scaRedirectUrl,
      message: 'Pago iniciado. Redirigir al usuario a authUrl para autenticar.'
    });
  } catch (error: any) {
    logger.error('Error iniciando pago:', error);
    return NextResponse.json(
      {
        error: 'Error al iniciar pago',
        details: error.message
      },
      { status: 500 }
    );
  }
}
