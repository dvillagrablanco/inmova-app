import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';
import { startOfMonth, endOfMonth, startOfYear } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/sales/dashboard - Obtener estadísticas del dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar el representante de ventas por email
    const salesRep = await prisma.salesRepresentative.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Representante de ventas no encontrado' },
        { status: 404 }
      );
    }

    const now = new Date();
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);
    const startYear = startOfYear(now);

    // Obtener leads
    const [totalLeads, nuevosLeads, enProcesoLeads, convertidosLeads] = await Promise.all([
      prisma.salesLead.count({
        where: {
          salesRepresentativeId: salesRep.id,
        },
      }),
      prisma.salesLead.count({
        where: {
          salesRepresentativeId: salesRep.id,
          estado: 'NUEVO',
        },
      }),
      prisma.salesLead.count({
        where: {
          salesRepresentativeId: salesRep.id,
          estado: {
            in: ['CONTACTADO', 'CALIFICADO', 'PROPUESTA', 'NEGOCIACION'],
          },
        },
      }),
      prisma.salesLead.count({
        where: {
          salesRepresentativeId: salesRep.id,
          estado: 'CERRADO_GANADO',
        },
      }),
    ]);

    const tasaConversion =
      totalLeads > 0 ? (convertidosLeads / totalLeads) * 100 : 0;

    // Obtener comisiones del mes actual
    const comisionesMes = await prisma.salesCommission.findMany({
      where: {
        salesRepresentativeId: salesRep.id,
        fechaCalculo: {
          gte: startMonth,
          lte: endMonth,
        },
      },
    });

    const totalComisionesMes = comisionesMes.reduce(
      (sum, c) => sum + parseFloat(c.monto.toString()),
      0
    );
    const pendientesCount = comisionesMes.filter(
      (c) => c.estado === 'PENDIENTE'
    ).length;
    const pagadasCount = comisionesMes.filter((c) => c.estado === 'PAGADA').length;

    // Obtener comisiones del año
    const comisionesAnio = await prisma.salesCommission.findMany({
      where: {
        salesRepresentativeId: salesRep.id,
        fechaCalculo: {
          gte: startYear,
        },
      },
    });

    const acumuladoAnio = comisionesAnio.reduce(
      (sum, c) => sum + parseFloat(c.monto.toString()),
      0
    );

    // Obtener objetivos del mes
    const objetivoMes = await prisma.salesTarget.findFirst({
      where: {
        salesRepresentativeId: salesRep.id,
        activo: true,
        fechaInicio: {
          lte: now,
        },
        fechaFin: {
          gte: now,
        },
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    // Calcular leads y conversiones del mes actual
    const leadsMesActual = await prisma.salesLead.count({
      where: {
        salesRepresentativeId: salesRep.id,
        fechaCreacion: {
          gte: startMonth,
          lte: endMonth,
        },
      },
    });

    const conversionesMesActual = await prisma.salesLead.count({
      where: {
        salesRepresentativeId: salesRep.id,
        estado: 'CERRADO_GANADO',
        fechaConversion: {
          gte: startMonth,
          lte: endMonth,
        },
      },
    });

    const leadsObjetivo = objetivoMes?.metaLeads || salesRep.objetivoLeadsMes || 10;
    const conversionesObjetivo =
      objetivoMes?.metaConversiones || salesRep.objetivoConversionesMes || 2;

    // Calcular progreso general (promedio de ambos objetivos)
    const progresoLeads = (leadsMesActual / leadsObjetivo) * 100;
    const progresoConversiones = (conversionesMesActual / conversionesObjetivo) * 100;
    const progresoGeneral = (progresoLeads + progresoConversiones) / 2;

    // Obtener leads recientes
    const recentLeads = await prisma.salesLead.findMany({
      where: {
        salesRepresentativeId: salesRep.id,
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
      take: 5,
      select: {
        id: true,
        nombreCompleto: true,
        empresa: true,
        estado: true,
        fechaCreacion: true,
      },
    });

    const stats = {
      leads: {
        total: totalLeads,
        nuevos: nuevosLeads,
        enProceso: enProcesoLeads,
        convertidos: convertidosLeads,
        tasaConversion: tasaConversion,
      },
      comisiones: {
        totalMes: totalComisionesMes,
        pendientes: pendientesCount,
        pagadas: pagadasCount,
        acumuladoAnio: acumuladoAnio,
      },
      objetivos: {
        leadsActuales: leadsMesActual,
        leadsObjetivo: leadsObjetivo,
        conversionesActuales: conversionesMesActual,
        conversionesObjetivo: conversionesObjetivo,
        progreso: progresoGeneral,
      },
      recentLeads: recentLeads,
    };

    return NextResponse.json(stats);
  } catch (error) {
    logError('Error en GET /api/sales/dashboard', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
}
