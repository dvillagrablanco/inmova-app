import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PDFGeneratorService } from '@/lib/services/pdf-generator-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { analysisId, config } = body;

    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId requerido' }, { status: 400 });
    }

    // Generar PDF
    const pdfBuffer = await PDFGeneratorService.generateAnalysisReport(
      analysisId,
      session.user.id,
      config
    );

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="analisis-inversion-${analysisId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: 'Error generando PDF' },
      { status: 500 }
    );
  }
}
