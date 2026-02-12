import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import { endOfMonth, startOfMonth } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');
    const [year, month] = (periodo || '').split('-').map(Number);
    const baseDate = year && month ? new Date(year, month - 1, 1) : new Date();
    const fechaInicio = startOfMonth(baseDate);
    const fechaFin = endOfMonth(baseDate);

    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: scope.companyIds },
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      select: { tipo: true, categoria: true, monto: true },
    });

    let ingresos = 0, gastos = 0, impuestos = 0;
    for (const t of transactions) {
      if (t.tipo === 'ingreso') ingresos += t.monto;
      else gastos += t.monto;
      if (t.categoria === 'gasto_impuesto') impuestos += t.monto;
    }

    const baseImponible = ingresos - gastos + impuestos;
    const ivaRepercutido = ingresos * 0.21;
    const ivaSoportado = gastos * 0.21;
    const ivaLiquidar = ivaRepercutido - ivaSoportado;
    const retencionesIrpf = ingresos * 0.19;
    const impuestoSociedades = Math.max(0, baseImponible * 0.25);

    return NextResponse.json({
      data: {
        periodo: periodo || `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`,
        isConsolidated: scope.isConsolidated,
        baseImponible: Math.round(baseImponible * 100) / 100,
        iva: {
          repercutido: Math.round(ivaRepercutido * 100) / 100,
          soportado: Math.round(ivaSoportado * 100) / 100,
          aLiquidar: Math.round(ivaLiquidar * 100) / 100,
        },
        irpf: {
          retenciones: Math.round(retencionesIrpf * 100) / 100,
          baseImponible: Math.round(ingresos * 100) / 100,
        },
        impuestoSociedades: Math.round(impuestoSociedades * 100) / 100,
        impuestosDirectos: Math.round(impuestos * 100) / 100,
        totalCargaFiscal: Math.round((ivaLiquidar + impuestoSociedades + impuestos) * 100) / 100,
      },
    });
  } catch (error) {
    logger.error('[Accounting Tax Summary] Error:', error);
    return NextResponse.json({ error: 'Error al obtener resumen fiscal' }, { status: 500 });
  }
}
