import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { iniciarPago } from '@/lib/open-banking-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/bankinter/payment
 * Inicia un pago vía PIS sobre Bankinter/Redsys.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session?.user as any)?.companyId;
    const userId = (session?.user as any)?.id;

    if (!companyId || !userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      debtorIban,
      creditorIban,
      creditorName,
      amount,
      currency = 'EUR',
      concept,
      psuIpAddress,
    } = body;

    if (!debtorIban || !creditorIban || !creditorName || !amount) {
      return NextResponse.json(
        { error: 'debtorIban, creditorIban, creditorName y amount son requeridos' },
        { status: 400 }
      );
    }

    const result = await iniciarPago({
      companyId,
      userId,
      psuIpAddress:
        psuIpAddress ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        '127.0.0.1',
      debtorIban,
      creditorIban,
      creditorName,
      amount: Number(amount),
      currency,
      concept,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('[Bankinter Payment]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
