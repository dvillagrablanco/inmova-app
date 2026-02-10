export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/db';
import { endOfMonth, startOfMonth, subMonths, format } from 'date-fns';

export async function POST(request: NextRequest) {
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
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reportType = typeof body.type === 'string' ? body.type : 'esg';
    const period = typeof body.period === 'string' ? body.period : 'month';
    const companyId = session.user.companyId;

    const now = new Date();
    let startDate: Date;
    const endDate = endOfMonth(now);

    switch (period) {
      case 'year':
        startDate = startOfMonth(subMonths(now, 12));
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case 'month':
      default:
        startDate = startOfMonth(now);
        break;
    }

    const [company, carbonFootprints, energyReadings, recyclingMetrics, certifications] =
      await prisma.$transaction([
        prisma.company.findUnique({
          where: { id: companyId },
          select: { nombre: true },
        }),
        prisma.carbonFootprint.findMany({
          where: {
            companyId,
            fechaInicio: { gte: startDate },
            fechaFin: { lte: endDate },
          },
          orderBy: { fechaInicio: 'desc' },
          take: 1,
        }),
        prisma.energyReading.findMany({
          where: {
            companyId,
            fechaLectura: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.recyclingMetric.findMany({
          where: {
            companyId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.eSGCertification.findMany({
          where: {
            companyId,
            estado: 'vigente',
          },
          select: {
            nombre: true,
            tipo: true,
          },
        }),
      ]);

    const totalEnergy = energyReadings
      .filter(r => r.tipo !== 'agua')
      .reduce((sum, r) => sum + (r.consumo || 0), 0);
    const waterConsumption = energyReadings
      .filter(r => r.tipo === 'agua')
      .reduce((sum, r) => sum + (r.consumo || 0), 0);
    const totalRenewable = 0;
    const renewableRate = totalEnergy > 0 ? (totalRenewable / totalEnergy) * 100 : 0;

    const totalWaste = recyclingMetrics.reduce((sum, r) => sum + (r.residuosGenerados || 0), 0);
    const totalRecycled = recyclingMetrics.reduce((sum, r) => sum + (r.residuosReciclados || 0), 0);
    const recyclingRate = totalWaste > 0 ? (totalRecycled / totalWaste) * 100 : 0;

    const latestCarbon = carbonFootprints[0];
    const carbonFootprint = latestCarbon?.total || 0;

    let esgScore = 50;
    if (renewableRate > 30) esgScore += 10;
    if (renewableRate > 50) esgScore += 10;
    if (recyclingRate > 50) esgScore += 10;
    if (recyclingRate > 70) esgScore += 10;
    if (certifications.length > 0) esgScore += 5 * Math.min(certifications.length, 4);

    const metrics = {
      carbonFootprint,
      energyConsumption: totalEnergy,
      waterConsumption,
      wasteGenerated: totalWaste,
      recyclingRate: Math.round(recyclingRate * 10) / 10,
      renewableEnergyRate: Math.round(renewableRate * 10) / 10,
      esgScore: Math.min(esgScore, 100),
      certifications: certifications.map(c => c.nombre),
      breakdown: latestCarbon?.desglose || null,
      scope1: latestCarbon?.scope1 || 0,
      scope2: latestCarbon?.scope2 || 0,
      scope3: latestCarbon?.scope3 || 0,
    };

    const buffer = await generateESGReportPDF({
      companyName: company?.nombre || 'Empresa',
      periodLabel: `${format(startDate, 'yyyy-MM-dd')} - ${format(endDate, 'yyyy-MM-dd')}`,
      reportType,
      metrics,
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-esg-${period}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error generating ESG report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte', details: message },
      { status: 500 }
    );
  }
}

async function generateESGReportPDF(params: {
  companyName: string;
  periodLabel: string;
  reportType: string;
  metrics: {
    carbonFootprint: number;
    energyConsumption: number;
    waterConsumption: number;
    wasteGenerated: number;
    recyclingRate: number;
    renewableEnergyRate: number;
    esgScore: number;
    certifications: string[];
    scope1: number;
    scope2: number;
    scope3: number;
  };
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Reporte ESG ${params.reportType.toUpperCase()}`,
          Author: 'Inmova App',
          Subject: 'Reporte ESG',
          Keywords: 'ESG, sostenibilidad, reporte',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).font('Helvetica-Bold').text('Reporte ESG', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Tipo: ${params.reportType.toUpperCase()}`);
      doc.text(`Empresa: ${params.companyName}`);
      doc.text(`Periodo: ${params.periodLabel}`);
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('Resumen de métricas');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Huella de carbono total: ${params.metrics.carbonFootprint.toFixed(2)} tCO2e`);
      doc.text(`Scope 1: ${params.metrics.scope1.toFixed(2)} tCO2e`);
      doc.text(`Scope 2: ${params.metrics.scope2.toFixed(2)} tCO2e`);
      doc.text(`Scope 3: ${params.metrics.scope3.toFixed(2)} tCO2e`);
      doc.moveDown();

      doc.text(`Consumo energético: ${params.metrics.energyConsumption.toFixed(2)} kWh`);
      doc.text(`Consumo de agua: ${params.metrics.waterConsumption.toFixed(2)} m3`);
      doc.text(`Residuos generados: ${params.metrics.wasteGenerated.toFixed(2)} kg`);
      doc.text(`Tasa de reciclaje: ${params.metrics.recyclingRate.toFixed(1)}%`);
      doc.text(`Energía renovable: ${params.metrics.renewableEnergyRate.toFixed(1)}%`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text(`ESG Score: ${params.metrics.esgScore}/100`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('Certificaciones vigentes');
      doc.fontSize(11).font('Helvetica');
      if (params.metrics.certifications.length > 0) {
        params.metrics.certifications.forEach((cert) => {
          doc.text(`- ${cert}`);
        });
      } else {
        doc.text('No hay certificaciones registradas.');
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
