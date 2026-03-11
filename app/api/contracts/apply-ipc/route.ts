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
 * POST /api/contracts/apply-ipc
 * Calcula y aplica actualización de IPC a contratos que cumplen fecha de revisión.
 *
 * Body:
 * - ipcPct: number (ej: 2.8 para 2.8%)
 * - contractIds?: string[] (opcional - si no se pasa, aplica a todos los elegibles)
 * - dryRun?: boolean (default true - solo calcula sin aplicar)
 *
 * Contratos elegibles:
 * - estado = 'activo'
 * - incrementoType = 'ipc' o 'ipc_mas_diferencial'
 * - fechaFin > hoy (no vencido)
 * - Han cumplido al menos 12 meses desde inicio o última actualización
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
      ipcPct = 2.8,
      contractIds,
      dryRun = true,
    } = body;

    if (typeof ipcPct !== 'number' || ipcPct < -10 || ipcPct > 50) {
      return NextResponse.json({ error: 'IPC inválido (rango: -10% a 50%)' }, { status: 400 });
    }

    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Obtener contratos elegibles
    const whereClause: any = {
      estado: 'activo',
      incrementoType: { in: ['ipc', 'ipc_mas_diferencial'] },
      fechaFin: { gt: today },
      fechaInicio: { lte: oneYearAgo }, // Al menos 12 meses activo
      unit: {
        building: {
          companyId: scope.activeCompanyId,
        },
      },
    };

    if (contractIds && Array.isArray(contractIds) && contractIds.length > 0) {
      whereClause.id = { in: contractIds };
    }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        tenant: { select: { id: true, nombreCompleto: true, email: true } },
        unit: {
          select: {
            id: true,
            numero: true,
            building: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    if (contracts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay contratos elegibles para actualización de IPC',
        contratos: [],
        resumen: { total: 0, incrementoTotal: 0 },
      });
    }

    // Calcular nuevas rentas
    const actualizaciones = contracts.map((contract) => {
      let incrementoPct = ipcPct;

      // Si el contrato usa IPC y define diferencial/ajuste adicional, sumarlo
      if (contract.incrementoType === 'ipc' && contract.incrementoValor) {
        incrementoPct += contract.incrementoValor;
      }

      const nuevaRenta =
        Math.round(contract.rentaMensual * (1 + incrementoPct / 100) * 100) / 100;
      const incremento = nuevaRenta - contract.rentaMensual;

      return {
        contractId: contract.id,
        inquilino: contract.tenant?.nombreCompleto || 'Sin nombre',
        email: contract.tenant?.email || null,
        edificio: contract.unit?.building?.nombre || 'Sin edificio',
        unidad: contract.unit?.numero || 'Sin unidad',
        tipoIncremento: contract.incrementoType,
        diferencial: contract.incrementoValor || 0,
        incrementoPctAplicado: incrementoPct,
        rentaActual: contract.rentaMensual,
        nuevaRenta,
        incremento,
        fechaInicio: contract.fechaInicio,
      };
    });

    const resumen = {
      total: actualizaciones.length,
      rentaActualTotal: actualizaciones.reduce((s, a) => s + a.rentaActual, 0),
      nuevaRentaTotal: actualizaciones.reduce((s, a) => s + a.nuevaRenta, 0),
      incrementoTotal: actualizaciones.reduce((s, a) => s + a.incremento, 0),
      ipcPct,
    };

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        resumen,
        contratos: actualizaciones,
      });
    }

    // Aplicar actualizaciones
    let aplicados = 0;
    let errores = 0;

    for (const act of actualizaciones) {
      try {
        await prisma.contract.update({
          where: { id: act.contractId },
          data: { rentaMensual: act.nuevaRenta },
        });

        // Actualizar renta en unidad también
        const contract = contracts.find((c) => c.id === act.contractId);
        if (contract?.unitId) {
          await prisma.unit.update({
            where: { id: contract.unitId },
            data: { rentaMensual: act.nuevaRenta },
          });
        }

        aplicados++;
      } catch (err: any) {
        logger.error(`Error aplicando IPC a contrato ${act.contractId}:`, err);
        errores++;
      }
    }

    logger.info(`[IPC Update] ${aplicados}/${actualizaciones.length} contratos actualizados`, {
      companyId: scope.activeCompanyId,
      ipcPct,
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      resumen: { ...resumen, aplicados, errores },
      contratos: actualizaciones,
    });
  } catch (error: any) {
    logger.error('[IPC Apply Error]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error aplicando IPC' }, { status: 500 });
  }
}
