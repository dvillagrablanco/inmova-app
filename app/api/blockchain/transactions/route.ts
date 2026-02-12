export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Transacciones de Tokens
 * GET: Obtener historial de transacciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
