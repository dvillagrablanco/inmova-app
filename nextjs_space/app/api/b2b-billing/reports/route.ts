/**
 * API para reportes financieros B2B
 * GET: Obtener reportes
 * POST: Generar nuevo reporte
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  generateFinancialReport, 
  getBillingStats,
  getCompanyInvoiceHistory 
} from '@/lib/b2b-billing-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden ver reportes financieros
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const periodo = searchParams.get('periodo');
    const companyId = searchParams.get('companyId');

    // Estadísticas generales
    if (action === 'stats') {
      const stats = await getBillingStats();
      return NextResponse.json(stats);
    }

    // Historial de una empresa específica
    if (action === 'company-history' && companyId) {
      const history = await getCompanyInvoiceHistory(companyId);
      return NextResponse.json(history);
    }

    // Listar reportes existentes
    const reports = await prisma.b2BFinancialReport.findMany({
      where: periodo ? { periodo } : undefined,
      orderBy: {
        periodo: 'desc',
      },
      take: 12, // Últimos 12 reportes
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Error al obtener reportes:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden generar reportes
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { periodo, tipoReporte = 'mensual' } = body;

    if (!periodo) {
      return NextResponse.json(
        { error: 'Período requerido' },
        { status: 400 }
      );
    }

    const report = await generateFinancialReport(periodo, tipoReporte);

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error('Error al generar reporte:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte', details: error.message },
      { status: 500 }
    );
  }
}
