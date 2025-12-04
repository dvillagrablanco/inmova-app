/**
 * API Endpoint: Iniciar Pagos via Redsys PSD2
 * 
 * Este endpoint permite iniciar pagos SEPA a través de la API de Redsys PSD2.
 * 
 * Métodos: POST (iniciar pago), GET (consultar estado)
 * 
 * @author INMOVA Development Team
 */

import { NextRequest, NextResponse } from 'next/server';

import {

  initiatePayment,
  getPaymentStatus,
  getPaymentDetails,
  type PaymentInitiation,
} from '@/lib/redsys-psd2-service';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';

import { prisma } from '@/lib/db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { aspsp, connectionId, payment, paymentProduct = 'sepa-credit-transfers' } = body;

    if (!aspsp || !connectionId || !payment) {
      return NextResponse.json(
        { error: 'Parámetros aspsp, connectionId y payment son requeridos' },
        { status: 400 }
      );
    }

    // Validar datos del pago
    const { instructedAmount, debtorAccount, creditorAccount, creditorName, remittanceInformationUnstructured } = payment;
    
    if (!instructedAmount?.amount || !instructedAmount?.currency ||
        !debtorAccount?.iban || !creditorAccount?.iban ||
        !creditorName || !remittanceInformationUnstructured) {
      return NextResponse.json(
        { error: 'Datos del pago incompletos' },
        { status: 400 }
      );
    }

    // Obtener la conexión bancaria
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
        status: 'active',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión bancaria no encontrada o inactiva' },
        { status: 404 }
      );
    }

    // Iniciar el pago
    const paymentResponse = await initiatePayment(
      aspsp,
      paymentProduct,
      payment as PaymentInitiation,
      connection.accessToken
    );

    // Guardar el pago en la base de datos
    const paymentRecord = await prisma.bankPayment.create({
      data: {
        connectionId: connection.id,
        paymentId: paymentResponse.paymentId,
        amount: instructedAmount.amount,
        currency: instructedAmount.currency,
        debtorIban: debtorAccount.iban,
        creditorIban: creditorAccount.iban,
        creditorName,
        description: remittanceInformationUnstructured,
        status: paymentResponse.transactionStatus || 'PDNG',
        scaRedirectUrl: paymentResponse._links?.scaRedirect?.href || '',
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        paymentId: paymentRecord.paymentId,
        status: paymentRecord.status,
        scaRedirectUrl: paymentRecord.scaRedirectUrl,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
      },
    });
  } catch (error: any) {
    console.error('Error iniciando pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al iniciar pago' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const aspsp = searchParams.get('aspsp');
    const connectionId = searchParams.get('connectionId');
    const paymentId = searchParams.get('paymentId');
    const paymentProduct = searchParams.get('paymentProduct') || 'sepa-credit-transfers';

    if (!aspsp || !connectionId || !paymentId) {
      return NextResponse.json(
        { error: 'Parámetros aspsp, connectionId y paymentId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener la conexión bancaria
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
        status: 'active',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión bancaria no encontrada o inactiva' },
        { status: 404 }
      );
    }

    // Obtener el estado del pago
    const paymentStatus = await getPaymentStatus(
      aspsp,
      paymentProduct,
      paymentId,
      connection.accessToken
    );

    // Actualizar el estado en la base de datos
    await prisma.bankPayment.updateMany({
      where: {
        paymentId,
        connectionId: connection.id,
      },
      data: {
        status: paymentStatus.transactionStatus,
      },
    });

    return NextResponse.json({
      success: true,
      paymentStatus,
    });
  } catch (error: any) {
    console.error('Error obteniendo estado de pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener estado de pago' },
      { status: 500 }
    );
  }
}
