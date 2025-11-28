import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get all data for calculations
    const units = await prisma.unit.findMany();
    const payments = await prisma.payment.findMany({
      include: {
        contract: true,
      },
    });
    const contracts = await prisma.contract.findMany({
      where: { estado: 'activo' },
    });
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: { estado: { in: ['pendiente', 'en_progreso', 'programado'] } },
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
    const monthlyIncome = [];
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
      pagosPendientes: pagosPendientes.slice(0, 5).map((p) => ({
        ...p,
        contract: payments.find((pay) => pay.id === p.id)?.contract,
      })),
      contractsExpiringSoon,
      maintenanceRequests: maintenanceRequests.slice(0, 5),
      unidadesDisponibles,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}