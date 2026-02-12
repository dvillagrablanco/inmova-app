import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    // Obtener agentes/comerciales
    const agents = await prisma.salesRepresentative.findMany({
      where: { companyId },
      select: {
        id: true,
        nombreCompleto: true,
        activo: true,
        comisiones: { select: { monto: true, estado: true } },
        leads: { select: { id: true, estado: true } },
      },
    }).catch(() => []);

    // KPIs
    const totalAgents = agents.length;
    const activeAgents = agents.filter((a: any) => a.activo).length;

    let totalComisiones = 0;
    let totalOperaciones = 0;
    let totalLeads = 0;

    agents.forEach((a: any) => {
      totalComisiones += (a.comisiones || []).reduce((s: number, c: any) => s + (Number(c.monto) || 0), 0);
      totalOperaciones += (a.comisiones || []).filter((c: any) => c.estado === 'PAGADA' || c.estado === 'APROBADA').length;
      totalLeads += (a.leads || []).length;
    });

    const conversionRate = totalLeads > 0 ? Math.round((totalOperaciones / totalLeads) * 100) : 0;
    const ticketMedio = totalOperaciones > 0 ? Math.round(totalComisiones / totalOperaciones) : 0;

    // Rendimiento por agente
    const metricasAgentes = agents.map((a: any) => {
      const comisiones = (a.comisiones || []).reduce((s: number, c: any) => s + (Number(c.monto) || 0), 0);
      const ops = (a.comisiones || []).filter((c: any) => c.estado === 'PAGADA' || c.estado === 'APROBADA').length;
      const leads = (a.leads || []).length;
      const conversion = leads > 0 ? Math.round((ops / leads) * 100) : 0;
      const status = conversion >= 30 ? 'excellent' : conversion >= 15 ? 'good' : 'regular';
      return {
        nombre: a.nombreCompleto,
        operaciones: ops,
        conversion,
        comisiones,
        leads,
        status,
      };
    }).sort((a: any, b: any) => b.comisiones - a.comisiones);

    // Objetivos (desde la BD o valores por defecto configurables)
    const objetivos = [
      { nombre: 'Facturación Q', actual: totalComisiones, objetivo: 100000, unidad: '€' },
      { nombre: 'Operaciones Mes', actual: totalOperaciones, objetivo: 20, unidad: '' },
      { nombre: 'Nuevos Agentes', actual: activeAgents, objetivo: 5, unidad: '' },
      { nombre: 'Tasa Conversión', actual: conversionRate, objetivo: 30, unidad: '%' },
    ];

    return NextResponse.json({
      kpis: {
        facturacion: totalComisiones,
        operaciones: totalOperaciones,
        conversionRate,
        ticketMedio,
        totalAgents,
        activeAgents,
      },
      metricasAgentes,
      objetivos,
    });
  } catch (error: any) {
    logger.error('[Red Agentes Dashboard]:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
