import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/analysis/[id]/export?format=csv|json
 * Exporta un analisis de inversion completo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const prisma = getPrismaClient();
    const analysis = await prisma.investmentAnalysis.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analisis no encontrado' }, { status: 404 });
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(analysis, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="analisis-${analysis.nombre.replace(/\s+/g, '-')}-${analysis.id}.json"`,
        },
      });
    }

    // CSV export
    const rentRoll = (analysis.rentRoll as any[]) || [];
    const sensitivity = (analysis.tablaSensibilidad as any[]) || [];

    const lines: string[] = [];
    lines.push('ANALISIS DE INVERSION');
    lines.push(`Nombre;${analysis.nombre}`);
    lines.push(`Direccion;${analysis.direccion || ''}`);
    lines.push(`Ciudad;${analysis.ciudad || ''}`);
    lines.push(`Fecha;${analysis.createdAt.toISOString().split('T')[0]}`);
    lines.push('');

    lines.push('DATOS DE COMPRA');
    lines.push(`Asking Price;${analysis.askingPrice}`);
    lines.push(`Gastos Notaria;${analysis.gastosNotaria}`);
    lines.push(`Gastos Registro;${analysis.gastosRegistro}`);
    lines.push(`Impuesto Compra;${analysis.impuestoCompra}`);
    lines.push(`Comision Compra %;${analysis.comisionCompra}`);
    lines.push(`Otros Gastos;${analysis.otrosGastosCompra}`);
    lines.push('');

    lines.push('CAPEX');
    lines.push(`Reforma;${analysis.capexReforma}`);
    lines.push(`Imprevistos %;${analysis.capexImprevistos}`);
    lines.push(`Otros CAPEX;${analysis.capexOtros}`);
    lines.push('');

    lines.push('OPEX ANUAL');
    lines.push(`IBI;${analysis.ibiAnual}`);
    lines.push(`Comunidad/mes;${analysis.comunidadMensual}`);
    lines.push(`Seguro;${analysis.seguroAnual}`);
    lines.push(`Mantenimiento;${analysis.mantenimientoAnual}`);
    lines.push(`Gestion Admin %;${analysis.gestionAdminPct}`);
    lines.push(`Vacio %;${analysis.vacioEstimadoPct}`);
    lines.push(`Comision Alquiler %;${analysis.comisionAlquilerPct}`);
    lines.push(`Otros;${analysis.otrosGastosAnuales}`);
    lines.push('');

    if (analysis.usaFinanciacion) {
      lines.push('FINANCIACION');
      lines.push(`LTV %;${analysis.ltv}`);
      lines.push(`Tipo Interes %;${analysis.tipoInteres}`);
      lines.push(`Plazo Anos;${analysis.plazoAnos}`);
      lines.push(`Comision Apertura %;${analysis.comisionApertura}`);
      lines.push('');
    }

    lines.push('RENT ROLL');
    lines.push('Tipo;Referencia;Superficie m2;Renta Mensual;Estado');
    for (const u of rentRoll) {
      lines.push(`${u.tipo};${u.referencia};${u.superficie || ''};${u.rentaMensual};${u.estado}`);
    }
    lines.push('');

    lines.push('RESULTADOS');
    lines.push(`Renta Bruta Anual;${analysis.rentaBrutaAnual}`);
    lines.push(`Renta Neta Anual (NOI);${analysis.rentaNetaAnual}`);
    lines.push(`Inversion Total;${analysis.inversionTotal}`);
    lines.push(`Capital Propio;${analysis.capitalPropio}`);
    lines.push(`Hipoteca;${analysis.importeHipoteca || 0}`);
    lines.push(`Cuota Mensual;${analysis.cuotaHipotecaMensual || 0}`);
    lines.push(`Cash-Flow Anual;${analysis.cashFlowAnual}`);
    lines.push(`Yield Bruto %;${analysis.yieldBruto}`);
    lines.push(`Yield Neto %;${analysis.yieldNeto}`);
    lines.push(`Cash-on-Cash %;${analysis.cashOnCash}`);
    lines.push(`Payback Anos;${analysis.paybackAnos}`);
    lines.push('');

    if (analysis.precioM2Zona) {
      lines.push('POTENCIAL DE ZONA');
      lines.push(`Precio m2 Zona;${analysis.precioM2Zona}`);
      lines.push(`Fuente;${analysis.precioM2ZonaFuente || ''}`);
      lines.push(`Renta Potencial Anual;${analysis.rentaPotencialAnual || ''}`);
      lines.push(`Yield Potencial %;${analysis.yieldPotencial || ''}`);
      lines.push(`Gap vs Actual %;${analysis.gapRentaActualVsPotencial || ''}`);
      lines.push('');
    }

    if (sensitivity.length > 0) {
      lines.push('TABLA DE SENSIBILIDAD');
      lines.push('Precio;Descuento %;Inversion Total;Capital Propio;Yield Bruto %;Yield Neto %;Cash-on-Cash %;CF Mensual;CF Anual;Payback');
      for (const r of sensitivity) {
        lines.push(`${r.precio};${r.descuentoPct};${r.inversionTotal};${r.capitalPropio};${r.yieldBruto};${r.yieldNeto};${r.cashOnCash};${r.cashFlowMensual};${r.cashFlowAnual};${r.paybackAnos}`);
      }
    }

    const csv = lines.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analisis-${analysis.nombre.replace(/\s+/g, '-')}-${analysis.id}.csv"`,
      },
    });
  } catch (error: any) {
    logger.error('[Analysis Export]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error exportando analisis' }, { status: 500 });
  }
}
