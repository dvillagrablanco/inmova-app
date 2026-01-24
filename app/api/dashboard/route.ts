import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Obtener información de la empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { esEmpresaPrueba: true }
    });

    const currentMonth = new Date();
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    // Consultas paralelas para mejor rendimiento
    const [
      totalBuildings,
      totalUnits,
      totalTenants,
      activeContracts,
      paymentsCurrentMonth,
      pendingPaymentsData,
      expensesCurrentMonth,
      contractsExpiring,
      maintenanceActive,
      availableUnits,
      unitsByType
    ] = await Promise.all([
      // Total de edificios
      prisma.building.count({ where: { companyId } }),
      
      // Total de unidades
      prisma.unit.count({ where: { building: { companyId } } }),
      
      // Total de inquilinos
      prisma.tenant.count({ where: { companyId } }),
      
      // Contratos activos
      prisma.contract.count({
        where: {
          unit: { building: { companyId } },
          estado: 'activo',
        },
      }),
      
      // Ingresos del mes (pagos pagados)
      prisma.payment.aggregate({
        where: {
          contract: { unit: { building: { companyId } } },
          fechaVencimiento: { gte: startDate, lte: endDate },
          estado: 'pagado',
        },
        _sum: { monto: true },
      }),
      
      // Pagos pendientes (con detalles)
      prisma.payment.findMany({
        where: {
          contract: { unit: { building: { companyId } } },
          estado: 'pendiente',
        },
        include: {
          contract: {
            include: {
              tenant: { select: { nombreCompleto: true } },
              unit: { select: { numero: true, building: { select: { nombre: true } } } },
            },
          },
        },
        orderBy: { fechaVencimiento: 'asc' },
        take: 10,
      }),
      
      // Gastos del mes
      prisma.expense.aggregate({
        where: {
          building: { companyId },
          fecha: { gte: startDate, lte: endDate },
        },
        _sum: { monto: true },
      }),
      
      // Contratos por vencer (próximos 30 días)
      prisma.contract.findMany({
        where: {
          unit: { building: { companyId } },
          estado: 'activo',
          fechaFin: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          tenant: { select: { nombreCompleto: true } },
          unit: { 
            select: { 
              numero: true, 
              building: { select: { nombre: true } } 
            } 
          },
        },
        orderBy: { fechaFin: 'asc' },
        take: 5,
      }),
      
      // Solicitudes de mantenimiento activas
      prisma.maintenanceRequest.findMany({
        where: {
          unit: { building: { companyId } },
          estado: { in: ['pendiente', 'en_progreso'] },
        },
        include: {
          unit: { 
            select: { 
              numero: true, 
              building: { select: { nombre: true } } 
            } 
          },
        },
        orderBy: { fechaSolicitud: 'desc' },
        take: 5,
      }),
      
      // Unidades disponibles
      prisma.unit.findMany({
        where: {
          building: { companyId },
          estado: 'disponible',
        },
        include: {
          building: { select: { nombre: true } },
        },
        orderBy: { rentaMensual: 'asc' },
        take: 5,
      }),
      
      // Unidades agrupadas por tipo (para gráfico de ocupación)
      prisma.unit.groupBy({
        by: ['tipo'],
        where: { building: { companyId } },
        _count: true,
      }),
    ]);

    // Calcular ocupación por tipo de unidad
    const occupiedByType = await prisma.unit.groupBy({
      by: ['tipo'],
      where: { 
        building: { companyId },
        estado: 'ocupada',
      },
      _count: true,
    });

    const occupancyChartData = unitsByType.map(type => {
      const occupied = occupiedByType.find(o => o.tipo === type.tipo)?._count || 0;
      return {
        name: type.tipo || 'Sin tipo',
        ocupadas: occupied,
        disponibles: type._count - occupied,
        total: type._count,
      };
    });

    // Gastos por categoría (para gráfico de pastel)
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoria'],
      where: {
        building: { companyId },
        fecha: { gte: subMonths(currentMonth, 3), lte: endDate },
      },
      _sum: { monto: true },
    });

    const expensesChartData = expensesByCategory.map(cat => ({
      name: cat.categoria || 'Otros',
      value: Number(cat._sum.monto) || 0,
    }));

    // Ingresos históricos (últimos 6 meses)
    const monthlyIncome: Array<{ mes: string; ingresos: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(currentMonth, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthPayments = await prisma.payment.aggregate({
        where: {
          contract: { unit: { building: { companyId } } },
          fechaVencimiento: { gte: monthStart, lte: monthEnd },
          estado: 'pagado',
        },
        _sum: { monto: true },
      });

      monthlyIncome.push({
        mes: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
        ingresos: Number(monthPayments._sum.monto) || 0,
      });
    }

    // Cálculos de KPIs
    const ingresosTotalesMensuales = Number(paymentsCurrentMonth._sum.monto) || 0;
    const gastosTotales = Number(expensesCurrentMonth._sum.monto) || 0;
    const ingresosNetos = ingresosTotalesMensuales - gastosTotales;
    const margenNeto = ingresosTotalesMensuales > 0 
      ? ((ingresosNetos / ingresosTotalesMensuales) * 100) 
      : 0;
    const tasaOcupacion = totalUnits > 0 ? (activeContracts / totalUnits) * 100 : 0;
    
    // Calcular morosidad (pagos vencidos no pagados)
    const overduePayments = await prisma.payment.count({
      where: {
        contract: { unit: { building: { companyId } } },
        estado: 'pendiente',
        fechaVencimiento: { lt: new Date() },
      },
    });
    const totalExpectedPayments = await prisma.payment.count({
      where: {
        contract: { unit: { building: { companyId } } },
        fechaVencimiento: { gte: subMonths(currentMonth, 3), lte: endDate },
      },
    });
    const tasaMorosidad = totalExpectedPayments > 0 
      ? (overduePayments / totalExpectedPayments) * 100 
      : 0;

    // Formatear pagos pendientes con nivel de riesgo
    const pagosPendientes = pendingPaymentsData.map(pago => {
      const diasVencido = Math.max(0, Math.ceil(
        (new Date().getTime() - new Date(pago.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)
      ));
      let nivelRiesgo = 'bajo';
      if (diasVencido > 30) nivelRiesgo = 'alto';
      else if (diasVencido > 15) nivelRiesgo = 'medio';
      
      return {
        id: pago.id,
        periodo: pago.periodo,
        monto: Number(pago.monto),
        fechaVencimiento: pago.fechaVencimiento,
        nivelRiesgo,
        inquilino: pago.contract?.tenant?.nombreCompleto,
        unidad: `${pago.contract?.unit?.building?.nombre} - ${pago.contract?.unit?.numero}`,
      };
    });

    return NextResponse.json({
      kpis: {
        ingresosTotalesMensuales,
        numeroEdificios: totalBuildings,
        numeroUnidades: totalUnits,
        tasaOcupacion: Number(tasaOcupacion.toFixed(1)),
        tasaMorosidad: Number(tasaMorosidad.toFixed(1)),
        ingresosNetos,
        gastosTotales,
        margenNeto: Number(margenNeto.toFixed(1)),
      },
      monthlyIncome,
      occupancyChartData,
      expensesChartData,
      pagosPendientes,
      contractsExpiringSoon: contractsExpiring,
      maintenanceRequests: maintenanceActive,
      unidadesDisponibles: availableUnits,
      esEmpresaPrueba: company?.esEmpresaPrueba || false,
    });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    logger.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
