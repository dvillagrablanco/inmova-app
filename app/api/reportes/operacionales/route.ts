import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

interface ContractExpiryDetail {
  id: string;
  inquilino: string;
  propiedad: string;
  vence: Date;
  diasRestantes: number;
}

interface OperationalReport {
  propiedades: number;
  unidades: number;
  inquilinosActivos: number;
  contratosActivos: number;
  contratosPorVencer: number;
  incidenciasAbiertas: number;
  incidenciasResueltas: number;
  tiempoMedioResolucion: string;
  ocupacionMedia: number;
  detalleContratosPorVencer: ContractExpiryDetail[];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener reportes operacionales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;

    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      propiedades,
      unidades,
      unidadesOcupadas,
      contratosActivos,
      contratosPorVencer,
      tenantsActivosRaw,
      incidenciasAbiertas,
      incidenciasResueltas,
      incidenciasCompletadas,
    ] = await Promise.all([
      prisma.building.count({
        where: { companyId, isDemo: false },
      }),
      prisma.unit.count({
        where: { building: { companyId, isDemo: false }, isDemo: false },
      }),
      prisma.unit.count({
        where: { building: { companyId, isDemo: false }, isDemo: false, estado: 'ocupada' },
      }),
      prisma.contract.count({
        where: {
          estado: 'activo',
          isDemo: false,
          unit: { building: { companyId, isDemo: false }, isDemo: false },
        },
      }),
      prisma.contract.findMany({
        where: {
          estado: 'activo',
          isDemo: false,
          fechaFin: { gte: now, lte: in90Days },
          unit: { building: { companyId, isDemo: false }, isDemo: false },
        },
        select: {
          id: true,
          fechaFin: true,
          tenant: { select: { nombreCompleto: true } },
          unit: {
            select: {
              numero: true,
              building: { select: { nombre: true, direccion: true } },
            },
          },
        },
        orderBy: { fechaFin: 'asc' },
      }),
      prisma.contract.findMany({
        where: {
          estado: 'activo',
          isDemo: false,
          unit: { building: { companyId, isDemo: false }, isDemo: false },
        },
        select: { tenantId: true },
        distinct: ['tenantId'],
      }),
      prisma.maintenanceRequest.count({
        where: {
          isDemo: false,
          estado: { in: ['pendiente', 'en_progreso', 'programado'] },
          unit: { building: { companyId, isDemo: false }, isDemo: false },
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          isDemo: false,
          estado: 'completado',
          fechaCompletada: { gte: startOfYear },
          unit: { building: { companyId, isDemo: false }, isDemo: false },
        },
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          isDemo: false,
          estado: 'completado',
          fechaCompletada: { gte: startOfYear },
          unit: { building: { companyId, isDemo: false }, isDemo: false },
        },
        select: {
          fechaSolicitud: true,
          fechaCompletada: true,
        },
      }),
    ]);

    const detalleContratosPorVencer: ContractExpiryDetail[] = contratosPorVencer.map((contract) => {
      const fechaFin = contract.fechaFin;
      const diasRestantes = Math.ceil((fechaFin.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const buildingLabel = contract.unit?.building?.nombre || contract.unit?.building?.direccion || 'N/A';
      const unidadLabel = contract.unit?.numero ? ` ${contract.unit.numero}` : '';

      return {
        id: contract.id,
        inquilino: contract.tenant?.nombreCompleto || 'N/A',
        propiedad: `${buildingLabel}${unidadLabel}`,
        vence: fechaFin,
        diasRestantes,
      };
    });

    const totalResolucionDias = incidenciasCompletadas.reduce((sum, incidencia) => {
      if (!incidencia.fechaCompletada) return sum;
      const diffMs = incidencia.fechaCompletada.getTime() - incidencia.fechaSolicitud.getTime();
      return sum + diffMs / (24 * 60 * 60 * 1000);
    }, 0);
    const tiempoMedioResolucion =
      incidenciasCompletadas.length > 0
        ? `${(totalResolucionDias / incidenciasCompletadas.length).toFixed(1)} días`
        : '0 días';

    const inquilinosActivos = tenantsActivosRaw.length;
    const ocupacionMedia = unidades > 0 ? Math.round((unidadesOcupadas / unidades) * 1000) / 10 : 0;

    const operationalData: OperationalReport = {
      propiedades,
      unidades,
      inquilinosActivos,
      contratosActivos,
      contratosPorVencer: detalleContratosPorVencer.length,
      incidenciasAbiertas,
      incidenciasResueltas,
      tiempoMedioResolucion,
      ocupacionMedia,
      detalleContratosPorVencer,
    };

    return NextResponse.json({
      success: true,
      data: operationalData,
    });
  } catch (error: unknown) {
    logger.error('[API Reportes Operacionales] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reporte operacional', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
