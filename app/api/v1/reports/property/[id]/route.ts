/**
 * API Route: Generar PDF de Reporte de Propiedad
 *
 * GET /api/v1/reports/property/[id]?period=year
 *
 * Genera un reporte PDF completo de una propiedad.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generatePropertyReportPDF } from '@/lib/pdf-generator-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'year'; // year, month, all

    // Calcular fechas
    const now = new Date();
    let startDate = new Date();
    if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate = new Date(0); // All time
    }

    // Obtener propiedad
    const property = await prisma.unit.findUnique({
      where: { id: propertyId },
      include: {
        building: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    if (property.building?.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Historial de ocupación
    const occupancyHistory = await prisma.contract.findMany({
      where: {
        unitId: propertyId,
        fechaInicio: { gte: startDate },
      },
      select: {
        id: true,
        tenant: { select: { nombreCompleto: true } },
        fechaInicio: true,
        fechaFin: true,
        rentaMensual: true,
      },
      orderBy: { fechaInicio: 'desc' },
    });

    // Historial de mantenimiento
    const maintenanceHistory = await prisma.maintenanceRequest.findMany({
      where: {
        unitId: propertyId,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        descripcion: true,
        prioridad: true,
        costoEstimado: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Resumen financiero
    const totalIncome = occupancyHistory.reduce((sum, c) => {
      const months = Math.max(
        1,
        Math.round((c.fechaFin.getTime() - c.fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
      return sum + c.rentaMensual * months;
    }, 0);

    const totalExpenses = maintenanceHistory.reduce((sum, m) => sum + (m.costoEstimado || 0), 0);

    const netIncome = totalIncome - totalExpenses;

    const totalDays = Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const occupiedDays = occupancyHistory.reduce((sum, c) => {
      const start = c.fechaInicio > startDate ? c.fechaInicio : startDate;
      const end = c.fechaFin < now ? c.fechaFin : now;
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    const occupancyRate = Math.round((occupiedDays / totalDays) * 100);

    // Preparar datos
    const reportData = {
      property,
      occupancyHistory: occupancyHistory.map((c) => ({
        tenant: c.tenant.nombreCompleto,
        startDate: c.fechaInicio,
        endDate: c.fechaFin,
      })),
      maintenanceHistory: maintenanceHistory.map((m) => ({
        date: m.createdAt,
        description: m.descripcion,
        cost: m.costoEstimado || 0,
      })),
      financialSummary: {
        totalIncome,
        totalExpenses,
        netIncome,
        occupancyRate,
      },
    };

    // Generar PDF
    const pdfBuffer = await generatePropertyReportPDF(reportData);

    logger.info('✅ PDF de propiedad generado', {
      propertyId,
      userId: session.user.id,
      period,
      size: pdfBuffer.length,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-propiedad-${propertyId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    logger.error('❌ Error generando PDF de propiedad:', error);
    return NextResponse.json(
      { error: 'Error generando PDF', message: error.message },
      { status: 500 }
    );
  }
}
