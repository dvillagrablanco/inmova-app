/**
 * API: Consultar estado de pago Bizum
 * GET - Obtiene el estado de un pago por referencia
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBizumClient } from '@/lib/bizum-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { reference } = await params;

    if (!reference) {
      return NextResponse.json(
        { error: 'Referencia requerida' },
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

    const result = await client.getPaymentStatus(reference);

    if (result === null) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error('Error getting Bizum payment status:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: 'Error al consultar el estado del pago', details: message },
      { status: 500 }
    );
  }
}
