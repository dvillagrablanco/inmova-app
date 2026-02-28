import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/family-office/simulate-allocation
 * Simula cambios en asset allocation:
 * "¿Qué pasa si vendo Espronceda y compro fondos?"
 * "¿Cómo queda si invierto €500K más en renta variable?"
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { operaciones } = await request.json();
    // operaciones: [{ tipo: 'vender_inmueble'|'comprar_inmueble'|'invertir_financiero'|'retirar_financiero'|'aportar_pe', importe: number, descripcion: string }]

    if (!operaciones || !Array.isArray(operaciones)) {
      return NextResponse.json({ error: 'Se requiere array de operaciones' }, { status: 400 });
    }

    const companyId = session.user.companyId;
    const groupIds = [companyId];
    const children = await prisma.company.findMany({ where: { parentCompanyId: companyId }, select: { id: true } });
    children.forEach((c) => groupIds.push(c.id));

    // Estado actual
    const units = await prisma.unit.findMany({
      where: { building: { companyId: { in: groupIds }, isDemo: false } },
      select: { valorMercado: true, precioCompra: true, rentaMensual: true, estado: true },
    });
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId, activa: true },
      include: { positions: { select: { valorActual: true } } },
    });
    const participations = await prisma.participation.findMany({
      where: { companyId, activa: true },
      select: { valorEstimado: true, valorContable: true },
    });

    let inmobiliario = units.reduce((s, u) => s + (u.valorMercado || u.precioCompra || 0), 0);
    let financiero = accounts.reduce((s, a) => s + a.positions.reduce((ps, p) => ps + p.valorActual, 0), 0);
    let pe = participations.reduce((s, p) => s + (p.valorEstimado || p.valorContable), 0);
    let liquidez = accounts.reduce((s, a) => s + a.saldoActual, 0);
    let rentaMensual = units.filter((u) => u.estado === 'ocupada').reduce((s, u) => s + u.rentaMensual, 0);

    const antes = { inmobiliario, financiero, pe, liquidez, total: inmobiliario + financiero + pe + liquidez, rentaMensual };

    // Aplicar operaciones simuladas
    for (const op of operaciones) {
      switch (op.tipo) {
        case 'vender_inmueble':
          inmobiliario -= op.importe;
          liquidez += op.importe * 0.90; // 10% gastos venta
          rentaMensual -= (op.importe * 0.05) / 12; // ~5% yield perdida
          break;
        case 'comprar_inmueble':
          inmobiliario += op.importe;
          liquidez -= op.importe * 1.10; // 10% gastos compra
          rentaMensual += (op.importe * 0.05) / 12; // ~5% yield ganada
          break;
        case 'invertir_financiero':
          financiero += op.importe;
          liquidez -= op.importe;
          break;
        case 'retirar_financiero':
          financiero -= op.importe;
          liquidez += op.importe;
          break;
        case 'aportar_pe':
          pe += op.importe;
          liquidez -= op.importe;
          break;
        case 'distribucion_pe':
          pe -= op.importe * 0.5; // Devuelve capital
          liquidez += op.importe;
          break;
      }
    }

    const despues = { inmobiliario, financiero, pe, liquidez, total: inmobiliario + financiero + pe + liquidez, rentaMensual };
    const totalDespues = despues.total;

    return NextResponse.json({
      success: true,
      antes: {
        ...antes,
        allocation: {
          inmobiliario: antes.total > 0 ? Math.round((antes.inmobiliario / antes.total) * 1000) / 10 : 0,
          financiero: antes.total > 0 ? Math.round((antes.financiero / antes.total) * 1000) / 10 : 0,
          pe: antes.total > 0 ? Math.round((antes.pe / antes.total) * 1000) / 10 : 0,
          liquidez: antes.total > 0 ? Math.round((antes.liquidez / antes.total) * 1000) / 10 : 0,
        },
      },
      despues: {
        ...despues,
        allocation: {
          inmobiliario: totalDespues > 0 ? Math.round((inmobiliario / totalDespues) * 1000) / 10 : 0,
          financiero: totalDespues > 0 ? Math.round((financiero / totalDespues) * 1000) / 10 : 0,
          pe: totalDespues > 0 ? Math.round((pe / totalDespues) * 1000) / 10 : 0,
          liquidez: totalDespues > 0 ? Math.round((liquidez / totalDespues) * 1000) / 10 : 0,
        },
      },
      impacto: {
        cambioPatrimonio: Math.round(despues.total - antes.total),
        cambioRentaMensual: Math.round((despues.rentaMensual - antes.rentaMensual) * 100) / 100,
        cambioRentaAnual: Math.round((despues.rentaMensual - antes.rentaMensual) * 12 * 100) / 100,
        alertas: liquidez < 0
          ? ['🔴 DÉFICIT de liquidez. No hay caja suficiente para estas operaciones.']
          : liquidez < 50000
            ? ['⚠️ Liquidez baja tras operaciones. Mantener reserva mínima.']
            : [],
      },
      operaciones,
    });
  } catch (error: any) {
    logger.error('[Simulate Allocation]:', error);
    return NextResponse.json({ error: 'Error en simulación' }, { status: 500 });
  }
}
