import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodo = parseInt(searchParams.get('periodo') || '12');
    const buildingId = searchParams.get('buildingId') || '';

    const scope = await resolveCompanyScope({
      userId: (session.user as any).id,
      role: (session.user as any).role,
      primaryCompanyId: (session.user as any).companyId,
      request: req,
    });

    const companyId = scope.activeCompanyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }
    const companyFilter = scope.scopeCompanyIds.length > 1
      ? { in: scope.scopeCompanyIds }
      : companyId;

    const now = new Date();
    const startDate = subMonths(now, periodo);

    // Filtro de edificio
    const buildingWhere = buildingId ? { id: buildingId } : { companyId: companyFilter };

    // ================================================================
    // 1. INGRESOS - Cascada: Payment → AccountingTransaction → BankTransaction
    // ================================================================
    const ingresos: Array<{ mes: string; rentas: number; servicios: number; otros: number }> = [];

    // Verificar si hay pagos operativos
    const totalPayments = await prisma.payment.count({
      where: {
        contract: { unit: { building: buildingWhere } },
        estado: 'pagado',
        fechaPago: { gte: startDate },
      },
    });

    // Verificar si hay transacciones contables de ingreso
    const totalAccountingIncome = await prisma.accountingTransaction.count({
      where: {
        companyId: companyFilter,
        tipo: 'ingreso',
        fecha: { gte: startDate },
      },
    });

    // Verificar bank transactions
    let totalBankIncome = 0;
    try {
      totalBankIncome = await prisma.bankTransaction.count({
        where: { companyId: companyFilter, monto: { gt: 0 }, fecha: { gte: startDate } },
      });
    } catch { /* model might not exist */ }

    const incomeSource = totalPayments > 0 ? 'payment'
      : totalAccountingIncome > 0 ? 'accounting'
      : totalBankIncome > 0 ? 'bank'
      : 'none';

    for (let i = 0; i < periodo; i++) {
      const monthStart = startOfMonth(subMonths(now, periodo - i - 1));
      const monthEnd = endOfMonth(monthStart);
      let rentas = 0;
      let servicios = 0;
      let otros = 0;

      if (incomeSource === 'payment') {
        const payments = await prisma.payment.findMany({
          where: {
            contract: { unit: { building: buildingWhere } },
            estado: 'pagado',
            fechaPago: { gte: monthStart, lte: monthEnd },
          },
        });
        rentas = payments.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0);
        servicios = rentas * 0.05;
        otros = rentas * 0.02;
      } else if (incomeSource === 'accounting') {
        const txs = await prisma.accountingTransaction.findMany({
          where: {
            companyId: companyFilter,
            tipo: 'ingreso',
            fecha: { gte: monthStart, lte: monthEnd },
          },
          select: { monto: true, categoria: true },
        });
        for (const tx of txs) {
          const cat = tx.categoria || '';
          if (cat.includes('renta') || cat.includes('arrend') || cat.includes('alquiler')) {
            rentas += tx.monto;
          } else if (cat.includes('servicio') || cat.includes('suministro')) {
            servicios += tx.monto;
          } else {
            otros += tx.monto;
          }
        }
      } else if (incomeSource === 'bank') {
        try {
          const bankTxs = await prisma.bankTransaction.findMany({
            where: { companyId: companyFilter, monto: { gt: 0 }, fecha: { gte: monthStart, lte: monthEnd } },
            select: { monto: true },
          });
          rentas = bankTxs.reduce((sum: number, tx: any) => sum + Number(tx.monto || 0), 0);
        } catch { /* ignore */ }
      }

      ingresos.push({
        mes: format(monthStart, 'MMM yyyy', { locale: es }),
        rentas: parseFloat(rentas.toFixed(2)),
        servicios: parseFloat(servicios.toFixed(2)),
        otros: parseFloat(otros.toFixed(2)),
      });
    }

    // ================================================================
    // 2. GASTOS - Cascada: Expense → AccountingTransaction → BankTransaction
    // ================================================================
    const gastos: Array<{ categoria: string; monto: number; porcentaje: number }> = [];
    const gastosPorCategoria: Record<string, number> = {};

    const allExpenses = await prisma.expense.findMany({
      where: { building: buildingWhere, fecha: { gte: startDate } },
    });

    if (allExpenses.length > 0) {
      // Usar tabla Expense
      allExpenses.forEach((gasto: any) => {
        const cat = gasto.categoria || 'otro';
        gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + Number(gasto.monto || 0);
      });
    } else {
      // Fallback a AccountingTransaction
      const accountingExpenses = await prisma.accountingTransaction.findMany({
        where: {
          companyId: companyFilter,
          tipo: 'gasto',
          fecha: { gte: startDate },
        },
        select: { monto: true, categoria: true },
      });

      if (accountingExpenses.length > 0) {
        accountingExpenses.forEach((tx: any) => {
          const cat = tx.categoria || 'gasto_otro';
          gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + tx.monto;
        });
      } else {
        // Fallback a BankTransaction (negativos)
        try {
          const bankExpenses = await prisma.bankTransaction.findMany({
            where: { companyId: companyFilter, monto: { lt: 0 }, fecha: { gte: startDate } },
            select: { monto: true, concepto: true },
          });
          bankExpenses.forEach((tx: any) => {
            gastosPorCategoria['banco'] = (gastosPorCategoria['banco'] || 0) + Math.abs(tx.monto);
          });
        } catch { /* ignore */ }
      }
    }

    const totalGastos = Object.values(gastosPorCategoria).reduce((sum, val) => sum + val, 0);
    Object.entries(gastosPorCategoria).forEach(([categoria, monto]) => {
      gastos.push({
        categoria,
        monto: parseFloat(monto.toFixed(2)),
        porcentaje: totalGastos > 0 ? parseFloat(((monto / totalGastos) * 100).toFixed(1)) : 0,
      });
    });

    // ================================================================
    // 3. OCUPACIÓN
    // ================================================================
    const buildings = await prisma.building.findMany({
      where: buildingWhere,
      include: {
        units: {
          include: {
            contracts: {
              where: {
                OR: [
                  { estado: 'activo' },
                  { AND: [{ fechaInicio: { lte: now } }, { fechaFin: { gte: now } }] },
                ],
              },
            },
          },
        },
      },
    });

    const ocupacion = buildings.map((building: any) => {
      const totalUnits = building.units.length;
      const occupiedUnits = building.units.filter((unit: any) => unit.contracts.length > 0).length;
      const porcentaje = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      return {
        edificio: building.nombre,
        total: totalUnits,
        ocupadas: occupiedUnits,
        porcentaje: parseFloat(porcentaje.toFixed(1)),
      };
    });

    // ================================================================
    // 4. MOROSIDAD
    // ================================================================
    const morosidad: Array<{ mes: string; morosidad: number; recuperado: number }> = [];
    for (let i = 0; i < periodo; i++) {
      const monthStart = startOfMonth(subMonths(now, periodo - i - 1));
      const monthEnd = endOfMonth(monthStart);

      const paymentsOverdue = await prisma.payment.findMany({
        where: {
          contract: { unit: { building: buildingWhere } },
          fechaVencimiento: { gte: monthStart, lte: monthEnd },
          estado: 'pendiente',
        },
      });

      const paymentsPaidLate = await prisma.payment.findMany({
        where: {
          contract: { unit: { building: buildingWhere } },
          fechaVencimiento: { gte: monthStart, lte: monthEnd },
          estado: 'pagado',
          fechaPago: { gt: monthEnd },
        },
      });

      morosidad.push({
        mes: format(monthStart, 'MMM yyyy', { locale: es }),
        morosidad: parseFloat(paymentsOverdue.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0).toFixed(2)),
        recuperado: parseFloat(paymentsPaidLate.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0).toFixed(2)),
      });
    }

    // ================================================================
    // 5. RENTABILIDAD
    // ================================================================
    const totalIngresos = ingresos.reduce((sum, item) => sum + item.rentas + item.servicios + item.otros, 0);
    const totalGastosCalc = gastos.reduce((sum, item) => sum + item.monto, 0);
    const ingresosNetos = totalIngresos - totalGastosCalc;

    const totalUnits = buildings.reduce((sum: number, b: any) => sum + b.units.length, 0);
    const occupiedUnits = buildings.reduce(
      (sum: number, b: any) => sum + b.units.filter((u: any) => u.contracts.length > 0).length,
      0
    );
    const tasaOcupacion = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const totalMorosidad = morosidad.reduce((sum, item) => sum + item.morosidad, 0);
    const tasaMorosidad = totalIngresos > 0 ? (totalMorosidad / totalIngresos) * 100 : 0;

    const rentabilidad = {
      ingresosTotales: parseFloat(totalIngresos.toFixed(2)),
      gastosTotales: parseFloat(totalGastosCalc.toFixed(2)),
      ingresosNetos: parseFloat(ingresosNetos.toFixed(2)),
      margenNeto: totalIngresos > 0 ? parseFloat(((ingresosNetos / totalIngresos) * 100).toFixed(2)) : 0,
      tasaOcupacion: parseFloat(tasaOcupacion.toFixed(1)),
      tasaMorosidad: parseFloat(tasaMorosidad.toFixed(1)),
      roiPromedio: totalIngresos > 0 ? parseFloat(((ingresosNetos / totalIngresos) * 100).toFixed(2)) : 0,
    };

    // ================================================================
    // 6. TENDENCIAS
    // ================================================================
    const tendencias = {
      data: ingresos.map((item, index) => ({
        periodo: item.mes,
        real: item.rentas,
        prediccion: index >= ingresos.length - 3 ? item.rentas * 1.08 : null,
      })),
    };

    return NextResponse.json({
      ingresos,
      gastos,
      ocupacion,
      morosidad,
      rentabilidad,
      tendencias,
      meta: { incomeSource },
    });
  } catch (error: any) {
    logger.error('Error en BI dashboard:', error);
    return NextResponse.json(
      { error: 'Error al cargar datos de BI', details: error.message },
      { status: 500 }
    );
  }
}
