import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { SaleAnalysisService } from '@/lib/services/sale-analysis-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (analysisId) {
      const analysis = await SaleAnalysisService.getSaleAnalysis(analysisId, session.user.id);
      
      if (!analysis) {
        return NextResponse.json({ error: 'Análisis no encontrado' }, { status: 404 });
      }

      return NextResponse.json(analysis);
    } else {
      const analyses = await SaleAnalysisService.getUserSaleAnalyses(session.user.id);
      return NextResponse.json(analyses);
    }
  } catch (error) {
    console.error('Error obteniendo análisis de venta:', error);
    return NextResponse.json(
      { error: 'Error obteniendo análisis de venta' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { data, results, name } = body;

    const analysis = await SaleAnalysisService.saveSaleAnalysis(
      session.user.id,
      data,
      results,
      name
    );

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error('Error guardando análisis de venta:', error);
    return NextResponse.json(
      { error: 'Error guardando análisis de venta' },
      { status: 500 }
    );
  }
}
