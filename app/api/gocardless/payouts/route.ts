import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/gocardless/payouts
 * Lista payouts (transferencias de GC a la cuenta bancaria de la empresa)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const conciliado = searchParams.get('conciliado');

    const where: any = { companyId: session.user.companyId };
    if (conciliado !== null && conciliado !== undefined) {
      where.conciliado = conciliado === 'true';
    }

    const [payouts, total] = await Promise.all([
      prisma.gCPayout.findMany({
        where,
        orderBy: { arrivalDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gCPayout.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payouts.map(p => ({
        ...p,
        amountEuros: p.amount / 100,
        feeAmountEuros: p.feeAmount / 100,
        debitAmountEuros: p.debitAmount / 100,
        refundAmountEuros: p.refundAmount / 100,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('[GC Payouts GET]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
