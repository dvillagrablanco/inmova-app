import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { InvestmentAnalysisService } from '@/lib/services/investment-analysis-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (analysisId) {
      // Obtener análisis específico
      const analysis = await InvestmentAnalysisService.getAnalysis(analysisId, session.user.id);
      
      if (!analysis) {
        return NextResponse.json({ error: 'Análisis no encontrado' }, { status: 404 });
      }

      return NextResponse.json(analysis);
    } else {
      // Obtener todos los análisis del usuario
      const analyses = await InvestmentAnalysisService.getUserAnalyses(session.user.id);
      return NextResponse.json(analyses);
    }
  } catch (error) {
    console.error('Error obteniendo análisis:', error);
    return NextResponse.json(
      { error: 'Error obteniendo análisis' },
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

    const analysis = await InvestmentAnalysisService.saveAnalysis(
      session.user.id,
      data,
      results,
      name
    );

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error('Error guardando análisis:', error);
    return NextResponse.json(
      { error: 'Error guardando análisis' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, data, results } = body;

    const analysis = await InvestmentAnalysisService.updateAnalysis(
      id,
      session.user.id,
      data,
      results
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error actualizando análisis:', error);
    return NextResponse.json(
      { error: 'Error actualizando análisis' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await InvestmentAnalysisService.deleteAnalysis(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando análisis:', error);
    return NextResponse.json(
      { error: 'Error eliminando análisis' },
      { status: 500 }
    );
  }
}
