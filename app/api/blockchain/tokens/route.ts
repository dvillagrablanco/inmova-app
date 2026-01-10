export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Gestión de Tokens de Propiedades
 * GET: Obtener propiedades tokenizadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Obtener tokens de propiedades
    const tokens = await prisma.propertyToken.findMany({
      where: {
        companyId: session.user.companyId,
        ...(status && { estado: status }),
      },
      include: {
        unit: {
          select: { id: true, nombre: true, direccion: true },
        },
        building: {
          select: { id: true, nombre: true, direccion: true },
        },
        holders: {
          select: {
            id: true,
            cantidadTokens: true,
            walletAddress: true,
          },
        },
        _count: {
          select: {
            holders: true,
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformar al formato esperado
    const formattedTokens = tokens.map((token) => ({
      id: token.id,
      name: token.unit?.nombre || token.building?.nombre || token.nombre,
      totalValue: token.valorPropiedad,
      tokenized: token.valorActual || (token.totalSupply * token.precioPorToken),
      tokensIssued: token.totalSupply,
      tokenPrice: token.precioPorToken,
      investors: token._count.holders,
      annualYield: token.rentaDistribuida > 0
        ? (token.rentaDistribuida / token.valorPropiedad) * 100
        : 0,
      status: token.estado === 'active' ? 'active' : 'pending',
      contractAddress: token.contractAddress,
      blockchain: token.blockchain,
      symbol: token.tokenSymbol,
      holdersCount: token._count.holders,
      transactionsCount: token._count.transactions,
    }));

    // Calcular estadísticas generales
    const stats = {
      totalTokenizedValue: formattedTokens
        .filter(t => t.status === 'active')
        .reduce((sum, t) => sum + t.tokenized, 0),
      totalInvestors: formattedTokens.reduce((sum, t) => sum + t.investors, 0),
      averageYield: formattedTokens.length > 0
        ? formattedTokens.reduce((sum, t) => sum + t.annualYield, 0) / formattedTokens.length
        : 0,
      activeProperties: formattedTokens.filter(t => t.status === 'active').length,
    };

    return NextResponse.json({
      tokens: formattedTokens,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching blockchain tokens:', error);
    return NextResponse.json(
      { error: 'Error al obtener tokens' },
      { status: 500 }
    );
  }
}
