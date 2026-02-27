import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/renewals/batch
 * Renovación en lote de contratos por edificio o selección.
 * Aplica IPC o incremento manual a cada contrato.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await request.json();
    const {
      contractIds,
      incrementoPct = 3.0, // Default: 3% IPC
      duracionMeses = 12,
      dryRun = false, // Si true, solo calcula sin aplicar
    } = body;

    if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere contractIds (array)' }, { status: 400 });
    }

    // Obtener contratos con verificación de pertenencia a la empresa
    const contracts = await prisma.contract.findMany({
      where: {
        id: { in: contractIds },
        unit: {
          building: {
            companyId: scope.activeCompanyId,
          },
        },
      },
      include: {
        unit: {
          include: {
            building: { select: { id: true, nombre: true } },
          },
        },
        tenant: { select: { id: true, nombreCompleto: true } },
      },
    });

    if (contracts.length === 0) {
      return NextResponse.json({ error: 'No se encontraron contratos válidos' }, { status: 404 });
    }

    // Calcular nuevas rentas
    const renovaciones = contracts.map((contract) => {
      const nuevaRenta = Math.round(contract.rentaMensual * (1 + incrementoPct / 100) * 100) / 100;
      const fechaFinActual = new Date(contract.fechaFin);
      const nuevaFechaFin = new Date(fechaFinActual);
      nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + duracionMeses);

      return {
        contractId: contract.id,
        inquilino: contract.tenant?.nombreCompleto || 'Sin nombre',
        edificio: contract.unit?.building?.nombre || 'Sin edificio',
        unidad: contract.unit?.numero || 'Sin unidad',
        rentaActual: contract.rentaMensual,
        nuevaRenta,
        incremento: nuevaRenta - contract.rentaMensual,
        incrementoPct,
        fechaFinActual: contract.fechaFin,
        nuevaFechaFin,
        duracionMeses,
      };
    });

    // Resumen
    const resumen = {
      totalContratos: renovaciones.length,
      rentaActualTotal: renovaciones.reduce((s, r) => s + r.rentaActual, 0),
      nuevaRentaTotal: renovaciones.reduce((s, r) => s + r.nuevaRenta, 0),
      incrementoTotal: renovaciones.reduce((s, r) => s + r.incremento, 0),
      incrementoPct,
    };

    // Si es dry run, devolver solo el cálculo
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        resumen,
        renovaciones,
      });
    }

    // Aplicar renovaciones
    const resultados = [];
    for (const r of renovaciones) {
      try {
        await prisma.contract.update({
          where: { id: r.contractId },
          data: {
            rentaMensual: r.nuevaRenta,
            fechaFin: r.nuevaFechaFin,
          },
        });

        // Actualizar renta en la unidad
        const contract = contracts.find((c) => c.id === r.contractId);
        if (contract?.unitId) {
          await prisma.unit.update({
            where: { id: contract.unitId },
            data: { rentaMensual: r.nuevaRenta },
          });
        }

        resultados.push({ ...r, aplicado: true });
      } catch (err: any) {
        logger.error(`Error renovando contrato ${r.contractId}:`, err);
        resultados.push({ ...r, aplicado: false, error: err.message });
      }
    }

    const exitosos = resultados.filter((r) => r.aplicado).length;
    const fallidos = resultados.filter((r) => !r.aplicado).length;

    logger.info(`[Batch Renewal] ${exitosos}/${renovaciones.length} contratos renovados`, {
      companyId: scope.activeCompanyId,
      incrementoPct,
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      resumen: {
        ...resumen,
        exitosos,
        fallidos,
      },
      resultados,
    });
  } catch (error: any) {
    logger.error('[Batch Renewal Error]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error en renovación en lote' }, { status: 500 });
  }
}
