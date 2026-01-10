export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Dashboard del Portal Comercial
 * GET: Obtener estadísticas del representante de ventas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Obtener leads del usuario
    let leads: any[] = [];
    let leadsStats = {
      total: 0,
      nuevos: 0,
      enProceso: 0,
      convertidos: 0,
      tasaConversion: 0,
    };

    try {
      // Verificar si el modelo Lead existe
      if ((prisma as any).lead) {
        leads = await (prisma as any).lead.findMany({
          where: {
            companyId,
            asignadoA: userId,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        const allLeads = await (prisma as any).lead.findMany({
          where: {
            companyId,
            asignadoA: userId,
          },
        });

        leadsStats = {
          total: allLeads.length,
          nuevos: allLeads.filter((l: any) => l.estado === 'nuevo').length,
          enProceso: allLeads.filter((l: any) => l.estado === 'en_proceso').length,
          convertidos: allLeads.filter((l: any) => l.estado === 'convertido').length,
          tasaConversion: allLeads.length > 0
            ? (allLeads.filter((l: any) => l.estado === 'convertido').length / allLeads.length) * 100
            : 0,
        };
      }
    } catch {
      // Modelo no existe, usar defaults
    }

    // Comisiones (simuladas si no hay modelo)
    const comisiones = {
      totalMes: 0,
      pendientes: 0,
      pagadas: 0,
      acumuladoAnio: 0,
    };

    // Objetivos (simulados)
    const objetivos = {
      leadsActuales: leadsStats.total,
      leadsObjetivo: 50,
      conversionesActuales: leadsStats.convertidos,
      conversionesObjetivo: 10,
      progreso: Math.min(100, ((leadsStats.total / 50) + (leadsStats.convertidos / 10)) / 2 * 100),
    };

    // Leads recientes formateados
    const recentLeads = leads.slice(0, 5).map((lead: any) => ({
      id: lead.id,
      nombreCompleto: lead.nombre || 'Sin nombre',
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
  } catch (error) {
    logger.error('Error fetching sales dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener dashboard' },
      { status: 500 }
    );
  }
}
