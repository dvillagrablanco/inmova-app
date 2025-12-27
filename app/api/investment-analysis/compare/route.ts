import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { InvestmentAnalysisService } from '@/lib/services/investment-analysis-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { analysisIds } = body;

    if (!Array.isArray(analysisIds) || analysisIds.length < 2) {
      return NextResponse.json(
        { error: 'Se requieren al menos 2 análisis para comparar' },
        { status: 400 }
      );
    }

    const comparison = await InvestmentAnalysisService.compareAnalyses(
      analysisIds,
      session.user.id
    );

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error comparando análisis:', error);
    return NextResponse.json(
      { error: 'Error comparando análisis' },
      { status: 500 }
    );
  }
}
