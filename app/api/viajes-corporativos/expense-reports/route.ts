import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const addMonths = (date: Date, count: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));

const parsePeriod = (period: string | null) => {
  if (!period) return null;
  const [year, month] = period.split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(month)) return null;
  return { year, month };
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period');
    const parsed = parsePeriod(periodParam);
    const baseDate = parsed
      ? new Date(Date.UTC(parsed.year, parsed.month - 1, 1))
      : new Date();

    const periodStart = startOfMonth(baseDate);
    const periodEnd = addMonths(periodStart, 1);
    const rangeStart = addMonths(periodStart, -3);
    const rangeEnd = periodEnd;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { metadata: true },
    });

    const metadata = (company?.metadata as Record<string, any>) || {};
    const budgetMonthly = Number(metadata.presupuestoViajesMensual || 0);
    const budgetByDepartment = (metadata.presupuestoViajesDepartamentos as Record<string, number>) || {};
    const ahorroVsMercado = Number(metadata.ahorroViajesMercado || 0);

    const [periodExpenses, rangeExpenses] = await Promise.all([
      prisma.corporateTravelExpense.findMany({
        where: {
          companyId,
          fechaGasto: { gte: periodStart, lt: periodEnd },
        },
        include: { tenant: true },
        orderBy: { fechaGasto: 'desc' },
      }),
      prisma.corporateTravelExpense.findMany({
        where: {
          companyId,
          fechaGasto: { gte: rangeStart, lt: rangeEnd },
        },
      }),
    ]);

    const gastoMes = periodExpenses.reduce((sum, expense) => sum + expense.monto, 0);
    const presupuestoMes = budgetMonthly;
    const ahorro = Math.max(presupuestoMes - gastoMes, 0);
    const viajesRealizados = periodExpenses.length;
    const costoPromedio = viajesRealizados > 0 ? Math.round(gastoMes / viajesRealizados) : 0;

    const monthlyMap = new Map<string, { gastado: number }>();
    for (let i = 3; i >= 0; i -= 1) {
      const date = addMonths(periodStart, -i);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { gastado: 0 });
    }

    for (const expense of rangeExpenses) {
      const key = expense.fechaGasto.toISOString().slice(0, 7);
      const current = monthlyMap.get(key);
      if (current) {
        current.gastado += expense.monto;
      }
    }

    const monthly = Array.from(monthlyMap.entries()).map(([periodo, values]) => ({
      periodo,
      presupuesto: presupuestoMes,
      gastado: values.gastado,
      ahorro: Math.max(presupuestoMes - values.gastado, 0),
    }));

    const totalPeriodSpent = gastoMes;
    const categoryMap = new Map<string, number>();
    for (const expense of periodExpenses) {
      const key = expense.categoria;
      categoryMap.set(key, (categoryMap.get(key) || 0) + expense.monto);
    }

    const categories = Array.from(categoryMap.entries()).map(([categoria, gasto]) => ({
      categoria,
      gasto,
      porcentaje: totalPeriodSpent > 0 ? Math.round((gasto / totalPeriodSpent) * 100) : 0,
    }));

    const departmentMap = new Map<
      string,
      { gasto: number; empleados: Set<string>; viajes: number }
    >();
    for (const expense of periodExpenses) {
      const departamento = expense.departamento || 'Sin departamento';
      const current = departmentMap.get(departamento) || {
        gasto: 0,
        empleados: new Set<string>(),
        viajes: 0,
      };
      current.gasto += expense.monto;
      current.viajes += 1;
      if (expense.tenantId) current.empleados.add(expense.tenantId);
      departmentMap.set(departamento, current);
    }

    const departments = Array.from(departmentMap.entries()).map(([departamento, data]) => ({
      departamento,
      gasto: data.gasto,
      presupuesto: Number(budgetByDepartment[departamento] || 0),
      empleados: data.empleados.size,
      viajes: data.viajes,
    }));

    const alerts = departments
      .map((dept) => {
        if (dept.presupuesto <= 0) return null;
        const porcentaje = Math.round((dept.gasto / dept.presupuesto) * 100);
        if (porcentaje >= 90) {
          return { id: `${dept.departamento}-warning`, departamento: dept.departamento, porcentaje, tipo: 'warning' as const };
        }
        if (porcentaje >= 80) {
          return { id: `${dept.departamento}-info`, departamento: dept.departamento, porcentaje, tipo: 'info' as const };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; departamento: string; porcentaje: number; tipo: 'warning' | 'info' }>;

    const reports = monthly
      .filter((item) => item.gastado > 0)
      .map((item) => {
        const [year, month] = item.periodo.split('-').map(Number);
        const date = new Date(Date.UTC(year, month, 0));
        return {
          id: `INF-${item.periodo}`,
          nombre: `Informe Mensual ${item.periodo}`,
          tipo: 'mensual',
          fecha: date.toISOString(),
          estado: 'generado',
          periodo: item.periodo,
        };
      });

    return NextResponse.json({
      stats: {
        gastoMes,
        presupuestoMes,
        ahorro,
        ahorroVsMercado,
        viajesRealizados,
        costoPromedio,
      },
      monthly,
      categories,
      departments,
      reports,
      alerts,
    });
  } catch (error) {
    logger.error('[Viajes Corporativos] Error al obtener reportes', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al cargar reportes' }, { status: 500 });
  }
}
