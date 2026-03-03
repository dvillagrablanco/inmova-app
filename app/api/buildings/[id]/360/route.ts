import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/buildings/[id]/360
 * Returns complete 360° view of a building: info, units, contracts, payments, expenses, insurance, occupancy, revenue, maintenance.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await context.params;

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const companyFilter =
      scope.scopeCompanyIds.length > 1
        ? { in: scope.scopeCompanyIds }
        : scope.activeCompanyId;

    const building = await prisma.building.findFirst({
      where: {
        id,
        companyId: companyFilter,
      },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        referenciaCatastral: true,
        anoConstructor: true,
        tipo: true,
        numeroUnidades: true,
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const today = new Date();
    const twelveMonthsAgo = subMonths(today, 12);
    const monthStart = startOfMonth(twelveMonthsAgo);
    const monthEnd = endOfMonth(today);

    const [
      units,
      contracts,
      paymentsAgg,
      expensesAgg,
      insurancePolicies,
      maintenanceRequests,
    ] = await Promise.all([
      prisma.unit.findMany({
        where: { buildingId: id },
        select: {
          id: true,
          numero: true,
          estado: true,
          rentaMensual: true,
          superficie: true,
          habitaciones: true,
          banos: true,
          tenant: { select: { id: true, nombreCompleto: true, email: true } },
        },
      }),
      prisma.contract.findMany({
        where: {
          estado: 'activo',
          unit: { buildingId: id },
        },
        include: {
          tenant: { select: { id: true, nombreCompleto: true, email: true } },
          unit: { select: { id: true, numero: true } },
        },
      }),
      prisma.payment.groupBy({
        by: ['estado'],
        where: {
          contract: { unit: { buildingId: id } },
          fechaVencimiento: { gte: monthStart, lte: monthEnd },
        },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: {
          buildingId: id,
          fecha: { gte: monthStart, lte: monthEnd },
        },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.insurancePolicy.findMany({
        where: { buildingId: id, estado: 'activa' },
        select: {
          id: true,
          tipoSeguro: true,
          numeroPoliza: true,
          aseguradora: true,
          montoCobertura: true,
          primaAnual: true,
          fechaVencimiento: true,
        },
      }),
      prisma.maintenanceRequest.findMany({
        where: { unit: { buildingId: id } },
        select: {
          id: true,
          titulo: true,
          estado: true,
          prioridad: true,
          fechaSolicitud: true,
          unit: { select: { numero: true } },
        },
        orderBy: { fechaSolicitud: 'desc' },
        take: 20,
      }),
    ]);

    const totalUnits = units.length;
    const occupiedUnits = units.filter((u) => u.estado === 'ocupada').length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const monthlyRevenue = contracts.reduce(
      (sum, c) => sum + Number(c.rentaMensual || 0),
      0
    );

    const paymentsByMonth = paymentsAgg.reduce(
      (acc, p) => {
        const key = p.estado;
        acc[key] = { total: Number(p._sum.monto || 0), count: p._count };
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    const paymentsSummary = {
      last12Months: {
        total: Object.values(paymentsByMonth).reduce((s, v) => s + v.total, 0),
        byStatus: paymentsByMonth,
      },
    };

    const expensesSummary = {
      last12Months: {
        total: Number(expensesAgg._sum.monto || 0),
        count: expensesAgg._count,
      },
    };

    const unitsFormatted = units.map((u) => ({
      id: u.id,
      numero: u.numero,
      estado: u.estado,
      rentaMensual: Number(u.rentaMensual || 0),
      superficie: u.superficie,
      habitaciones: u.habitaciones,
      banos: u.banos,
      inquilino: u.tenant
        ? { id: u.tenant.id, nombreCompleto: u.tenant.nombreCompleto, email: u.tenant.email }
        : null,
    }));

    const contractsFormatted = contracts.map((c) => ({
      id: c.id,
      unitId: c.unitId,
      unitNumber: c.unit?.numero,
      tenant: c.tenant
        ? {
            id: c.tenant.id,
            nombreCompleto: c.tenant.nombreCompleto,
            email: c.tenant.email,
          }
        : null,
      fechaInicio: c.fechaInicio,
      fechaFin: c.fechaFin,
      rentaMensual: Number(c.rentaMensual || 0),
      estado: c.estado,
    }));

    return NextResponse.json({
      building: {
        ...building,
        anoConstructor: building.anoConstructor,
      },
      units: unitsFormatted,
      contracts: contractsFormatted,
      paymentsSummary,
      expensesSummary,
      insurancePolicies: insurancePolicies.map((p) => ({
        ...p,
        montoCobertura: Number(p.montoCobertura),
        primaAnual: Number(p.primaAnual),
      })),
      maintenanceRequests,
      metrics: {
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        totalUnits,
        occupiedUnits,
        revenue: monthlyRevenue,
      },
    });
  } catch (error: any) {
    logger.error('[Building 360 API]:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Error obteniendo vista 360 del edificio' },
      { status: 500 }
    );
  }
}
