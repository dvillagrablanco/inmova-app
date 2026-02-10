export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Transacciones de Tokens
 * GET: Obtener historial de transacciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Obtener transacciones
    const transactions = await prisma.tokenTransaction.findMany({
      where: {
        token: {
          companyId: session.user.companyId,
        },
        ...(tokenId && { tokenId }),
        ...(type && { tipo: type }),
      },
      include: {
        token: {
          select: {
            nombre: true,
            tokenSymbol: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Formatear transacciones
    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      type: tx.tipo,
      from: tx.fromAddress || 'Smart Contract',
      to: tx.toAddress || 'Unknown',
      amount: tx.cantidadTokens,
      value: tx.montoTotal,
      tokenName: tx.token.nombre,
      tokenSymbol: tx.token.tokenSymbol,
      timestamp: tx.createdAt.toISOString(),
      hash: tx.txHash,
      blockNumber: tx.blockNumber,
    }));

    // Estadísticas
    const stats = {
      total: transactions.length,
      totalVolume: transactions.reduce((sum, tx) => sum + tx.montoTotal, 0),
      purchases: transactions.filter(tx => tx.tipo === 'purchase').length,
      distributions: transactions.filter(tx => tx.tipo === 'distribution').length,
    };

    return NextResponse.json({
      transactions: formattedTransactions,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching blockchain transactions:', error);
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    );
  }
}
