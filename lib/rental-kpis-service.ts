/**
 * SERVICIO DE KPIs AVANZADOS PARA ALQUILER
 * 
 * Métricas profesionales basadas en estándares de la industria PropTech:
 * - NOI (Net Operating Income)
 * - Gross/Net Yield
 * - Tasa de morosidad real (por monto)
 * - DSO (Days Sales Outstanding)
 * - Tasa de rotación de inquilinos
 * - Tasa de renovación de contratos
 * - Días promedio de vacancia
 * - ARPU (Average Revenue Per Unit)
 * - Cap Rate
 * - Aging de cuentas por cobrar
 */

import { prisma } from './db';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, startOfYear, endOfYear } from 'date-fns';

export interface RentalKPIs {
  // KPIs Operativos
  operational: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number; // %
    averageVacancyDays: number; // Días promedio vacío
    turnoverRate: number; // % inquilinos que se van al año
    renewalRate: number; // % contratos renovados
    activeContracts: number;
    expiringContracts30Days: number;
    expiringContracts60Days: number;
    expiringContracts90Days: number;
  };

  // KPIs Financieros
  financial: {
    monthlyGrossIncome: number; // Ingresos brutos del mes
    monthlyOperatingExpenses: number; // Gastos operativos del mes
    monthlyNOI: number; // Net Operating Income del mes
    annualizedNOI: number; // NOI anualizado
    grossYield: number; // % (Ingresos anuales / Valor propiedades)
    netYield: number; // % (NOI / Valor propiedades)
    averageRentPerUnit: number; // ARPU
    averageRentPerSqm: number; // €/m²
    portfolioValue: number; // Valor estimado del portfolio
    capRate: number; // % Tasa de capitalización
    netMargin: number; // % Margen neto
  };

  // KPIs de Cobranza/Morosidad
  collection: {
    totalReceivables: number; // Total pendiente de cobro
    currentMonthCollected: number; // Cobrado este mes
    collectionRate: number; // % de cobro
    delinquencyRate: number; // % morosidad (por monto)
    delinquencyCount: number; // Número de pagos morosos
    averageDaysToCollect: number; // DSO - Días promedio de cobro
    aging: {
      current: number; // 0-30 días
      days30to60: number;
      days60to90: number;
      over90Days: number;
    };
  };

  // KPIs de Mantenimiento
  maintenance: {
    pendingRequests: number;
    inProgressRequests: number;
    completedThisMonth: number;
    averageResolutionDays: number;
    maintenanceCostMTD: number; // Coste este mes
    maintenanceCostPerUnit: number;
    maintenanceAsPercentOfRevenue: number; // %
  };

  // Tendencias (comparativa vs mes anterior)
  trends: {
    occupancyChange: number; // % cambio
    incomeChange: number; // % cambio
    noiChange: number; // % cambio
    delinquencyChange: number; // % cambio (negativo es bueno)
  };

  // Datos para gráficos
  charts: {
    monthlyIncome: Array<{ month: string; income: number; expenses: number; noi: number }>;
    occupancyHistory: Array<{ month: string; rate: number }>;
    collectionAging: Array<{ category: string; amount: number; count: number }>;
    incomeByPropertyType: Array<{ type: string; income: number; units: number }>;
    topPerformingProperties: Array<{ name: string; noi: number; yield: number; occupancy: number }>;
  };
}

