import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-propietario/monthly-report?ownerId=xxx&month=2026-03
 * Monthly financial report for property owner
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 });

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: { ownerBuildings: { include: { building: { include: { units: { include: { contracts: { where: { estado: 'activo' }, select: { rentaMensual: true } } } } } } } } },
    });
    if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);

    const buildings = [];
    let totalIngresos = 0, totalGastos = 0, totalUnidades = 0, totalOcupadas = 0;

    for (const ob of owner.ownerBuildings) {
      const b = ob.building;
      const uds = b.units.length;
      const ocup = b.units.filter(u => u.contracts.length > 0).length;
      const renta = b.units.reduce((s, u) => s + (u.contracts[0]?.rentaMensual || 0), 0);

      const pagos = await prisma.payment.aggregate({
        where: { estado: 'pagado', fechaPago: { gte: monthStart, lt: monthEnd }, contract: { unit: { buildingId: b.id } } },
        _sum: { monto: true },
      });
      const gastos = await prisma.expense.aggregate({
        where: { buildingId: b.id, fecha: { gte: monthStart, lt: monthEnd } },
        _sum: { monto: true },
      });

      const ing = pagos._sum.monto || 0;
      const gas = gastos._sum.monto || 0;
      totalIngresos += ing; totalGastos += gas; totalUnidades += uds; totalOcupadas += ocup;

      buildings.push({
        nombre: b.nombre, direccion: b.direccion, porcentaje: ob.porcentajePropiedad,
        unidades: uds, ocupadas: ocup, ocupacion: uds > 0 ? Math.round(ocup / uds * 100) : 0,
        rentaMensual: renta, ingresosCobrados: ing, gastos: gas, neto: ing - gas,
      });
    }

    return NextResponse.json({
      success: true,
      report: {
        propietario: owner.nombreCompleto, periodo: month,
        resumen: { ingresos: totalIngresos, gastos: totalGastos, neto: totalIngresos - totalGastos, unidades: totalUnidades, ocupadas: totalOcupadas, ocupacion: totalUnidades > 0 ? Math.round(totalOcupadas / totalUnidades * 100) : 0 },
        edificios: buildings,
      },
    });
  } catch (error: any) {
    logger.error('[Owner Monthly Report]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
