import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Get all data for calculations filtered by company
    const buildings = await prisma.building.findMany({
      where: { companyId },
      include: { units: true },
    });
    
    const units = buildings.flatMap(b => b.units);
    
    const contracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        unit: { building: { companyId } },
      },
      include: {
        unit: { include: { building: true } },
      },
    });
    
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: { building: { companyId } },
        },
      },
      include: {
        contract: true,
      },
    });
    
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        estado: { in: ['pendiente', 'en_progreso', 'programado'] },
        unit: { building: { companyId } },
      },
    });

    // Calculate KPIs
    const totalUnits = units.length;
    const occupiedUnits = units.filter((u) => u.estado === 'ocupada').length;
    const tasaOcupacion = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Current month income
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.fechaVencimiento);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    const ingresosTotalesMensuales = currentMonthPayments
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);

    // Pending payments
    const pagosPendientes = payments.filter(
      (p) => p.estado === 'pendiente' || p.estado === 'atrasado'
    );

    // Morosidad rate
    const totalPaymentsCount = currentMonthPayments.length;
    const latePaymentsCount = currentMonthPayments.filter((p) => p.estado === 'atrasado').length;
    const tasaMorosidad = totalPaymentsCount > 0 ? (latePaymentsCount / totalPaymentsCount) * 100 : 0;

    // Financial KPIs
    const ingresosNetos = payments
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);

    const gastosMantenimiento = await prisma.maintenanceRequest.findMany({
      where: { estado: 'completado' },
    });
    const gastosTotales = gastosMantenimiento.reduce((sum, m) => sum + (m.costoReal || 0), 0);

    const margenNeto = ingresosNetos > 0 ? ((ingresosNetos - gastosTotales) / ingresosNetos) * 100 : 0;

    // Monthly income for last 12 months
    const monthlyIncome: Array<{
      mes: string;
      ingresos: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthPayments = payments.filter((p) => {
        const paymentDate = new Date(p.fechaVencimiento);
        return (
          paymentDate.getMonth() === month &&
          paymentDate.getFullYear() === year &&
          p.estado === 'pagado'
        );
      });

      const total = monthPayments.reduce((sum, p) => sum + p.monto, 0);
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      monthlyIncome.push({
        mes: monthNames[month],
        ingresos: Math.round(total),
      });
    }

    // Contracts expiring soon
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const in90Days = new Date(now);
    in90Days.setDate(in90Days.getDate() + 90);

    const contractsExpiringSoon = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        fechaFin: {
          lte: in90Days,
          gte: now,
        },
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        tenant: true,
      },
      orderBy: { fechaFin: 'asc' },
      take: 5,
    });

    // Available units
    const unidadesDisponibles = await prisma.unit.findMany({
      where: { estado: 'disponible' },
      include: {
        building: true,
      },
      take: 5,
    });

    // Occupancy by unit type
    const occupancyByType = await prisma.unit.groupBy({
      by: ['tipo', 'estado'],
      _count: true,
    });

    const unitTypeData: Record<string, { total: number; ocupadas: number }> = {};
    occupancyByType.forEach((item) => {
      if (!unitTypeData[item.tipo]) {
        unitTypeData[item.tipo] = { total: 0, ocupadas: 0 };
      }
      unitTypeData[item.tipo].total += item._count;
      if (item.estado === 'ocupada') {
        unitTypeData[item.tipo].ocupadas += item._count;
      }
    });

    const occupancyChartData = Object.entries(unitTypeData).map(([tipo, data]) => ({
      name: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      ocupadas: data.ocupadas,
      disponibles: data.total - data.ocupadas,
      total: data.total,
    }));

    // Expenses by category
    const expenses = await prisma.expense.findMany();
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((expense) => {
      if (!expensesByCategory[expense.categoria]) {
        expensesByCategory[expense.categoria] = 0;
      }
      expensesByCategory[expense.categoria] += expense.monto;
    });

    const expensesChartData = Object.entries(expensesByCategory).map(([categoria, monto]) => ({
      name: categoria.charAt(0).toUpperCase() + categoria.slice(1).replace('_', ' '),
      value: Math.round(monto * 100) / 100,
    }));

    return NextResponse.json({
      kpis: {
        ingresosTotalesMensuales: Math.round(ingresosTotalesMensuales * 100) / 100,
        numeroPropiedades: totalUnits,
        tasaOcupacion: Math.round(tasaOcupacion * 10) / 10,
        tasaMorosidad: Math.round(tasaMorosidad * 10) / 10,
        ingresosNetos: Math.round(ingresosNetos * 100) / 100,
        gastosTotales: Math.round(gastosTotales * 100) / 100,
        margenNeto: Math.round(margenNeto * 10) / 10,
      },
      monthlyIncome,
      occupancyChartData,
      expensesChartData,
      pagosPendientes: pagosPendientes.slice(0, 5).map((p) => ({
        ...p,
        contract: payments.find((pay) => pay.id === p.id)?.contract,
      })),
      contractsExpiringSoon,
      maintenanceRequests: maintenanceRequests.slice(0, 5),
      unidadesDisponibles,
    });
  } catch (error: any) {
    logger.error('Error fetching dashboard data:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
