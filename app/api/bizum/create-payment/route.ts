/**
 * API: Crear pago Bizum
 * POST - Crea una solicitud de pago Bizum
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import {
  getBizumClient,
  isValidSpanishPhone,
  type CreateBizumPaymentParams,
} from '@/lib/bizum-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createPaymentSchema = z.object({
  amount: z.number().positive('El importe debe ser positivo'),
  phoneNumber: z.string().min(1, 'El número de teléfono es requerido'),
  concept: z.string().min(1, 'El concepto es requerido'),
  reference: z.string().min(1, 'La referencia es requerida'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const validatedData = parsed.data;

    if (!isValidSpanishPhone(validatedData.phoneNumber)) {
      return NextResponse.json(
        { error: 'Número de teléfono español inválido' },
        { status: 400 }
      );
    }

    const client = getBizumClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Bizum no configurado' },
        { status: 503 }
      );
    }

    const paymentParams: CreateBizumPaymentParams = {
      amount: validatedData.amount,
      phoneNumber: validatedData.phoneNumber,
      concept: validatedData.concept,
      reference: validatedData.reference,
    };

    const result = await client.createPayment(paymentParams);

    logger.info('Bizum payment created', {
      reference: result.reference,
      status: result.status,
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error('Error creating Bizum payment:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: 'Error al crear el pago Bizum', details: message },
      { status: 500 }
    );
  }
}
