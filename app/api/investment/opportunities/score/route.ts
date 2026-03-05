/**
 * API: Score IA unificado para una oportunidad
 * POST /api/investment/opportunities/score
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ScoreInput {
  price: number;
  marketValue: number;
  discount: number;
  estimatedYield: number;
  riskLevel: string;
  category: string;
  location: string;
  surface?: number;
}

function calculateUnifiedScore(input: ScoreInput): {
  score: number;
  breakdown: { yield: number; discount: number; risk: number; liquidity: number; potential: number };
  label: string;
} {
  // Yield score (0-25): higher yield = better
  const yieldScore = Math.min(25, (input.estimatedYield || 0) * 2.5);

  // Discount score (0-25): higher discount = better
  const discountScore = Math.min(25, (input.discount || 0) * 0.5);

  // Risk score (0-20): lower risk = better
  const riskMap: Record<string, number> = { bajo: 20, medio: 12, alto: 5 };
  const riskScore = riskMap[input.riskLevel] || 10;

  // Liquidity score (0-15): based on location and type
  const liquidCities = ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla'];
  const isLiquid = liquidCities.some(c => input.location.toLowerCase().includes(c.toLowerCase()));
  const liquidityScore = isLiquid ? 15 : input.category === 'crowdfunding' ? 5 : 8;

  // Potential score (0-15): based on category and market trends
  const potentialMap: Record<string, number> = {
    tendencia: 15, divergencia: 13, subasta: 10, banca: 8, crowdfunding: 7,
  };
  const potentialScore = potentialMap[input.category] || 8;

  const score = Math.round(yieldScore + discountScore + riskScore + liquidityScore + potentialScore);

  const label = score >= 80 ? 'Excelente' : score >= 65 ? 'Buena' : score >= 50 ? 'Aceptable' : score >= 35 ? 'Regular' : 'Baja';

  return {
    score: Math.min(100, score),
    breakdown: {
      yield: Math.round(yieldScore),
      discount: Math.round(discountScore),
      risk: Math.round(riskScore),
      liquidity: Math.round(liquidityScore),
      potential: Math.round(potentialScore),
    },
    label,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const result = calculateUnifiedScore(body);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[Score Error]:', error);
    return NextResponse.json({ error: 'Error calculando score' }, { status: 500 });
  }
}