export async function calculateRentalKPIs(companyId: string): Promise<RentalKPIs> {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));
  const yearStart = startOfYear(now);

  // ============================================
  // CONSULTAS BASE
  // ============================================
  
  const [
    buildings,
    units,
    contracts,
    payments,
    expenses,
    maintenanceRequests,
  ] = await Promise.all([
    // Edificios con valor estimado
    prisma.building.findMany({
      where: { companyId },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        valorEstimado: true,
        units: {
          select: {
            id: true,
            estado: true,
            superficie: true,
            rentaMensual: true,
            tipo: true,
          },
        },
      },
    }),
    
    // Todas las unidades
    prisma.unit.findMany({
      where: { building: { companyId } },
      select: {
        id: true,
        estado: true,
        superficie: true,
        rentaMensual: true,
        tipo: true,
        updatedAt: true,
      },
    }),
    
    // Contratos (activos y recientes)
    prisma.contract.findMany({
      where: {
        unit: { building: { companyId } },
        OR: [
          { estado: 'activo' },
          { fechaFin: { gte: subMonths(now, 12) } }, // Últimos 12 meses
        ],
      },
      select: {
        id: true,
        estado: true,
        fechaInicio: true,
        fechaFin: true,
        rentaMensual: true,
        renovacionAutomatica: true,
        unitId: true,
      },
    }),
    
    // Pagos del año
    prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId } } },
        fechaVencimiento: { gte: yearStart },
      },
      select: {
        id: true,
        monto: true,
        estado: true,
        fechaVencimiento: true,
        fechaPago: true,
        contractId: true,
      },
    }),
    
    // Gastos del año
    prisma.expense.findMany({
      where: {
        building: { companyId },
        fecha: { gte: yearStart },
      },
      select: {
        id: true,
        monto: true,
        categoria: true,
        fecha: true,
        buildingId: true,
      },
    }),
    
    // Solicitudes de mantenimiento
    prisma.maintenanceRequest.findMany({
      where: { unit: { building: { companyId } } },
      select: {
        id: true,
        estado: true,
        fechaSolicitud: true,
        fechaResolucion: true,
        costoEstimado: true,
        costoReal: true,
      },
    }),
  ]);

  // ============================================
  // CALCULAR KPIs OPERATIVOS
  // ============================================
  
  const totalProperties = buildings.length;
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.estado === 'ocupada').length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  
  // Contratos activos y por vencer
  const activeContracts = contracts.filter(c => c.estado === 'activo');
  const expiringContracts30Days = activeContracts.filter(c => {
    const daysToExpiry = differenceInDays(new Date(c.fechaFin), now);
    return daysToExpiry >= 0 && daysToExpiry <= 30;
  }).length;
  const expiringContracts60Days = activeContracts.filter(c => {
    const daysToExpiry = differenceInDays(new Date(c.fechaFin), now);
    return daysToExpiry > 30 && daysToExpiry <= 60;
  }).length;
  const expiringContracts90Days = activeContracts.filter(c => {
    const daysToExpiry = differenceInDays(new Date(c.fechaFin), now);
    return daysToExpiry > 60 && daysToExpiry <= 90;
  }).length;
  
  // Tasa de rotación (contratos terminados / total) últimos 12 meses
  const terminatedContracts = contracts.filter(c => 
    c.estado !== 'activo' && 
    new Date(c.fechaFin) >= subMonths(now, 12)
  ).length;
  const turnoverRate = activeContracts.length > 0 
    ? (terminatedContracts / (activeContracts.length + terminatedContracts)) * 100 
    : 0;
  
  // Tasa de renovación (contratos con renovación automática o renovados)
  const renewedContracts = contracts.filter(c => c.renovacionAutomatica).length;
  const renewalRate = contracts.length > 0 
    ? (renewedContracts / contracts.length) * 100 
    : 0;
  
  // Días promedio de vacancia (estimación basada en unidades vacías)
  const vacantUnitsData = units.filter(u => u.estado !== 'ocupada');
  const averageVacancyDays = vacantUnitsData.length > 0
    ? vacantUnitsData.reduce((sum, u) => {
        const daysSinceUpdate = differenceInDays(now, new Date(u.updatedAt));
        return sum + Math.min(daysSinceUpdate, 365); // Cap a 1 año
      }, 0) / vacantUnitsData.length
    : 0;

  // ============================================
  // CALCULAR KPIs FINANCIEROS
  // ============================================
  
  // Ingresos del mes actual
  const currentMonthPayments = payments.filter(p => 
    new Date(p.fechaVencimiento) >= currentMonthStart &&
    new Date(p.fechaVencimiento) <= currentMonthEnd &&
    p.estado === 'pagado'
  );
  const monthlyGrossIncome = currentMonthPayments.reduce(
    (sum, p) => sum + Number(p.monto || 0), 0
  );
  
  // Gastos del mes actual
  const currentMonthExpenses = expenses.filter(e =>
    new Date(e.fecha) >= currentMonthStart &&
    new Date(e.fecha) <= currentMonthEnd
  );
  const monthlyOperatingExpenses = currentMonthExpenses.reduce(
    (sum, e) => sum + Number(e.monto || 0), 0
  );
  
  // NOI (Net Operating Income)
  const monthlyNOI = monthlyGrossIncome - monthlyOperatingExpenses;
  const annualizedNOI = monthlyNOI * 12;
  
  // Valor del portfolio
  const portfolioValue = buildings.reduce(
    (sum, b) => sum + Number(b.valorEstimado || 0), 0
  );
  
  // Yields
  const annualizedIncome = monthlyGrossIncome * 12;
  const grossYield = portfolioValue > 0 
    ? (annualizedIncome / portfolioValue) * 100 
    : 0;
  const netYield = portfolioValue > 0 
    ? (annualizedNOI / portfolioValue) * 100 
    : 0;
  
  // Cap Rate (similar a Net Yield para simplificar)
  const capRate = netYield;
  
  // ARPU (Average Revenue Per Unit)
  const averageRentPerUnit = occupiedUnits > 0 
    ? monthlyGrossIncome / occupiedUnits 
    : 0;
  
  // Precio por m²
  const totalSqm = units.reduce((sum, u) => sum + Number(u.superficie || 0), 0);
  const averageRentPerSqm = totalSqm > 0 && monthlyGrossIncome > 0
    ? monthlyGrossIncome / totalSqm
    : 0;
  
  // Margen neto
  const netMargin = monthlyGrossIncome > 0 
    ? (monthlyNOI / monthlyGrossIncome) * 100 
    : 0;

  // ============================================
  // CALCULAR KPIs DE COBRANZA
  // ============================================
  
  // Pagos pendientes (morosidad)
  const pendingPayments = payments.filter(p => p.estado === 'pendiente');
  const totalReceivables = pendingPayments.reduce(
    (sum, p) => sum + Number(p.monto || 0), 0
  );
  
  // Total esperado del mes
  const totalExpectedThisMonth = payments.filter(p =>
    new Date(p.fechaVencimiento) >= currentMonthStart &&
    new Date(p.fechaVencimiento) <= currentMonthEnd
  ).reduce((sum, p) => sum + Number(p.monto || 0), 0);
  
  const collectionRate = totalExpectedThisMonth > 0 
    ? (monthlyGrossIncome / totalExpectedThisMonth) * 100 
    : 100;
  
  // Tasa de morosidad (por monto)
  const totalBilled = payments.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const delinquencyRate = totalBilled > 0 
    ? (totalReceivables / totalBilled) * 100 
    : 0;
  
  // DSO (Days Sales Outstanding)
  const paidPayments = payments.filter(p => p.estado === 'pagado' && p.fechaPago);
  const averageDaysToCollect = paidPayments.length > 0
    ? paidPayments.reduce((sum, p) => {
        const days = differenceInDays(new Date(p.fechaPago!), new Date(p.fechaVencimiento));
        return sum + Math.max(0, days); // Solo contar días positivos (pagos tardíos)
      }, 0) / paidPayments.length
    : 0;
  
  // Aging de cuentas por cobrar
  const aging = {
    current: 0,
    days30to60: 0,
    days60to90: 0,
    over90Days: 0,
  };
  
  pendingPayments.forEach(p => {
    const daysPastDue = differenceInDays(now, new Date(p.fechaVencimiento));
    const amount = Number(p.monto || 0);
    
    if (daysPastDue <= 30) aging.current += amount;
    else if (daysPastDue <= 60) aging.days30to60 += amount;
    else if (daysPastDue <= 90) aging.days60to90 += amount;
    else aging.over90Days += amount;
  });

  // ============================================
  // CALCULAR KPIs DE MANTENIMIENTO
  // ============================================
  
  const pendingMaintenance = maintenanceRequests.filter(m => m.estado === 'pendiente').length;
  const inProgressMaintenance = maintenanceRequests.filter(m => m.estado === 'en_proceso').length;
  
  const completedThisMonth = maintenanceRequests.filter(m =>
    m.estado === 'completado' &&
    m.fechaResolucion &&
    new Date(m.fechaResolucion) >= currentMonthStart
  ).length;
  
  // Tiempo medio de resolución
  const resolvedRequests = maintenanceRequests.filter(m => 
    m.estado === 'completado' && m.fechaResolucion
  );
  const averageResolutionDays = resolvedRequests.length > 0
    ? resolvedRequests.reduce((sum, m) => {
        const days = differenceInDays(new Date(m.fechaResolucion!), new Date(m.fechaSolicitud));
        return sum + days;
      }, 0) / resolvedRequests.length
    : 0;
  
  // Coste de mantenimiento
  const maintenanceCostMTD = maintenanceRequests
    .filter(m => 
      m.fechaResolucion && 
      new Date(m.fechaResolucion) >= currentMonthStart
    )
    .reduce((sum, m) => sum + Number(m.costoReal || m.costoEstimado || 0), 0);
  
  const maintenanceCostPerUnit = totalUnits > 0 
    ? maintenanceCostMTD / totalUnits 
    : 0;
  
  const maintenanceAsPercentOfRevenue = monthlyGrossIncome > 0 
    ? (maintenanceCostMTD / monthlyGrossIncome) * 100 
    : 0;

  // ============================================
  // CALCULAR TENDENCIAS (vs mes anterior)
  // ============================================
  
  // Ingresos mes anterior
  const previousMonthPayments = payments.filter(p =>
    new Date(p.fechaVencimiento) >= previousMonthStart &&
    new Date(p.fechaVencimiento) <= previousMonthEnd &&
    p.estado === 'pagado'
  );
  const previousMonthIncome = previousMonthPayments.reduce(
    (sum, p) => sum + Number(p.monto || 0), 0
  );
  
  const previousMonthExpensesTotal = expenses
    .filter(e =>
      new Date(e.fecha) >= previousMonthStart &&
      new Date(e.fecha) <= previousMonthEnd
    )
    .reduce((sum, e) => sum + Number(e.monto || 0), 0);
  
  const previousNOI = previousMonthIncome - previousMonthExpensesTotal;
  
  const incomeChange = previousMonthIncome > 0 
    ? ((monthlyGrossIncome - previousMonthIncome) / previousMonthIncome) * 100 
    : 0;
  
  const noiChange = previousNOI !== 0 
    ? ((monthlyNOI - previousNOI) / Math.abs(previousNOI)) * 100 
    : 0;

  // ============================================
  // DATOS PARA GRÁFICOS
  // ============================================
  
  // Ingresos mensuales (últimos 6 meses)
  const monthlyIncomeChart: Array<{ month: string; income: number; expenses: number; noi: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthIncome = payments
      .filter(p =>
        new Date(p.fechaVencimiento) >= monthStart &&
        new Date(p.fechaVencimiento) <= monthEnd &&
        p.estado === 'pagado'
      )
      .reduce((sum, p) => sum + Number(p.monto || 0), 0);
    
    const monthExpenses = expenses
      .filter(e =>
        new Date(e.fecha) >= monthStart &&
        new Date(e.fecha) <= monthEnd
      )
      .reduce((sum, e) => sum + Number(e.monto || 0), 0);
    
    monthlyIncomeChart.push({
      month: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
      income: monthIncome,
      expenses: monthExpenses,
      noi: monthIncome - monthExpenses,
    });
  }
  
  // Historial de ocupación (últimos 6 meses - simplificado)
  const occupancyHistory: Array<{ month: string; rate: number }> = monthlyIncomeChart.map(m => ({
    month: m.month,
    rate: occupancyRate, // Simplificado, idealmente se calcularía histórico
  }));
  
  // Aging para gráfico
  const collectionAging: Array<{ category: string; amount: number; count: number }> = [
    { category: '0-30 días', amount: aging.current, count: pendingPayments.filter(p => differenceInDays(now, new Date(p.fechaVencimiento)) <= 30).length },
    { category: '31-60 días', amount: aging.days30to60, count: pendingPayments.filter(p => { const d = differenceInDays(now, new Date(p.fechaVencimiento)); return d > 30 && d <= 60; }).length },
    { category: '61-90 días', amount: aging.days60to90, count: pendingPayments.filter(p => { const d = differenceInDays(now, new Date(p.fechaVencimiento)); return d > 60 && d <= 90; }).length },
    { category: '+90 días', amount: aging.over90Days, count: pendingPayments.filter(p => differenceInDays(now, new Date(p.fechaVencimiento)) > 90).length },
  ];
  
  // Ingresos por tipo de propiedad
  const incomeByType: Record<string, { income: number; units: number }> = {};
  units.forEach(u => {
    const tipo = u.tipo || 'Otro';
    if (!incomeByType[tipo]) {
      incomeByType[tipo] = { income: 0, units: 0 };
    }
    incomeByType[tipo].units++;
    if (u.estado === 'ocupada') {
      incomeByType[tipo].income += Number(u.rentaMensual || 0);
    }
  });
  
  const incomeByPropertyType = Object.entries(incomeByType).map(([type, data]) => ({
    type,
    income: data.income,
    units: data.units,
  }));
  
  // Top propiedades
  const topPerformingProperties = buildings
    .map(b => {
      const buildingUnits = b.units;
      const buildingIncome = buildingUnits
        .filter(u => u.estado === 'ocupada')
        .reduce((sum, u) => sum + Number(u.rentaMensual || 0), 0);
      const buildingValue = Number(b.valorEstimado || 0);
      const buildingOccupancy = buildingUnits.length > 0
        ? (buildingUnits.filter(u => u.estado === 'ocupada').length / buildingUnits.length) * 100
        : 0;
      
      return {
        name: b.nombre,
        noi: buildingIncome * 0.7, // Estimación NOI 70%
        yield: buildingValue > 0 ? ((buildingIncome * 12) / buildingValue) * 100 : 0,
        occupancy: buildingOccupancy,
      };
    })
    .sort((a, b) => b.noi - a.noi)
    .slice(0, 5);

  // ============================================
  // RETORNAR KPIs COMPLETOS
  // ============================================
  
  return {
    operational: {
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      averageVacancyDays: Math.round(averageVacancyDays),
      turnoverRate: Math.round(turnoverRate * 10) / 10,
      renewalRate: Math.round(renewalRate * 10) / 10,
      activeContracts: activeContracts.length,
      expiringContracts30Days,
      expiringContracts60Days,
      expiringContracts90Days,
    },
    financial: {
      monthlyGrossIncome: Math.round(monthlyGrossIncome * 100) / 100,
      monthlyOperatingExpenses: Math.round(monthlyOperatingExpenses * 100) / 100,
      monthlyNOI: Math.round(monthlyNOI * 100) / 100,
      annualizedNOI: Math.round(annualizedNOI * 100) / 100,
      grossYield: Math.round(grossYield * 100) / 100,
      netYield: Math.round(netYield * 100) / 100,
      averageRentPerUnit: Math.round(averageRentPerUnit * 100) / 100,
      averageRentPerSqm: Math.round(averageRentPerSqm * 100) / 100,
      portfolioValue: Math.round(portfolioValue * 100) / 100,
      capRate: Math.round(capRate * 100) / 100,
      netMargin: Math.round(netMargin * 10) / 10,
    },
    collection: {
      totalReceivables: Math.round(totalReceivables * 100) / 100,
      currentMonthCollected: Math.round(monthlyGrossIncome * 100) / 100,
      collectionRate: Math.round(collectionRate * 10) / 10,
      delinquencyRate: Math.round(delinquencyRate * 10) / 10,
      delinquencyCount: pendingPayments.length,
      averageDaysToCollect: Math.round(averageDaysToCollect),
      aging,
    },
    maintenance: {
      pendingRequests: pendingMaintenance,
      inProgressRequests: inProgressMaintenance,
      completedThisMonth,
      averageResolutionDays: Math.round(averageResolutionDays),
      maintenanceCostMTD: Math.round(maintenanceCostMTD * 100) / 100,
      maintenanceCostPerUnit: Math.round(maintenanceCostPerUnit * 100) / 100,
      maintenanceAsPercentOfRevenue: Math.round(maintenanceAsPercentOfRevenue * 10) / 10,
    },
    trends: {
      occupancyChange: 0, // Requiere histórico
      incomeChange: Math.round(incomeChange * 10) / 10,
      noiChange: Math.round(noiChange * 10) / 10,
      delinquencyChange: 0, // Requiere histórico
    },
    charts: {
      monthlyIncome: monthlyIncomeChart,
      occupancyHistory,
      collectionAging,
      incomeByPropertyType,
      topPerformingProperties,
    },
  };
}
