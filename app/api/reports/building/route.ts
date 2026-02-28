import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/reports/building?buildingId=xxx
 * Genera informe mensual completo por edificio:
 * ocupación, ingresos, gastos, incidencias, morosidad, contratos.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId requerido' }, { status: 400 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    const building = await prisma.building.findFirst({
      where: { id: buildingId, companyId: scope.activeCompanyId || undefined },
      include: {
        company: { select: { nombre: true } },
        units: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            estado: true,
            rentaMensual: true,
            superficie: true,
            tenant: { select: { nombreCompleto: true } },
            contracts: {
              where: { estado: 'activo' },
              select: { fechaFin: true, rentaMensual: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const today = new Date();
    const totalUnits = building.units.length;
    const ocupadas = building.units.filter((u: any) => u.estado === 'ocupada').length;
    const rentaTotal = building.units.filter((u: any) => u.estado === 'ocupada').reduce((s: number, u: any) => s + u.rentaMensual, 0);

    // Pagos del edificio
    const [pagados, pendientes, atrasados] = await Promise.all([
      prisma.payment.count({
        where: { contract: { unit: { buildingId } }, estado: 'pagado' },
      }),
      prisma.payment.count({
        where: { contract: { unit: { buildingId } }, estado: 'pendiente' },
      }),
      prisma.payment.aggregate({
        where: { contract: { unit: { buildingId } }, estado: 'atrasado' },
        _sum: { monto: true },
        _count: true,
      }),
    ]);

    // Gastos del edificio
    const gastos = await prisma.expense.aggregate({
      where: { buildingId, isDemo: false },
      _sum: { monto: true },
      _count: true,
    });

    // Incidencias
    const incidencias = await prisma.maintenanceRequest.findMany({
      where: { unit: { buildingId }, estado: { in: ['pendiente', 'en_progreso'] } },
      select: { titulo: true, prioridad: true, estado: true, fechaSolicitud: true },
      take: 10,
    });

    const report = {
      titulo: `Informe Mensual — ${building.nombre}`,
      fecha: format(today, "d 'de' MMMM yyyy", { locale: es }),
      edificio: {
        nombre: building.nombre,
        direccion: building.direccion,
        sociedad: building.company?.nombre,
        tipo: building.tipo,
      },
      ocupacion: {
        totalUnidades: totalUnits,
        ocupadas,
        disponibles: totalUnits - ocupadas,
        porcentaje: totalUnits > 0 ? Math.round((ocupadas / totalUnits) * 100) : 0,
      },
      ingresos: {
        rentaMensual: Math.round(rentaTotal),
        rentaAnualEstimada: Math.round(rentaTotal * 12),
      },
      pagos: {
        cobrados: pagados,
        pendientes,
        atrasados: atrasados._count || 0,
        importeAtrasado: Math.round(atrasados._sum?.monto || 0),
      },
      gastos: {
        total: Math.round(gastos._sum?.monto || 0),
        registros: gastos._count || 0,
        ibiAnual: building.ibiAnual || 0,
      },
      margen: {
        mensual: Math.round(rentaTotal - (gastos._sum?.monto || 0) / 12),
      },
      incidencias: {
        abiertas: incidencias.length,
        detalle: incidencias,
      },
      unidades: building.units.map((u: any) => ({
        numero: u.numero,
        tipo: u.tipo,
        estado: u.estado,
        renta: u.rentaMensual,
        inquilino: u.tenant?.nombreCompleto || null,
        vencimientoContrato: u.contracts?.[0]?.fechaFin || null,
      })),
    };

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    logger.error('[Building Report]:', error);
    return NextResponse.json({ error: 'Error generando informe' }, { status: 500 });
  }
}
