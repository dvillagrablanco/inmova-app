import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export const dynamic = 'force-dynamic';
/**
 * GET /api/admin-fincas/reports
 * Obtiene informes generados
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const tipo = searchParams.get('tipo');
    const where: any = {
      companyId: session.user.companyId,
    };
    if (communityId) {
      where.communityId = communityId;
    }
    if (tipo) {
      where.tipo = tipo;
    }
    const reports = await prisma.communityReport.findMany({
      where,
      include: {
        community: {
          select: {
            id: true,
            nombreComunidad: true,
            direccion: true,
          },
        },
      },
      orderBy: {
        generadoEn: 'desc',
      },
    });
    return NextResponse.json(reports);
  } catch (error) {
    logger.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Error al obtener informes' }, { status: 500 });
  }
}
/**
 * POST /api/admin-fincas/reports/generate
 * Genera un nuevo informe automáticamente
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId || !session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { communityId, tipo, periodo, fechaInicio, fechaFin } = body;

    // Validar campos requeridos
    if (!communityId || !tipo || !periodo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar que la comunidad existe y pertenece a la compañía
    const community = await prisma.communityManagement.findFirst({
      where: {
        id: communityId,
        companyId: session.user.companyId,
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Determinar fechas según el tipo
    let start: Date;
    let end: Date;
    if (fechaInicio && fechaFin) {
      start = new Date(fechaInicio);
      end = new Date(fechaFin);
    } else {
      const now = new Date();
      if (tipo === 'trimestral') {
        start = startOfQuarter(now);
        end = endOfQuarter(now);
      } else {
        start = startOfYear(now);
        end = endOfYear(now);
      }
    }

    // Obtener movimientos del período
    const movimientos = await prisma.cashBookEntry.findMany({
      where: {
        communityId,
        fecha: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    // Calcular totales
    const ingresos = movimientos.filter((m) => m.tipo === 'ingreso');
    const gastos = movimientos.filter((m) => m.tipo === 'gasto');
    const totalIngresos = ingresos.reduce((sum, m) => sum + m.importe, 0);
    const totalGastos = gastos.reduce((sum, m) => sum + m.importe, 0);

    // Obtener saldo inicial (saldo anterior del primer movimiento)
    const saldoInicial = movimientos[0]?.saldoAnterior || 0;

    // Obtener saldo final (saldo actual del último movimiento)
    const saldoFinal = movimientos[movimientos.length - 1]?.saldoActual || saldoInicial;

    // Desglose por categoría
    const detalleIngresos = ingresos.reduce((acc: any, m) => {
      const cat = m.categoria || 'otros';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += m.importe;
      return acc;
    }, {});

    const detalleGastos = gastos.reduce((acc: any, m) => {
      const cat = m.categoria || 'otros';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += m.importe;
      return acc;
    }, {});

    // Crear informe
    const report = await prisma.communityReport.create({
      data: {
        companyId: session.user.companyId,
        communityId,
        tipo,
        periodo,
        fechaInicio: start,
        fechaFin: end,
        totalIngresos,
        totalGastos,
        saldoInicial,
        saldoFinal,
        detalleIngresos,
        detalleGastos,
        fondosReserva: saldoFinal > 0 ? saldoFinal * 0.1 : 0, // Ejemplo: 10% del saldo
        generadoPor: session.user.email,
      },
      include: {
        community: true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    logger.error('Error generating report:', error);
    return NextResponse.json({ error: 'Error al generar informe' }, { status: 500 });
  }
}
