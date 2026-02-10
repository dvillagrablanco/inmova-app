export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Dashboard del Portal Comercial
 * GET: Obtener estadísticas del representante de ventas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

interface LeadStats {
  total: number;
  nuevos: number;
  enProceso: number;
  convertidos: number;
  tasaConversion: number;
}

interface ComisionesStats {
  totalMes: number;
  pendientes: number;
  pagadas: number;
  acumuladoAnio: number;
}

interface ObjetivosStats {
  leadsActuales: number;
  leadsObjetivo: number;
  conversionesActuales: number;
  conversionesObjetivo: number;
  progreso: number;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    const userId = session.user.id;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no configurada' }, { status: 400 });
    }
    const userEmail = session.user.email ?? '';
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Obtener leads del usuario
    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        asignadoA: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        empresa: true,
        estado: true,
        createdAt: true,
      },
    });

    const leadCounts = await prisma.lead.groupBy({
      by: ['estado'],
      where: {
        companyId,
        asignadoA: userId,
      },
      _count: { _all: true },
    });

    const leadCountMap = new Map<string, number>(
      leadCounts.map((item) => [item.estado, item._count._all])
    );

    const totalLeads = leadCounts.reduce((sum, item) => sum + item._count._all, 0);
    const nuevos = leadCountMap.get('nuevo') ?? 0;
    const enProceso =
      (leadCountMap.get('contactado') ?? 0) +
      (leadCountMap.get('calificado') ?? 0) +
      (leadCountMap.get('propuesta') ?? 0) +
      (leadCountMap.get('negociacion') ?? 0);
    const convertidos = leadCountMap.get('ganado') ?? 0;
    const tasaConversion = totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0;

    const leadsStats: LeadStats = {
      total: totalLeads,
      nuevos,
      enProceso,
      convertidos,
      tasaConversion,
    };

    const salesRep = userEmail
      ? await prisma.salesRepresentative.findUnique({
          where: { email: userEmail },
          select: { id: true },
        })
      : null;

    let comisiones: ComisionesStats = {
      totalMes: 0,
      pendientes: 0,
      pagadas: 0,
      acumuladoAnio: 0,
    };

    let objetivos: ObjetivosStats = {
      leadsActuales: leadsStats.total,
      leadsObjetivo: 0,
      conversionesActuales: leadsStats.convertidos,
      conversionesObjetivo: 0,
      progreso: 0,
    };

    if (salesRep) {
      const [monthSum, yearSum, pendingCount, paidCount, target] = await Promise.all([
        prisma.salesCommission.aggregate({
          where: {
            salesRepId: salesRep.id,
            fechaGeneracion: { gte: startOfMonth, lte: now },
            estado: { not: 'CANCELADA' },
          },
          _sum: { montoNeto: true },
        }),
        prisma.salesCommission.aggregate({
          where: {
            salesRepId: salesRep.id,
            fechaGeneracion: { gte: startOfYear, lte: now },
            estado: { not: 'CANCELADA' },
          },
          _sum: { montoNeto: true },
        }),
        prisma.salesCommission.count({
          where: {
            salesRepId: salesRep.id,
            estado: { in: ['PENDIENTE', 'APROBADA', 'RETENIDA'] },
          },
        }),
        prisma.salesCommission.count({
          where: {
            salesRepId: salesRep.id,
            estado: 'PAGADA',
            fechaGeneracion: { gte: startOfYear, lte: now },
          },
        }),
        prisma.salesTarget.findFirst({
          where: {
            salesRepId: salesRep.id,
            fechaInicio: { lte: now },
            fechaFin: { gte: now },
          },
          orderBy: { fechaInicio: 'desc' },
        }),
      ]);

      comisiones = {
        totalMes: monthSum._sum.montoNeto ?? 0,
        pendientes: pendingCount,
        pagadas: paidCount,
        acumuladoAnio: yearSum._sum.montoNeto ?? 0,
      };

      const leadsObjetivo = target?.objetivoLeads ?? 0;
      const conversionesObjetivo = target?.objetivoConversiones ?? 0;
      const progresoLeads =
        leadsObjetivo > 0 ? Math.min(1, leadsStats.total / leadsObjetivo) : 0;
      const progresoConv =
        conversionesObjetivo > 0
          ? Math.min(1, leadsStats.convertidos / conversionesObjetivo)
          : 0;
      const progreso =
        leadsObjetivo > 0 || conversionesObjetivo > 0
          ? ((progresoLeads + progresoConv) / 2) * 100
          : 0;

      objetivos = {
        leadsActuales: leadsStats.total,
        leadsObjetivo,
        conversionesActuales: leadsStats.convertidos,
        conversionesObjetivo,
        progreso,
      };
    }

    const recentLeads = leads.slice(0, 5).map((lead) => ({
      id: lead.id,
      nombreCompleto: lead.apellidos ? `${lead.nombre} ${lead.apellidos}` : lead.nombre,
      empresa: lead.empresa || '',
      estado: lead.estado || 'nuevo',
      fechaCreacion: lead.createdAt,
    }));

    return NextResponse.json({
      leads: leadsStats,
      comisiones,
      objetivos,
      recentLeads,
    });
  } catch (error: unknown) {
    logger.error('Error fetching sales dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener dashboard', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
