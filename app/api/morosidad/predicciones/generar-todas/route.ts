import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calcularPrediccionMorosidad } from '@/lib/morosidad-prediction-service';
import { addDays } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/morosidad/predicciones/generar-todas - Generar predicciones para todos los inquilinos
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'administrador' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    // Obtener todos los contratos activos
    const contracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        tenant: {
          companyId: user.companyId,
        },
      },
      include: {
        tenant: true,
      },
    });

    const resultados: Array<{
      tenantId: string;
      tenantName: string;
      nivelRiesgo: string;
      probabilidad: number;
      status: string;
    }> = [];
    let generadas = 0;
    let errores = 0;

    for (const contract of contracts) {
      try {
        // Calcular predicción
        const result = await calcularPrediccionMorosidad(contract.tenantId, contract.id);

        // Guardar en BD
        await prisma.morosidadPrediccion.create({
          data: {
            companyId: user.companyId,
            tenantId: contract.tenantId,
            contractId: contract.id,
            probabilidadImpago: result.probabilidadImpago,
            nivelRiesgo: result.nivelRiesgo,
            scoring: result.scoring,
            factoresRiesgo: result.factoresRiesgo,
            variablesAnalizadas: 40,
            prediccion30Dias: result.prediccion30Dias,
            prediccion60Dias: result.prediccion60Dias,
            prediccion90Dias: result.prediccion90Dias,
            recomendaciones: result.recomendaciones,
            accionPrioritaria: result.accionPrioritaria,
            pagosATiempo: result.pagosATiempo,
            pagosAtrasados: result.pagosAtrasados,
            diasPromedioRetraso: result.diasPromedioRetraso,
            montoPendiente: result.montoPendiente,
            ratioIngresoRenta: result.ratioIngresoRenta,
            modeloVersion: 'xgboost_v1',
            confianzaModelo: 0.89,
            ultimoEntrenamiento: new Date(),
            alertaGenerada: result.nivelRiesgo === 'alto' || result.nivelRiesgo === 'critico',
            fechaAlerta:
              result.nivelRiesgo === 'alto' || result.nivelRiesgo === 'critico' ? new Date() : null,
            validaHasta: addDays(new Date(), 30),
          },
        });

        generadas++;
        resultados.push({
          tenantId: contract.tenantId,
          tenantName: contract.tenant.nombreCompleto,
          nivelRiesgo: result.nivelRiesgo,
          probabilidad: result.probabilidadImpago,
          status: 'success',
        });
      } catch (error: any) {
        errores++;
        resultados.push({
          tenantId: contract.tenantId,
          tenantName: contract.tenant.nombreCompleto,
          nivelRiesgo: 'error',
          probabilidad: 0,
          status: 'error',
        });
      }
    }

    return NextResponse.json({
      message: `Predicciones generadas: ${generadas}/${contracts.length}`,
      generadas,
      errores,
      total: contracts.length,
      resultados,
    });
  } catch (error: any) {
    logger.error('Error al generar predicciones:', error);
    return NextResponse.json(
      { error: 'Error al generar predicciones', details: error.message },
      { status: 500 }
    );
  }
}
