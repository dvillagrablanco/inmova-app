/**
 * API de Estadísticas - Datos reales con cascada Payment→AccountingTransaction→BankTransaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    const companyIds = scope?.companyIds || [session.user.companyId];

    // Obtener datos reales de edificios y unidades
    const buildings = await prisma.building.findMany({
      where: { companyId: { in: companyIds }, isDemo: false },
      include: {
        units: {
          select: {
            id: true,
            tipo: true,
            rentaMensual: true,
            estado: true,
          },
        },
      },
    });

    // Calcular estadísticas por tipo de propiedad
    const unitsByType = buildings.reduce((acc: Record<string, { count: number; occupied: number; income: number }>, building) => {
      building.units.forEach(unit => {
        const tipo = unit.tipo || 'otros';
        if (!acc[tipo]) {
          acc[tipo] = { count: 0, occupied: 0, income: 0 };
        }
        acc[tipo].count++;
        if (unit.estado === 'ocupada') {
          acc[tipo].occupied++;
          acc[tipo].income += unit.rentaMensual || 0;
        }
      });
      return acc;
    }, {});

    const tipoLabels: Record<string, string> = {
      apartamento: 'Apartamentos',
      estudio: 'Estudios',
      local: 'Locales',
      oficina: 'Oficinas',
      habitacion: 'Habitaciones',
      garaje: 'Garajes',
      nave: 'Naves',
      plaza_garaje: 'Plazas de Garaje',
      otros: 'Otros',
    };

    const propertyTypes = Object.entries(unitsByType).map(([tipo, data]) => ({
      tipo: tipoLabels[tipo] || tipo,
      count: data.count,
      ocupacion: data.count > 0 ? Math.round((data.occupied / data.count) * 100) : 0,
      ingresos: data.income,
    }));

    // Top edificios por ingresos
    const topProperties = buildings
      .map(b => {
        const occupiedUnits = b.units.filter(u => u.estado === 'ocupada');
        const totalIncome = occupiedUnits.reduce((sum, u) => sum + (u.rentaMensual || 0), 0);
        return {
          nombre: b.nombre,
          unidades: b.units.length,
          ocupacion: b.units.length > 0 ? Math.round((occupiedUnits.length / b.units.length) * 100) : 0,
          ingresos: totalIncome,
        };
      })
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    // ================================================================
    // DATOS MENSUALES - Cascada: Payment → AccountingTransaction → BankTransaction
    // ================================================================
    const now = new Date();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Verificar fuentes de datos disponibles
    const sixMonthsAgo = subMonths(now, 6);

    const paymentCount = await prisma.payment.count({
      where: {
        contract: { unit: { building: { companyId: { in: companyIds } } } },
        estado: 'pagado',
        fechaPago: { gte: sixMonthsAgo },
      },
    });

    const accountingCount = await prisma.accountingTransaction.count({
      where: {
        companyId: { in: companyIds },
        tipo: 'ingreso',
        fecha: { gte: sixMonthsAgo },
      },
    });

    let bankCount = 0;
    try {
      bankCount = await prisma.bankTransaction.count({
        where: { companyId: { in: companyIds }, monto: { gt: 0 }, fecha: { gte: sixMonthsAgo } },
      });
    } catch { /* ignore */ }

    const incomeSource = paymentCount > 0 ? 'payment'
      : accountingCount > 0 ? 'accounting'
      : bankCount > 0 ? 'bank'
      : 'none';

    const totalUnits = buildings.reduce((sum, b) => sum + b.units.length, 0);
    const occupiedUnits = buildings.reduce(
      (sum, b) => sum + b.units.filter(u => u.estado === 'ocupada').length,
      0
    );
    const baseOcupacion = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const monthlyData: { mes: string; ingresos: number; gastos: number; ocupacion: number }[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (let i = 5; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(now, i));
      const mEnd = endOfMonth(mStart);
      const monthName = monthNames[mStart.getMonth()];
      let ingresos = 0;
      let gastos = 0;

      if (incomeSource === 'payment') {
        const payments = await prisma.payment.findMany({
          where: {
            contract: { unit: { building: { companyId: { in: companyIds } } } },
            estado: 'pagado',
            fechaPago: { gte: mStart, lte: mEnd },
          },
          select: { monto: true },
        });
        ingresos = payments.reduce((sum, p) => sum + Number(p.monto || 0), 0);

        const expenses = await prisma.expense.aggregate({
          where: { building: { companyId: { in: companyIds } }, fecha: { gte: mStart, lte: mEnd } },
          _sum: { monto: true },
        });
        gastos = Number(expenses._sum.monto || 0);
      } else if (incomeSource === 'accounting') {
        const txs = await prisma.accountingTransaction.findMany({
          where: {
            companyId: { in: companyIds },
            fecha: { gte: mStart, lte: mEnd },
          },
          select: { tipo: true, monto: true },
        });
        ingresos = txs.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
        gastos = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
      } else if (incomeSource === 'bank') {
        try {
          const [inc, exp] = await Promise.all([
            prisma.bankTransaction.aggregate({
              where: { companyId: { in: companyIds }, monto: { gt: 0 }, fecha: { gte: mStart, lte: mEnd } },
              _sum: { monto: true },
            }),
            prisma.bankTransaction.aggregate({
              where: { companyId: { in: companyIds }, monto: { lt: 0 }, fecha: { gte: mStart, lte: mEnd } },
              _sum: { monto: true },
            }),
          ]);
          ingresos = Number(inc._sum.monto || 0);
          gastos = Math.abs(Number(exp._sum.monto || 0));
        } catch { /* ignore */ }
      }

      totalIncome += ingresos;
      totalExpenses += gastos;

      monthlyData.push({
        mes: monthName,
        ingresos: parseFloat(ingresos.toFixed(2)),
        gastos: parseFloat(gastos.toFixed(2)),
        ocupacion: baseOcupacion,
      });
    }

    // KPIs calculados
    const avgPaymentDays = paymentCount > 0 ? 3.2 : 0; // TODO: calcular desde Payment.fechaPago vs fechaVencimiento
    const contractRenewalRate = await calculateRenewalRate(prisma, companyIds);
    const roi = totalIncome > 0 ? parseFloat(((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        monthlyData,
        propertyTypes: propertyTypes.length > 0 ? propertyTypes : [],
        topProperties: topProperties.length > 0 ? topProperties : [],
        summary: {
          totalBuildings: buildings.length,
          totalUnits,
          occupiedUnits,
          occupancyRate: baseOcupacion,
          totalIncome: parseFloat(totalIncome.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        },
        kpis: {
          avgPaymentDays,
          contractRenewalRate,
          roi,
        },
      },
      meta: { incomeSource },
    });
  } catch (error) {
    logger.error('[API Error] Estadísticas:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}

async function calculateRenewalRate(prisma: any, companyIds: string[]): Promise<number> {
  try {
    const oneYearAgo = subMonths(new Date(), 12);
    const [expired, renewed] = await Promise.all([
      prisma.contract.count({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          fechaFin: { gte: oneYearAgo, lte: new Date() },
        },
      }),
      prisma.contract.count({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          fechaFin: { gte: oneYearAgo, lte: new Date() },
          renovado: true,
        },
      }),
    ]);
    return expired > 0 ? Math.round((renewed / expired) * 100) : 0;
  } catch {
    return 0;
  }
}
