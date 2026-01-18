/**
 * API: Crear cobro SEPA para un pago pendiente
 * 
 * @endpoint POST /api/sepa/charge
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createSepaCharge, isSepaEnabled } from '@/lib/sepa-direct-debit-service';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const chargeSchema = z.object({
  paymentId: z.string().min(1),
  chargeDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!isSepaEnabled()) {
      return NextResponse.json(
        { error: 'Domiciliación SEPA no está habilitada' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validated = chargeSchema.parse(body);

    const result = await createSepaCharge(validated);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          gcPaymentId: result.gcPaymentId,
          paymentId: result.paymentId,
          chargeDate: result.chargeDate,
          status: result.status,
        },
        message: result.message,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message, status: result.status },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Error en /api/sepa/charge:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
