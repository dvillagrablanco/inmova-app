/**
 * API Route: Generar PDF de Reporte de Analytics
 * 
 * GET /api/v1/reports/analytics?period=month
 * 
 * Genera un reporte PDF de métricas de uso y costos de IA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateAnalyticsReportPDF } from '@/lib/pdf-generator-service';
import { getUsageMetrics, getAIMetrics } from '@/lib/analytics-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || 'month';

    // Calcular periodo
    const now = new Date();
    let startDate = new Date();
    let periodLabel = '';

    switch (periodParam) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        periodLabel = 'Última semana';
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        periodLabel = 'Último mes';
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        periodLabel = 'Último año';
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
        periodLabel = 'Último mes';
    }

    // Obtener métricas
    const usageMetrics = await getUsageMetrics(session.user.companyId, periodParam);
    const aiMetrics = await getAIMetrics(session.user.companyId, periodParam);

    // Combinar métricas
    const metrics = {
      users: {
        activeUsers: usageMetrics.users.activeUsers || 0,
        totalUsers: usageMetrics.users.totalUsers || 0,
      },
      properties: {
        totalProperties: usageMetrics.properties.totalProperties || 0,
        rentedProperties: usageMetrics.properties.rentedProperties || 0,
      },
      features: {
        valuationsCount: aiMetrics.byFeature?.valuations?.count || 0,
        matchesCount: aiMetrics.byFeature?.matching?.count || 0,
        incidentsCount: aiMetrics.byFeature?.incidents?.count || 0,
      },
      aiCosts: {
        total: aiMetrics.totalCost || 0,
        totalRequests: aiMetrics.totalRequests || 0,
        avgCostPerRequest: aiMetrics.totalRequests > 0 
          ? (aiMetrics.totalCost / aiMetrics.totalRequests).toFixed(4)
          : 0,
        byFeature: {
          valuations: aiMetrics.byFeature?.valuations?.cost || 0,
          matching: aiMetrics.byFeature?.matching?.cost || 0,
          incidents: aiMetrics.byFeature?.incidents?.cost || 0,
          marketing: aiMetrics.byFeature?.marketing?.cost || 0,
        },
      },
    };

    // Generar PDF
    const pdfBuffer = await generateAnalyticsReportPDF(
      metrics,
      `${periodLabel} (${startDate.toLocaleDateString('es-ES')} - ${now.toLocaleDateString('es-ES')})`
    );

    logger.info('✅ PDF de analytics generado', {
      companyId: session.user.companyId,
      userId: session.user.id,
      period: periodParam,
      size: pdfBuffer.length,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-analytics-${periodParam}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    logger.error('❌ Error generando PDF de analytics:', error);
    return NextResponse.json(
      { error: 'Error generando PDF', message: error.message },
      { status: 500 }
    );
  }
}
