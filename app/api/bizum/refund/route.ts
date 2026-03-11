// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBizumClient } from '@/lib/bizum-integration';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const refundSchema = z.object({
  originalReference: z.string().min(1, 'Referencia original requerida'),
  amount: z.number().positive('El monto debe ser positivo'),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = refundSchema.parse(body);

    const client = getBizumClient();
    if (!client) {
      return NextResponse.json({ error: 'Bizum no configurado' }, { status: 503 });
    }

    const result = await client.refund(validated);

    logger.info('[Bizum] Refund processed', {
      originalReference: validated.originalReference,
      amount: validated.amount,
      success: result.success,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Bizum] Refund error:', error);
    return NextResponse.json({ error: 'Error procesando reembolso' }, { status: 500 });
  }
}
